'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { supabase } from '@/lib/supabase'
import { createTestCase, createCategoryGroup, updateTestCaseResult, uploadTestCaseEvidence, addTestCaseComment, updateOpinionText } from '@/app/actions'

interface TestCaseListProps {
  projectId: string
  categoryGroups: CategoryGroup[]
  testCases: TestCase[]
  tcDetails: TCDetail[]
}

export default function TestCaseList({ projectId, categoryGroups, testCases: initialTestCases, tcDetails }: TestCaseListProps) {
  const [testCases, setTestCases] = useState<TestCase[]>(initialTestCases)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [activeUploadTcId, setActiveUploadTcId] = useState<string | null>(null)
  const [isUploadingFile, setIsUploadingFile] = useState(false)
  
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
      if (Array.isArray(detail.comments)) {
        initial[detail.id] = detail.comments
      } else if (detail.comments && typeof detail.comments === 'object') {
        initial[detail.id] = (detail.comments as any).list || []
      } else {
        initial[detail.id] = []
      }
    })
    return initial
  })

  const [opinionTextsState, setOpinionTextsState] = useState<Record<string, { refinement: string; policy: string }>>(() => {
    const initial: Record<string, { refinement: string; policy: string }> = {}
    tcDetails.forEach(detail => {
      if (detail.comments && typeof detail.comments === 'object' && !Array.isArray(detail.comments)) {
        initial[detail.id] = {
          refinement: (detail.comments as any).refinement_text || '',
          policy: (detail.comments as any).policy_text || ''
        }
      } else {
        initial[detail.id] = { refinement: '', policy: '' }
      }
    })
    return initial
  })

  const [imagesState, setImagesState] = useState<Record<string, string[]>>(() => {
    const initial: Record<string, string[]> = {}
    tcDetails.forEach(detail => {
      initial[detail.id] = detail.evidence_urls || []
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
  const [commentAuthorInputs, setCommentAuthorInputs] = useState<Record<string, string>>({})
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const [actualResultsState, setActualResultsState] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}
    tcDetails.forEach(detail => {
      initial[detail.id] = detail.actual_result || ''
    })
    return initial
  })

  const [metadataState, setMetadataState] = useState<Record<string, {
    app_version: string
    device: string
    testers: string
    execution_date: string
  }>>(() => {
    const initial: Record<string, any> = {}
    tcDetails.forEach(detail => {
      initial[detail.id] = {
        app_version: detail.app_version || '',
        device: detail.device || '',
        testers: detail.testers || '',
        execution_date: detail.execution_date || ''
      }
    })
    return initial
  })

  // Sync props to state when initialTestCases or tcDetails changes
  useEffect(() => {
    setTestCases(initialTestCases)
  }, [initialTestCases])

  useEffect(() => {
    setCommentsState(prev => {
      const next = { ...prev }
      tcDetails.forEach(detail => {
        if (Array.isArray(detail.comments)) {
          next[detail.id] = detail.comments
        } else if (detail.comments && typeof detail.comments === 'object') {
          next[detail.id] = (detail.comments as any).list || []
        } else {
          next[detail.id] = []
        }
      })
      return next
    })
    setOpinionTextsState(prev => {
      const next = { ...prev }
      tcDetails.forEach(detail => {
        if (detail.comments && typeof detail.comments === 'object' && !Array.isArray(detail.comments)) {
          next[detail.id] = {
            refinement: (detail.comments as any).refinement_text || '',
            policy: (detail.comments as any).policy_text || ''
          }
        } else {
          next[detail.id] = { refinement: '', policy: '' }
        }
      })
      return next
    })
    setImagesState(prev => {
      const next = { ...prev }
      tcDetails.forEach(detail => {
        if (!next[detail.id]) {
          next[detail.id] = detail.evidence_urls || []
        }
      })
      return next
    })
    setActiveImageIndexes(prev => {
      const next = { ...prev }
      tcDetails.forEach(detail => {
        if (next[detail.id] === undefined) {
          next[detail.id] = 0
        }
      })
      return next
    })
    setActualResultsState(prev => {
      const next = { ...prev }
      tcDetails.forEach(detail => {
        if (next[detail.id] === undefined || next[detail.id] === '') {
          next[detail.id] = detail.actual_result || ''
        }
      })
      return next
    })
    setMetadataState(prev => {
      const next = { ...prev }
      tcDetails.forEach(detail => {
        if (!next[detail.id] || (next[detail.id].app_version === '' && next[detail.id].device === '' && next[detail.id].testers === '' && next[detail.id].execution_date === '')) {
          next[detail.id] = {
            app_version: detail.app_version || '',
            device: detail.device || '',
            testers: detail.testers || '',
            execution_date: detail.execution_date || ''
          }
        }
      })
      return next
    })
  }, [tcDetails])

  // Filter States
  const [activeTab, setActiveTab] = useState<'all' | 'ios' | 'android'>('ios')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Modal states for adding TestCase
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newGroupId, setNewGroupId] = useState(categoryGroups[0]?.id || '')
  const [newTcCode, setNewTcCode] = useState('')
  const [newTags, setNewTags] = useState('')
  const [newTester, setNewTester] = useState('이다연')
  const [newSteps, setNewSteps] = useState('')
  const [newPrereqs, setNewPrereqs] = useState('')
  const [newExpected, setNewExpected] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // Modal states for adding Category Group
  const [isAddGroupModalOpen, setIsAddGroupModalOpen] = useState(false)
  const [newGroupTitle, setNewGroupTitle] = useState('')
  const [isAddingGroup, setIsAddingGroup] = useState(false)
  const [groupErrorMsg, setGroupErrorMsg] = useState('')

  useEffect(() => {
    if (categoryGroups.length > 0) {
      const exists = categoryGroups.some(g => g.id === newGroupId)
      if (!exists) {
        setNewGroupId(categoryGroups[0].id)
      }
    } else {
      if (newGroupId !== '') {
        setNewGroupId('')
      }
    }
  }, [categoryGroups, newGroupId])

  const handleAddCategoryGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newGroupTitle.trim()) return

    setIsAddingGroup(true)
    setGroupErrorMsg('')
    try {
      await createCategoryGroup(projectId, newGroupTitle)
      setNewGroupTitle('')
      setIsAddGroupModalOpen(false)
    } catch (err: any) {
      setGroupErrorMsg(err.message || '대분류 추가 중 오류가 발생했습니다.')
    } finally {
      setIsAddingGroup(false)
    }
  }

  const handleAddTestCase = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return

    setIsAdding(true)
    setErrorMsg('')
    try {
      const parsedSteps = newSteps.split('\n').map(s => s.trim()).filter(Boolean)
      const parsedPrereqs = newPrereqs.split('\n').map(p => p.trim()).filter(Boolean)
      const parsedTags = newTags.split(',').map(t => t.trim()).filter(Boolean)

      await createTestCase({
        projectId,
        title: newTitle,
        groupId: newGroupId || undefined,
        tcCode: newTcCode || undefined,
        tags: parsedTags.length > 0 ? parsedTags : undefined,
        tester: newTester || undefined,
        steps: parsedSteps,
        prerequisites: parsedPrereqs,
        expectedResult: newExpected || undefined,
      })

      // Reset
      setNewTitle('')
      setNewTcCode('')
      setNewTags('')
      setNewSteps('')
      setNewPrereqs('')
      setNewExpected('')
      setIsAddModalOpen(false)
    } catch (err: any) {
      setErrorMsg(err.message || '테스트 케이스 추가 중 오류가 발생했습니다.')
    } finally {
      setIsAdding(false)
    }
  }

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }))
  }

  const toggleTestCase = (tcId: string) => {
    setExpandedTestCases(prev => ({ ...prev, [tcId]: !prev[tcId] }))
  }

  const updateStatus = async (id: string, newStatus: TestCaseStatus) => {
    setTestCases(prev => prev.map(tc => tc.id === id ? { ...tc, status: newStatus } : tc))
    
    try {
      await updateTestCaseResult(id, { status: newStatus })
    } catch (err) {
      console.error('Failed to update status in Supabase:', err)
    }
  }

  const toggleTag = async (id: string, tag: string) => {
    const tc = testCases.find(t => t.id === id)
    if (!tc) return

    const currentTags = tc.tags || []
    let nextTags: string[]
    if (currentTags.includes(tag)) {
      nextTags = currentTags.filter(t => t !== tag)
    } else {
      nextTags = [...currentTags, tag]
    }

    setTestCases(prev => prev.map(t => t.id === id ? { ...t, tags: nextTags } : t))

    try {
      await updateTestCaseResult(id, { tags: nextTags })
    } catch (err) {
      console.error('Failed to update tags in Supabase:', err)
    }
  }

  const handleOpinionTextChange = (tcId: string, type: 'refinement' | 'policy', value: string) => {
    setOpinionTextsState(prev => ({
      ...prev,
      [tcId]: {
        ...(prev[tcId] || { refinement: '', policy: '' }),
        [type]: value
      }
    }))
  }

  const handleSaveOpinion = async (tcId: string, type: 'refinement' | 'policy') => {
    const val = opinionTextsState[tcId]?.[type] || ''
    try {
      await updateOpinionText(tcId, type, val)
      alert('의견이 성공적으로 저장되었습니다.')
    } catch (err) {
      console.error('Failed to save opinion:', err)
      alert('의견 저장 중 오류가 발생했습니다.')
    }
  }

  const handleSaveActualResult = async (tcId: string) => {
    const val = actualResultsState[tcId] || ''
    try {
      await updateTestCaseResult(tcId, { actualResult: val })
      alert('실제 결과가 성공적으로 저장되었습니다.')
    } catch (err) {
      console.error('Failed to save actual result:', err)
      alert('실제 결과 저장 중 오류가 발생했습니다.')
    }
  }

  const updateMetadataField = (tcId: string, field: 'app_version' | 'device' | 'testers' | 'execution_date', value: string) => {
    setMetadataState(prev => ({
      ...prev,
      [tcId]: {
        ...(prev[tcId] || { app_version: '', device: '', testers: '', execution_date: '' }),
        [field]: value
      }
    }))
  }

  const handleSaveMetadata = async (tcId: string) => {
    const meta = metadataState[tcId] || { app_version: '', device: '', testers: '', execution_date: '' }
    try {
      await updateTestCaseResult(tcId, {
        appVersion: meta.app_version || null,
        device: meta.device || null,
        testers: meta.testers || null,
        executionDate: meta.execution_date || null
      })
      alert('환경 설정 메타데이터가 저장되었습니다.')
    } catch (err) {
      console.error('Failed to save metadata:', err)
      alert('메타데이터 저장 중 오류가 발생했습니다.')
    }
  }

  const handleAddComment = async (tcId: string) => {
    const author = commentAuthorInputs[tcId] || ''
    const text = commentInputs[tcId] || ''

    if (!author.trim()) {
      alert('닉네임을 입력해 주세요.')
      return
    }
    if (!text.trim()) {
      alert('댓글 내용을 입력해 주세요.')
      return
    }

    const newComment = {
      author: author.trim(),
      role: 'Tester',
      text: text.trim(),
      date: new Date().toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' }) + ' ' + new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })
    }

    try {
      const nextComments = await addTestCaseComment(tcId, newComment)
      setCommentsState(prev => ({
        ...prev,
        [tcId]: nextComments
      }))
      setCommentInputs(prev => ({ ...prev, [tcId]: '' }))
    } catch (err) {
      console.error('Failed to add comment:', err)
      alert('댓글 등록 중 오류가 발생했습니다.')
    }
  }

  const handleImageUpload = (tcId: string) => {
    setActiveUploadTcId(tcId)
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !activeUploadTcId) return

    setIsUploadingFile(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const fileUrl = await uploadTestCaseEvidence(activeUploadTcId, formData)

      // Update client state
      const currentList = imagesState[activeUploadTcId] || []
      const nextList = [...currentList, fileUrl]
      setImagesState(prev => ({ ...prev, [activeUploadTcId]: nextList }))
      setActiveImageIndexes(prev => ({ ...prev, [activeUploadTcId]: nextList.length - 1 }))
    } catch (err) {
      console.error('Failed to upload image:', err)
      alert('이미지 업로드 중 오류가 발생했습니다.')
    } finally {
      setIsUploadingFile(false)
      setActiveUploadTcId(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
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
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="md" 
            className="flex items-center gap-1.5 font-bold hover:border-accent-green hover:text-accent-green cursor-pointer"
            onClick={() => setIsAddGroupModalOpen(true)}
          >
            <span>+</span> 대분류 추가
          </Button>
          <Button 
            variant="primary" 
            size="md" 
            className="flex items-center gap-1.5 font-bold shadow-lg shadow-accent-green/20 cursor-pointer"
            onClick={() => setIsAddModalOpen(true)}
          >
            <span>+</span> 테스트 케이스 추가
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          
          <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-border-color self-start">
            {['ios', 'android', 'all'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all capitalize ${
                  activeTab === tab
                    ? 'bg-zinc-800 text-white shadow'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {tab === 'all' ? '전체보기' : tab === 'ios' ? 'iOS' : 'Android'}
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
              <option value="REFINEMENT">개선 필요</option>
              <option value="POLICY">정책 확인 필요</option>
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
        {filteredGroups.length === 0 ? (
          <div className="border border-dashed border-border-color rounded-2xl p-10 text-center bg-card-bg/5 space-y-3">
            <div className="text-zinc-600 text-3xl select-none">📂</div>
            <h3 className="text-sm font-bold text-zinc-300">등록된 대분류가 없습니다</h3>
            <p className="text-xs text-text-muted max-w-sm mx-auto leading-relaxed">
              이 프로젝트에 등록된 테스트 케이스 대분류가 없습니다. 우측 상단의 <strong>'+ 대분류 추가'</strong> 버튼을 클릭하여 테스트 진행 영역을 분류해 보세요.
            </p>
          </div>
        ) : (
          filteredGroups.map((group) => {
          const isGroupExpanded = !!expandedGroups[group.id]
          
          // Get children testcases belonging to this parent category group
          const groupCases = testCases.filter(tc => tc.group_id === group.id)
          
          // Filter by status tab selector
          const visibleCases = groupCases.filter(tc => {
            const matchesOS = activeTab === 'all' || !tc.os || tc.os.toLowerCase().includes(activeTab)
            let matchesStatus = false
            if (selectedStatus === 'all') {
              matchesStatus = true
            } else if (selectedStatus === 'REFINEMENT') {
              matchesStatus = !!tc.tags?.includes('개선 필요')
            } else if (selectedStatus === 'POLICY') {
              matchesStatus = !!tc.tags?.includes('정책 확인 필요')
            } else {
              matchesStatus = tc.status === selectedStatus
            }
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
                                    <div className="flex items-center justify-between">
                                      <div className="text-accent-red font-bold flex items-center gap-1.5">
                                        <span>⚠</span> 실제 결과 (Actual)
                                      </div>
                                      <button
                                        onClick={() => handleSaveActualResult(tc.id)}
                                        className="px-2.5 py-1 bg-accent-red hover:bg-[#b82a2a] text-white font-bold rounded-lg transition duration-200 text-[10px] cursor-pointer"
                                      >
                                        저장
                                      </button>
                                    </div>
                                    <textarea
                                      rows={2}
                                      placeholder="실제 수행 결과를 입력하세요..."
                                      value={actualResultsState[tc.id] || ''}
                                      onChange={(e) => setActualResultsState({ ...actualResultsState, [tc.id]: e.target.value })}
                                      className="w-full bg-[#11131c]/60 border border-[#DE3A3A]/20 rounded-lg p-2.5 text-zinc-300 placeholder-zinc-600 outline-none resize-none focus:border-[#DE3A3A]/50 focus:ring-1 focus:ring-[#DE3A3A]/50 transition-all text-xs leading-relaxed"
                                    />
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

                                  <div className="border border-border-color rounded-xl bg-zinc-950 p-3.5 space-y-3 flex flex-col">
                                    <div className="flex items-center gap-3">
                                      <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider shrink-0 font-sans">WRITER NICKNAME</span>
                                      <input
                                        type="text"
                                        placeholder="이름 (예: 이다연)"
                                        value={commentAuthorInputs[tc.id] || ''}
                                        onChange={(e) => setCommentAuthorInputs({ ...commentAuthorInputs, [tc.id]: e.target.value })}
                                        className="bg-[#11131c]/60 border border-border-color rounded-lg px-2.5 py-1 text-zinc-200 text-xs outline-none focus:border-zinc-700 font-bold w-48 font-sans"
                                      />
                                    </div>
                                    <textarea
                                      rows={2}
                                      placeholder="여기에 댓글 내용을 입력하세요..."
                                      value={commentInputs[tc.id] || ''}
                                      onChange={(e) => setCommentInputs({ ...commentInputs, [tc.id]: e.target.value })}
                                      className="bg-transparent text-zinc-200 placeholder-zinc-600 border border-border-color/30 rounded-lg p-2.5 outline-none text-xs resize-none focus:border-zinc-700/60 leading-relaxed"
                                    />
                                    <button
                                      onClick={() => handleAddComment(tc.id)}
                                      className="self-end px-4.5 py-1.5 bg-accent-green hover:bg-emerald-600 text-white font-bold rounded-lg transition shadow-lg shadow-emerald-500/10 cursor-pointer text-[11px]"
                                    >
                                      댓글 등록
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
                                      disabled={isUploadingFile && activeUploadTcId === tc.id}
                                      className="text-zinc-400 hover:text-white flex items-center gap-1 text-[11px] font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      {isUploadingFile && activeUploadTcId === tc.id ? (
                                        <span>업로드 중...</span>
                                      ) : (
                                        <>
                                          <span>📤</span> UPLOAD
                                        </>
                                      )}
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
                                      <span className="text-zinc-500 font-medium text-xs">등록된 증적 이미지가 없습니다.</span>
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
                                      disabled={isUploadingFile && activeUploadTcId === tc.id}
                                      className="w-14 h-14 rounded-lg border border-dashed border-zinc-800 hover:border-zinc-600 flex items-center justify-center text-zinc-500 font-bold shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      {isUploadingFile && activeUploadTcId === tc.id ? '...' : '+'}
                                    </button>
                                  </div>
                                </div>

                                <div className="border border-border-color rounded-xl overflow-hidden bg-[#090A0D]/50 p-4 space-y-3.5">
                                  <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider font-sans">ENVIRONMENT METADATA</span>
                                    <button
                                      onClick={() => handleSaveMetadata(tc.id)}
                                      className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-lg transition duration-200 text-[10px] cursor-pointer border border-zinc-700/60"
                                    >
                                      저장
                                    </button>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4 text-left">
                                    <div>
                                      <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">APP VERSION</div>
                                      <input
                                        type="text"
                                        value={metadataState[tc.id]?.app_version || ''}
                                        onChange={(e) => updateMetadataField(tc.id, 'app_version', e.target.value)}
                                        placeholder="입력..."
                                        className="w-full bg-[#11131c]/60 border border-border-color rounded-lg px-2.5 py-1.5 text-zinc-200 mt-1 text-xs outline-none focus:border-zinc-700 font-mono font-bold"
                                      />
                                    </div>
                                    <div>
                                      <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">DEVICE</div>
                                      <input
                                        type="text"
                                        value={metadataState[tc.id]?.device || ''}
                                        onChange={(e) => updateMetadataField(tc.id, 'device', e.target.value)}
                                        placeholder="입력..."
                                        className="w-full bg-[#11131c]/60 border border-border-color rounded-lg px-2.5 py-1.5 text-zinc-200 mt-1 text-xs outline-none focus:border-zinc-700 font-bold"
                                      />
                                    </div>
                                    <div>
                                      <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">TESTERS</div>
                                      <input
                                        type="text"
                                        value={metadataState[tc.id]?.testers || ''}
                                        onChange={(e) => updateMetadataField(tc.id, 'testers', e.target.value)}
                                        placeholder="입력..."
                                        className="w-full bg-[#11131c]/60 border border-border-color rounded-lg px-2.5 py-1.5 text-zinc-200 mt-1 text-xs outline-none focus:border-zinc-700 font-bold"
                                      />
                                    </div>
                                    <div>
                                      <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">EXECUTION DATE</div>
                                      <input
                                        type="text"
                                        value={metadataState[tc.id]?.execution_date || ''}
                                        onChange={(e) => updateMetadataField(tc.id, 'execution_date', e.target.value)}
                                        placeholder="입력..."
                                        className="w-full bg-[#11131c]/60 border border-border-color rounded-lg px-2.5 py-1.5 text-zinc-200 mt-1 text-xs outline-none focus:border-zinc-700 font-mono font-bold"
                                      />
                                    </div>
                                  </div>
                                </div>

                                <div className="pt-2 border-t border-zinc-900 flex flex-col gap-1.5">
                                  <Button variant="outline" size="sm" className="hover:border-accent-green hover:text-accent-green w-full" onClick={() => updateStatus(tc.id, 'PASS')}>PASS 로 판정 완료</Button>
                                  <Button variant="outline" size="sm" className="hover:border-accent-red hover:text-accent-red w-full" onClick={() => updateStatus(tc.id, 'FAIL')}>FAIL 로 판정 완료</Button>
                                  
                                  <div className="grid grid-cols-2 gap-2 mt-1">
                                    <button
                                      type="button"
                                      onClick={() => toggleTag(tc.id, '개선 필요')}
                                      className={`px-2 py-1.5 rounded-lg border text-[11px] font-black transition-all cursor-pointer ${
                                        tc.tags?.includes('개선 필요')
                                          ? 'bg-yellow-500/10 border-yellow-500/40 text-yellow-500 shadow'
                                          : 'border-zinc-800 hover:border-zinc-700 text-zinc-400 bg-transparent'
                                      }`}
                                    >
                                      개선 필요 {tc.tags?.includes('개선 필요') ? '✓' : ''}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => toggleTag(tc.id, '정책 확인 필요')}
                                      className={`px-2 py-1.5 rounded-lg border text-[11px] font-black transition-all cursor-pointer ${
                                        tc.tags?.includes('정책 확인 필요')
                                          ? 'bg-purple-500/10 border-purple-500/40 text-purple-400 shadow'
                                          : 'border-zinc-800 hover:border-zinc-700 text-zinc-400 bg-transparent'
                                      }`}
                                    >
                                      정책 확인 필요 {tc.tags?.includes('정책 확인 필요') ? '✓' : ''}
                                    </button>
                                  </div>

                                  {/* 개선 필요 입력창 */}
                                  {tc.tags?.includes('개선 필요') && (
                                    <div className="mt-2 space-y-1.5 bg-[#151821]/40 border border-yellow-500/20 rounded-xl p-3">
                                      <div className="flex items-center justify-between">
                                        <span className="text-[10px] text-yellow-500 font-bold">개선 필요 내용 입력</span>
                                        <button
                                          type="button"
                                          onClick={() => handleSaveOpinion(tc.id, 'refinement')}
                                          className="px-2 py-0.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded text-[10px] font-bold cursor-pointer"
                                        >
                                          저장
                                        </button>
                                      </div>
                                      <input
                                        type="text"
                                        value={opinionTextsState[tc.id]?.refinement || ''}
                                        onChange={(e) => handleOpinionTextChange(tc.id, 'refinement', e.target.value)}
                                        placeholder="개선이 필요한 내용을 입력하세요..."
                                        className="w-full bg-[#11131c]/60 border border-zinc-800 rounded px-2.5 py-1 text-zinc-200 text-xs outline-none focus:border-yellow-500/50"
                                      />
                                    </div>
                                  )}

                                  {/* 정책 확인 필요 입력창 */}
                                  {tc.tags?.includes('정책 확인 필요') && (
                                    <div className="mt-2 space-y-1.5 bg-[#151821]/40 border border-purple-500/20 rounded-xl p-3">
                                      <div className="flex items-center justify-between">
                                        <span className="text-[10px] text-purple-400 font-bold">정책 확인 필요 내용 입력</span>
                                        <button
                                          type="button"
                                          onClick={() => handleSaveOpinion(tc.id, 'policy')}
                                          className="px-2 py-0.5 bg-purple-500 hover:bg-purple-600 text-white rounded text-[10px] font-bold cursor-pointer"
                                        >
                                          저장
                                        </button>
                                      </div>
                                      <input
                                        type="text"
                                        value={opinionTextsState[tc.id]?.policy || ''}
                                        onChange={(e) => handleOpinionTextChange(tc.id, 'policy', e.target.value)}
                                        placeholder="정책 확인이 필요한 내용을 입력하세요..."
                                        className="w-full bg-[#11131c]/60 border border-zinc-800 rounded px-2.5 py-1 text-zinc-200 text-xs outline-none focus:border-purple-500/50"
                                      />
                                    </div>
                                  )}
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
        }))}
      </div>

      {/* 4. Add TestCase Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-xl bg-[#11131c] border border-border-color rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 my-8">
            <div className="flex items-center justify-between border-b border-border-color pb-3 mb-4">
              <h3 className="text-lg font-black text-white">새 테스트 케이스 추가</h3>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>
            
            {errorMsg && (
              <div className="bg-red-500/10 border border-red-500/20 text-[#DE3A3A] px-3.5 py-2.5 rounded-xl text-xs mb-4">
                {errorMsg}
              </div>
            )}
            
            <form onSubmit={handleAddTestCase} className="space-y-4 text-left">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 col-span-2">
                  <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">테스트 항목명 (Title)</label>
                  <input
                    type="text"
                    required
                    placeholder="예: 다중 램프 동시 스캔 및 식별 검증"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-[#090A0D] border border-border-color rounded-xl px-3.5 py-2.5 text-xs text-zinc-200 outline-none focus:border-zinc-700"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">대분류 (Category Group)</label>
                  <select
                    value={newGroupId}
                    onChange={(e) => setNewGroupId(e.target.value)}
                    className="w-full bg-[#090A0D] border border-border-color rounded-xl px-3 py-2.5 text-xs text-zinc-300 outline-none cursor-pointer focus:border-zinc-700"
                  >
                    {categoryGroups.length === 0 ? (
                      <option value="">(대분류를 먼저 생성해 주세요)</option>
                    ) : (
                      categoryGroups.map(g => (
                        <option key={g.id} value={g.id}>{g.title}</option>
                      ))
                    )}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">TC 코드 (E.g., INT-SCAN-005)</label>
                  <input
                    type="text"
                    placeholder="예: INT-SCAN-005"
                    value={newTcCode}
                    onChange={(e) => setNewTcCode(e.target.value)}
                    className="w-full bg-[#090A0D] border border-border-color rounded-xl px-3.5 py-2.5 text-xs text-zinc-200 outline-none focus:border-zinc-700 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">태그 (쉼표구분)</label>
                  <input
                    type="text"
                    placeholder="예: 페어링, UX 개선"
                    value={newTags}
                    onChange={(e) => setNewTags(e.target.value)}
                    className="w-full bg-[#090A0D] border border-border-color rounded-xl px-3.5 py-2.5 text-xs text-zinc-200 outline-none focus:border-zinc-700"
                  />
                </div>


              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">사전 조건 (라인구분)</label>
                <textarea
                  rows={2}
                  placeholder="예: 두 대 이상의 스마트폰에 앱 설치 확인&#10;테스트 대상 기기 초기화 확인"
                  value={newPrereqs}
                  onChange={(e) => setNewPrereqs(e.target.value)}
                  className="w-full bg-[#090A0D] border border-border-color rounded-xl p-3 text-xs text-zinc-200 outline-none resize-none focus:border-zinc-700"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">테스트 절차 (라인구분)</label>
                <textarea
                  rows={3}
                  placeholder="예: 스마트폰 A에서 스캔 시작&#10;검색 목록 노출 확인&#10;스마트폰 B에서 연결 시도"
                  value={newSteps}
                  onChange={(e) => setNewSteps(e.target.value)}
                  className="w-full bg-[#090A0D] border border-border-color rounded-xl p-3 text-xs text-zinc-200 outline-none resize-none focus:border-zinc-700"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">예상 결과</label>
                <input
                  type="text"
                  placeholder="예: 선택한 램프와 즉시 통신 세션이 연결됩니다."
                  value={newExpected}
                  onChange={(e) => setNewExpected(e.target.value)}
                  className="w-full bg-[#090A0D] border border-border-color rounded-xl px-3.5 py-2.5 text-xs text-zinc-200 outline-none focus:border-zinc-700"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border-color mt-4">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsAddModalOpen(false)}
                  className="font-bold"
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isAdding}
                  className="font-bold shadow-lg shadow-accent-green/20"
                >
                  {isAdding ? '추가 중...' : '테스트 케이스 생성'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Add Category Group Modal */}
      {isAddGroupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#11131c] border border-border-color rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border-color pb-3 mb-4">
              <h3 className="text-lg font-black text-white">새 대분류 추가</h3>
              <button 
                onClick={() => setIsAddGroupModalOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>
            
            {groupErrorMsg && (
              <div className="bg-red-500/10 border border-red-500/20 text-[#DE3A3A] px-3.5 py-2.5 rounded-xl text-xs mb-4">
                {groupErrorMsg}
              </div>
            )}
            
            <form onSubmit={handleAddCategoryGroup} className="space-y-4 text-left">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">대분류명 (Title)</label>
                <input
                  type="text"
                  required
                  placeholder="예: 5-2-F. 신규 네트워크 및 BLE 테스트"
                  value={newGroupTitle}
                  onChange={(e) => setNewGroupTitle(e.target.value)}
                  className="w-full bg-[#090A0D] border border-border-color rounded-xl px-3.5 py-2.5 text-xs text-zinc-200 outline-none focus:border-zinc-700"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border-color mt-4">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsAddGroupModalOpen(false)}
                  className="font-bold"
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isAddingGroup}
                  className="font-bold shadow-lg shadow-accent-green/20"
                >
                  {isAddingGroup ? '추가 중...' : '대분류 생성'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
    </div>
  )
}
