'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { createProject } from '@/app/actions'

interface ProjectListProps {
  projects: Project[]
}

// Helper to map DB projects to display assets
const getProjectDisplayData = (project: Project) => {
  const name = project.name
  const id = project.id
  
  if (id === 'proj-1' || name === 'Mellight App') {
    return {
      category: 'Mobile App',
      categoryColor: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
      status: '진행 중',
      period: '2026.05.01 ~ 진행 중',
      testers: '이다은, 이다연',
      icon: (
        <div className="w-12 h-12 rounded-xl bg-zinc-950 flex items-center justify-center border border-zinc-800 shrink-0">
          <svg className="w-7 h-7 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707-.707M12 7a5 5 0 100 10 5 5 0 000-10z" />
          </svg>
        </div>
      )
    }
  }
  
  if (id === 'proj-2' || name === 'Melatonin') {
    return {
      category: 'Mobile App',
      categoryColor: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
      status: '진행 중',
      period: '2026.04.15 ~ 진행 중',
      testers: '이다연',
      icon: (
        <div className="w-12 h-12 rounded-xl bg-zinc-950 flex items-center justify-center border border-zinc-800 shrink-0">
          <svg className="w-6 h-6 text-yellow-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        </div>
      )
    }
  }
  
  if (id === 'proj-3' || name === '관리자 웹') {
    return {
      category: 'Web',
      categoryColor: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
      status: '진행 중',
      period: '2026.03.10 ~ 진행 중',
      testers: '이다은',
      icon: (
        <div className="w-12 h-12 rounded-xl bg-zinc-950 flex items-center justify-center border border-zinc-800 shrink-0">
          <svg className="w-6 h-6 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
      )
    }
  }

  // Fallback for user-created dynamic database records
  const isWeb = name.toLowerCase().includes('web') || name.includes('웹')
  const formattedDate = project.created_at ? new Date(project.created_at).toLocaleDateString('ko-KR') : new Date().toLocaleDateString('ko-KR')
  return {
    category: isWeb ? 'Web' : 'App',
    categoryColor: isWeb 
      ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' 
      : 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
    status: '진행 중',
    period: `${formattedDate} ~ 진행 중`,
    testers: '이다연',
    icon: (
      <div className="w-12 h-12 rounded-xl bg-zinc-950 flex items-center justify-center border border-zinc-800 shrink-0">
        <svg className="w-6 h-6 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      </div>
    )
  }
}

export default function ProjectList({ projects }: ProjectListProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')

  // Modal form states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectDesc, setNewProjectDesc] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newProjectName.trim()) return

    setIsSubmitting(true)
    setErrorMsg('')
    try {
      await createProject(newProjectName, newProjectDesc)
      setNewProjectName('')
      setNewProjectDesc('')
      setIsAddModalOpen(false)
    } catch (err: any) {
      setErrorMsg(err.message || '프로젝트 추가 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Filter project cards using dynamic DB list
  const filteredProjects = projects.filter(proj => {
    const matchesSearch = proj.name.toLowerCase().includes(searchQuery.toLowerCase())
    
    const displayData = getProjectDisplayData(proj)
    const matchesStatus = selectedStatus === 'all' || 
      (selectedStatus === 'ongoing' && displayData.status === '진행 중') || 
      (selectedStatus === 'done' && displayData.status === '완료')
      
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      
      {/* 1. Header with update status and add project button */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-border-color pb-5">
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-white tracking-tight">프로젝트 목록</h1>
          <p className="text-sm text-text-muted">진행 중인 프로젝트의 QA 현황을 한눈에 확인하세요.</p>
        </div>
        <div className="flex items-center gap-4.5 self-start md:self-auto shrink-0 text-xs">
          <span className="text-zinc-500 font-medium flex items-center gap-1.5 font-mono">
            마지막 업데이트 2026.06.10 12:30
            <button className="text-zinc-500 hover:text-zinc-300 cursor-pointer">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18.75" />
              </svg>
            </button>
          </span>
          <Button 
            variant="primary" 
            className="font-bold shadow-lg shadow-accent-green/20"
            onClick={() => setIsAddModalOpen(true)}
          >
            + 프로젝트 추가
          </Button>
        </div>
      </div>

      {/* 2. Control / Filter bar */}
      <div className="flex items-center justify-between gap-4">
        
        {/* Toggle layout mode buttons */}
        <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-border-color shrink-0">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
              viewMode === 'grid' ? 'bg-zinc-800 text-blue-400' : 'text-zinc-500 hover:text-zinc-400'
            }`}
          >
            <svg className="w-4.5 h-4.5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 002-2h2a2 2 0 002 2v2a2 2 0 00-2 2h-2a2 2 0 00-2-2V5zM11 13a2 2 0 002-2h2a2 2 0 002 2v2a2 2 0 00-2 2h-2a2 2 0 00-2-2v-2z" />
            </svg>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
              viewMode === 'list' ? 'bg-zinc-800 text-blue-400' : 'text-zinc-500 hover:text-zinc-400'
            }`}
          >
            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Status select dropdown & Search input */}
        <div className="flex items-center gap-2">
          
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-[#151821] border border-border-color rounded-xl px-3.5 py-2 text-xs font-bold text-zinc-300 outline-none cursor-pointer hover:border-zinc-700"
          >
            <option value="all">전체 상태</option>
            <option value="ongoing">진행 중</option>
            <option value="done">완료</option>
          </select>

          <div className="relative">
            <input
              type="text"
              placeholder="프로젝트 검색"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-card-bg border border-border-color rounded-xl pl-9 pr-4 py-2 text-xs text-zinc-200 outline-none w-56 focus:border-zinc-700 font-sans"
            />
            <span className="absolute left-3.5 top-2.5 text-zinc-500 text-xs">🔍</span>
          </div>

        </div>

      </div>

      {/* 3. Representation of cards (Grid or List view) */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map((proj) => {
            const display = getProjectDisplayData(proj)
            return (
              <Link
                key={proj.id}
                href={`/?project=${proj.id}`}
                className="group block bg-[#151821]/40 border border-border-color rounded-2xl p-5 hover:border-zinc-700/80 hover:bg-[#151821]/70 transition-all duration-300 shadow-xl cursor-pointer"
              >
                <div className="space-y-4">
                  
                  {/* Logo line and status */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {display.icon}
                      <div>
                        <h3 className="font-bold text-base text-zinc-100 group-hover:text-white transition">
                          {proj.name}
                        </h3>
                        <span className={`inline-block px-2 py-0.5 mt-1 rounded text-[9px] font-bold ${display.categoryColor}`}>
                          {display.category}
                        </span>
                      </div>
                    </div>
                    
                    {/* Status badge & More menu */}
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#00BA54]/10 text-accent-green border border-[#00BA54]/20">
                        {display.status}
                      </span>
                      <div className="text-zinc-600 hover:text-zinc-400 p-1 cursor-pointer">
                        <svg className="w-4.5 h-4.5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Bottom line project info (period & qa lead) */}
                  <div className="pt-3 border-t border-border-color/60 flex items-center justify-between text-[11px] text-text-muted font-medium font-sans">
                    <div>
                      <span className="text-zinc-600 mr-1">프로젝트 기간</span>
                      <span className="text-zinc-400">{display.period}</span>
                    </div>
                    <div className="w-px h-3 bg-zinc-800" />
                    <div>
                      <span className="text-zinc-600 mr-1">담당 QA</span>
                      <span className="text-zinc-400">{display.testers}</span>
                    </div>
                  </div>

                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="border border-border-color rounded-2xl bg-card-bg/25 overflow-hidden divide-y divide-zinc-900">
          {filteredProjects.map((proj) => {
            const display = getProjectDisplayData(proj)
            return (
              <Link
                key={proj.id}
                href={`/?project=${proj.id}`}
                className="flex items-center justify-between p-4.5 hover:bg-zinc-800/20 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-4.5">
                  {display.icon}
                  <div>
                    <h3 className="font-bold text-sm text-zinc-100">{proj.name}</h3>
                    <span className={`inline-block px-1.5 py-0.2 rounded text-[8px] font-bold mt-1 ${display.categoryColor}`}>
                      {display.category}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-[11px] text-zinc-500 font-sans font-medium">
                  <div>
                    <span className="text-zinc-600 mr-1.5">기간:</span>
                    <span className="text-zinc-400">{display.period}</span>
                  </div>
                  <div>
                    <span className="text-zinc-600 mr-1.5">담당:</span>
                    <span className="text-zinc-400">{display.testers}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#00BA54]/10 text-accent-green border border-[#00BA54]/20 shrink-0">
                    {display.status}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* 4. Project Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#11131c] border border-border-color rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-black text-white mb-2">새 프로젝트 추가</h3>
            <p className="text-xs text-text-muted mb-5">QA 작업을 진행할 새로운 프로젝트를 등록하세요.</p>
            
            {errorMsg && (
              <div className="bg-red-500/10 border border-red-500/20 text-[#DE3A3A] px-3.5 py-2.5 rounded-xl text-xs mb-4">
                {errorMsg}
              </div>
            )}
            
            <form onSubmit={handleAddProject} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">프로젝트명</label>
                <input
                  type="text"
                  required
                  placeholder="예: Mellight App"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full bg-[#090A0D] border border-border-color rounded-xl px-3.5 py-2.5 text-xs text-zinc-200 outline-none focus:border-zinc-700"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">설명 (선택)</label>
                <textarea
                  rows={3}
                  placeholder="프로젝트 상세 설명 입력"
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  className="w-full bg-[#090A0D] border border-border-color rounded-xl p-3 text-xs text-zinc-200 outline-none resize-none focus:border-zinc-700"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setIsAddModalOpen(false)
                    setErrorMsg('')
                  }}
                  className="font-bold"
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isSubmitting}
                  className="font-bold shadow-lg shadow-accent-green/20"
                >
                  {isSubmitting ? '추가 중...' : '프로젝트 생성'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
