import { createClient } from '@/utils/supabase/server'
import DashboardStats from '@/features/dashboard/DashboardStats'
import TestCaseList from '@/features/testcase/TestCaseList'
import ProjectList from '@/features/project/ProjectList'

export const dynamic = 'force-dynamic'

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
  let tcComments: TCComment[] = []
  
  try {
    const supabase = await createClient()
    const { data: dbProjects } = await supabase.from('projects').select('*')
    if (dbProjects) {
      projects = dbProjects as Project[]
    }

    if (selectedProject) {
      const { data: dbGroups } = await supabase
        .from('category_groups')
        .select('*')
        .eq('project_id', selectedProject)
        .order('created_at', { ascending: true })
      if (dbGroups) {
        categoryGroups = dbGroups as CategoryGroup[]
      }

      const { data: dbTestCases } = await supabase
        .from('test_cases')
        .select('*')
        .eq('project_id', selectedProject)
        .order('created_at', { ascending: true })
      if (dbTestCases) {
        testCases = dbTestCases as TestCase[]
      }

      const testCaseIds = testCases.map((tc) => tc.id)
      if (testCaseIds.length > 0) {
        const { data: dbDetails } = await supabase
          .from('tc_details')
          .select('*')
          .in('id', testCaseIds)
        if (dbDetails) {
          tcDetails = dbDetails as TCDetail[]
        }

        const { data: dbComments } = await supabase
          .from('tc_comments')
          .select('*')
          .in('test_case_id', testCaseIds)
          .order('created_at', { ascending: true })
        if (dbComments) {
          tcComments = dbComments as TCComment[]
        }
      }
    }
  } catch (err) {
    console.error('Failed to load database records', err)
  }

  // If no project is selected, render the ProjectList landing screen
  if (!selectedProject) {
    return <ProjectList projects={projects} />
  }

  return (
    <div className="space-y-10 w-full max-w-[1440px] mx-auto px-4 sm:px-6">
      

      {/* Developer A Area (Dashboard & Statistics) */}
      <section className="space-y-4">
        <DashboardStats key={`dashboard-${selectedProject}`} projects={projects} testCases={testCases} selectedProjectId={selectedProject || 'proj-1'} categoryGroups={categoryGroups} tcDetails={tcDetails} />
      </section>

      {/* Divider */}
      <div className="border-t border-[#222631]" />

      {/* Developer B Area (Test Case Accordion & Image Upload) */}
      <section className="space-y-4">
        <TestCaseList key={`testcases-${selectedProject}`} projectId={selectedProject} categoryGroups={categoryGroups} testCases={testCases} tcDetails={tcDetails} tcComments={tcComments} />
      </section>
      
    </div>
  )
}
