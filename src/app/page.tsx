import { createClient } from '@/utils/supabase/server'
import DashboardStats from '@/features/dashboard/DashboardStats'
import TestCaseList from '@/features/testcase/TestCaseList'
import ProjectList from '@/features/project/ProjectList'

// Mock Projects
const mockProjects: Project[] = [
  { id: 'proj-1', name: 'Mellight App', description: '멜라이트 앱 QA 검증', created_at: new Date().toISOString() },
  { id: 'proj-2', name: 'Melatonin', description: '멜라토닌 앱 QA 검증', created_at: new Date().toISOString() },
  { id: 'proj-3', name: '관리자 웹', description: '관리자 웹사이트 QA 검증', created_at: new Date().toISOString() }
]

// Mock Category Groups (대분류)
const mockCategoryGroups: CategoryGroup[] = [
  { id: 'group-a', title: '5-2-A. 다중 램프 스캔 및 순차 페어링 동작' },
  { id: 'group-b', title: '5-2-B. 다중 기기 간 제어 전환(스위칭)' },
  { id: 'group-c', title: '5-2-C. 기기 전원 상태 동기화 및 자동 재연결' },
  { id: 'group-d', title: '5-2-D. 블루투스 통신 거리 이탈 및 복귀 시 동작' },
  { id: 'group-e', title: '5-2-E. 다중 기기 신호 간섭 및 예외 상황(충돌) 처리' }
]

// Programmatic mock test case generator to matches dashboard summary stats:
// 전체 TC: 642 / 실행 완료: 512 / 미실시: 130 / Open 이슈: 28
// PASS: 362 / FAIL: 86 / BLOCK: 64 / UNTESTED: 130
const generateMockTestCases = (projectId: string): TestCase[] => {
  const tcs: TestCase[] = [
    // --- Group A (5-2-A) ---
    { 
      id: 'tc-scan-001', 
      project_id: 'proj-1', 
      group_id: 'group-a', 
      tc_code: 'INT-SCAN-001', 
      title: '다중 램프 동시 스캔 및 식별 검증', 
      status: 'PASS', 
      tags: ['페어링'], 
      tester: '이다은, 이다연', 
      execution_date: '2026.05.28', 
      created_at: new Date().toISOString() 
    },
    { 
      id: 'tc-scan-002', 
      project_id: 'proj-1', 
      group_id: 'group-a', 
      tc_code: 'INT-SCAN-002', 
      title: '다중 스캔 목록 중 단일 기기 선택 페어링 검증', 
      status: 'PASS', 
      tags: ['페어링'], 
      tester: '이다은, 이다연', 
      execution_date: '2026.05.28', 
      created_at: new Date().toISOString() 
    },
    { 
      id: 'tc-scan-003', 
      project_id: 'proj-1', 
      group_id: 'group-a', 
      tc_code: 'INT-SCAN-003', 
      title: '기기 별칭 등록 후 재연결 시 표시 검증', 
      status: 'PASS', 
      tags: ['페어링'], 
      tester: '이다은, 이다연', 
      execution_date: '2026.05.28', 
      created_at: new Date().toISOString() 
    },
    { 
      id: 'tc-scan-004', 
      project_id: 'proj-1', 
      group_id: 'group-a', 
      tc_code: 'INT-SCAN-004', 
      title: '동일 기기에 대한 복수 앱 동시 연결 시도 예외 처리 검증', 
      status: 'FAIL', 
      tags: ['페어링', 'UX 개선'], 
      tester: '이다은, 이다연', 
      execution_date: '2026.05.26', 
      os: 'iOS / Android', 
      created_at: new Date().toISOString() 
    },

    // --- Group B (5-2-B) ---
    { 
      id: 'tc-switch-001', 
      project_id: 'proj-1', 
      group_id: 'group-b', 
      tc_code: 'INT-SWITCH-001', 
      title: '다중 기기 간 기본 제어 전환 검증', 
      status: 'FAIL', 
      tags: ['기기전환', '오류 (Bug)'], 
      tester: '이다은, 이다연', 
      execution_date: '2026.05.26', 
      os: 'iOS', 
      created_at: new Date().toISOString() 
    },
    { 
      id: 'tc-switch-002', 
      project_id: 'proj-1', 
      group_id: 'group-b', 
      tc_code: 'INT-SWITCH-002', 
      title: '기기 전환 후 이전 기기로의 복귀 제어 검증', 
      status: 'FAIL', 
      tags: ['기기전환', '오류 (Bug)'], 
      tester: '이다은, 이다연', 
      execution_date: '2026.05.26', 
      os: 'iOS', 
      created_at: new Date().toISOString() 
    },
    { 
      id: 'tc-switch-003', 
      project_id: 'proj-1', 
      group_id: 'group-b', 
      tc_code: 'INT-SWITCH-003', 
      title: '다중 기기 간 연속 전원 시 세션 안정성 검증', 
      status: 'UNTESTED', 
      tags: ['기기전환', '안정성 개선'], 
      tester: '이다은, 이다연', 
      execution_date: '2026.05.26', 
      created_at: new Date().toISOString() 
    }
  ]

  // Add dummy fill testcases to hit exact numbers for stats (362 PASS, 86 FAIL, 64 BLOCK, 130 UNTESTED)
  let passMax = 359
  let failMax = 83
  let blockMax = 64
  let untestedMax = 129

  if (projectId === 'proj-2') {
    passMax = 237
    failMax = 39
    blockMax = 30
    untestedMax = 79
  } else if (projectId === 'proj-3') {
    passMax = 177
    failMax = 12
    blockMax = 10
    untestedMax = 44
  }

  // PASS: 3 already in active list (tc-scan-001, tc-scan-002, tc-scan-003) -> Add passMax
  for (let i = 0; i < passMax; i++) {
    tcs.push({ id: `tc-pass-fill-${i}`, project_id: 'proj-1', title: `DUMMY-PASS-${i}`, status: 'PASS', created_at: new Date().toISOString() })
  }
  // FAIL: 3 already in active list (tc-scan-004, tc-switch-001, tc-switch-002) -> Add failMax
  for (let i = 0; i < failMax; i++) {
    tcs.push({ id: `tc-fail-fill-${i}`, project_id: 'proj-1', title: `DUMMY-FAIL-${i}`, status: 'FAIL', created_at: new Date().toISOString() })
  }
  // BLOCK: 0 in list -> Add blockMax
  for (let i = 0; i < blockMax; i++) {
    tcs.push({ id: `tc-block-fill-${i}`, project_id: 'proj-1', title: `DUMMY-BLOCK-${i}`, status: 'BLOCK', created_at: new Date().toISOString() })
  }
  // UNTESTED: 1 in list (tc-switch-003) -> Add untestedMax
  for (let i = 0; i < untestedMax; i++) {
    tcs.push({ id: `tc-untested-fill-${i}`, project_id: 'proj-1', title: `DUMMY-UNTESTED-${i}`, status: 'UNTESTED', created_at: new Date().toISOString() })
  }

  return tcs.map(tc => ({ ...tc, project_id: projectId }))
}

// Detailed info for active testcases
const mockTCDetails: (TCDetail & {
  step_statuses?: string[]
  category?: string
  prerequisites?: string[]
  actual_result?: string | null
  app_version?: string
  device?: string
  testers?: string
  execution_date?: string
  comments?: {
    author: string
    role: string
    text: string
    date: string
  }[]
})[] = [
  { 
    id: 'tc-scan-001', 
    category: '페어링',
    prerequisites: ['두 대 이상의 스마트폰에 앱 설치 확인'],
    steps: ['스마트폰 A에서 스캔 시작', '검색 목록 노출 완료 확인'], 
    step_statuses: ['PASS', 'PASS'],
    expected_result: '스캔 장비가 성공적으로 검색 목록에 노출됩니다.',
    actual_result: '성공 완료.',
    evidence_urls: [], 
    app_version: 'v1.2.4 (412)',
    device: 'iPhone 15 Pro',
    testers: '이다은, 이다연',
    execution_date: '2026.05.28',
    comments: [],
    updated_at: new Date().toISOString() 
  },
  { 
    id: 'tc-scan-002', 
    category: '페어링',
    prerequisites: ['스캔된 램프 목록 확보'],
    steps: ['스캔 목록 중 단일 기기 탭', '페어링 진행 후 성공 신호 체크'], 
    step_statuses: ['PASS', 'PASS'],
    expected_result: '선택한 램프와 즉시 통신 세션이 연결됩니다.',
    actual_result: '성공 완료.',
    evidence_urls: [], 
    app_version: 'v1.2.4 (412)',
    device: 'iPhone 15 Pro',
    testers: '이다은, 이다연',
    execution_date: '2026.05.28',
    comments: [],
    updated_at: new Date().toISOString() 
  },
  { 
    id: 'tc-scan-003', 
    category: '페어링',
    prerequisites: ['페어링 성공 완료 기기 정보'],
    steps: ['설정에서 램프 별칭 입력', '연결 해제 후 재접속 시 별칭 로드 확인'], 
    step_statuses: ['PASS', 'PASS'],
    expected_result: '별칭 캐시가 보존되어 재연결 시 정상 출력됩니다.',
    actual_result: '성공 완료.',
    evidence_urls: [], 
    app_version: 'v1.2.4 (412)',
    device: 'iPhone 15 Pro',
    testers: '이다은, 이다연',
    execution_date: '2026.05.28',
    comments: [],
    updated_at: new Date().toISOString() 
  },
  { 
    id: 'tc-scan-004', 
    category: '페어링',
    prerequisites: [
      '두 대 이상의 스마트폰에 동일한 버전의 앱이 설치되어 있어야 함',
      '테스트 대상 기기(램프)의 초기화 상태 확인 필요',
      '네트워크 간섭이 적은 환경에서 수행 권장 (Bluetooth Mesh 환경)'
    ],
    steps: [
      '스마트폰 A에서 램프 스캔 시작 및 검색 리스트 노출 확인',
      '스마트폰 B에서 동일한 램프 스캔 시작 및 검색 리스트 노출 확인',
      'A에서 연결 시도 중 B에서 동시에 연결 버튼 탭하여 동시 진입 유도',
      '두 기기의 반응(성공/실패 팝업) 및 램프의 물리 인디케이터 상태 확인'
    ], 
    step_statuses: ['PASS', 'PASS', 'PASS', 'UNTESTED'], // 3 / 4 (75%)
    expected_result: '먼저 연결을 시도한 기기(A)가 우선권을 가지며, 나중에 시도한 기기(B)에서는 "이미 다른 기기에서 연결 중입니다"라는 팝업 안내가 노출되어야 함.',
    actual_result: '[재현] 기기 A가 연결되는 도중 기기 B에서 연결을 시도할 경우, 두 기기 모두 무한 로딩 상태에 빠지며 램프의 페어링 모드가 강제 종료됨.',
    evidence_urls: [
      'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=600&q=80'
    ], 
    app_version: 'v1.2.4 (412)',
    device: 'iPhone 15 Pro',
    testers: '이다은, 이다연',
    execution_date: '2024.05.26 14:32',
    comments: [
      {
        author: '김철수',
        role: 'QA Lead',
        text: '재현 경로 확인했습니다. 범위가 넓어 긴급 수정 요청 전달 완료되었습니다. 우선 순위 P1 할당.',
        date: '2026.05.26 15:00'
      }
    ],
    updated_at: new Date().toISOString()
  }
]

export default async function Home({
  searchParams
}: {
  searchParams: Promise<{ project?: string }>
}) {
  const params = await searchParams
  const selectedProject = params.project

  let projects: Project[] = []
  let categoryGroups: CategoryGroup[] = []
  let testCases: TestCase[] = []
  let tcDetails: TCDetail[] = []
  
  try {
    const supabase = await createClient()
    const { data: dbProjects } = await supabase.from('projects').select('*')
    if (dbProjects) {
      projects = dbProjects as Project[]
    }

    const { data: dbGroups } = await supabase
      .from('category_groups')
      .select('*')
      .eq('project_id', selectedProject || '')
      .order('created_at', { ascending: true })
    if (dbGroups) {
      categoryGroups = dbGroups as CategoryGroup[]
    }

    const { data: dbTestCases } = await supabase.from('test_cases').select('*')
    if (dbTestCases) {
      testCases = dbTestCases as TestCase[]
    }

    const { data: dbDetails } = await supabase.from('tc_details').select('*')
    if (dbDetails) {
      tcDetails = dbDetails as TCDetail[]
    }
  } catch (err) {
    console.error('Failed to load database records', err)
  }

  // Filter testcases if loaded from DB
  if (selectedProject) {
    testCases = testCases.filter(tc => tc.project_id === selectedProject)
  }

  // If no project is selected, render the ProjectList landing screen
  if (!selectedProject) {
    return <ProjectList projects={projects} />
  }

  return (
    <div className="space-y-10 max-w-6xl mx-auto">
      

      {/* Developer A Area (Dashboard & Statistics) */}
      <section className="space-y-4">
        <DashboardStats projects={projects} testCases={testCases} selectedProjectId={selectedProject || 'proj-1'} categoryGroups={categoryGroups} />
      </section>

      {/* Divider */}
      <div className="border-t border-[#222631]" />

      {/* Developer B Area (Test Case Accordion & Image Upload) */}
      <section className="space-y-4">
        <TestCaseList projectId={selectedProject} categoryGroups={categoryGroups} testCases={testCases} tcDetails={tcDetails} />
      </section>
      
    </div>
  )
}
