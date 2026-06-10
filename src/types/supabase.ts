export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_at?: string
        }
        Relationships: []
      }
      category_groups: {
        Row: {
          id: string
          project_id: string
          title: string
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          title: string
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          title?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "category_groups_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          }
        ]
      }
      test_cases: {
        Row: {
          id: string
          project_id: string
          group_id: string | null
          tc_code: string | null
          tags: string[] | null
          os: string | null
          tester: string | null
          execution_date: string | null
          title: string
          status: 'PASS' | 'FAIL' | 'UNTESTED' | 'BLOCK'
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          group_id?: string | null
          tc_code?: string | null
          tags?: string[] | null
          os?: string | null
          tester?: string | null
          execution_date?: string | null
          title: string
          status?: 'PASS' | 'FAIL' | 'UNTESTED' | 'BLOCK'
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          group_id?: string | null
          tc_code?: string | null
          tags?: string[] | null
          os?: string | null
          tester?: string | null
          execution_date?: string | null
          title?: string
          status?: 'PASS' | 'FAIL' | 'UNTESTED' | 'BLOCK'
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_cases_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          }
        ]
      }
      tc_details: {
        Row: {
          id: string
          steps: string[]
          step_statuses: string[] | null
          category: string | null
          prerequisites: string[] | null
          expected_result: string | null
          actual_result: string | null
          app_version: string | null
          device: string | null
          testers: string | null
          execution_date: string | null
          comments: Json | null
          evidence_urls: string[]
          updated_at: string
        }
        Insert: {
          id: string
          steps: string[]
          step_statuses?: string[] | null
          category?: string | null
          prerequisites?: string[] | null
          expected_result?: string | null
          actual_result?: string | null
          app_version?: string | null
          device?: string | null
          testers?: string | null
          execution_date?: string | null
          comments?: Json | null
          evidence_urls?: string[]
          updated_at?: string
        }
        Update: {
          id?: string
          steps?: string[]
          step_statuses?: string[] | null
          category?: string | null
          prerequisites?: string[] | null
          expected_result?: string | null
          actual_result?: string | null
          app_version?: string | null
          device?: string | null
          testers?: string | null
          execution_date?: string | null
          comments?: Json | null
          evidence_urls?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tc_details_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "test_cases"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
