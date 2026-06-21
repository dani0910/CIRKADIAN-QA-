'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { randomUUID } from 'crypto'
import path from 'path'

import { parseProjectDescription } from '@/utils/project'

export async function createProject(
  name: string,
  description?: string | null,
  qa?: string | null,
  developer?: string | null,
  designer?: string | null,
  period?: string | null,
  status?: string | null
) {
  const supabase = await createClient()

  const metaData = {
    description: description || '',
    qa: qa || '',
    developer: developer || '',
    designer: designer || '',
    period: period || '',
    versions: [],
    status: status || '진행 중'
  }

  const { data, error } = await supabase
    .from('projects')
    .insert([
      {
        id: randomUUID(),
        name,
        description: JSON.stringify(metaData)
      }
    ])
    .select()

  if (error) {
    throw new Error(`Failed to create project: ${error.message}`)
  }

  revalidatePath('/')
  return data[0]
}

export async function updateProjectMetadata(projectId: string, meta: {
  description?: string
  qa?: string
  developer?: string
  designer?: string
  period?: string
  versions?: string[]
  status?: string
}) {
  const supabase = await createClient()

  // 1. Fetch current description
  const { data: project, error: fetchError } = await supabase
    .from('projects')
    .select('description')
    .eq('id', projectId)
    .single()

  if (fetchError) {
    throw new Error(`Failed to fetch project for metadata update: ${fetchError.message}`)
  }

  const currentMeta = parseProjectDescription(project.description)
  const nextMeta = {
    description: meta.description !== undefined ? meta.description : currentMeta.description,
    qa: meta.qa !== undefined ? meta.qa : currentMeta.qa,
    developer: meta.developer !== undefined ? meta.developer : currentMeta.developer,
    designer: meta.designer !== undefined ? meta.designer : currentMeta.designer,
    period: meta.period !== undefined ? meta.period : currentMeta.period,
    versions: meta.versions !== undefined ? meta.versions : currentMeta.versions,
    status: meta.status !== undefined ? meta.status : currentMeta.status
  }

  const { error: updateError } = await supabase
    .from('projects')
    .update({ description: JSON.stringify(nextMeta) })
    .eq('id', projectId)

  if (updateError) {
    throw new Error(`Failed to update project metadata: ${updateError.message}`)
  }

  revalidatePath('/')
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

export async function createCategoryGroup(projectId: string, title: string, testCategory?: string) {
  const supabase = await createClient()

  const finalTitle = testCategory?.trim() ? `${title.trim()}|||${testCategory.trim()}` : title.trim()

  const { data, error } = await supabase
    .from('category_groups')
    .insert([
      {
        id: randomUUID(),
        project_id: projectId,
        title: finalTitle,
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
  status?: 'PASS' | 'FAIL' | 'UNTESTED'
  tags?: string[] | null
  actualResult?: string | null
  evidenceUrls?: string[]
  appVersion?: string | null
  device?: string | null
  testers?: string | null
  executionDate?: string | null
}) {
  const supabase = await createClient()

  if (params.status || params.tags !== undefined) {
    const updates: any = {}
    if (params.status) updates.status = params.status
    if (params.tags !== undefined) updates.tags = params.tags

    const { error: tcError } = await supabase
      .from('test_cases')
      .update(updates)
      .eq('id', tcId)
    if (tcError) {
      throw new Error(`Failed to update test case: ${tcError.message}`)
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

  let nextComments: any;
  const currentComments = detail?.comments;

  if (Array.isArray(currentComments)) {
    nextComments = [...currentComments, comment];
  } else if (currentComments && typeof currentComments === 'object') {
    const list = (currentComments as any).list || [];
    nextComments = {
      ...(currentComments as any),
      list: [...list, comment]
    };
  } else {
    nextComments = [comment];
  }

  const { error: updateError } = await supabase
    .from('tc_details')
    .update({ comments: nextComments })
    .eq('id', tcId)

  if (updateError) {
    throw new Error(`Failed to save comment: ${updateError.message}`)
  }

  revalidatePath('/')
  return Array.isArray(nextComments) ? nextComments : nextComments.list;
}

export async function updateOpinionText(tcId: string, type: 'refinement' | 'policy', text: string) {
  const supabase = await createClient()

  const { data: detail, error: fetchError } = await supabase
    .from('tc_details')
    .select('comments')
    .eq('id', tcId)
    .single()

  if (fetchError) {
    throw new Error(`Failed to fetch test case details: ${fetchError.message}`)
  }

  let nextComments: any;
  const currentComments = detail?.comments;

  if (Array.isArray(currentComments)) {
    nextComments = {
      list: currentComments,
      refinement_text: type === 'refinement' ? text : '',
      policy_text: type === 'policy' ? text : ''
    };
  } else if (currentComments && typeof currentComments === 'object') {
    nextComments = {
      ...(currentComments as any),
      refinement_text: type === 'refinement' ? text : ((currentComments as any).refinement_text || ''),
      policy_text: type === 'policy' ? text : ((currentComments as any).policy_text || '')
    };
  } else {
    nextComments = {
      list: [],
      refinement_text: type === 'refinement' ? text : '',
      policy_text: type === 'policy' ? text : ''
    };
  }

  const { error: updateError } = await supabase
    .from('tc_details')
    .update({ comments: nextComments })
    .eq('id', tcId)

  if (updateError) {
    throw new Error(`Failed to save opinion text: ${updateError.message}`)
  }

  revalidatePath('/')
  return nextComments;
}

export async function deleteProject(projectId: string) {
  const supabase = await createClient()

  // 1. Fetch test cases of the project to delete their details
  const { data: testCases, error: fetchError } = await supabase
    .from('test_cases')
    .select('id')
    .eq('project_id', projectId)

  if (fetchError) {
    throw new Error(`Failed to fetch project test cases for deletion: ${fetchError.message}`)
  }

  // 2. Delete tc_details for those test cases
  if (testCases && testCases.length > 0) {
    const tcIds = testCases.map(tc => tc.id)
    const { error: detailsDeleteError } = await supabase
      .from('tc_details')
      .delete()
      .in('id', tcIds)
    
    if (detailsDeleteError) {
      throw new Error(`Failed to delete project test case details: ${detailsDeleteError.message}`)
    }
  }

  // 3. Delete test_cases
  const { error: tcDeleteError } = await supabase
    .from('test_cases')
    .delete()
    .eq('project_id', projectId)

  if (tcDeleteError) {
    throw new Error(`Failed to delete project test cases: ${tcDeleteError.message}`)
  }

  // 4. Delete category_groups
  const { error: groupDeleteError } = await supabase
    .from('category_groups')
    .delete()
    .eq('project_id', projectId)

  if (groupDeleteError) {
    throw new Error(`Failed to delete project categories: ${groupDeleteError.message}`)
  }

  // 5. Delete project itself
  const { error: projectDeleteError } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId)

  if (projectDeleteError) {
    throw new Error(`Failed to delete project: ${projectDeleteError.message}`)
  }

  revalidatePath('/')
}

export async function updateCategoryGroup(groupId: string, title: string, testCategory?: string) {
  const supabase = await createClient()

  const finalTitle = testCategory?.trim() ? `${title.trim()}|||${testCategory.trim()}` : title.trim()

  const { error } = await supabase
    .from('category_groups')
    .update({
      title: finalTitle
    })
    .eq('id', groupId)

  if (error) {
    throw new Error(`Failed to update category group: ${error.message}`)
  }

  revalidatePath('/')
}

export async function deleteCategoryGroup(groupId: string) {
  const supabase = await createClient()

  // 1. Fetch test cases of the category group to delete their details
  const { data: testCases, error: fetchError } = await supabase
    .from('test_cases')
    .select('id')
    .eq('group_id', groupId)

  if (fetchError) {
    throw new Error(`Failed to fetch test cases for category deletion: ${fetchError.message}`)
  }

  // 2. Delete tc_details for those test cases
  if (testCases && testCases.length > 0) {
    const tcIds = testCases.map(tc => tc.id)
    const { error: detailsDeleteError } = await supabase
      .from('tc_details')
      .delete()
      .in('id', tcIds)
    
    if (detailsDeleteError) {
      throw new Error(`Failed to delete test case details: ${detailsDeleteError.message}`)
    }
  }

  // 3. Delete test_cases
  const { error: tcDeleteError } = await supabase
    .from('test_cases')
    .delete()
    .eq('group_id', groupId)

  if (tcDeleteError) {
    throw new Error(`Failed to delete test cases: ${tcDeleteError.message}`)
  }

  // 4. Delete category group itself
  const { error: groupDeleteError } = await supabase
    .from('category_groups')
    .delete()
    .eq('id', groupId)

  if (groupDeleteError) {
    throw new Error(`Failed to delete category group: ${groupDeleteError.message}`)
  }

  revalidatePath('/')
}

export async function updateTestCase(params: {
  id: string
  title: string
  groupId?: string
  tcCode?: string
  tags?: string[]
  tester?: string
  steps?: string[]
  prerequisites?: string[]
  expectedResult?: string
}) {
  const supabase = await createClient()

  // 1. Update test_cases
  const { error: tcError } = await supabase
    .from('test_cases')
    .update({
      title: params.title,
      group_id: params.groupId || null,
      tc_code: params.tcCode || null,
      tags: params.tags || null,
      tester: params.tester || '이다연'
    })
    .eq('id', params.id)

  if (tcError) {
    throw new Error(`Failed to update testcase: ${tcError.message}`)
  }

  // 2. Update tc_details
  const { error: detailError } = await supabase
    .from('tc_details')
    .update({
      steps: params.steps || [],
      prerequisites: params.prerequisites || [],
      expected_result: params.expectedResult || null,
      testers: params.tester || '이다연'
    })
    .eq('id', params.id)

  if (detailError) {
    throw new Error(`Failed to update testcase details: ${detailError.message}`)
  }

  revalidatePath('/')
}

export async function deleteTestCase(tcId: string) {
  const supabase = await createClient()

  // 1. Delete details first
  const { error: detailError } = await supabase
    .from('tc_details')
    .delete()
    .eq('id', tcId)

  if (detailError) {
    throw new Error(`Failed to delete testcase details: ${detailError.message}`)
  }

  // 2. Delete testcase
  const { error: tcError } = await supabase
    .from('test_cases')
    .delete()
    .eq('id', tcId)

  if (tcError) {
    throw new Error(`Failed to delete testcase: ${tcError.message}`)
  }

  revalidatePath('/')
}
