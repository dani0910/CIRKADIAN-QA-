# CIRKADIAN-QA 프로젝트 인계 가이드 (Handover Guide)

본 문서는 QA 대시보드 및 테스트 케이스 관리 프로젝트의 구조, 로컬 개발 환경 구성 방법 및 Vercel 배포 시 필요한 AWS S3 스토리지 전환 작업 가이드를 포함합니다.

---

## 1. 프로젝트 주요 디렉토리 구조 (Directory Structure)

본 프로젝트는 Next.js App Router 아키텍처를 기반으로 작성되었습니다.

```bash
cirkadianQA/
├── public/                    # 정적 자산 폴더
│   └── uploads/               # [현재 사용] 로컬 업로드 이미지 저장 디렉토리 (S3 전환 후 삭제 가능)
├── src/
│   ├── app/                   # Next.js App Router 페이지 및 서버 액션
│   │   ├── actions.ts         # Supabase DB 제어 및 파일 업로드 처리 서버 액션
│   │   ├── globals.css        # 글로벌 다크 테마/글래스모피즘 CSS 스타일 정의
│   │   ├── layout.tsx         # 루트 레이아웃
│   │   └── page.tsx           # 프로젝트 대시보드 및 상세 메인 페이지 (서버 컴포넌트)
│   ├── components/            # 공용 UI 컴포넌트
│   │   └── ui/
│   │       ├── Badge.tsx      # 상태(PASS/FAIL/미실시) 뱃지 컴포넌트
│   │       ├── Button.tsx     # 공용 버튼 컴포넌트
│   │       └── Card.tsx       # 대시보드용 공용 카드 컨테이너 컴포넌트
│   ├── features/              # 피처(기능) 단위 핵심 모듈
│   │   ├── dashboard/
│   │   │   └── DashboardStats.tsx # 대시보드 상단 통계(전체/합계 카드 및 도넛/막대 차트) 컴포넌트
│   │   ├── project/
│   │   │   └── ProjectList.tsx   # 프로젝트 선택 랜딩 페이지 컴포넌트
│   │   └── testcase/
│   │       └── TestCaseList.tsx  # 테스트케이스 아코디언 목록, 댓글 및 의견 입력창 컴포넌트
│   ├── lib/
│   │   └── supabase.ts        # 클라이언트 사이드 Supabase 초기화 및 커넥션
│   ├── types/
│   │   ├── global.d.ts        # 프로젝트 내 공용 TypeScript 타입 인터페이스 설정
│   │   └── supabase.ts        # Supabase CLI에서 자동 생성된 데이터베이스 스키마 타입
│   └── utils/
│       └── supabase/
│           ├── client.ts      # App Router 클라이언트 컴포넌트용 Supabase 생성자
│           ├── middleware.ts  # 로그인 세션 및 쿠키 검증용 미들웨어
│           └── server.ts      # App Router 서버 컴포넌트/서버 액션용 Supabase 생성자
├── .env.local                 # [로컬 전용] 환경 변수 설정 파일 (Git 제외)
├── package.json               # 프로젝트 의존성 관리 및 빌드 스크립트 정의
└── tsconfig.json              # TypeScript 컴파일 상세 규칙 설정
```

---

## 2. 로컬 개발 환경 세팅 방법 (Local Environment Setup)

깃허브(Git)에는 중요 인증 키 정보 누출을 차단하기 위해 `.env.local` 파일이 포함되어 있지 않습니다. 로컬에서 환경을 실행하려면 프로젝트 루트 폴더에 `.env.local` 파일을 직접 생성하고 아래 형식에 맞추어 실제 Supabase 값을 입력해야 합니다.

### `.env.local` 설정 파일 작성

```env
# Supabase 접속 및 인증 정보
NEXT_PUBLIC_SUPABASE_URL=https://cyjuzgqesyhitbxmisgr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5anV6Z3Flc3loaXRieG1pc2dyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5ODMyODAsImV4cCI6MjA5NjU1OTI4MH0.ZFFoT4JIlWxunDgdg-xuOWw8hJBr-WQwAVni5lcnr8Q
```

### 패키지 설치 및 서버 구동

1. **의존성 모듈 설치**:
   ```bash
   npm install
   ```
2. **로컬 개발 서버 실행**:
   ```bash
   npm run dev
   ```
   이후 브라우저에서 `http://localhost:3000`으로 접속하여 테스트할 수 있습니다.

---

## 3. Vercel 배포 및 Supabase Storage 이미지 업로드 전환 가이드

Vercel은 서버리스 아키텍처 환경으로 작동하므로 로컬 파일 시스템(`public/uploads`)에 영구적으로 파일을 쓰고 저장할 수 없습니다. 따라서 이미지를 업로드하고 링크를 불러오려면 외부 파일 스토리지인 **Supabase Storage**로 저장 방식을 수정해야 합니다.

Supabase Storage를 이용하면 별도의 AWS SDK 설치나 복잡한 AWS 환경 변수 설정 없이 기존에 연동된 Supabase 설정을 활용하여 손쉽게 영구적인 이미지 업로드를 구현할 수 있습니다.

### 3.1 Supabase 스토리지 버킷 및 보안 정책 설정

1. **Storage Bucket 생성**:
   - Supabase 프로젝트 대시보드에서 `Storage` 메뉴로 이동합니다.
   - `New Bucket`을 클릭하고 버킷 이름을 `evidences`로 입력합니다.
   - 업로드된 이미지를 퍼블릭 URL로 조회할 수 있도록 **Public** 옵션을 반드시 활성화(체크)해 줍니다.

2. **보안 정책 (RLS Policies) 설정**:
   - 생성한 `evidences` 버킷의 `Policies` 설정 탭으로 이동합니다.
   - 클라이언트 세션(`createClient`)에서 파일을 업로드할 수 있어야 하므로, `Insert` 권한을 부여하는 정책을 추가합니다.
   - 예를 들어, 로그인 여부와 무관하게 익명(anon) 사용자도 증적 이미지를 업로드할 수 있도록 하려면 다음과 같이 정책을 구성합니다:
     - **Allowed operations**: `INSERT`, `SELECT`
     - **Target roles**: `anon`, `authenticated`
     - **Expression**: `true` (또는 필요에 따라 특정 폴더 경로 규칙 적용)

### 3.2 `src/app/actions.ts` 코드 변경 상세 가이드

로컬 디렉토리 저장 방식에서 Supabase Storage 버킷 저장 및 퍼블릭 이미지 주소(`https://...`) 리턴 구조로 변경합니다.

#### [기존 로컬 업로드 코드 (actions.ts)]
```typescript
export async function uploadTestCaseEvidence(tcId: string, formData: FormData) {
  const file = formData.get('file') as File | null
  if (!file) {
    throw new Error('No file uploaded')
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const uploadDir = path.join(process.cwd(), 'public', 'uploads')
  await mkdir(uploadDir, { recursive: true })

  const fileExt = path.extname(file.name)
  const fileName = `${tcId}-${Date.now()}${fileExt}`
  const filePath = path.join(uploadDir, fileName)

  await writeFile(filePath, buffer)

  const fileUrl = `/uploads/${fileName}`
  // ... 생략 (Supabase DB 저장 코드) ...
}
```

#### [변경 완료된 Supabase Storage 기반 업로드 코드 (actions.ts)]
기존 코드를 아래와 같이 대체하여 Supabase Storage에 직접 업로드하도록 구현되었습니다.

```typescript
export async function uploadTestCaseEvidence(tcId: string, formData: FormData) {
  const file = formData.get('file') as File | null
  if (!file) {
    throw new Error('No file uploaded')
  }

  const fileExt = path.extname(file.name)
  const fileName = `evidences/${tcId}-${Date.now()}${fileExt}`

  const supabase = await createClient()

  // 1. Supabase Storage에 파일 업로드
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('evidences')
    .upload(fileName, file, {
      contentType: file.type || 'image/jpeg',
      upsert: false
    })

  if (uploadError) {
    throw new Error(`Failed to upload image to Supabase Storage: ${uploadError.message}`)
  }

  // 2. 업로드된 파일의 Public URL 획득
  const { data: { publicUrl } } = supabase.storage
    .from('evidences')
    .getPublicUrl(fileName)

  // 3. Supabase DB에 이미지 URL 추가 저장
  const { data: detail, error: fetchError } = await supabase
    .from('tc_details')
    .select('evidence_urls')
    .eq('id', tcId)
    .single()

  if (fetchError) {
    throw new Error(`Failed to fetch test case details: ${fetchError.message}`)
  }

  const currentUrls = detail?.evidence_urls || []
  const nextUrls = [...currentUrls, publicUrl]

  const { error: updateError } = await supabase
    .from('tc_details')
    .update({ evidence_urls: nextUrls })
    .eq('id', tcId)

  if (updateError) {
    throw new Error(`Failed to update evidence urls: ${updateError.message}`)
  }

  revalidatePath('/')
  return publicUrl
}
```

---

## 4. Vercel 배포 시 주의점
1. **Supabase 환경 변수 설정**: Vercel Dashboard의 `Settings > Environment Variables`에서 `NEXT_PUBLIC_SUPABASE_URL` 및 `NEXT_PUBLIC_SUPABASE_ANON_KEY`를 환경 변수로 등록해야 합니다.
2. **Supabase Storage 버킷 생성 및 RLS 설정**: 버킷 이름이 `evidences`로 일치하는지 확인하고, 해당 버킷의 RLS 정책이 `Insert` 및 `Select` 권한을 올바르게 부여하고 있는지 다시 한번 검증하십시오.
