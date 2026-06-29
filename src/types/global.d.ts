declare global {
  interface Project {
    id: string
    name: string
    description?: string | null
    qa?: string | null
    developer?: string | null
    designer?: string | null
    period?: string | null
    created_at: string
  }

  type TestCaseStatus = 'PASS' | 'FAIL' | 'UNTESTED' | 'POLICY_REVIEW'

  interface CategoryGroup {
    id: string
    project_id?: string
    parent_id?: string | null
    title: string
    test_category?: string
    display_order?: number | null
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
    fail_type?: 'BUG' | 'UX_ISSUE' | null
    app_version?: string
    device?: string
    testers?: string
    execution_date?: string
    comments?: {
      author: string
      text: string
      date: string
    }[]
    evidence_urls: string[]
    updated_at: string
  }

  interface TCComment {
    id: string
    test_case_id: string
    author: string
    body: string
    created_at: string
  }
}

export {}
