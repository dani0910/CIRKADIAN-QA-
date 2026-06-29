import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const CSV_PATHS = {
  alarm: '/Users/daeun/Downloads/Mellight_QA - 5-1. 기능별 상세 테스트 묶음-빛알람.csv',
  device: '/Users/daeun/Downloads/Mellight_QA - 5-2. 기능별 상세 테스트 묶음-기기 연동.csv',
  full: '/Users/daeun/Downloads/Mellight_QA - 6. 전체 테스트 표.csv',
}

const MELLIGHT_PROJECT_ID = '5466dca4-5e45-40ea-8ccb-339b9c444265'
const MELATONIN_PROJECT_ID = 'f04b8382-e7a7-4dc5-b912-36823e3a8d27'
const APPLY = process.argv.includes('--apply')

const envText = readFileSync('.env.local', 'utf8')
const env = Object.fromEntries(
  envText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#') && line.includes('='))
    .map((line) => {
      const index = line.indexOf('=')
      return [line.slice(0, index), line.slice(index + 1)]
    }),
)

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]
    const next = text[i + 1]

    if (char === '"') {
      if (inQuotes && next === '"') {
        field += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      row.push(field)
      field = ''
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') i += 1
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else {
      field += char
    }
  }

  if (field || row.length) {
    row.push(field)
    rows.push(row)
  }

  return rows.map((items) => items.map((item) => item.trim()))
}

function splitLines(value) {
  return (value || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
}

function parseCsvDate(value) {
  const match = (value || '').match(/^(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\.?$/)
  if (!match) return undefined
  return new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
  ).toISOString()
}

function normalizeStatus(value, issueType) {
  if (issueType?.includes('정책')) return 'POLICY_REVIEW'
  if (value === 'P') return 'PASS'
  if (value === 'F') return 'FAIL'
  return 'UNTESTED'
}

function makeTags(row) {
  const tags = new Set()
  const parentTitle = row.parentTitle?.trim()

  if (parentTitle) tags.add(parentTitle)
  return [...tags]
}

function testCategoryFromCodeOrCategory(code, category) {
  if (code?.startsWith('HW-')) return 'HW'
  if (code?.startsWith('SW-')) return 'SW'
  if (code?.startsWith('INT-')) return '공통'
  if (category?.includes('BLE') || category?.includes('램프') || category?.includes('센서')) return 'HW'
  return 'SW'
}

function parseDataRowsFromSectionCsv(path, parentTitle, parentCategory) {
  const rows = parseCsv(readFileSync(path, 'utf8'))
  const items = []
  let currentSection = null

  for (const row of rows) {
    const first = row[0] || ''
    if (/^5-\d-[A-Z]\./.test(first)) {
      currentSection = first.replace(/^5-\d-[A-Z]\.\s*/, '').trim()
      continue
    }
    if (first === 'No.' || !/^\d+$/.test(first)) continue

    items.push({
      parentTitle,
      parentCategory,
      childTitle: currentSection || '기타',
      tcCode: row[1] || '',
      category: row[2] || '',
      title: row[3] || '',
      prerequisites: splitLines(row[4]),
      steps: splitLines(row[5]),
      expected: row[6] || '',
      status: normalizeStatus(row[7], row[9] || ''),
      executionDate: row[8] || '',
      issueType: row[9] || '',
      defectId: row[10] || '',
      defectOs: row[11] || '',
      tester: row[12] || '',
      note: row[13] || '',
    })
  }

  return items
}

function parseFullCsv(path, detailedCodes) {
  const rows = parseCsv(readFileSync(path, 'utf8'))
  const items = []

  for (const row of rows) {
    const first = row[0] || ''
    if (first === 'No.' || !/^\d+$/.test(first)) continue
    const tcCode = row[1] || ''
    if (detailedCodes.has(tcCode)) continue

    const category = row[2] || ''
    items.push({
      parentTitle: category || '기타',
      parentCategory: testCategoryFromCodeOrCategory(tcCode, category),
      childTitle: null,
      tcCode,
      category,
      title: row[3] || '',
      prerequisites: splitLines(row[4]),
      steps: splitLines(row[5]),
      expected: row[6] || '',
      status: normalizeStatus(row[7], row[9] || ''),
      executionDate: row[8] || '',
      issueType: row[9] || '',
      defectId: row[10] || '',
      defectOs: row[11] || '',
      tester: row[12] || '',
      note: row[13] || '',
    })
  }

  return items
}

function orderedGroupSpecs(items) {
  const specs = []
  const seen = new Set()

  for (const item of items) {
    const parentKey = item.parentTitle
    if (!seen.has(parentKey)) {
      seen.add(parentKey)
      specs.push({
        key: parentKey,
        title: item.parentTitle,
        category: item.parentCategory,
        parent: true,
      })
    }

    if (item.childTitle) {
      const childKey = `${item.parentTitle}|||${item.childTitle}`
      if (!seen.has(childKey)) {
        seen.add(childKey)
        specs.push({
          key: childKey,
          title: item.childTitle,
          category: item.parentCategory,
          parentTitle: item.parentTitle,
          parent: false,
        })
      }
    }
  }

  return specs
}

function buildImportPlan() {
  const detailed = [
    ...parseDataRowsFromSectionCsv(CSV_PATHS.alarm, '빛알람', 'SW'),
    ...parseDataRowsFromSectionCsv(CSV_PATHS.device, '기기 연동', '공통'),
  ]
  const detailedCodes = new Set(detailed.map((item) => item.tcCode).filter(Boolean))
  const fullOnly = parseFullCsv(CSV_PATHS.full, detailedCodes)
  const items = [...fullOnly, ...detailed]
  const groupSpecs = orderedGroupSpecs(items)

  const groups = []
  const parentIdByTitle = new Map()
  const parentOrderByTitle = new Map()
  const childCounters = new Map()
  let parentOrder = 0

  for (const spec of groupSpecs) {
    const id = randomUUID()

    if (spec.parent) {
      parentOrder += 1
      parentIdByTitle.set(spec.title, id)
      parentOrderByTitle.set(spec.title, parentOrder)
      groups.push({
        id,
        key: spec.key,
        parent_id: null,
        title: spec.title,
        test_category: spec.category,
        display_order: parentOrder,
      })
      continue
    }

    const nextChildOrder = (childCounters.get(spec.parentTitle) || 0) + 1
    childCounters.set(spec.parentTitle, nextChildOrder)
    groups.push({
      id,
      key: spec.key,
      parent_id: parentIdByTitle.get(spec.parentTitle),
      title: spec.title,
      test_category: spec.category,
      display_order: nextChildOrder,
      parent_order: parentOrderByTitle.get(spec.parentTitle),
    })
  }

  const groupIdByKey = new Map(groups.map((group) => [group.key, group.id]))
  const testCases = []
  const details = []
  const comments = []

  for (const item of items) {
    const id = randomUUID()
    const groupKey = item.childTitle ? `${item.parentTitle}|||${item.childTitle}` : item.parentTitle
    const tags = makeTags(item)

    if (item.note) {
      comments.push({
        test_case_id: id,
        author: 'CSV',
        body: item.note,
        created_at: parseCsvDate(item.executionDate),
      })
    }

    testCases.push({
      id,
      groupKey,
      tc_code: item.tcCode || null,
      tags: tags.length ? tags : null,
      os: item.defectOs || null,
      tester: item.tester || null,
      execution_date: item.executionDate || null,
      title: item.title,
      status: item.status,
    })

    details.push({
      id,
      category: item.category || null,
      prerequisites: item.prerequisites,
      steps: item.steps,
      step_statuses: item.steps.map(() => 'UNTESTED'),
      expected_result: item.expected || null,
      actual_result: item.note || null,
      app_version: '',
      device: item.defectOs || '',
      testers: item.tester || '',
      execution_date: item.executionDate || '',
      fail_type: null,
      comments: null,
      evidence_urls: [],
    })
  }

  return { groups, testCases, details, comments, items, groupIdByKey }
}

async function assertSchemaReady() {
  const { error: categoryError } = await supabase
    .from('category_groups')
    .select('id,parent_id,test_category,display_order')
    .limit(1)

  if (categoryError) {
    throw new Error(
      `category_groups schema is not ready: ${categoryError.message}\n` +
      'Run the migration SQL in Supabase first, then rerun this script.'
    )
  }

  const { error: detailError } = await supabase
    .from('tc_details')
    .select('id,fail_type')
    .limit(1)

  if (detailError) {
    throw new Error(
      `tc_details schema is not ready: ${detailError.message}\n` +
      'Run scripts/migrate-tc-details-comments.sql in Supabase first, then rerun this script.'
    )
  }

  const { error: commentError } = await supabase
    .from('tc_comments')
    .select('id,test_case_id,author,body,created_at')
    .limit(1)

  if (commentError) {
    throw new Error(
      `tc_comments table is not ready: ${commentError.message}\n` +
      'Run scripts/migrate-tc-details-comments.sql in Supabase first, then rerun this script.'
    )
  }
}

async function fetchProject(projectId) {
  const { data, error } = await supabase
    .from('projects')
    .select('id,name')
    .eq('id', projectId)
    .single()

  if (error) throw new Error(`Failed to fetch project ${projectId}: ${error.message}`)
  return data
}

async function getCurrentCounts(projectId) {
  const [{ count: groupCount }, { count: testCaseCount }] = await Promise.all([
    supabase.from('category_groups').select('*', { count: 'exact', head: true }).eq('project_id', projectId),
    supabase.from('test_cases').select('*', { count: 'exact', head: true }).eq('project_id', projectId),
  ])
  return { groupCount: groupCount || 0, testCaseCount: testCaseCount || 0 }
}

async function clearProjectTestData(projectId) {
  const { data: currentCases, error: fetchError } = await supabase
    .from('test_cases')
    .select('id')
    .eq('project_id', projectId)

  if (fetchError) throw new Error(`Failed to fetch current test cases: ${fetchError.message}`)

  const ids = currentCases.map((item) => item.id)
  if (ids.length) {
    const { error } = await supabase.from('tc_details').delete().in('id', ids)
    if (error) throw new Error(`Failed to delete tc_details: ${error.message}`)
  }

  {
    const { error } = await supabase.from('test_cases').delete().eq('project_id', projectId)
    if (error) throw new Error(`Failed to delete test_cases: ${error.message}`)
  }

  {
    const { error } = await supabase.from('category_groups').delete().eq('project_id', projectId)
    if (error) throw new Error(`Failed to delete category_groups: ${error.message}`)
  }
}

async function importMellightData(plan) {
  await clearProjectTestData(MELATONIN_PROJECT_ID)
  await clearProjectTestData(MELLIGHT_PROJECT_ID)

  const groupsToInsert = plan.groups.map(({ key, parent_order, ...group }) => ({
    ...group,
    project_id: MELLIGHT_PROJECT_ID,
  }))

  const { error: groupError } = await supabase.from('category_groups').insert(groupsToInsert)
  if (groupError) throw new Error(`Failed to insert category_groups: ${groupError.message}`)

  const groupIdByKey = new Map(plan.groups.map((group) => [group.key, group.id]))
  const testCasesToInsert = plan.testCases.map(({ groupKey, ...item }) => ({
    ...item,
    project_id: MELLIGHT_PROJECT_ID,
    group_id: groupIdByKey.get(groupKey),
  }))

  const { error: testCaseError } = await supabase.from('test_cases').insert(testCasesToInsert)
  if (testCaseError) throw new Error(`Failed to insert test_cases: ${testCaseError.message}`)

  const { error: detailError } = await supabase.from('tc_details').insert(plan.details)
  if (detailError) throw new Error(`Failed to insert tc_details: ${detailError.message}`)

  if (plan.comments.length) {
    const { error: commentError } = await supabase.from('tc_comments').insert(plan.comments)
    if (commentError) throw new Error(`Failed to insert tc_comments: ${commentError.message}`)
  }
}

await assertSchemaReady()

const plan = buildImportPlan()
const [mellightProject, melatoninProject] = await Promise.all([
  fetchProject(MELLIGHT_PROJECT_ID),
  fetchProject(MELATONIN_PROJECT_ID),
])
const [mellightCounts, melatoninCounts] = await Promise.all([
  getCurrentCounts(MELLIGHT_PROJECT_ID),
  getCurrentCounts(MELATONIN_PROJECT_ID),
])

const parents = plan.groups.filter((group) => !group.parent_id).length
const children = plan.groups.length - parents

console.log(`Mellight target: ${mellightProject.name} (${mellightProject.id})`)
console.log(`Melatonin clear target: ${melatoninProject.name} (${melatoninProject.id})`)
console.log(`Current Mellight DB: ${mellightCounts.groupCount} groups, ${mellightCounts.testCaseCount} test cases`)
console.log(`Current Melatonin DB: ${melatoninCounts.groupCount} groups, ${melatoninCounts.testCaseCount} test cases`)
console.log(`Import plan: ${parents} parent groups, ${children} child groups, ${plan.testCases.length} test cases, ${plan.comments.length} comments`)
console.log('')
console.log('Group preview:')
for (const group of plan.groups.slice(0, 24)) {
  const prefix = group.parent_id ? `  - child #${group.display_order}` : `- parent #${group.display_order}`
  console.log(`${prefix}: ${group.title} [${group.test_category}]`)
}
if (plan.groups.length > 24) console.log(`... +${plan.groups.length - 24} more groups`)
console.log('')
console.log('First test cases:')
for (const item of plan.testCases.slice(0, 10)) {
  console.log(`- ${item.tc_code}: ${item.title} [${item.status}]`)
}

if (!APPLY) {
  console.log('')
  console.log('Dry run only. Re-run with --apply to clear Melatonin test data and replace Mellight test data.')
  process.exit(0)
}

await importMellightData(plan)
const [nextMellightCounts, nextMelatoninCounts] = await Promise.all([
  getCurrentCounts(MELLIGHT_PROJECT_ID),
  getCurrentCounts(MELATONIN_PROJECT_ID),
])
console.log('')
console.log(`Done. New Mellight DB: ${nextMellightCounts.groupCount} groups, ${nextMellightCounts.testCaseCount} test cases`)
console.log(`Done. New Melatonin DB: ${nextMelatoninCounts.groupCount} groups, ${nextMelatoninCounts.testCaseCount} test cases`)
