'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'

const versionsByProject: Record<string, string[]> = {
  'proj-1': ['v1.2.4 (412)', 'v1.2.3 (411)', 'v1.2.2 (410)', 'v1.2.1 (409)'],
  'proj-2': ['v2.1.0 (501)', 'v2.0.9 (500)', 'v2.0.8 (499)'],
  'proj-3': ['v1.0.5 (302)', 'v1.0.4 (301)', 'v1.0.3 (300)']
}

interface DashboardStatsProps {
  projects: Project[]
  testCases: TestCase[]
  selectedProjectId: string
  categoryGroups: CategoryGroup[]
}

export default function DashboardStats({ projects, testCases, selectedProjectId, categoryGroups }: DashboardStatsProps) {
  // Filter test cases based on selection
  const router = useRouter()
  const [isProjectOpen, setIsProjectOpen] = useState(false)
  const [isVersionOpen, setIsVersionOpen] = useState(false)
  const [selectedVersion, setSelectedVersion] = useState<string>('')
  const [versionOptions, setVersionOptions] = useState<string[]>([])
  const [isAddingVersion, setIsAddingVersion] = useState(false)
  const [newVersionValue, setNewVersionValue] = useState('')
  const [activeTab, setActiveTab] = useState<'PASS_FAIL' | 'OS' | 'ISSUE'>('PASS_FAIL')

  const filteredCases = selectedProjectId === 'all'
    ? testCases
    : testCases.filter(tc => tc.project_id === selectedProjectId)

  const availableVersions = versionsByProject[selectedProjectId] || []

  useEffect(() => {
    setVersionOptions(versionsByProject[selectedProjectId] || [])
  }, [selectedProjectId])

  useEffect(() => {
    if (versionOptions.length) {
      setSelectedVersion((prev) => prev || versionOptions[0])
    }
  }, [selectedProjectId, versionOptions])

  const handleProjectSelect = (id: string | null) => {
    setIsProjectOpen(false)
    if (id) {
      router.push(`/?project=${id}`)
    }
  }

  const handleAddVersion = () => {
    if (!newVersionValue.trim()) return
    setVersionOptions((prev) => [newVersionValue.trim(), ...prev])
    setSelectedVersion(newVersionValue.trim())
    setNewVersionValue('')
    setIsAddingVersion(false)
    setIsVersionOpen(false)
  }

  // Calculate stats dynamically from filteredCases
  const total = filteredCases.length
  const passCount = filteredCases.filter(tc => tc.status === 'PASS').length
  const failCount = filteredCases.filter(tc => tc.status === 'FAIL').length
  const blockCount = filteredCases.filter(tc => tc.status === 'BLOCK').length
  const untested = filteredCases.filter(tc => tc.status === 'UNTESTED').length

  const executed = passCount + failCount + blockCount
  const openIssues = Math.round(failCount * 0.32) || 0 // ~32% of failCount is open issues
  
  const executedPercent = total > 0 ? parseFloat(((executed / total) * 100).toFixed(1)) : 0
  const untestedPercent = total > 0 ? parseFloat(((untested / total) * 100).toFixed(1)) : 0
  const passPercent = executed > 0 ? parseFloat(((passCount / executed) * 100).toFixed(1)) : 0
  const failPercent = executed > 0 ? parseFloat(((failCount / executed) * 100).toFixed(1)) : 0

  // Custom SVG Donut calculation
  const radius = 50
  const circ = 2 * Math.PI * radius
  const donutLabel = 'TOTAL'
  const donutCenterVal = total
  const donutData = [
    { label: 'PASS', count: passCount, percent: total > 0 ? parseFloat(((passCount / total) * 100).toFixed(1)) : 0, color: '#00BA54' },
    { label: 'FAIL', count: failCount, percent: total > 0 ? parseFloat(((failCount / total) * 100).toFixed(1)) : 0, color: '#DE3A3A' },
    { label: 'Improvement', count: blockCount, percent: total > 0 ? parseFloat(((blockCount / total) * 100).toFixed(1)) : 0, color: '#F5A623' },
    { label: 'Policy Review', count: untested, percent: total > 0 ? parseFloat(((untested / total) * 100).toFixed(1)) : 0, color: '#8C5FFF' }
  ]

  const donutSegments = donutData.reduce((acc, seg) => {
    const prevTotal = acc.reduce((sum, item) => sum + item.strokeDash, 0)
    const strokeDash = Math.round((seg.percent / 100) * circ)
    return [...acc, { ...seg, strokeDash, offset: -prevTotal }]
  }, [] as Array<typeof donutData[number] & { strokeDash: number; offset: number }>)

  const barData = categoryGroups.length > 0
    ? categoryGroups.map(group => {
        const groupCases = filteredCases.filter(tc => tc.group_id === group.id)
        const totalInGroup = groupCases.length
        
        let topPercent = 0
        let val1 = 0
        let val2 = 0
        
        const passInGroup = groupCases.filter(tc => tc.status === 'PASS').length
        const failInGroup = groupCases.filter(tc => tc.status === 'FAIL').length
        val1 = totalInGroup > 0 ? Math.round((passInGroup / totalInGroup) * 100) : 0
        val2 = totalInGroup > 0 ? Math.round((failInGroup / totalInGroup) * 100) : 0
        topPercent = val1

        let label = group.title
        if (label.includes('.')) {
          const parts = label.split('.')
          if (parts[0].match(/^\d+(-\d+)*(-[a-zA-Z])?$/) || parts[0].trim().length <= 6) {
            label = parts.slice(1).join('.').trim()
          }
        }
        if (label.length > 7) {
          label = label.substring(0, 6) + '..'
        }

        return {
          label,
          topPercent,
          val1,
          val2
        }
      })
    : [
        { label: '연결/BLE', topPercent: 85, val1: 85, val2: 15 },
        { label: '알람', topPercent: 72, val1: 72, val2: 28 },
        { label: '조명 제어', topPercent: 68, val1: 68, val2: 32 },
        { label: '권한', topPercent: 75, val1: 75, val2: 25 },
        { label: '설정', topPercent: 81, val1: 81, val2: 19 },
        { label: '기타', topPercent: 67, val1: 67, val2: 33 },
      ]

  const osCounts = filteredCases.reduce((acc, tc) => {
    const osText = (tc.os || '').toLowerCase()
    if (osText.includes('ios')) acc.iOS += 1
    else if (osText.includes('android')) acc.Android += 1
    else if (osText.includes('web') || osText.includes('웹')) acc.Web += 1
    else acc.Other += 1
    return acc
  }, { iOS: 0, Android: 0, Web: 0, Other: 0 })

  const osTotal = osCounts.iOS + osCounts.Android + osCounts.Web + osCounts.Other
  const osGroups = osTotal > 0
    ? [
        { label: 'iOS', count: osCounts.iOS, color: '#4f8bff' },
        { label: 'Android', count: osCounts.Android, color: '#26c26a' },
        { label: 'Web', count: osCounts.Web, color: '#6c7cff' },
        ...(osCounts.Other ? [{ label: 'Other', count: osCounts.Other, color: '#8f8f9e' }] : [])
      ]
    : [
        { label: 'iOS', count: 258, color: '#4f8bff' },
        { label: 'Android', count: 242, color: '#26c26a' },
        { label: 'Web', count: 12, color: '#6c7cff' }
      ]

  const issueTotal = Math.max(failCount, 1)
  const issueOpen = Math.round(issueTotal * 0.55)
  const issueInProgress = Math.round(issueTotal * 0.25)
  const issueClosed = issueTotal - issueOpen - issueInProgress
  const issueGroups = [
    { label: 'Open', count: issueOpen, color: '#DE3A3A' },
    { label: 'In Progress', count: issueInProgress, color: '#F5A623' },
    { label: 'Closed', count: issueClosed > 0 ? issueClosed : 0, color: '#00BA54' }
  ]

  const issueTotalCount = issueGroups.reduce((sum, item) => sum + item.count, 0)

  return (
    <div className="space-y-4">
      
      {/* 1. Mellight App Header & Meta */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-3 border-b border-border-color pb-4">
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsProjectOpen(!isProjectOpen)}
                className="inline-flex items-center gap-2 text-2xl md:text-3xl font-black text-white tracking-tight"
              >
                <span>{projects.find(p => p.id === selectedProjectId)?.name || 'Mellight App'}</span>
                <span className="text-zinc-400 text-xs">▼</span>
              </button>

              {isProjectOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsProjectOpen(false)} />
                  <div className="absolute left-0 mt-3 w-60 rounded-2xl bg-[#090A0D] border border-[#222631] shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-3 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                      프로젝트 전환
                    </div>
                    {projects.map((proj) => (
                      <button
                        key={proj.id}
                        type="button"
                        onClick={() => handleProjectSelect(proj.id)}
                        className={`w-full text-left px-4 py-2 text-xs font-semibold flex items-center justify-between transition cursor-pointer hover:bg-zinc-800 ${
                          selectedProjectId === proj.id
                            ? 'text-[#00BA54] bg-[#00BA54]/5'
                            : 'text-zinc-300'
                        }`}
                      >
                        <span>{proj.name}</span>
                        {selectedProjectId === proj.id && <span className="text-[#00BA54] text-[10px]">●</span>}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#00BA54]/10 text-accent-green border border-[#00BA54]/20">
              진행 중
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400 font-medium">
            <div>
              <span className="text-zinc-600 mr-2">프로젝트 기간:</span>
              <span className="font-semibold text-zinc-300">{projects.find(p => p.id === selectedProjectId)?.period || '2026.05.01 ~ 진행 중'}</span>
            </div>
            <div className="w-px h-4 bg-zinc-700" />
            <div>
              <span className="text-zinc-600 mr-2">담당 QA:</span>
              <span className="font-semibold text-zinc-300">{projects.find(p => p.id === selectedProjectId)?.qa || '담당자 미지정'}</span>
            </div>
            <div className="w-px h-4 bg-zinc-700" />
            <div>
              <span className="text-zinc-600 mr-2">담당 개발자:</span>
              <span className="font-semibold text-zinc-300">{projects.find(p => p.id === selectedProjectId)?.developer || '담당자 미지정'}</span>
            </div>
            <div className="w-px h-4 bg-zinc-700" />
            <div>
              <span className="text-zinc-600 mr-2">담당 디자인:</span>
              <span className="font-semibold text-zinc-300">{projects.find(p => p.id === selectedProjectId)?.designer || '담당자 미지정'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start">
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setIsVersionOpen((prev) => !prev)
                setIsAddingVersion(false)
              }}
              className="flex items-center gap-2 rounded-lg border border-[#222631] bg-[#151821] px-3 py-2 text-xs font-semibold text-[#62ABAB] hover:bg-zinc-800 transition"
            >
              <span className="font-semibold text-[#62ABAB]">{selectedVersion || '+ 버전 입력'}</span>
              <span className="text-[#62ABAB] text-[10px]">▼</span>
            </button>
            {isVersionOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsVersionOpen(false)} />
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-[#090A0D] border border-[#222631] shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  {versionOptions.map((version) => (
                    <button
                      key={version}
                      type="button"
                      onClick={() => {
                        setSelectedVersion(version)
                        setIsVersionOpen(false)
                      }}
                      className={`w-full text-left px-4 py-2 text-xs font-semibold flex items-center justify-between transition cursor-pointer hover:bg-zinc-800 ${
                        selectedVersion === version
                          ? 'text-[#62ABAB] bg-[#62ABAB]/10'
                          : 'text-zinc-300'
                      }`}
                    >
                      <span>{version}</span>
                      {selectedVersion === version && <span className="text-[#62ABAB] text-[10px]">●</span>}
                    </button>
                  ))}

                  {isAddingVersion ? (
                    <div className="px-4 py-3 space-y-2">
                      <input
                        value={newVersionValue}
                        onChange={(e) => setNewVersionValue(e.target.value)}
                        className="w-full rounded-lg border border-[#222631] bg-[#090A0D] px-3 py-2 text-xs text-white outline-none focus:border-[#62ABAB] focus:ring-2 focus:ring-[#62ABAB]/20"
                        placeholder="버전 입력 (예: v1.2.5)"
                      />
                      <div className="flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={handleAddVersion}
                          className="flex-1 rounded-lg bg-[#62ABAB] px-3 py-2 text-xs font-semibold text-[#020617] hover:bg-[#4d9999] transition"
                        >
                          추가
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsAddingVersion(false)}
                          className="flex-1 rounded-lg border border-[#222631] bg-[#151821] px-3 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 transition"
                        >
                          취소
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="border-t border-[#222631] my-1" />
                      <button
                        type="button"
                        onClick={() => setIsAddingVersion(true)}
                        className="w-full text-left px-4 py-2 text-xs font-semibold text-[#62ABAB] hover:bg-zinc-800 transition"
                      >
                        + 버전 추가
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 2. Summary Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Card className="flex items-center justify-between p-2 hover:border-zinc-800">
          <div>
            <span className="text-xs font-bold text-zinc-400">전체 TC</span>
            <div className="text-xl md:text-2xl font-black text-white mt-0">{total}</div>
          </div>
          <div className="p-1 rounded-xl bg-blue-500/5 text-blue-400 border border-blue-500/10">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        </Card>
        <Card className="flex items-center justify-between p-2 hover:border-[#00BA54]/20">
          <div>
            <span className="text-xs font-bold text-zinc-400">실행 완료</span>
            <div className="flex items-baseline gap-1.5 mt-0">
              <span className="text-xl md:text-2xl font-black text-white">{executed}</span>
              <span className="text-[10px] text-text-muted font-medium">{executedPercent}%</span>
            </div>
          </div>
          <div className="p-1 rounded-xl bg-[#00BA54]/5 text-accent-green border border-[#00BA54]/10">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </Card>
        <Card className="flex items-center justify-between p-2 hover:border-zinc-800">
          <div>
            <span className="text-xs font-bold text-zinc-400">미실시</span>
            <div className="flex items-baseline gap-1.5 mt-0">
              <span className="text-xl md:text-2xl font-black text-white">{untested}</span>
              <span className="text-[10px] text-text-muted font-medium">{untestedPercent}%</span>
            </div>
          </div>
          <div className="p-1 rounded-xl bg-zinc-800/20 text-zinc-400 border border-zinc-800/30">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
        </Card>
        <Card className="flex items-center justify-between p-2 hover:border-accent-red/20">
          <div>
            <span className="text-xs font-bold text-zinc-400">Open 이슈</span>
            <div className="text-xl md:text-2xl font-black text-accent-red mt-0">{openIssues}</div>
          </div>
          <div className="p-1 rounded-xl bg-red-500/5 text-accent-red border border-red-500/10">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </Card>
      </div>

      {/* 3. Main Chart Card */}
      <Card className="space-y-3">
        
        {/* Chart Header & Tab Buttons */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-800/60 pb-3">
          <div>
            <h2 className="text-lg font-black text-white">대시보드 요약</h2>
          </div>
          <div className="flex flex-wrap items-center gap-1">
            {[
              { id: 'PASS_FAIL', label: 'PASS/FAIL 현황' },
              { id: 'OS', label: 'OS별 결과' },
              { id: 'ISSUE', label: '이슈 상태 현황' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`rounded-2xl px-4 py-1.5 text-xs font-semibold transition ${activeTab === tab.id ? 'bg-[#00BA54] text-black' : 'border border-zinc-800 bg-[#151821] text-zinc-300 hover:border-zinc-600 hover:text-white'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'PASS_FAIL' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
            <div className="lg:col-span-4 flex flex-col items-start justify-center gap-3 py-2">
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r={radius} fill="none" stroke="#1a1c23" strokeWidth="10" />
                  {donutSegments.map((seg, idx) => (
                    <circle
                      key={seg.label}
                      cx="60"
                      cy="60"
                      r={radius}
                      fill="none"
                      stroke={seg.color}
                      strokeWidth="10"
                      strokeDasharray={`${seg.strokeDash} ${circ}`}
                      strokeDashoffset={seg.offset}
                      strokeLinecap="round"
                    />
                  ))}
                </svg>
                <div className="absolute text-center space-y-0.5 select-none">
                  <div className="text-2xl sm:text-3xl font-black text-white">{donutCenterVal}</div>
                  <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{donutLabel}</div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-3 rounded-3xl border border-zinc-800 bg-[#090A0D] p-3 text-xs text-zinc-300">
              {donutData.map((seg) => (
                <div key={seg.label} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: seg.color }} />
                    <div>
                      <div className="font-bold text-white">{seg.label}</div>
                      <div className="text-[11px] text-zinc-500">{seg.count}개</div>
                    </div>
                  </div>
                  <div className="text-xs font-semibold text-zinc-400">{seg.percent}%</div>
                </div>
              ))}
            </div>

            <div className="lg:col-span-6 space-y-4 border-l border-zinc-800 pl-5">
              <div className="flex items-center justify-between text-xs text-zinc-400 uppercase tracking-[0.18em] font-bold">
                <span>기능별 PASS율</span>
              </div>
              <div className="grid grid-cols-6 gap-2 px-1">
                {barData.map((bar, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-1">
                    <span className="text-[11px] font-black text-zinc-200">{bar.topPercent}%</span>
                    <div className="relative h-24 w-5 rounded-3xl bg-zinc-900">
                      <div
                        className="absolute bottom-0 left-0 right-0 rounded-3xl bg-accent-green transition-all duration-500"
                        style={{ height: `${bar.topPercent}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-center text-zinc-400">{bar.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'OS' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-5 flex flex-col items-center justify-center gap-4 py-4">
              <div className="relative w-40 h-40 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r={radius} fill="none" stroke="#1a1c23" strokeWidth="10" />
                  {osGroups.map((seg, idx) => {
                    const segmentDash = Math.round((seg.count / Math.max(osGroups.reduce((s, item) => s + item.count, 0), 1)) * circ)
                    const offset = idx === 0 ? 0 : osGroups.slice(0, idx).reduce((sum, prev) => sum + Math.round((prev.count / Math.max(osGroups.reduce((s, item) => s + item.count, 0), 1)) * circ), 0)
                    return (
                      <circle
                        key={seg.label}
                        cx="60"
                        cy="60"
                        r={radius}
                        fill="none"
                        stroke={seg.color}
                        strokeWidth="10"
                        strokeDasharray={`${segmentDash} ${circ}`}
                        strokeDashoffset={-offset}
                        strokeLinecap="round"
                      />
                    )
                  })}
                </svg>
                <div className="absolute text-center space-y-0.5 select-none">
                  <div className="text-2xl sm:text-3xl font-black text-white">{osGroups.reduce((sum, item) => sum + item.count, 0)}</div>
                  <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">OS별 결과</div>
                </div>
              </div>
            </div>
            <div className="lg:col-span-7 grid grid-cols-2 gap-3">
              {osGroups.map((seg) => {
                const total = osGroups.reduce((sum, item) => sum + item.count, 0)
                const percent = total ? Math.round((seg.count / total) * 100) : 0
                return (
                  <div key={seg.label} className="rounded-3xl border border-zinc-800 bg-[#090A0D] p-4 text-xs text-zinc-300">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-white">{seg.label}</span>
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: seg.color }} />
                    </div>
                    <div className="mt-3 text-2xl font-black text-white">{seg.count}</div>
                    <div className="mt-1 text-xs text-zinc-500">{percent}%</div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {activeTab === 'ISSUE' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-5 flex flex-col items-center justify-center gap-4 py-4">
              <div className="relative w-40 h-40 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r={radius} fill="none" stroke="#1a1c23" strokeWidth="10" />
                  {issueGroups.map((seg, idx) => {
                    const segmentDash = Math.round((seg.count / Math.max(issueTotalCount, 1)) * circ)
                    const offset = idx === 0 ? 0 : issueGroups.slice(0, idx).reduce((sum, prev) => sum + Math.round((prev.count / Math.max(issueTotalCount, 1)) * circ), 0)
                    return (
                      <circle
                        key={seg.label}
                        cx="60"
                        cy="60"
                        r={radius}
                        fill="none"
                        stroke={seg.color}
                        strokeWidth="10"
                        strokeDasharray={`${segmentDash} ${circ}`}
                        strokeDashoffset={-offset}
                        strokeLinecap="round"
                      />
                    )
                  })}
                </svg>
                <div className="absolute text-center space-y-0.5 select-none">
                  <div className="text-2xl sm:text-3xl font-black text-white">{issueTotalCount}</div>
                  <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">이슈 상태</div>
                </div>
              </div>
            </div>
            <div className="lg:col-span-7 grid grid-cols-2 gap-3">
              {issueGroups.map((seg) => {
                const percent = issueTotalCount ? Math.round((seg.count / issueTotalCount) * 100) : 0
                return (
                  <div key={seg.label} className="rounded-3xl border border-zinc-800 bg-[#090A0D] p-4 text-xs text-zinc-300">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-white">{seg.label}</span>
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: seg.color }} />
                    </div>
                    <div className="mt-3 text-2xl font-black text-white">{seg.count}</div>
                    <div className="mt-1 text-xs text-zinc-500">{percent}%</div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </Card>
      
    </div>
  )
}
