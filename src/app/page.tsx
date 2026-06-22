import { createClient } from '@/utils/supabase/server'
import DashboardStats from '@/features/dashboard/DashboardStats'
import TestCaseList from '@/features/testcase/TestCaseList'
import ProjectList from '@/features/project/ProjectList'


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
