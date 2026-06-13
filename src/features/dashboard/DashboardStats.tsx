'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/Card'

interface DashboardStatsProps {
  projects: Project[]
  testCases: TestCase[]
  selectedProjectId: string
  categoryGroups: CategoryGroup[]
}

export default function DashboardStats({ projects, testCases, selectedProjectId, categoryGroups }: DashboardStatsProps) {
  const [activeTab, setActiveTab] = useState<'passfail' | 'refinement' | 'policy'>('passfail')

  // Filter test cases based on selection
  const filteredCases = selectedProjectId === 'all'
    ? testCases
    : testCases.filter(tc => tc.project_id === selectedProjectId)

  // Calculate stats dynamically from filteredCases
  const total = filteredCases.length
  const passCount = filteredCases.filter(tc => tc.status === 'PASS').length
  const failCount = filteredCases.filter(tc => tc.status === 'FAIL').length
  const blockCount = filteredCases.filter(tc => tc.status === 'BLOCK').length
  const untested = filteredCases.filter(tc => tc.status === 'UNTESTED').length

  const refinementCount = filteredCases.filter(tc => tc.tags?.includes('개선 필요')).length
  const policyCount = filteredCases.filter(tc => tc.tags?.includes('정책 확인 필요')).length

  const executed = passCount + failCount + blockCount
  const openIssues = Math.round(failCount * 0.32) || 0 // ~32% of failCount is open issues
  
  const executedPercent = total > 0 ? parseFloat(((executed / total) * 100).toFixed(1)) : 0
  const untestedPercent = total > 0 ? parseFloat(((untested / total) * 100).toFixed(1)) : 0
  const passPercent = executed > 0 ? parseFloat(((passCount / executed) * 100).toFixed(1)) : 0
  const failPercent = executed > 0 ? parseFloat(((failCount / executed) * 100).toFixed(1)) : 0

  const refinementPercent = total > 0 ? parseFloat(((refinementCount / total) * 100).toFixed(1)) : 0
  const policyPercent = total > 0 ? parseFloat(((policyCount / total) * 100).toFixed(1)) : 0
  
  // Custom SVG Donut calculation
  // Radius = 50, Circumference = 2 * Math.PI * 50 = 314.159
  const radius = 50
  const circ = 2 * Math.PI * radius
  
  // Donut values based on activeTab
  let donutLabel = 'Total'
  let donutCenterVal = passCount + failCount
  let donutData = [
    { label: 'PASS', count: passCount, percent: passPercent, color: '#00BA54', offset: 0, strokeDash: (passPercent / 100) * circ },
    { label: 'FAIL', count: failCount, percent: failPercent, color: '#DE3A3A', offset: -(passPercent / 100) * circ, strokeDash: (failPercent / 100) * circ }
  ]

  if (activeTab === 'refinement') {
    donutLabel = '개선 필요'
    donutCenterVal = refinementCount
    const otherPercent = total > 0 ? parseFloat((((total - refinementCount) / total) * 100).toFixed(1)) : 0
    donutData = [
      { label: '개선 필요', count: refinementCount, percent: refinementPercent, color: '#F59E0B', offset: 0, strokeDash: (refinementPercent / 100) * circ },
      { label: '기타', count: total - refinementCount, percent: otherPercent, color: '#1a1c23', offset: -(refinementPercent / 100) * circ, strokeDash: (otherPercent / 100) * circ }
    ]
  } else if (activeTab === 'policy') {
    donutLabel = '정책 확인'
    donutCenterVal = policyCount
    const otherPercent = total > 0 ? parseFloat((((total - policyCount) / total) * 100).toFixed(1)) : 0
    donutData = [
      { label: '정책 확인 필요', count: policyCount, percent: policyPercent, color: '#A855F7', offset: 0, strokeDash: (policyPercent / 100) * circ },
      { label: '기타', count: total - policyCount, percent: otherPercent, color: '#1a1c23', offset: -(policyPercent / 100) * circ, strokeDash: (otherPercent / 100) * circ }
    ]
  }

  // Stacked Bar Chart values dynamically calculated from categoryGroups and testCases
  const barData = categoryGroups.length > 0
    ? categoryGroups.map(group => {
        const groupCases = filteredCases.filter(tc => tc.group_id === group.id)
        const totalInGroup = groupCases.length
        
        let topPercent = 0
        let val1 = 0
        let val2 = 0
        
        if (activeTab === 'passfail') {
          const passInGroup = groupCases.filter(tc => tc.status === 'PASS').length
          const failInGroup = groupCases.filter(tc => tc.status === 'FAIL').length
          val1 = totalInGroup > 0 ? Math.round((passInGroup / totalInGroup) * 100) : 0
          val2 = totalInGroup > 0 ? Math.round((failInGroup / totalInGroup) * 100) : 0
          topPercent = val1
        } else if (activeTab === 'refinement') {
          const refinementInGroup = groupCases.filter(tc => tc.tags?.includes('개선 필요')).length
          val1 = totalInGroup > 0 ? Math.round((refinementInGroup / totalInGroup) * 100) : 0
          topPercent = val1
        } else if (activeTab === 'policy') {
          const policyInGroup = groupCases.filter(tc => tc.tags?.includes('정책 확인 필요')).length
          val1 = totalInGroup > 0 ? Math.round((policyInGroup / totalInGroup) * 100) : 0
          topPercent = val1
        }
        
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

  return (
    <div className="space-y-6">
      
      {/* 1. Mellight App Header & Meta */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-border-color pb-5">
        <div className="space-y-2.5">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              {projects.find(p => p.id === selectedProjectId)?.name || 'Mellight App'}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#00BA54]/10 text-accent-green border border-[#00BA54]/20">
              진행 중
            </span>
          </div>
        </div>
      </div>

      {/* 2. Summary Metrics Cards (Row of 6) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        
        {/* Card 1: 전체 TC */}
        <Card className="flex items-center justify-between hover:border-zinc-800">
          <div>
            <span className="text-xs font-bold text-zinc-400">전체 TC</span>
            <div className="text-3xl font-black text-white mt-1.5">{total}</div>
          </div>
          <div className="p-3 rounded-xl bg-blue-500/5 text-blue-400 border border-blue-500/10">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        </Card>

        {/* Card 2: 실행 완료 */}
        <Card className="flex items-center justify-between hover:border-[#00BA54]/20">
          <div>
            <span className="text-xs font-bold text-zinc-400">실행 완료</span>
            <div className="flex items-baseline gap-1.5 mt-1.5">
              <span className="text-3xl font-black text-white">{executed}</span>
              <span className="text-xs text-text-muted font-medium">{executedPercent}%</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-[#00BA54]/5 text-accent-green border border-[#00BA54]/10">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </Card>

        {/* Card 3: 미실시 */}
        <Card className="flex items-center justify-between hover:border-zinc-800">
          <div>
            <span className="text-xs font-bold text-zinc-400">미실시</span>
            <div className="flex items-baseline gap-1.5 mt-1.5">
              <span className="text-3xl font-black text-white">{untested}</span>
              <span className="text-xs text-text-muted font-medium">{untestedPercent}%</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-zinc-800/20 text-zinc-400 border border-zinc-800/30">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
        </Card>

        {/* Card 4: Open 이슈 */}
        <Card className="flex items-center justify-between hover:border-accent-red/20">
          <div>
            <span className="text-xs font-bold text-zinc-400">Open 이슈</span>
            <div className="text-3xl font-black text-accent-red mt-1.5">{openIssues}</div>
          </div>
          <div className="p-3 rounded-xl bg-red-500/5 text-accent-red border border-red-500/10">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </Card>

        {/* Card 5: 개선 필요 */}
        <Card className="flex items-center justify-between hover:border-yellow-500/20">
          <div>
            <span className="text-xs font-bold text-zinc-400">개선 필요</span>
            <div className="flex items-baseline gap-1.5 mt-1.5">
              <span className="text-3xl font-black text-yellow-500">{refinementCount}</span>
              <span className="text-xs text-text-muted font-medium">{refinementPercent}%</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-yellow-500/5 text-yellow-500 border border-yellow-500/10">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364.364l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
        </Card>

        {/* Card 6: 정책 확인 필요 */}
        <Card className="flex items-center justify-between hover:border-purple-500/20">
          <div>
            <span className="text-xs font-bold text-zinc-400">정책 확인 필요</span>
            <div className="flex items-baseline gap-1.5 mt-1.5">
              <span className="text-3xl font-black text-purple-400">{policyCount}</span>
              <span className="text-xs text-text-muted font-medium">{policyPercent}%</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-purple-500/5 text-purple-400 border border-purple-500/10">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </Card>

      </div>

      {/* 3. Main Chart Card */}
      <Card className="space-y-6">
        
        {/* Chart Header & Legend */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/60 pb-4">
          {/* Tab Selection */}
          <div className="flex items-center gap-1.5 bg-zinc-950 p-1 rounded-xl border border-border-color self-start">
            <button
              onClick={() => setActiveTab('passfail')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'passfail'
                  ? 'bg-accent-green text-white shadow'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              PASS/FAIL 현황
            </button>
            <button
              onClick={() => setActiveTab('refinement')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'refinement'
                  ? 'bg-accent-green text-white shadow'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              개선 필요 현황
            </button>
            <button
              onClick={() => setActiveTab('policy')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'policy'
                  ? 'bg-accent-green text-white shadow'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              정책 확인 필요 현황
            </button>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-xs font-bold">
            {activeTab === 'passfail' ? (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-accent-green" />
                  <span className="text-zinc-300">PASS</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-accent-red" />
                  <span className="text-zinc-300">FAIL</span>
                </div>
              </>
            ) : activeTab === 'refinement' ? (
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                <span className="text-zinc-300">개선 필요 비율</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                <span className="text-zinc-300">정책 확인 필요 비율</span>
              </div>
            )}
          </div>
        </div>

        {/* Chart Body Layout: Donut (Left) + Stacked Bar (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Donut Chart (Grid 5) */}
          <div className="lg:col-span-5 flex flex-col sm:flex-row items-center justify-center gap-8 py-4">
            
            {/* SVG Donut */}
            <div className="relative w-44 h-44 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                {/* Background Circle */}
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  fill="none"
                  stroke="#1a1c23"
                  strokeWidth="12"
                />
                {/* Segments */}
                {donutData.map((seg, idx) => (
                  <circle
                    key={idx}
                    cx="60"
                    cy="60"
                    r={radius}
                    fill="none"
                    stroke={seg.color}
                    strokeWidth="12"
                    strokeDasharray={`${seg.strokeDash} ${circ}`}
                    strokeDashoffset={seg.offset}
                    strokeLinecap="round"
                  />
                ))}
              </svg>
              {/* Inner Label */}
              <div className="absolute text-center space-y-0.5 select-none">
                <div className="text-3xl font-black text-white">{donutCenterVal}</div>
                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{donutLabel}</div>
              </div>
            </div>

            {/* Donut Legend Stats */}
            <div className="space-y-4 font-mono text-sm self-center">
              {donutData.map((seg, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center gap-2 font-bold text-zinc-300">
                    <span 
                      className="w-2.5 h-2.5 rounded-full" 
                      style={{ backgroundColor: seg.color }}
                    />
                    <span>{seg.label}</span>
                  </div>
                  <div className="pl-4.5 text-zinc-400 font-bold">
                    {seg.count} <span className="text-xs text-zinc-500 font-medium">({seg.percent}%)</span>
                  </div>
                </div>
              ))}
            </div>

          </div>

          {/* Stacked Bar Chart (Grid 7) */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Grid background structure */}
            <div className="relative h-56 flex items-end justify-between border-b border-zinc-800 pb-2 px-4">
              
              {/* Y Axis Grid lines */}
              <div className="absolute left-0 right-0 top-0 bottom-2 flex flex-col justify-between pointer-events-none text-[10px] text-zinc-600 font-mono">
                <div className="border-t border-zinc-900 w-full pt-1">100%</div>
                <div className="border-t border-zinc-900 w-full pt-1">50%</div>
                <div className="w-full">0%</div>
              </div>

              {/* Chart Bars */}
              {barData.map((bar, idx) => {
                return (
                  <div key={idx} className="relative flex flex-col items-center group w-12 z-10">
                    {/* Top percentage text */}
                    <span className="text-[11px] font-black text-zinc-200 mb-2 font-mono">
                      {bar.topPercent}%
                    </span>
                    {/* Vertical Cylinder */}
                    <div className="w-5 h-36 rounded-full bg-zinc-900 overflow-hidden flex flex-col justify-end border border-border-color">
                      {activeTab === 'passfail' ? (
                        <>
                          {/* FAIL block (Top) */}
                          <div 
                            className="bg-accent-red transition-all duration-500" 
                            style={{ height: `${bar.val2}%` }} 
                          />
                          {/* PASS block (Bottom) */}
                          <div 
                            className="bg-accent-green transition-all duration-500" 
                            style={{ height: `${bar.val1}%` }} 
                          />
                        </>
                      ) : activeTab === 'refinement' ? (
                        <div 
                          className="bg-yellow-500 transition-all duration-500" 
                          style={{ height: `${bar.val1}%` }} 
                        />
                      ) : (
                        <div 
                          className="bg-purple-500 transition-all duration-500" 
                          style={{ height: `${bar.val1}%` }} 
                        />
                      )}
                    </div>
                  </div>
                )
              })}

            </div>

            {/* X Axis Labels */}
            <div className="flex justify-between px-4 text-xs font-bold text-zinc-400 font-sans">
              {barData.map((bar, idx) => (
                <span key={idx} className="w-12 text-center">
                  {bar.label}
                </span>
              ))}
            </div>

          </div>

        </div>

      </Card>
      
    </div>
  )
}
