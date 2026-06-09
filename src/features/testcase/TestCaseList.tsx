'use client'

import React, { useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { supabase } from '@/lib/supabase'

interface TestCaseListProps {
  categoryGroups: CategoryGroup[]
  testCases: TestCase[]
  tcDetails: (TCDetail & {
    step_statuses?: string[]
    category?: string
    prerequisites?: string[]
    actual_result?: string | null
    app_version?: string
    device?: string
    testers?: string
    execution_date?: string
    comments?: {
      author: string
      role: string
      text: string
      date: string
    }[]
  })[]
}

export default function TestCaseList({ categoryGroups, testCases: initialTestCases, tcDetails }: TestCaseListProps) {
  const [testCases, setTestCases] = useState<TestCase[]>(initialTestCases)
  
  // Expanded states for groups (Parent level) and test cases (Child level)
  // Initially expand group-a and group-b, and case tc-scan-004 to matches the screenshots perfectly.
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'group-a': true,
    'group-b': true
  })
  
  const [expandedTestCases, setExpandedTestCases] = useState<Record<string, boolean>>({
    'tc-scan-004': true
  })

  // Comments, image gallery switcher, and uploads states mapped by TestCase ID
  const [commentsState, setCommentsState] = useState<Record<string, { author: string; role: string; text: string; date: string }[]>>(() => {
    const initial: Record<string, any> = {}
    tcDetails.forEach(detail => {
      initial[detail.id] = detail.comments || []
    })
    return initial
  })

  const [imagesState, setImagesState] = useState<Record<string, string[]>>(() => {
    const initial: Record<string, string[]> = {}
    tcDetails.forEach(detail => {
      initial[detail.id] = detail.evidence_urls.length > 0 
        ? detail.evidence_urls 
        : [
            'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80',
            'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80'
          ]
    })
    return initial
  })

  const [activeImageIndexes, setActiveImageIndexes] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {}
    tcDetails.forEach(detail => {
      initial[detail.id] = 0
    })
    return initial
  })

  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({})
  const [uploadingId, setUploadingId] = useState<string | null>(null)

  // Filter States
  const [activeTab, setActiveTab] = useState<'all' | 'ios' | 'android' | 'web'>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }))
  }

  const toggleTestCase = (tcId: string) => {
    setExpandedTestCases(prev => ({ ...prev, [tcId]: !prev[tcId] }))
  }

  const updateStatus = async (id: string, newStatus: TestCaseStatus) => {
    setTestCases(prev => prev.map(tc => tc.id === id ? { ...tc, status: newStatus } : tc))
    
    try {
      const { error } = await supabase
        .from('test_cases')
        .update({ status: newStatus })
        .eq('id', id)
      
      if (error) {
        console.error('Failed to update status in Supabase:', error.message)
      }
    } catch (err) {
      console.error('Supabase connection error:', err)
    }
  }

  const handleAddComment = (tcId: string) => {
    const text = commentInputs[tcId]
    if (!text || !text.trim()) return

    const newComment = {
      author: '이다연',
      role: 'QA Specialist',
      text: text,
      date: new Date().toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' }) + ' ' + new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })
    }

    setCommentsState(prev => ({
      ...prev,
      [tcId]: [...(prev[tcId] || []), newComment]
    }))

    setCommentInputs(prev => ({ ...prev, [tcId]: '' }))
  }

  const handleImageUpload = (tcId: string) => {
    const nextImages = [
      'https://images.unsplash.com/photo-1542744094-3a31f103e35f?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=600&q=80'
    ]
    const currentList = imagesState[tcId] || []
    const nextImg = nextImages[currentList.length % nextImages.length]

    setImagesState(prev => ({
      ...prev,
      [tcId]: [...currentList, nextImg]
    }))
    
    setActiveImageIndexes(prev => ({
      ...prev,
      [tcId]: currentList.length
    }))
  }

  // Filter Category groups
  const filteredGroups = categoryGroups.filter(group => {
    // Search query matching group title
    if (searchQuery && group.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return true
    }
    // Matching categories
    if (selectedCategory !== 'all' && !group.title.includes(selectedCategory)) {
      return false
    }
    return true
  })

  // Status Badge UI
  const renderStatusBadge = (status: TestCaseStatus) => {
    const styles = {
      PASS: 'bg-[#00BA54]/10 text-accent-green border border-[#00BA54]/20',
      FAIL: 'bg-[#DE3A3A]/10 text-[#DE3A3A] border border-[#DE3A3A]/20',
      BLOCK: 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20',
      UNTESTED: 'bg-zinc-800 text-zinc-400 border border-zinc-700'
    }

    const labels = {
      PASS: 'PASS',
      FAIL: 'FAIL',
      BLOCK: 'BLOCK',
      UNTESTED: '미실시'
    }

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black tracking-wider ${styles[status]}`}>
        {labels[status]}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      
      {/* Search and platform header filter controls */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white tracking-tight">전체 테스트 케이스</h2>
        <Button variant="primary" size="md" className="flex items-center gap-1.5 font-bold shadow-lg shadow-accent-green/20">
          <span>+</span> 테스트 케이스 추가
        </Button>
      </div>

      <div className="space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          
          <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-border-color self-start">
            {['all', 'ios', 'android', 'web'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all capitalize ${
                  activeTab === tab
                    ? 'bg-zinc-800 text-white shadow'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {tab === 'all' ? '전체' : tab}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-card-bg border border-border-color rounded-xl px-3 py-2 text-xs font-bold text-zinc-300 outline-none cursor-pointer hover:border-zinc-700"
            >
              <option value="all">기능 영역 전체</option>
              <option value="BLE">BLE / 페어링</option>
              <option value="기기전환">기기 전환</option>
              <option value="동기화">동기화</option>
              <option value="통신">통신</option>
              <option value="예외 처리">예외 처리</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-card-bg border border-border-color rounded-xl px-3 py-2 text-xs font-bold text-zinc-300 outline-none cursor-pointer hover:border-zinc-700"
            >
              <option value="all">전체 상태</option>
              <option value="PASS">PASS</option>
              <option value="FAIL">FAIL</option>
              <option value="BLOCK">BLOCK</option>
              <option value="UNTESTED">미실시</option>
            </select>

            <div className="relative">
              <input
                type="text"
                placeholder="TC-ID, 테스트 항목명 검색"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-card-bg border border-border-color rounded-xl pl-9 pr-4 py-2 text-xs text-zinc-200 outline-none w-56 focus:border-zinc-700"
              />
              <span className="absolute left-3.5 top-2.5 text-zinc-500 text-xs">🔍</span>
            </div>

          </div>

        </div>
      </div>

      {/* Hierarchical Double Accordion List */}
      <div className="space-y-4">
        {filteredGroups.map((group) => {
          const isGroupExpanded = !!expandedGroups[group.id]
          
          // Get children testcases belonging to this parent category group
          const groupCases = testCases.filter(tc => tc.group_id === group.id)
          
          // Filter by status tab selector
          const visibleCases = groupCases.filter(tc => {
            const matchesOS = activeTab === 'all' || !tc.os || tc.os.toLowerCase().includes(activeTab)
            const matchesStatus = selectedStatus === 'all' || tc.status === selectedStatus
            const matchesSearch = searchQuery === '' || tc.title.toLowerCase().includes(searchQuery.toLowerCase()) || tc.tc_code?.toLowerCase().includes(searchQuery.toLowerCase())
            return matchesOS && matchesStatus && matchesSearch
          })

          const totalCount = groupCases.length
          const passCount = groupCases.filter(c => c.status === 'PASS').length

          if (visibleCases.length === 0 && searchQuery !== '') return null

          return (
            <div key={group.id} className="border border-border-color rounded-2xl overflow-hidden bg-card-bg/25">
              
              {/* Level 1: Category Group Header (부모 아코디언) */}
              <div
                onClick={() => toggleGroup(group.id)}
                className="flex items-center justify-between px-5 py-4 bg-[#090A0D]/80 cursor-pointer select-none border-b border-border-color/60 hover:bg-[#151821]/30 transition-all"
              >
                <span className="text-sm font-black text-zinc-100 tracking-tight">{group.title}</span>
                <div className="flex items-center gap-3 font-mono text-xs">
                  <span className="text-zinc-500 font-bold">{passCount}/{totalCount} PASS</span>
                  <span className={`text-[9px] text-zinc-600 transition-transform duration-200 ${isGroupExpanded ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                </div>
              </div>

              {/* Category Children Container */}
              {isGroupExpanded && (
                <div className="divide-y divide-zinc-900 bg-black/10">
                  {visibleCases.length > 0 ? (
                    visibleCases.map((tc) => {
                      const isCaseExpanded = !!expandedTestCases[tc.id]
                      const detail = tcDetails.find(d => d.id === tc.id)
                      
                      // Fetch local states
                      const activeComments = commentsState[tc.id] || []
                      const activeImages = imagesState[tc.id] || []
                      const currentImgIndex = activeImageIndexes[tc.id] || 0
                      const currentPreviewUrl = activeImages[currentImgIndex] || ''

                      return (
                        <div key={tc.id} className="transition-all">
                          
                          {/* Level 2: Sub TestCase Row (자식 아코디언) */}
                          <div
                            onClick={() => toggleTestCase(tc.id)}
                            className="flex flex-col sm:flex-row sm:items-center justify-between p-4.5 pl-6.5 cursor-pointer select-none hover:bg-zinc-800/20 gap-3 transition-all"
                          >
                            <div className="flex items-start sm:items-center gap-3">
                              {/* Status Badge */}
                              {renderStatusBadge(tc.status)}
                              
                              {/* TestCase Code */}
                              {tc.tc_code && (
                                <span className="font-mono font-bold text-[11px] text-cyan-400 bg-cyan-950/20 px-1.5 py-0.5 rounded border border-cyan-800/10 shrink-0">
                                  {tc.tc_code}
                                </span>
                              )}

                              {/* Title */}
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs font-semibold text-zinc-200">{tc.title}</span>
                                {/* Mini Tags */}
                                {tc.tags?.map((tag, tagIdx) => (
                                  <span key={tagIdx} className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                    tag === '오류 (Bug)'
                                      ? 'bg-red-500/10 text-accent-red border border-red-500/20'
                                      : tag === '안정성 개선'
                                      ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                                      : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                                  }`}>
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>

                            {/* Chevron and metadata right */}
                            <div className="flex items-center justify-between sm:justify-end gap-5 shrink-0 text-[10px] text-zinc-500 font-sans font-medium pl-8 sm:pl-0">
                              <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 text-right">
                                {tc.tester && <span>테스터: {tc.tester}</span>}
                                {tc.execution_date && <span>실행일: {tc.execution_date}</span>}
                                {tc.os && <span className="text-zinc-600 font-mono">OS: {tc.os}</span>}
                              </div>
                              <span className={`text-[8px] text-zinc-600 transition-transform duration-200 shrink-0 ${isCaseExpanded ? 'rotate-180' : ''}`}>
                                ▼
                              </span>
                            </div>

                          </div>

                          {/* Level 3: Expanded Detail Panel (최하위 전개 영역) */}
                          {isCaseExpanded && (
                            <div className="p-6 pl-8 border-t border-zinc-900 bg-card-bg/15 grid grid-cols-1 xl:grid-cols-12 gap-6 text-xs">
                              
                              {/* Left detail Column */}
                              <div className="xl:col-span-8 space-y-6">
                                
                                {/* Prerequisites */}
                                <div className="space-y-2">
                                  <div className="flex items-center gap-1.5 text-zinc-400 font-bold">
                                    <span>ⓘ</span> 01. 사전 조건 및 참고사항
                                  </div>
                                  <div className="bg-[#090A0D]/50 border border-border-color rounded-xl p-4.5 space-y-2 text-zinc-400 leading-relaxed font-sans">
                                    {detail?.prerequisites?.map((pre, idx) => (
                                      <div key={idx} className="flex items-start gap-2">
                                        <span className="text-zinc-600 select-none">•</span>
                                        <span>{pre}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Steps list */}
                                <div className="space-y-2">
                                  <div className="flex items-center gap-1.5 text-zinc-400 font-bold">
                                    <span>📋</span> 02. 테스트 절차
                                  </div>
                                  <div className="bg-[#090A0D]/50 border border-border-color rounded-xl p-4.5 space-y-3.5">
                                    {detail?.steps.map((step, idx) => {
                                      const stepStatus = detail.step_statuses?.[idx] || 'UNTESTED'
                                      return (
                                        <div key={idx} className="flex items-start justify-between gap-4">
                                          <div className="flex items-start gap-2.5 text-zinc-300 leading-relaxed">
                                            <span className="font-bold text-accent-green font-mono">{idx + 1}.</span>
                                            <span>{step}</span>
                                          </div>
                                          <Badge status={stepStatus as TestCaseStatus} className="text-[10px] scale-90 select-none shrink-0" />
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>

                                {/* Expected vs Actual Results cards */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="border border-border-color rounded-xl p-4.5 bg-[#090A0D]/40 space-y-2">
                                    <div className="text-accent-green font-bold flex items-center gap-1.5">
                                      <span>⊙</span> 예상 결과 (Expected)
                                    </div>
                                    <p className="text-zinc-300 leading-relaxed font-sans">{detail?.expected_result}</p>
                                  </div>

                                  <div className="border border-[#DE3A3A]/20 rounded-xl p-4.5 bg-[#DE3A3A]/5 space-y-2">
                                    <div className="text-accent-red font-bold flex items-center gap-1.5">
                                      <span>⚠</span> 실제 결과 (Actual)
                                    </div>
                                    <p className="text-zinc-300 leading-relaxed font-sans">{detail?.actual_result || '성공 완료'}</p>
                                  </div>
                                </div>

                                {/* Live Comment system */}
                                <div className="space-y-4 pt-4">
                                  <div className="flex items-center gap-2">
                                    <span className="text-zinc-400 font-bold flex items-center gap-1.5">
                                      <span>✉</span> REVIEW & COMMENTS
                                    </span>
                                    <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono text-[10px] font-bold">
                                      {activeComments.length}
                                    </span>
                                  </div>

                                  <div className="space-y-3.5">
                                    {activeComments.length > 0 ? (
                                      activeComments.map((com, idx) => (
                                        <div key={idx} className="border-b border-zinc-900 pb-3.5 space-y-1.5 leading-relaxed font-sans">
                                          <div className="flex items-center justify-between text-[11px]">
                                            <div className="flex items-center gap-1.5 font-bold">
                                              <span className="text-zinc-200">{com.author}</span>
                                              <span className="text-zinc-500 font-medium">({com.role})</span>
                                            </div>
                                            <span className="text-zinc-600 font-mono">{com.date}</span>
                                          </div>
                                          <p className="text-zinc-400 text-[12px]">{com.text}</p>
                                        </div>
                                      ))
                                    ) : (
                                      <p className="text-zinc-600 italic">등록된 의견이 없습니다.</p>
                                    )}
                                  </div>

                                  <div className="relative border border-border-color rounded-xl bg-zinc-950 p-2 flex flex-col">
                                    <textarea
                                      rows={3}
                                      placeholder="의견을 입력하세요..."
                                      value={commentInputs[tc.id] || ''}
                                      onChange={(e) => setCommentInputs({ ...commentInputs, [tc.id]: e.target.value })}
                                      className="bg-transparent text-zinc-200 placeholder-zinc-600 outline-none text-xs p-2 resize-none"
                                    />
                                    <button
                                      onClick={() => handleAddComment(tc.id)}
                                      className="self-end px-4.5 py-1.5 bg-accent-green hover:bg-emerald-600 text-white font-bold rounded-lg transition shadow-lg shadow-emerald-500/10 cursor-pointer text-[11px]"
                                    >
                                      POST
                                    </button>
                                  </div>
                                </div>

                              </div>

                              {/* Right uploader column */}
                              <div className="xl:col-span-4 space-y-6 xl:border-l xl:border-zinc-900 xl:pl-6">
                                
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between text-zinc-400 font-bold">
                                    <span className="flex items-center gap-1.5">
                                      <span>📷</span> EVIDENCE
                                    </span>
                                    <button 
                                      onClick={() => handleImageUpload(tc.id)}
                                      className="text-zinc-400 hover:text-white flex items-center gap-1 text-[11px] font-bold cursor-pointer"
                                    >
                                      <span>📤</span> UPLOAD
                                    </button>
                                  </div>

                                  <div className="relative aspect-[4/5] rounded-xl overflow-hidden border border-border-color bg-zinc-950 flex items-center justify-center group">
                                    {currentPreviewUrl ? (
                                      <img
                                        src={currentPreviewUrl}
                                        alt="Evidence Preview"
                                        className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                                      />
                                    ) : (
                                      <span className="text-zinc-600 italic">No image</span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-2 overflow-x-auto py-1">
                                    {activeImages.map((imgUrl, imgIdx) => {
                                      const isActive = imgIdx === currentImgIndex
                                      return (
                                        <button
                                          key={imgIdx}
                                          onClick={() => setActiveImageIndexes({ ...activeImageIndexes, [tc.id]: imgIdx })}
                                          className={`relative w-14 h-14 rounded-lg overflow-hidden border bg-zinc-950 shrink-0 cursor-pointer transition-all ${
                                            isActive ? 'border-accent-green ring-1 ring-accent-green' : 'border-border-color hover:border-zinc-600'
                                          }`}
                                        >
                                          <img src={imgUrl} className="w-full h-full object-cover" alt="Thumbnail" />
                                        </button>
                                      )
                                    })}
                                    <button
                                      onClick={() => handleImageUpload(tc.id)}
                                      className="w-14 h-14 rounded-lg border border-dashed border-zinc-800 hover:border-zinc-600 flex items-center justify-center text-zinc-500 font-bold shrink-0 cursor-pointer"
                                    >
                                      +
                                    </button>
                                  </div>
                                </div>

                                <div className="border border-border-color rounded-xl overflow-hidden bg-[#090A0D]/50 p-4 space-y-3.5">
                                  <div className="grid grid-cols-2 gap-4 text-left">
                                    <div>
                                      <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">APP VERSION</div>
                                      <div className="text-zinc-200 mt-1 font-mono font-bold">{detail?.app_version || 'v1.0.0'}</div>
                                    </div>
                                    <div>
                                      <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">DEVICE</div>
                                      <div className="text-zinc-200 mt-1 font-bold">{detail?.device || 'iPhone 15 Pro'}</div>
                                    </div>
                                    <div>
                                      <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">TESTERS</div>
                                      <div className="text-zinc-200 mt-1 font-bold">{detail?.testers || 'QA Engine'}</div>
                                    </div>
                                    <div>
                                      <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">EXECUTION DATE</div>
                                      <div className="text-zinc-200 mt-1 font-mono font-bold">{detail?.execution_date || '2024.05.26 14:32'}</div>
                                    </div>
                                  </div>
                                </div>

                                <div className="pt-2 border-t border-zinc-900 flex flex-col gap-1.5">
                                  <Button variant="outline" size="sm" className="hover:border-accent-green hover:text-accent-green w-full" onClick={() => updateStatus(tc.id, 'PASS')}>PASS 로 판정 완료</Button>
                                  <Button variant="outline" size="sm" className="hover:border-accent-red hover:text-accent-red w-full" onClick={() => updateStatus(tc.id, 'FAIL')}>FAIL 로 판정 완료</Button>
                                </div>

                              </div>

                            </div>
                          )}

                        </div>
                      )
                    })
                  ) : (
                    <div className="p-4.5 text-zinc-500 text-xs italic pl-8">이 대분류에는 필터에 일치하는 세부 테스트 케이스가 없습니다.</div>
                  )}
                </div>
              )}

            </div>
          )
        })}
      </div>

    </div>
  )
}
