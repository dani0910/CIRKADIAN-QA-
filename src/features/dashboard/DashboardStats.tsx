'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/Card'

interface DashboardStatsProps {
  projects: Project[]
  testCases: TestCase[]
  selectedProjectId: string
}

export default function DashboardStats({ projects, testCases, selectedProjectId }: DashboardStatsProps) {
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

  const executed = passCount + failCount + blockCount
  const openIssues = Math.round(failCount * 0.32) || 0 // ~32% of failCount is open issues (e.g. 28 / 86)
  
  const executedPercent = total > 0 ? parseFloat(((executed / total) * 100).toFixed(1)) : 0
  const untestedPercent = total > 0 ? parseFloat(((untested / total) * 100).toFixed(1)) : 0
  const passPercent = executed > 0 ? parseFloat(((passCount / executed) * 100).toFixed(1)) : 0
  const failPercent = executed > 0 ? parseFloat(((failCount / executed) * 100).toFixed(1)) : 0
  
  // Custom SVG Donut calculation
  // Radius = 50, Circumference = 2 * Math.PI * 50 = 314.159
  const radius = 50
  const circ = 2 * Math.PI * radius
  
  const passStrokeDash = (passPercent / 100) * circ
  const failStrokeDash = (failPercent / 100) * circ
  
  // Dashoffsets
  const passOffset = 0
  const failOffset = -passStrokeDash

  // Stacked Bar Chart mock values for categories
  const barData = [
    { label: '연결/BLE', pass: 85, fail: 15 },
    { label: '알람', pass: 72, fail: 28 },
    { label: '조명 제어', pass: 68, fail: 32 },
    { label: '권한', pass: 75, fail: 25 },
    { label: '설정', pass: 81, fail: 19 },
    { label: '기타', pass: 67, fail: 33 },
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
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1.5 text-xs text-text-muted font-medium">
            <div>
              <span className="text-zinc-500 mr-1.5">프로젝트 기간</span>
              <span className="text-zinc-300">2026.05.01 ~ 2026.06.09</span>
            </div>
            <div className="w-px h-3 bg-zinc-800 hidden sm:block" />
            <div>
              <span className="text-zinc-500 mr-1.5">담당 QA</span>
              <span className="text-zinc-300">이다은, 이다연</span>
            </div>
            <div className="w-px h-3 bg-zinc-800 hidden sm:block" />
            <div>
              <span className="text-zinc-500 mr-1.5">개발 담당</span>
              <span className="text-zinc-300">김개발, 박개발</span>
            </div>
          </div>
        </div>

        {/* Date Selector */}
        <div className="flex items-center">
          <div className="bg-[#151821] border border-border-color rounded-xl px-4 py-2 text-xs font-semibold text-zinc-300 flex items-center gap-2 shadow-lg cursor-pointer hover:border-zinc-700">
            <span>📅 2026.05.01 ~ 2026.06.09</span>
            <span className="text-zinc-500 text-[10px]">▼</span>
          </div>
        </div>
      </div>

      {/* 2. Summary Metrics Cards (Row of 4) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
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
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-accent-green" />
              <span className="text-zinc-300">PASS</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-accent-red" />
              <span className="text-zinc-300">FAIL</span>
            </div>
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
                {/* PASS Circle */}
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  fill="none"
                  stroke="#00BA54"
                  strokeWidth="12"
                  strokeDasharray={`${passStrokeDash} ${circ}`}
                  strokeDashoffset={passOffset}
                  strokeLinecap="round"
                />
                {/* FAIL Circle */}
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  fill="none"
                  stroke="#DE3A3A"
                  strokeWidth="12"
                  strokeDasharray={`${failStrokeDash} ${circ}`}
                  strokeDashoffset={failOffset}
                  strokeLinecap="round"
                />
              </svg>
              {/* Inner Label */}
              <div className="absolute text-center space-y-0.5 select-none">
                <div className="text-3xl font-black text-white">{passCount + failCount}</div>
                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Total</div>
              </div>
            </div>

            {/* Donut Legend Stats */}
            <div className="space-y-4 font-mono text-sm self-center">
              <div className="space-y-1">
                <div className="flex items-center gap-2 font-bold text-zinc-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-accent-green" />
                  <span>PASS</span>
                </div>
                <div className="pl-4.5 text-zinc-400 font-bold">
                  {passCount} <span className="text-xs text-zinc-500 font-medium">({passPercent}%)</span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 font-bold text-zinc-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-accent-red" />
                  <span>FAIL</span>
                </div>
                <div className="pl-4.5 text-zinc-400 font-bold">
                  {failCount} <span className="text-xs text-zinc-500 font-medium">({failPercent}%)</span>
                </div>
              </div>
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
                      {bar.pass}%
                    </span>
                    {/* Vertical Cylinder */}
                    <div className="w-5 h-36 rounded-full bg-zinc-900 overflow-hidden flex flex-col justify-end border border-border-color">
                      {/* FAIL block (Top) */}
                      <div 
                        className="bg-accent-red transition-all duration-500" 
                        style={{ height: `${bar.fail}%` }} 
                      />
                      {/* PASS block (Bottom) */}
                      <div 
                        className="bg-accent-green transition-all duration-500" 
                        style={{ height: `${bar.pass}%` }} 
                      />
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
