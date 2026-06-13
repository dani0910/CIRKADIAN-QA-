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

## 3. Vercel 배포 및 AWS S3 이미지 업로드 전환 가이드

Vercel은 서버리스 아키텍처 환경으로 작동하므로 로컬 파일 시스템(`public/uploads`)에 영구적으로 파일을 쓰고 저장할 수 없습니다. 따라서 이미지를 업로드하고 링크를 불러오려면 외부 파일 스토리지 서비스(AWS S3)로 저장 방식을 수정해야 합니다.

### 3.1 AWS SDK 패키지 설치
S3 사용을 위해 아래 패키지를 프로젝트에 설치합니다.
```bash
npm install @aws-sdk/client-s3
```

### 3.2 `.env.local` (및 Vercel 환경변수) 추가 설정
AWS S3 접근용 자격 증명 환경 변수를 추가합니다.
```env
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=ap-northeast-2
AWS_S3_BUCKET_NAME=cirkadian-qa-uploads
```

### 3.3 `src/app/actions.ts` 코드 변경 상세 가이드

로컬 디렉토리 저장 방식에서 AWS S3 버킷 저장 및 버킷 내 업로드 주소(`https://...`) 리턴 구조로 변경합니다.

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

#### [변경할 S3 기반 업로드 코드 (actions.ts)]
기존 코드를 아래와 같이 대체하여 S3 PutObject 명령을 수행하도록 수정합니다.

```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

// S3 클라이언트 초기화
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-northeast-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
})

export async function uploadTestCaseEvidence(tcId: string, formData: FormData) {
  const file = formData.get('file') as File | null
  if (!file) {
    throw new Error('No file uploaded')
  }

  // 바이너리 데이터 변환
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const fileExt = path.extname(file.name)
  const fileName = `evidences/${tcId}-${Date.now()}${fileExt}`

  // S3 업로드 명령 구성
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: fileName,
    Body: buffer,
    ContentType: file.type || 'image/jpeg',
  })

  // S3 전송 실행
  await s3Client.send(command)

  // S3 공개 액세스 이미지 경로 생성
  const fileUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`

  // -------------------------------------------------------------
  // Supabase DB에 이미지 주소 저장 로직 (기존과 동일하게 작동)
  // -------------------------------------------------------------
  const supabase = await createClient()
  const { data: detail, error: fetchError } = await supabase
    .from('tc_details')
    .select('evidence_urls')
    .eq('id', tcId)
    .single()

  if (fetchError) {
    throw new Error(`Failed to fetch test case details: ${fetchError.message}`)
  }

  const currentUrls = detail?.evidence_urls || []
  const nextUrls = [...currentUrls, fileUrl]

  const { error: updateError } = await supabase
    .from('tc_details')
    .update({ evidence_urls: nextUrls })
    .eq('id', tcId)

  if (updateError) {
    throw new Error(`Failed to update evidence urls: ${updateError.message}`)
  }

  revalidatePath('/')
  return fileUrl
}
```

---

## 4. Vercel 배포 시 주의점
1. **Supabase 환경 변수 설정**: Vercel Dashboard의 `Settings > Environment Variables`에서 `NEXT_PUBLIC_SUPABASE_URL` 및 `NEXT_PUBLIC_SUPABASE_ANON_KEY`를 환경 변수로 등록해야 합니다.
2. **AWS S3 환경 변수 설정**: S3 업로드 설정에 필요한 4가지 AWS 키(`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_S3_BUCKET_NAME`)도 Vercel 환경 변수에 필수로 추가해야 빌드 및 파일 저장 기능이 정상 작동합니다.
3. **AWS S3 Bucket CORS 설정**: 이미지 업로드 및 도메인 교차 읽기 에러 방지를 위해 S3 버킷 권한에서 Vercel의 도메인(또는 `*`)을 허용하도록 CORS 구성을 추가해야 합니다.
