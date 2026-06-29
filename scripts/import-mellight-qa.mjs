import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const CSV_PATHS = {
  alarm: '/Users/daeun/Downloads/Mellight_QA - 5-1. 기능별 상세 테스트 묶음-빛알람.csv',
  device: '/Users/daeun/Downloads/Mellight_QA - 5-2. 기능별 상세 테스트 묶음-기기 연동.csv',
  full: '/Users/daeun/Downloads/Mellight_QA - 6. 전체 테스트 표.csv',
}

const APPLY = process.argv.includes('--apply')
const PROJECT_NAME_HINT = 'Mel'

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

function normalizeStatus(value) {
  if (value === 'P') return 'PASS'
  if (value === 'F') return 'FAIL'
  return 'UNTESTED'
}

function makeTags(row) {
  const tags = new Set()
  const category = row.category?.trim()
  const issueType = row.issueType?.trim()

  if (category) tags.add(category)
  if (issueType) tags.add(issueType)

  if (issueType.includes('정책')) tags.add('정책 확인 필요')
  if (issueType.includes('UX')) tags.add('UX ISSUE')
  if (issueType.includes('오류') || row.defectId?.includes('BUG')) tags.add('BUG')
  if (issueType.includes('안정성')) tags.add('개선 필요')

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
      source: path,
      parentTitle,
      parentCategory,
      childTitle: currentSection || '기타',
      no: first,
      tcCode: row[1] || '',
      category: row[2] || '',
      title: row[3] || '',
      prerequisites: splitLines(row[4]),
      steps: splitLines(row[5]),
      expected: row[6] || '',
      status: normalizeStatus(row[7]),
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
      source: path,
      parentTitle: category || '기타',
      parentCategory: testCategoryFromCodeOrCategory(tcCode, category),
      childTitle: null,
      no: first,
      tcCode,
      category,
      title: row[3] || '',
      prerequisites: splitLines(row[4]),
      steps: splitLines(row[5]),
      expected: row[6] || '',
      status: normalizeStatus(row[7]),
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

function orderedGroupKeys(items) {
  const keys = []
  const seen = new Set()
  for (const item of items) {
    const parentKey = item.parentTitle
    if (!seen.has(parentKey)) {
      seen.add(parentKey)
      keys.push({ key: parentKey, title: item.parentTitle, category: item.parentCategory, parent: true })
    }
    if (item.childTitle) {
      const childKey = `${item.parentTitle}|||${item.childTitle}`
      if (!seen.has(childKey)) {
        seen.add(childKey)
        keys.push({
          key: childKey,
          title: item.childTitle,
          category: item.parentCategory,
          parentTitle: item.parentTitle,
          parent: false,
        })
      }
    }
  }
  return keys
}

function buildImportPlan() {
  const detailed = [
    ...parseDataRowsFromSectionCsv(CSV_PATHS.alarm, '빛알람', 'SW'),
    ...parseDataRowsFromSectionCsv(CSV_PATHS.device, '기기 연동', '공통'),
  ]
  const detailedCodes = new Set(detailed.map((item) => item.tcCode).filter(Boolean))
  const fullOnly = parseFullCsv(CSV_PATHS.full, detailedCodes)
  const items = [...fullOnly, ...detailed]
  const groupSpecs = orderedGroupKeys(items)

  const parentNumbers = new Map()
  let parentNumber = 0
  for (const spec of groupSpecs) {
    if (spec.parent) {
      parentNumber += 1
      parentNumbers.set(spec.title, parentNumber)
    }
  }

  const childCounters = new Map()
  const groups = groupSpecs.map((spec) => {
    const id = randomUUID()
    if (spec.parent) {
      const number = parentNumbers.get(spec.title)
      return {
        id,
        key: spec.key,
        title: `${number}. ${spec.title}|||${spec.category}`,
      }
    }

    const number = parentNumbers.get(spec.parentTitle)
    const nextIndex = childCounters.get(spec.parentTitle) || 0
    childCounters.set(spec.parentTitle, nextIndex + 1)
    const letter = String.fromCharCode(65 + nextIndex)
    return {
      id,
      key: spec.key,
      title: `${number}-${letter}. ${spec.title}|||${spec.category}`,
    }
  })

  const groupIdByKey = new Map(groups.map((group) => [group.key, group.id]))

  const testCases = []
  const details = []

  for (const item of items) {
    const id = randomUUID()
    const groupKey = item.childTitle ? `${item.parentTitle}|||${item.childTitle}` : item.parentTitle
    const tags = makeTags(item)
    const comments = []

    if (item.note) {
      comments.push({
        author: 'CSV',
        role: 'Import',
        text: item.note,
        date: item.executionDate || '',
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
      comments,
      evidence_urls: [],
    })
  }

  return { groups, testCases, details, items }
}

async function findProject() {
  const { data, error } = await supabase.from('projects').select('*').order('created_at')
  if (error) throw new Error(`Failed to fetch projects: ${error.message}`)

  const candidates = data.filter((project) => project.name.toLowerCase().includes(PROJECT_NAME_HINT.toLowerCase()))
  if (candidates.length === 1) return candidates[0]

  const mellight = data.find((project) => /mellight|melatonin|멜라이트/i.test(project.name))
  if (mellight) return mellight

  throw new Error(`Could not find a Mellight project. Projects: ${data.map((project) => project.name).join(', ')}`)
}

async function getCurrentCounts(projectId) {
  const [{ count: groupCount }, { count: testCaseCount }] = await Promise.all([
    supabase.from('category_groups').select('*', { count: 'exact', head: true }).eq('project_id', projectId),
    supabase.from('test_cases').select('*', { count: 'exact', head: true }).eq('project_id', projectId),
  ])
  return { groupCount: groupCount || 0, testCaseCount: testCaseCount || 0 }
}

async function replaceProjectData(project, plan) {
  const { data: currentCases, error: fetchError } = await supabase
    .from('test_cases')
    .select('id')
    .eq('project_id', project.id)

  if (fetchError) throw new Error(`Failed to fetch current test cases: ${fetchError.message}`)

  const ids = currentCases.map((item) => item.id)
  if (ids.length) {
    const { error } = await supabase.from('tc_details').delete().in('id', ids)
    if (error) throw new Error(`Failed to delete tc_details: ${error.message}`)
  }

  {
    const { error } = await supabase.from('test_cases').delete().eq('project_id', project.id)
    if (error) throw new Error(`Failed to delete test_cases: ${error.message}`)
  }

  {
    const { error } = await supabase.from('category_groups').delete().eq('project_id', project.id)
    if (error) throw new Error(`Failed to delete category_groups: ${error.message}`)
  }

  const groupsToInsert = plan.groups.map(({ id, title }) => ({
    id,
    project_id: project.id,
    title,
  }))

  const { error: groupError } = await supabase.from('category_groups').insert(groupsToInsert)
  if (groupError) throw new Error(`Failed to insert category_groups: ${groupError.message}`)

  const groupIdByKey = new Map(plan.groups.map((group) => [group.key, group.id]))
  const testCasesToInsert = plan.testCases.map(({ groupKey, ...item }) => ({
    ...item,
    project_id: project.id,
    group_id: groupIdByKey.get(groupKey),
  }))

  const { error: testCaseError } = await supabase.from('test_cases').insert(testCasesToInsert)
  if (testCaseError) throw new Error(`Failed to insert test_cases: ${testCaseError.message}`)

  const { error: detailError } = await supabase.from('tc_details').insert(plan.details)
  if (detailError) throw new Error(`Failed to insert tc_details: ${detailError.message}`)
}

const plan = buildImportPlan()
const project = await findProject()
const currentCounts = await getCurrentCounts(project.id)

const parents = plan.groups.filter((group) => /^\d+\.\s/.test(group.title)).length
const children = plan.groups.length - parents

console.log(`Project: ${project.name} (${project.id})`)
console.log(`Current DB: ${currentCounts.groupCount} groups, ${currentCounts.testCaseCount} test cases`)
console.log(`Import plan: ${parents} parent groups, ${children} child groups, ${plan.testCases.length} test cases`)
console.log('')
console.log('Group preview:')
for (const group of plan.groups.slice(0, 20)) {
  console.log(`- ${group.title}`)
}
if (plan.groups.length > 20) console.log(`... +${plan.groups.length - 20} more groups`)
console.log('')
console.log('First test cases:')
for (const item of plan.testCases.slice(0, 10)) {
  console.log(`- ${item.tc_code}: ${item.title} [${item.status}]`)
}

if (!APPLY) {
  console.log('')
  console.log('Dry run only. Re-run with --apply to replace project test data.')
  process.exit(0)
}

await replaceProjectData(project, plan)
const nextCounts = await getCurrentCounts(project.id)
console.log('')
console.log(`Done. New DB: ${nextCounts.groupCount} groups, ${nextCounts.testCaseCount} test cases`)
