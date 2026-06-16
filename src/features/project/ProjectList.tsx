'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { createProject, deleteProject } from '@/app/actions'
import { parseProjectDescription } from '@/utils/project'

interface ProjectListProps {
  projects: Project[]
}

// Helper to map DB projects to display assets
const getProjectDisplayData = (project: Project) => {
  const name = project.name
  const id = project.id
  
  // Parse description metadata
  const meta = parseProjectDescription(project.description || null)
  
  // Base display assets mapping
  let category = 'App'
  let categoryColor = 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
  let testers = '이다연'
  let icon = (
    <div className="w-12 h-12 rounded-xl bg-zinc-950 flex items-center justify-center border border-zinc-800 shrink-0">
      <svg className="w-6 h-6 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
      </svg>
    </div>
  )

  if (id === 'proj-1' || name === 'Mellight App') {
    category = 'Mobile App'
    categoryColor = 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
    testers = '이다은, 이다연'
    icon = (
      <div className="w-12 h-12 rounded-xl bg-zinc-950 flex items-center justify-center border border-zinc-800 shrink-0">
        <svg className="w-7 h-7 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707-.707M12 7a5 5 0 100 10 5 5 0 000-10z" />
        </svg>
      </div>
    )
  } else if (id === 'proj-2' || name === 'Melatonin') {
    category = 'Mobile App'
    categoryColor = 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
    testers = '이다연'
    icon = (
      <div className="w-12 h-12 rounded-xl bg-zinc-950 flex items-center justify-center border border-zinc-800 shrink-0">
        <svg className="w-6 h-6 text-yellow-400" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      </div>
    )
  } else if (id === 'proj-3' || name === '관리자 웹') {
    category = 'Web'
    categoryColor = 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
    testers = '이다은'
    icon = (
      <div className="w-12 h-12 rounded-xl bg-zinc-950 flex items-center justify-center border border-zinc-800 shrink-0">
        <svg className="w-6 h-6 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </div>
    )
  }

  // Fallback for user-created dynamic database records
  const isWeb = name.toLowerCase().includes('web') || name.includes('웹')
  if (isWeb) {
    category = 'Web'
    categoryColor = 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
  }
  
  const formattedDate = project.created_at ? new Date(project.created_at).toLocaleDateString('ko-KR') : new Date().toLocaleDateString('ko-KR')

  return {
    category,
    categoryColor,
    status: meta.status || '진행 중',
    qa: meta.qa || project.qa || (id === 'proj-1' ? '이다은' : id === 'proj-2' ? '이다연' : id === 'proj-3' ? '이다은' : '담당자 미지정'),
    developer: meta.developer || project.developer || (id === 'proj-1' ? '김철수' : id === 'proj-2' ? '박지현' : id === 'proj-3' ? '이준호' : '담당자 미지정'),
    designer: meta.designer || project.designer || (id === 'proj-1' ? '박민준' : id === 'proj-2' ? '이수진' : id === 'proj-3' ? '김민지' : '담당자 미지정'),
    period: meta.period || project.period || (id === 'proj-1' ? '2026.05.01 ~ 진행 중' : id === 'proj-2' ? '2026.04.15 ~ 진행 중' : id === 'proj-3' ? '2026.03.10 ~ 진행 중' : `${formattedDate} ~ 진행 중`),
    testers: testers,
    icon: icon
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
  const [newProjectQA, setNewProjectQA] = useState('')
  const [newProjectDeveloper, setNewProjectDeveloper] = useState('')
  const [newProjectDesigner, setNewProjectDesigner] = useState('')
  const [newProjectPeriodStart, setNewProjectPeriodStart] = useState('')
  const [newProjectPeriodEnd, setNewProjectPeriodEnd] = useState('')
  const [newProjectIsOngoing, setNewProjectIsOngoing] = useState(true)
  const [newProjectStatus, setNewProjectStatus] = useState('진행 중')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // Delete project states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteErrorMsg, setDeleteErrorMsg] = useState('')

  const handleDeleteProject = async () => {
    if (!projectToDelete) return
    setIsDeleting(true)
    setDeleteErrorMsg('')
    try {
      await deleteProject(projectToDelete.id)
      setIsDeleteModalOpen(false)
      setProjectToDelete(null)
    } catch (err: any) {
      setDeleteErrorMsg(err.message || '프로젝트 삭제 중 오류가 발생했습니다.')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newProjectName.trim()) return

    setIsSubmitting(true)
    setErrorMsg('')
    
    // Convert YYYY-MM-DD to YYYY.MM.DD format
    const formatDate = (dateStr: string) => {
      if (!dateStr) return ''
      return dateStr.replace(/-/g, '.')
    }

    const periodStr = newProjectPeriodStart
      ? newProjectStatus === '완료' && newProjectPeriodEnd
        ? `${formatDate(newProjectPeriodStart)} ~ ${formatDate(newProjectPeriodEnd)}`
        : `${formatDate(newProjectPeriodStart)} ~ ${newProjectStatus}`
      : null

    try {
      await createProject(newProjectName, newProjectDesc, newProjectQA, newProjectDeveloper, newProjectDesigner, periodStr, newProjectStatus)
      setNewProjectName('')
      setNewProjectDesc('')
      setNewProjectQA('')
      setNewProjectDeveloper('')
      setNewProjectDesigner('')
      setNewProjectPeriodStart('')
      setNewProjectPeriodEnd('')
      setNewProjectIsOngoing(true)
      setNewProjectStatus('진행 중')
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
      (selectedStatus === 'not_started' && displayData.status === '시작 전') ||
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
            <option value="not_started">시작 전</option>
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
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        display.status === '완료'
                          ? 'bg-[#00BA54]/10 text-accent-green border-[#00BA54]/20'
                          : display.status === '시작 전'
                          ? 'bg-zinc-800 text-zinc-400 border-zinc-700'
                          : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      }`}>
                        {display.status}
                      </span>
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setProjectToDelete(proj)
                          setIsDeleteModalOpen(true)
                        }}
                        className="text-zinc-600 hover:text-[#DE3A3A] p-1 cursor-pointer rounded hover:bg-zinc-800/50 transition duration-150"
                        title="프로젝트 삭제"
                      >
                        <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Bottom line project info (period only) */}
                  <div className="pt-3 border-t border-border-color/60 text-[11px] text-text-muted font-medium font-sans">
                    <div>
                      <span className="text-zinc-600 mr-1">프로젝트 기간</span>
                      <span className="text-zinc-400">{display.period}</span>
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
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border shrink-0 ${
                    display.status === '완료'
                      ? 'bg-[#00BA54]/10 text-accent-green border-[#00BA54]/20'
                      : display.status === '시작 전'
                      ? 'bg-zinc-800 text-zinc-400 border-zinc-700'
                      : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                  }`}>
                    {display.status}
                  </span>
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setProjectToDelete(proj)
                      setIsDeleteModalOpen(true)
                    }}
                    className="text-zinc-500 hover:text-[#DE3A3A] p-1 cursor-pointer transition rounded hover:bg-zinc-800/50 shrink-0"
                    title="프로젝트 삭제"
                  >
                    <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
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
            
            <form onSubmit={handleAddProject} className="space-y-4 max-h-96 overflow-y-auto">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">프로젝트명 *</label>
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
                  rows={2}
                  placeholder="프로젝트 상세 설명 입력"
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  className="w-full bg-[#090A0D] border border-border-color rounded-xl p-3 text-xs text-zinc-200 outline-none resize-none focus:border-zinc-700"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">담당 QA</label>
                <input
                  type="text"
                  placeholder="예: 이다은"
                  value={newProjectQA}
                  onChange={(e) => setNewProjectQA(e.target.value)}
                  className="w-full bg-[#090A0D] border border-border-color rounded-xl px-3.5 py-2.5 text-xs text-zinc-200 outline-none focus:border-zinc-700"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">담당 개발자</label>
                <input
                  type="text"
                  placeholder="예: 김철수"
                  value={newProjectDeveloper}
                  onChange={(e) => setNewProjectDeveloper(e.target.value)}
                  className="w-full bg-[#090A0D] border border-border-color rounded-xl px-3.5 py-2.5 text-xs text-zinc-200 outline-none focus:border-zinc-700"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">담당 디자인</label>
                <input
                  type="text"
                  placeholder="예: 박민준"
                  value={newProjectDesigner}
                  onChange={(e) => setNewProjectDesigner(e.target.value)}
                  className="w-full bg-[#090A0D] border border-border-color rounded-xl px-3.5 py-2.5 text-xs text-zinc-200 outline-none focus:border-zinc-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">프로젝트 시작일</label>
                  <input
                    type="date"
                    value={newProjectPeriodStart}
                    onChange={(e) => setNewProjectPeriodStart(e.target.value)}
                    className="w-full bg-[#090A0D] border border-border-color rounded-xl px-3.5 py-2.5 text-xs text-zinc-200 outline-none focus:border-zinc-700 cursor-pointer"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">프로젝트 종료일</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={newProjectPeriodEnd}
                      onChange={(e) => setNewProjectPeriodEnd(e.target.value)}
                      disabled={newProjectIsOngoing}
                      className="flex-1 bg-[#090A0D] border border-border-color rounded-xl px-3.5 py-2.5 text-xs text-zinc-200 outline-none focus:border-zinc-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                  <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">프로젝트 상태</label>
                  <select
                    value={newProjectStatus}
                    onChange={(e) => {
                      const val = e.target.value
                      setNewProjectStatus(val)
                      if (val === '완료') {
                        setNewProjectIsOngoing(false)
                      } else {
                        setNewProjectIsOngoing(true)
                        setNewProjectPeriodEnd('')
                      }
                    }}
                    className="w-full bg-[#090A0D] border border-border-color rounded-xl px-3 py-2.5 text-xs text-zinc-300 outline-none cursor-pointer focus:border-zinc-700 font-bold"
                  >
                    <option value="시작 전">시작 전</option>
                    <option value="진행 중">진행 중</option>
                    <option value="완료">완료</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setIsAddModalOpen(false)
                    setErrorMsg('')
                    setNewProjectName('')
                    setNewProjectDesc('')
                    setNewProjectQA('')
                    setNewProjectDeveloper('')
                    setNewProjectDesigner('')
                    setNewProjectPeriodStart('')
                    setNewProjectPeriodEnd('')
                    setNewProjectIsOngoing(true)
                    setNewProjectStatus('진행 중')
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

      {/* 5. Project Delete Modal */}
      {isDeleteModalOpen && projectToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#11131c] border border-border-color rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-[#DE3A3A] mb-3">
              <svg className="w-6 h-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h3 className="text-lg font-black text-white">프로젝트 삭제</h3>
            </div>
            
            <p className="text-xs text-zinc-300 leading-relaxed mb-4">
              정말 <span className="font-bold text-white">"{projectToDelete.name}"</span> 프로젝트를 삭제하시겠습니까?
            </p>
            
            <div className="bg-red-500/5 border border-red-500/10 text-zinc-400 p-3.5 rounded-xl text-xs space-y-1.5 mb-5 font-medium leading-normal">
              <p className="text-[#DE3A3A] font-bold">⚠️ 주의사항:</p>
              <p>이 프로젝트를 삭제하면 관련 기능 분류(Category), 테스트케이스, 그리고 상세 테스트 결과와 모든 히스토리 코멘트가 영구적으로 삭제되며 복구할 수 없습니다.</p>
            </div>

            {deleteErrorMsg && (
              <div className="bg-red-500/10 border border-red-500/20 text-[#DE3A3A] px-3.5 py-2.5 rounded-xl text-xs mb-4">
                {deleteErrorMsg}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  setIsDeleteModalOpen(false)
                  setProjectToDelete(null)
                  setDeleteErrorMsg('')
                }}
                disabled={isDeleting}
                className="font-bold"
              >
                취소
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleDeleteProject}
                disabled={isDeleting}
                className="font-bold bg-[#DE3A3A] hover:bg-[#b82d2d] border-none text-white shadow-lg shadow-red-500/15"
              >
                {isDeleting ? '삭제 중...' : '프로젝트 삭제'}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
