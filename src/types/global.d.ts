declare global {
  interface Project {
    id: string
    name: string
    description?: string | null
    created_at: string
  }

  type TestCaseStatus = 'PASS' | 'FAIL' | 'UNTESTED' | 'BLOCK'

  interface CategoryGroup {
    id: string
    title: string
  }

  interface TestCase {
    id: string
    project_id: string
    group_id?: string // Links to CategoryGroup
    tc_code?: string // E.g., 'INT-SCAN-001'
    tags?: string[] // E.g., ['페어링', 'UX 개선']
    os?: string // E.g., 'iOS / Android'
    tester?: string // E.g., '이다은, 이다연'
    execution_date?: string // E.g., '2026.05.28'
    title: string
    status: TestCaseStatus
    created_at: string
  }

  interface TCDetail {
    id: string
    steps: string[]
    step_statuses?: string[]
    category?: string
    prerequisites?: string[]
    expected_result?: string | null
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
    evidence_urls: string[]
    updated_at: string
  }
}

export {}
