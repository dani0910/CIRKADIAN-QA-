'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { randomUUID } from 'crypto'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function createProject(name: string, description?: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('projects')
    .insert([
      {
        id: randomUUID(),
        name,
        description: description || null,
      }
    ])
    .select()

  if (error) {
    throw new Error(`Failed to create project: ${error.message}`)
  }

  revalidatePath('/')
  return data[0]
}

export async function createTestCase(params: {
  projectId: string
  title: string
  groupId?: string
  tcCode?: string
  tags?: string[]
  os?: string
  tester?: string
  steps?: string[]
  prerequisites?: string[]
  expectedResult?: string
}) {
  const supabase = await createClient()
  const platforms = ['iOS', 'Android']

  for (const os of platforms) {
    const tcId = randomUUID()

    // 1. Insert into test_cases
    const { error: tcError } = await supabase
      .from('test_cases')
      .insert([
        {
          id: tcId,
          project_id: params.projectId,
          group_id: params.groupId || null,
          tc_code: params.tcCode || null,
          tags: params.tags || null,
          os: os,
          tester: params.tester || '이다연',
          title: params.title,
          status: 'UNTESTED',
        }
      ])

    if (tcError) {
      throw new Error(`Failed to create testcase for ${os}: ${tcError.message}`)
    }

    // 2. Insert into tc_details
    const { error: detailError } = await supabase
      .from('tc_details')
      .insert([
        {
          id: tcId,
          steps: params.steps || [],
          step_statuses: params.steps ? params.steps.map(() => 'UNTESTED') : [],
          prerequisites: params.prerequisites || [],
          expected_result: params.expectedResult || null,
          actual_result: null,
          evidence_urls: [],
          comments: [],
          app_version: '',
          device: '',
          testers: params.tester || '이다연',
          execution_date: '',
        }
      ])

    if (detailError) {
      // Rollback testcase if details insertion fails
      await supabase.from('test_cases').delete().eq('id', tcId)
      throw new Error(`Failed to create testcase details for ${os}: ${detailError.message}`)
    }
  }

  revalidatePath('/')
}

export async function createCategoryGroup(projectId: string, title: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('category_groups')
    .insert([
      {
        id: randomUUID(),
        project_id: projectId,
        title,
      }
    ])
    .select()

  if (error) {
    throw new Error(`Failed to create category group: ${error.message}`)
  }

  revalidatePath('/')
  return data[0]
}

export async function updateTestCaseResult(tcId: string, params: {
  status?: 'PASS' | 'FAIL' | 'UNTESTED' | 'BLOCK'
  actualResult?: string | null
  evidenceUrls?: string[]
  appVersion?: string | null
  device?: string | null
  testers?: string | null
  executionDate?: string | null
}) {
  const supabase = await createClient()

  if (params.status) {
    const { error: tcError } = await supabase
      .from('test_cases')
      .update({ status: params.status })
      .eq('id', tcId)
    if (tcError) {
      throw new Error(`Failed to update test case status: ${tcError.message}`)
    }
  }

  const detailUpdates: any = {}
  if (params.actualResult !== undefined) {
    detailUpdates.actual_result = params.actualResult
  }
  if (params.evidenceUrls !== undefined) {
    detailUpdates.evidence_urls = params.evidenceUrls
  }
  if (params.appVersion !== undefined) {
    detailUpdates.app_version = params.appVersion
  }
  if (params.device !== undefined) {
    detailUpdates.device = params.device
  }
  if (params.testers !== undefined) {
    detailUpdates.testers = params.testers
  }
  if (params.executionDate !== undefined) {
    detailUpdates.execution_date = params.executionDate
  }

  if (Object.keys(detailUpdates).length > 0) {
    const { error: detailError } = await supabase
      .from('tc_details')
      .update(detailUpdates)
      .eq('id', tcId)
    if (detailError) {
      throw new Error(`Failed to update test case details: ${detailError.message}`)
    }
  }

  revalidatePath('/')
}

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

export async function addTestCaseComment(tcId: string, comment: {
  author: string
  role: string
  text: string
  date: string
}) {
  const supabase = await createClient()

  const { data: detail, error: fetchError } = await supabase
    .from('tc_details')
    .select('comments')
    .eq('id', tcId)
    .single()

  if (fetchError) {
    throw new Error(`Failed to fetch test case details: ${fetchError.message}`)
  }

  const currentComments = (detail?.comments as any[]) || []
  const nextComments = [...currentComments, comment]

  const { error: updateError } = await supabase
    .from('tc_details')
    .update({ comments: nextComments })
    .eq('id', tcId)

  if (updateError) {
    throw new Error(`Failed to save comment: ${updateError.message}`)
  }

  revalidatePath('/')
  return nextComments
}
