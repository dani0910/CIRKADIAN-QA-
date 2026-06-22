'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { supabase } from '@/lib/supabase'
import { createTestCase, createCategoryGroup, updateTestCaseResult, uploadTestCaseEvidence, addTestCaseComment, updateOpinionText, updateCategoryGroup, deleteCategoryGroup, updateTestCase, deleteTestCase } from '@/app/actions'

const getPastelColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % 5;
  const pastelColors = [
    'bg-[#1d2433] text-[#7fb7ff] border border-[#2d3a54]/50', // pastel blue
    'bg-[#241a2f] text-[#d6bdfa] border border-[#3b2d4c]/50', // pastel purple
    'bg-[#132725] text-[#86ebd4] border border-[#1e3b38]/50', // pastel teal
    'bg-[#2b2015] text-[#ffc482] border border-[#443322]/50', // pastel orange/peach
    'bg-[#2b1b22] text-[#ffb5cd] border border-[#4c2d3a]/50'  // pastel pink
  ];
  return pastelColors[index];
};

const stripAuthorPrefix = (value: string | null | undefined) => {
  return (value || '').replace(/^\[[^\]]+\]\s*/, '')
}

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
  
  // Expanded state for category groups.
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})
  const [activeTcId, setActiveTcId] = useState<string | null>(null)
  const [showImageViewer, setShowImageViewer] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(100)
  const [rotationAngle, setRotationAngle] = useState(0)

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
      initial[detail.id] = stripAuthorPrefix(detail.actual_result)
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
          next[detail.id] = stripAuthorPrefix(detail.actual_result)
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
  const [selectedAddGroupId, setSelectedAddGroupId] = useState<string>('')
  const [newTcCode, setNewTcCode] = useState('')
  const [newTags, setNewTags] = useState('')
  const [newTester, setNewTester] = useState('')
  const [newExecutionDate, setNewExecutionDate] = useState('')
  const [newDevice, setNewDevice] = useState('')
  const [newSteps, setNewSteps] = useState('')
  const [newPrereqs, setNewPrereqs] = useState('')
  const [newExpected, setNewExpected] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // Modal states for adding Category Group
  const [isAddGroupModalOpen, setIsAddGroupModalOpen] = useState(false)
  const [newGroupTitle, setNewGroupTitle] = useState('')
  const [groupCreateMode, setGroupCreateMode] = useState<'parent' | 'child'>('parent')
  const [parentGroupIdForChild, setParentGroupIdForChild] = useState('')
  const [categorySelectType, setCategorySelectType] = useState('HW')
  const [newGroupTestCategory, setNewGroupTestCategory] = useState('')
  const [isAddingGroup, setIsAddingGroup] = useState(false)
  const [groupErrorMsg, setGroupErrorMsg] = useState('')

  // Edit mode global state
  const [isEditMode, setIsEditMode] = useState(false)

  // Edit Category Group modal states
  const [editingGroup, setEditingGroup] = useState<CategoryGroup | null>(null)
  const [editGroupTitle, setEditGroupTitle] = useState('')
  const [editGroupCategoryType, setEditGroupCategoryType] = useState('HW')
  const [editGroupCustomCategory, setEditGroupCustomCategory] = useState('')
  const [isSavingGroup, setIsSavingGroup] = useState(false)
  const [editGroupErrorMsg, setEditGroupErrorMsg] = useState('')

  // Edit Test Case modal states
  const [editingTestCase, setEditingTestCase] = useState<TestCase | null>(null)
  const [editTcTitle, setEditTcTitle] = useState('')
  const [editTcGroupId, setEditTcGroupId] = useState('')
  const [editTcCode, setEditTcCode] = useState('')
  const [editTcTags, setEditTcTags] = useState('')
  const [editTcTester, setEditTcTester] = useState('')
  const [editTcSteps, setEditTcSteps] = useState('')
  const [editTcPrereqs, setEditTcPrereqs] = useState('')
  const [editTcExpected, setEditTcExpected] = useState('')
  const [isSavingTestCase, setIsSavingTestCase] = useState(false)
  const [editTcErrorMsg, setEditTcErrorMsg] = useState('')

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

  // Category Group handlers
  const handleStartEditGroup = (group: CategoryGroup) => {
    setEditingGroup(group)
    setEditGroupErrorMsg('')
    const parts = group.title.split('|||')
    const displayTitle = parts[0]
    const testCategory = parts[1] || 'HW'

    setEditGroupTitle(displayTitle)
    if (['HW', 'SW', '공통'].includes(testCategory)) {
      setEditGroupCategoryType(testCategory)
      setEditGroupCustomCategory('')
    } else {
      setEditGroupCategoryType('custom')
      setEditGroupCustomCategory(testCategory)
    }
  }

  const handleEditCategoryGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingGroup || !editGroupTitle.trim()) return

    const selectedTestCategory = editGroupCategoryType === 'custom' ? editGroupCustomCategory.trim() : editGroupCategoryType

    setIsSavingGroup(true)
    setEditGroupErrorMsg('')
    try {
      await updateCategoryGroup(editingGroup.id, editGroupTitle, selectedTestCategory)
      setEditingGroup(null)
    } catch (err: any) {
      setEditGroupErrorMsg(err.message || '기능 분류 수정 중 오류가 발생했습니다.')
    } finally {
      setIsSavingGroup(false)
    }
  }

  const handleDeleteGroup = async (groupId: string) => {
    const confirmed = window.confirm('정말로 이 기능 분류와 하위의 모든 테스트 케이스를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')
    if (!confirmed) return

    try {
      await deleteCategoryGroup(groupId)
    } catch (err: any) {
      alert(err.message || '기능 분류 삭제 중 오류가 발생했습니다.')
    }
  }

  // TestCase handlers
  const handleStartEditTestCase = (tc: TestCase) => {
    setEditingTestCase(tc)
    setEditTcErrorMsg('')
    const detail = tcDetails.find(d => d.id === tc.id)

    setEditTcTitle(tc.title || '')
    setEditTcGroupId(tc.group_id || '')
    setEditTcCode(tc.tc_code || '')
    setEditTcTags(tc.tags ? tc.tags.join(', ') : '')
    setEditTcTester(tc.tester || '')
    setEditTcSteps(detail?.steps ? detail.steps.join('\n') : '')
    setEditTcPrereqs(detail?.prerequisites ? detail.prerequisites.join('\n') : '')
    setEditTcExpected(detail?.expected_result || '')
  }

  const handleEditTestCase = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingTestCase || !editTcTitle.trim()) return

    setIsSavingTestCase(true)
    setEditTcErrorMsg('')
    try {
      const parsedSteps = editTcSteps.split('\n').map(s => s.trim()).filter(Boolean)
      const parsedPrereqs = editTcPrereqs.split('\n').map(p => p.trim()).filter(Boolean)
      const parsedTags = editTcTags.split(',').map(t => t.trim()).filter(Boolean)

      await updateTestCase({
        id: editingTestCase.id,
        title: editTcTitle,
        groupId: editTcGroupId || undefined,
        tcCode: editTcCode || undefined,
        tags: parsedTags.length > 0 ? parsedTags : undefined,
        tester: editTcTester || undefined,
        steps: parsedSteps,
        prerequisites: parsedPrereqs,
        expectedResult: editTcExpected || undefined
      })
      setEditingTestCase(null)
    } catch (err: any) {
      setEditTcErrorMsg(err.message || '테스트 케이스 수정 중 오류가 발생했습니다.')
    } finally {
      setIsSavingTestCase(false)
    }
  }

  const handleDeleteTestCase = async (tcId: string) => {
    const confirmed = window.confirm('정말로 이 테스트 케이스를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')
    if (!confirmed) return

    try {
      await deleteTestCase(tcId)
    } catch (err: any) {
      alert(err.message || '테스트 케이스 삭제 중 오류가 발생했습니다.')
    }
  }

  const handleAddCategoryGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newGroupTitle.trim()) return

    const selectedTestCategory = categorySelectType === 'custom' ? newGroupTestCategory.trim() : categorySelectType
    const numberedTitle = `${groupNumberPreview} ${newGroupTitle.trim()}`

    setIsAddingGroup(true)
    setGroupErrorMsg('')
    try {
      await createCategoryGroup(projectId, numberedTitle, selectedTestCategory)
      setNewGroupTitle('')
      setNewGroupTestCategory('')
      setCategorySelectType('HW')
      setGroupCreateMode('parent')
      setIsAddGroupModalOpen(false)
    } catch (err: any) {
      setGroupErrorMsg(err.message || '기능 분류 추가 중 오류가 발생했습니다.')
    } finally {
      setIsAddingGroup(false)
    }
  }

  const handleAddTestCase = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim() || !selectedAddGroupId) return

    setIsAdding(true)
    setErrorMsg('')
    try {
      const parsedSteps = newSteps.split('\n').map(s => s.trim()).filter(Boolean)
      const parsedPrereqs = newPrereqs.split('\n').map(p => p.trim()).filter(Boolean)
      const parsedTags = newTags.split(',').map(t => t.trim()).filter(Boolean)

      await createTestCase({
        projectId,
        title: newTitle,
        groupId: selectedAddGroupId || undefined,
        tcCode: newTcCode || undefined,
        tags: parsedTags.length > 0 ? parsedTags : undefined,
        tester: newTester || undefined,
        executionDate: newExecutionDate || undefined,
        device: newDevice || undefined,
        steps: parsedSteps,
        prerequisites: parsedPrereqs,
        expectedResult: newExpected || undefined,
      })

      // Reset
      setNewTitle('')
      setNewTcCode('')
      setNewTags('')
      setNewTester('')
      setNewExecutionDate('')
      setNewDevice('')
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

  const openAddTestCaseModal = (groupId: string) => {
    setSelectedAddGroupId(groupId)
    setNewGroupId(groupId)
    setErrorMsg('')
    setIsAddModalOpen(true)
  }

  const toggleTestCase = (tcId: string) => {
    setActiveTcId(prev => {
      const next = prev === tcId ? null : tcId
      if (next) {
        setZoomLevel(100)
        setRotationAngle(0)
      } else {
        setShowImageViewer(false)
      }
      return next
    })
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

  // Status Badge UI
  const renderStatusBadge = (status: TestCaseStatus) => {
    const styles = {
      PASS: 'bg-[#00BA54]/10 text-accent-green border border-[#00BA54]/20',
      FAIL: 'bg-[#DE3A3A]/10 text-[#DE3A3A] border border-[#DE3A3A]/20',
      UNTESTED: 'bg-zinc-800 text-zinc-400 border border-zinc-700'
    }

    const labels = {
      PASS: 'PASS',
      FAIL: 'FAIL',
      UNTESTED: '미실시'
    }

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black tracking-wider ${styles[status]}`}>
        {labels[status]}
      </span>
    )
  }

  const getGroupTitleParts = (title: string) => {
    const [displayTitle, testCategory] = title.split('|||')
    return {
      displayTitle: displayTitle?.trim() || title,
      testCategory: testCategory?.trim() || ''
    }
  }

  const stripGroupNumber = (title: string) => {
    return title.replace(/^\d+(?:-\d+)*(?:-[A-Z])?\.\s*/, '').trim()
  }

  const getNumberedGroupInfo = (group: CategoryGroup, topIndex: number) => {
    const { displayTitle, testCategory } = getGroupTitleParts(group.title)
    const match = displayTitle.match(/^(\d+)(?:-([A-Z]))?\.\s*(.*)$/)
    if (match) {
      const number = Number(match[1])
      const letter = match[2] || ''
      return {
        number,
        letter,
        code: letter ? `${number}-${letter}.` : `${number}.`,
        title: match[3] || displayTitle,
        testCategory
      }
    }
    return {
      number: topIndex + 1,
      letter: '',
      code: `${topIndex + 1}.`,
      title: stripGroupNumber(displayTitle),
      testCategory
    }
  }

  const topGroups = categoryGroups.filter(group => {
    const { displayTitle } = getGroupTitleParts(group.title)
    return !/^\d+-[A-Z]\.\s*/.test(displayTitle)
  })

  const childGroupsByParentNumber = categoryGroups.reduce<Record<number, CategoryGroup[]>>((acc, group) => {
    const { displayTitle } = getGroupTitleParts(group.title)
    const match = displayTitle.match(/^(\d+)-[A-Z]\.\s*/)
    if (!match) return acc
    const parentNumber = Number(match[1])
    acc[parentNumber] = [...(acc[parentNumber] || []), group]
    return acc
  }, {})

  const getNextParentNumber = () => {
    const numbers = topGroups.map((group, idx) => getNumberedGroupInfo(group, idx).number)
    return numbers.length ? Math.max(...numbers) + 1 : 1
  }

  const getParentPreviewInfo = () => {
    const parentGroup = topGroups.find(group => group.id === parentGroupIdForChild) || topGroups[0]
    if (!parentGroup) return null
    const parentIndex = topGroups.findIndex(group => group.id === parentGroup.id)
    return getNumberedGroupInfo(parentGroup, parentIndex)
  }

  const getNextChildLetter = (parentNumber: number) => {
    const children = childGroupsByParentNumber[parentNumber] || []
    const maxIndex = children.reduce((max, child) => {
      const { displayTitle } = getGroupTitleParts(child.title)
      const match = displayTitle.match(/^\d+-([A-Z])\.\s*/)
      if (!match) return max
      return Math.max(max, match[1].charCodeAt(0) - 65)
    }, -1)
    return String.fromCharCode(65 + maxIndex + 1)
  }

  const groupNumberPreview = (() => {
    if (groupCreateMode === 'parent') {
      return `${getNextParentNumber()}.`
    }
    const parentInfo = getParentPreviewInfo()
    if (!parentInfo) return '-'
    return `${parentInfo.number}-${getNextChildLetter(parentInfo.number)}.`
  })()

  const getFullGroupTitle = (group: CategoryGroup) => {
    const parentIndex = topGroups.findIndex(item => item.id === group.id)
    if (parentIndex >= 0) {
      const info = getNumberedGroupInfo(group, parentIndex)
      return `${info.code} ${info.title}`
    }
    const { displayTitle } = getGroupTitleParts(group.title)
    return displayTitle
  }

  const matchesGroupFilter = (group: CategoryGroup, topIndex: number) => {
    const info = getNumberedGroupInfo(group, topIndex)
    const haystack = `${info.code} ${info.title} ${info.testCategory}`.toLowerCase()
    if (searchQuery && haystack.includes(searchQuery.toLowerCase())) {
      return true
    }
    if (selectedCategory !== 'all' && !info.title.includes(selectedCategory) && !info.testCategory.includes(selectedCategory)) {
      return false
    }
    return true
  }

  const filteredGroups = topGroups.filter((group, index) => matchesGroupFilter(group, index))

  const getVisibleTags = (tc: TestCase, group?: CategoryGroup) => {
    const { displayTitle } = getGroupTitleParts(group?.title || '')
    const titleWithoutNumber = stripGroupNumber(displayTitle)
    return (tc.tags || []).filter(tag => {
      const trimmed = tag.trim()
      return trimmed !== displayTitle && trimmed !== titleWithoutNumber
    })
  }

  const activeTestCase = activeTcId ? testCases.find(tc => tc.id === activeTcId) : null
  const activeDetail = activeTcId ? tcDetails.find(detail => detail.id === activeTcId) : null
  const activeGroup = activeTestCase ? categoryGroups.find(group => group.id === activeTestCase.group_id) : undefined
  const activeComments = activeTcId ? commentsState[activeTcId] || [] : []
  const activeImages = activeTcId ? imagesState[activeTcId] || [] : []
  const activeImageIndex = activeTcId ? activeImageIndexes[activeTcId] || 0 : 0
  const activePreviewUrl = activeImages[activeImageIndex] || ''
  const activeGroupParts = getGroupTitleParts(activeGroup?.title || '')

  const closeDetailPanel = () => {
    setActiveTcId(null)
    setShowImageViewer(false)
    setZoomLevel(100)
    setRotationAngle(0)
  }

  const openImageViewer = () => {
    if (activeTcId) {
      setShowImageViewer(true)
    }
  }

  const downloadActiveImage = () => {
    if (!activePreviewUrl) return
    const link = document.createElement('a')
    link.href = activePreviewUrl
    link.download = `evidence-${activeTestCase?.tc_code || activeTcId || 'image'}`
    link.target = '_blank'
    link.rel = 'noreferrer'
    link.click()
  }

  return (
    <div className="space-y-6">
      
      {/* Search and platform header filter controls */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white tracking-tight">전체 테스트 케이스</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className={`flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer outline-none ${
              isEditMode 
                ? 'border-[#00BA54] text-[#00BA54] bg-[#00BA54]/10 hover:bg-[#00BA54]/20 shadow-lg shadow-[#00BA54]/10' 
                : 'border-[#222631] text-zinc-400 bg-[#151821] hover:bg-zinc-800 hover:text-zinc-200'
            }`}
          >
            <span>{isEditMode ? '✓ 수정 완료' : '✏️ 수정 모드'}</span>
          </button>
          <Button 
            variant="outline" 
            size="md" 
            className="flex items-center gap-1.5 font-bold hover:border-accent-green hover:text-accent-green cursor-pointer"
            onClick={() => setIsAddGroupModalOpen(true)}
          >
            <span>+</span> 기능 분류 추가
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

      {/* Hierarchical Double Accordion List + detail panels */}
      <div className={`grid grid-cols-1 gap-4 items-start ${
        activeTestCase && showImageViewer
          ? 'xl:grid-cols-[minmax(420px,4fr)_minmax(360px,4fr)_minmax(360px,4fr)]'
          : activeTestCase
          ? 'xl:grid-cols-[minmax(0,7fr)_minmax(420px,5fr)]'
          : ''
      }`}>
      <div className="space-y-4 min-w-0">
        {filteredGroups.length === 0 ? (
          <div className="border border-dashed border-border-color rounded-2xl p-10 text-center bg-card-bg/5 space-y-3">
            <div className="text-zinc-600 text-3xl select-none">📂</div>
            <h3 className="text-sm font-bold text-zinc-300">등록된 기능 분류가 없습니다</h3>
            <p className="text-xs text-text-muted max-w-sm mx-auto leading-relaxed">
              이 프로젝트에 등록된 테스트 케이스 기능 분류가 없습니다. 우측 상단의 <strong>'+ 기능 분류 추가'</strong> 버튼을 클릭하여 테스트 진행 영역을 분류해 보세요.
            </p>
          </div>
        ) : (
          filteredGroups.map((group) => {
          const isGroupExpanded = !!expandedGroups[group.id]
          const groupTopIndex = topGroups.findIndex(item => item.id === group.id)
          const groupInfo = getNumberedGroupInfo(group, groupTopIndex)
          const childGroups = childGroupsByParentNumber[groupInfo.number] || []
          
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
                <div className="flex items-center gap-3">
                  {/* Test Category Badge */}
                  {groupInfo.testCategory && (
                    <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-[10px] font-extrabold ${getPastelColor(groupInfo.testCategory)}`}>
                      {groupInfo.testCategory}
                    </span>
                  )}
                  <span className="text-sm font-black text-zinc-100 tracking-tight">
                    {groupInfo.code} {groupInfo.title}
                  </span>
                </div>
                <div className="flex items-center gap-3 font-mono text-xs">
                  {isEditMode && (
                    <div className="flex items-center gap-1.5 mr-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleStartEditGroup(group)}
                        className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition text-[10px] font-bold cursor-pointer border border-[#222631]"
                        title="기능 분류 수정"
                      >
                        ✏️ 수정
                      </button>
                      <button
                        onClick={() => handleDeleteGroup(group.id)}
                        className="px-2 py-1 rounded bg-red-950/40 hover:bg-red-900/60 text-red-400 transition text-[10px] font-bold cursor-pointer border border-red-900/20"
                        title="기능 분류 삭제"
                      >
                        🗑️ 삭제
                      </button>
                    </div>
                  )}
                  <span className="text-zinc-500 font-bold">{passCount}/{totalCount} PASS</span>
                  <span className="text-[11px] text-zinc-600 shrink-0">
                    {isGroupExpanded ? '▲' : '▼'}
                  </span>
                </div>
              </div>

              {/* Category Children Container */}
              {isGroupExpanded && (
                <div className="divide-y divide-zinc-900 bg-black/10">
                  {visibleCases.length > 0 ? (
                    visibleCases.map((tc) => {
                      const isActiveCase = activeTcId === tc.id
                      const visibleTags = getVisibleTags(tc, group)

                      return (
                        <div key={tc.id} className="transition-all">
                          
                          {/* Level 2: Sub TestCase Row (자식 아코디언) */}
                          <div
                            onClick={() => toggleTestCase(tc.id)}
                            className={`flex flex-col sm:flex-row sm:items-center justify-between p-4.5 pl-6.5 cursor-pointer select-none gap-3 transition-all ${
                              isActiveCase ? 'bg-zinc-800/40' : 'hover:bg-zinc-800/20'
                            }`}
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
                                {visibleTags.map((tag, tagIdx) => (
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
                            {activeTestCase ? (
                              isEditMode && (
                                <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    onClick={() => handleStartEditTestCase(tc)}
                                    className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition text-[10px] font-bold cursor-pointer border border-[#222631]"
                                    title="테스트케이스 수정"
                                  >
                                    ✏️ 수정
                                  </button>
                                  <button
                                    onClick={() => handleDeleteTestCase(tc.id)}
                                    className="px-2 py-1 rounded bg-red-950/40 hover:bg-red-900/60 text-red-400 transition text-[10px] font-bold cursor-pointer border border-red-900/20"
                                    title="테스트케이스 삭제"
                                  >
                                    🗑️ 삭제
                                  </button>
                                </div>
                              )
                            ) : (
                              <div className="flex items-center justify-between sm:justify-end gap-5 shrink-0 text-[10px] text-zinc-500 font-sans font-medium pl-8 sm:pl-0">
                                <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 text-right">
                                  {tc.tester && <span>테스터: {tc.tester}</span>}
                                  {tc.execution_date && <span>실행일: {tc.execution_date}</span>}
                                  {tc.os && <span className="text-zinc-600 font-mono">OS: {tc.os}</span>}
                                </div>
                                {isEditMode && (
                                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                    <button
                                      onClick={() => handleStartEditTestCase(tc)}
                                      className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition text-[10px] font-bold cursor-pointer border border-[#222631]"
                                      title="테스트케이스 수정"
                                    >
                                      ✏️ 수정
                                    </button>
                                    <button
                                      onClick={() => handleDeleteTestCase(tc.id)}
                                      className="px-2 py-1 rounded bg-red-950/40 hover:bg-red-900/60 text-red-400 transition text-[10px] font-bold cursor-pointer border border-red-900/20"
                                      title="테스트케이스 삭제"
                                    >
                                      🗑️ 삭제
                                    </button>
                                  </div>
                                )}
                                <span className="text-[11px] text-zinc-600 shrink-0">
                                  ▶
                                </span>
                              </div>
                            )}

                          </div>

                        </div>
                      )
                    })
                  ) : childGroups.length === 0 ? (
                    <div className="p-4.5 text-zinc-500 text-xs italic pl-8">이 기능 분류에는 필터에 일치하는 세부 테스트 케이스가 없습니다.</div>
                  ) : null}

                  {childGroups.map((childGroup) => {
                    const isChildExpanded = !!expandedGroups[childGroup.id]
                    const childInfo = getNumberedGroupInfo(childGroup, groupTopIndex)
                    const childCases = testCases.filter(tc => tc.group_id === childGroup.id)
                    const visibleChildCases = childCases.filter(tc => {
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
                    const childTotalCount = childCases.length
                    const childPassCount = childCases.filter(c => c.status === 'PASS').length

                    return (
                      <div key={childGroup.id} className="bg-[#090A0D]/30">
                        <div
                          onClick={() => toggleGroup(childGroup.id)}
                          className="flex items-center justify-between px-6 py-3.5 cursor-pointer select-none hover:bg-zinc-800/20 transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-black text-zinc-100 tracking-tight">
                              {childInfo.code} {childInfo.title}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 font-mono text-xs">
                            <span className="text-zinc-500 font-bold">{childPassCount}/{childTotalCount} PASS</span>
                            <span className="text-[11px] text-zinc-600 shrink-0">
                              {isChildExpanded ? '▲' : '▼'}
                            </span>
                          </div>
                        </div>

                        {isChildExpanded && (
                          <div className="divide-y divide-zinc-900 bg-black/10">
                            {visibleChildCases.length > 0 ? (
                              visibleChildCases.map((tc) => {
                                const isActiveCase = activeTcId === tc.id
                                const visibleTags = getVisibleTags(tc, childGroup)

                                return (
                                  <div key={tc.id} className="transition-all">
                                    <div
                                      onClick={() => toggleTestCase(tc.id)}
                                      className={`flex flex-col sm:flex-row sm:items-center justify-between p-4.5 pl-8 cursor-pointer select-none gap-3 transition-all ${
                                        isActiveCase ? 'bg-zinc-800/40' : 'hover:bg-zinc-800/20'
                                      }`}
                                    >
                                      <div className="flex items-start sm:items-center gap-3">
                                        {renderStatusBadge(tc.status)}
                                        {tc.tc_code && (
                                          <span className="font-mono font-bold text-[11px] text-cyan-400 bg-cyan-950/20 px-1.5 py-0.5 rounded border border-cyan-800/10 shrink-0">
                                            {tc.tc_code}
                                          </span>
                                        )}
                                        <div className="flex flex-wrap items-center gap-2">
                                          <span className="text-xs font-semibold text-zinc-200">{tc.title}</span>
                                          {visibleTags.map((tag, tagIdx) => (
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
                                      {activeTestCase ? null : (
                                        <div className="flex items-center justify-between sm:justify-end gap-5 shrink-0 text-[10px] text-zinc-500 font-sans font-medium pl-8 sm:pl-0">
                                          <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 text-right">
                                            {tc.tester && <span>{tc.tester}</span>}
                                            {tc.execution_date && <span>{tc.execution_date}</span>}
                                            {tc.os && <span className="text-zinc-600 font-mono">{tc.os}</span>}
                                          </div>
                                          <span className="text-[11px] text-zinc-600 shrink-0">▶</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )
                              })
                            ) : (
                              <div className="p-4.5 text-zinc-500 text-xs italic pl-8">이 기능 분류에는 필터에 일치하는 세부 테스트 케이스가 없습니다.</div>
                            )}
                            <div className="p-3">
                              <button
                                type="button"
                                onClick={() => openAddTestCaseModal(childGroup.id)}
                                className="w-full rounded-xl border border-dashed border-zinc-800 py-3 text-xs font-bold text-accent-green hover:border-accent-green/50 hover:bg-accent-green/5 transition cursor-pointer"
                              >
                                + 테스트 케이스 추가
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}

                  <div className="p-3">
                    <button
                      type="button"
                      onClick={() => openAddTestCaseModal(group.id)}
                      className="w-full rounded-xl border border-dashed border-zinc-800 py-3 text-xs font-bold text-accent-green hover:border-accent-green/50 hover:bg-accent-green/5 transition cursor-pointer"
                    >
                      + 테스트 케이스 추가
                    </button>
                  </div>
                </div>
              )}

            </div>
          )
        }))}
      </div>

      {activeTestCase && (
        <aside className="sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto rounded-2xl border border-border-color bg-[#11131c]/95 p-5 shadow-2xl shadow-black/20 text-xs min-w-0">
          <div className="flex items-start justify-between gap-4 border-b border-zinc-900 pb-4">
            <div className="space-y-3 min-w-0">
              <div className="flex items-center gap-2">
                {renderStatusBadge(activeTestCase.status)}
                {activeGroupParts.testCategory && (
                  <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-[10px] font-extrabold ${getPastelColor(activeGroupParts.testCategory)}`}>
                    {activeGroupParts.testCategory}
                  </span>
                )}
                {activeGroupParts.displayTitle && (
                  <span className="px-2 py-0.5 rounded border border-zinc-700 bg-zinc-950 text-[10px] font-bold text-zinc-300">
                    {activeGroupParts.displayTitle}
                  </span>
                )}
              </div>
              <h3 className="text-lg font-black text-white leading-tight break-words">
                {activeTestCase.tc_code && <span className="font-mono">{activeTestCase.tc_code} </span>}
                {activeTestCase.title}
              </h3>
            </div>
            <button
              onClick={closeDetailPanel}
              className="rounded-full border border-zinc-800 px-2.5 py-1 text-zinc-400 hover:text-white hover:border-zinc-600 transition cursor-pointer"
              aria-label="상세 패널 닫기"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 py-4 border-b border-zinc-900">
            <div>
              <div className="text-[10px] text-zinc-500 font-bold uppercase">테스트 타입</div>
              <div className="mt-1 font-bold text-zinc-200">{activeGroupParts.displayTitle || '-'}</div>
            </div>
            <div>
              <div className="text-[10px] text-zinc-500 font-bold uppercase">실행일</div>
              <div className="mt-1 font-mono text-zinc-200">{activeTestCase.execution_date || metadataState[activeTestCase.id]?.execution_date || '-'}</div>
            </div>
            <div>
              <div className="text-[10px] text-zinc-500 font-bold uppercase">OS</div>
              <div className="mt-1 font-bold text-zinc-200">{activeTestCase.os || '-'}</div>
            </div>
            <div>
              <div className="text-[10px] text-zinc-500 font-bold uppercase">테스터</div>
              <div className="mt-1 font-bold text-zinc-200">{activeTestCase.tester || metadataState[activeTestCase.id]?.testers || '-'}</div>
            </div>
          </div>

          <div className="space-y-5 pt-4">
            <div className="space-y-2">
              <div className="font-bold text-zinc-400">01. 사전 조건 및 참고사항</div>
              <div className="rounded-xl border border-border-color bg-[#090A0D]/50 p-3.5 text-zinc-300 leading-relaxed">
                {activeDetail?.prerequisites?.length ? (
                  activeDetail.prerequisites.map((pre, idx) => (
                    <div key={idx} className="flex gap-2">
                      <span className="text-zinc-600">-</span>
                      <span>{pre}</span>
                    </div>
                  ))
                ) : (
                  <span className="text-zinc-500">-</span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="font-bold text-zinc-400">02. 테스트 절차</div>
              <div className="rounded-xl border border-border-color bg-[#090A0D]/50 p-3.5 space-y-2.5">
                {activeDetail?.steps?.length ? (
                  activeDetail.steps.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-zinc-300 leading-relaxed">
                      <span className="font-mono font-bold text-accent-green">{idx + 1}</span>
                      <span>{step}</span>
                    </div>
                  ))
                ) : (
                  <span className="text-zinc-500">-</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="rounded-xl border border-[#00BA54]/20 bg-[#00BA54]/5 p-3.5 space-y-2">
                <div className="font-bold text-accent-green">예상 결과 (Expected)</div>
                <p className="text-zinc-300 leading-relaxed">{activeDetail?.expected_result || '-'}</p>
              </div>
              <div className="rounded-xl border border-[#DE3A3A]/25 bg-[#DE3A3A]/5 p-3.5 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-bold text-accent-red">실제 결과 (Actual)</div>
                  <button
                    onClick={() => handleSaveActualResult(activeTestCase.id)}
                    className="px-2.5 py-1 bg-accent-red hover:bg-[#b82a2a] text-white font-bold rounded-lg text-[10px] cursor-pointer"
                  >
                    저장
                  </button>
                </div>
                <textarea
                  rows={2}
                  placeholder="실제 수행 결과를 입력하세요..."
                  value={actualResultsState[activeTestCase.id] || ''}
                  onChange={(e) => setActualResultsState({ ...actualResultsState, [activeTestCase.id]: e.target.value })}
                  className="w-full bg-[#11131c]/60 border border-[#DE3A3A]/20 rounded-lg p-2.5 text-zinc-300 placeholder-zinc-600 outline-none resize-none focus:border-[#DE3A3A]/50 text-xs leading-relaxed"
                />
              </div>
            </div>

            <div className="space-y-2 border-t border-zinc-900 pt-4">
              <div className="flex items-center justify-between gap-2">
                <div className="font-bold text-zinc-400">EVIDENCE</div>
                <button
                  onClick={() => handleImageUpload(activeTestCase.id)}
                  disabled={isUploadingFile && activeUploadTcId === activeTestCase.id}
                  className="px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-300 hover:text-white hover:border-zinc-600 font-bold text-[11px] cursor-pointer disabled:opacity-50"
                >
                  + 업로드
                </button>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-border-color bg-[#090A0D]/60 p-2">
                <button
                  onClick={openImageViewer}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-zinc-900 px-3 py-2 text-zinc-300 hover:text-white hover:bg-zinc-800 font-bold cursor-pointer"
                >
                  이미지 보기 ({activeImages.length})
                </button>
                {activeImages.length > 0 && (
                  <div className="flex gap-1 overflow-x-auto max-w-[120px]">
                    {activeImages.map((imgUrl, imgIdx) => (
                      <button
                        key={imgUrl}
                        onClick={() => {
                          setActiveImageIndexes({ ...activeImageIndexes, [activeTestCase.id]: imgIdx })
                          setShowImageViewer(true)
                        }}
                        className={`h-8 w-8 shrink-0 overflow-hidden rounded border ${
                          imgIdx === activeImageIndex ? 'border-accent-green' : 'border-zinc-800'
                        }`}
                      >
                        <img src={imgUrl} alt="Evidence thumbnail" className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-border-color bg-[#090A0D]/50 p-3.5 space-y-3.5">
              <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">ENVIRONMENT METADATA</span>
                <button
                  onClick={() => handleSaveMetadata(activeTestCase.id)}
                  className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-lg transition duration-200 text-[10px] cursor-pointer border border-zinc-700/60"
                >
                  저장
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3 text-left">
                <div>
                  <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">APP VERSION</div>
                  <input
                    type="text"
                    value={metadataState[activeTestCase.id]?.app_version || ''}
                    onChange={(e) => updateMetadataField(activeTestCase.id, 'app_version', e.target.value)}
                    placeholder="입력..."
                    className="w-full bg-[#11131c]/60 border border-border-color rounded-lg px-2.5 py-1.5 text-zinc-200 mt-1 text-xs outline-none focus:border-zinc-700 font-mono font-bold"
                  />
                </div>
                <div>
                  <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">DEVICE</div>
                  <input
                    type="text"
                    value={metadataState[activeTestCase.id]?.device || ''}
                    onChange={(e) => updateMetadataField(activeTestCase.id, 'device', e.target.value)}
                    placeholder="입력..."
                    className="w-full bg-[#11131c]/60 border border-border-color rounded-lg px-2.5 py-1.5 text-zinc-200 mt-1 text-xs outline-none focus:border-zinc-700 font-bold"
                  />
                </div>
                <div>
                  <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">TESTERS</div>
                  <input
                    type="text"
                    value={metadataState[activeTestCase.id]?.testers || ''}
                    onChange={(e) => updateMetadataField(activeTestCase.id, 'testers', e.target.value)}
                    placeholder="입력..."
                    className="w-full bg-[#11131c]/60 border border-border-color rounded-lg px-2.5 py-1.5 text-zinc-200 mt-1 text-xs outline-none focus:border-zinc-700 font-bold"
                  />
                </div>
                <div>
                  <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">EXECUTION DATE</div>
                  <input
                    type="text"
                    value={metadataState[activeTestCase.id]?.execution_date || ''}
                    onChange={(e) => updateMetadataField(activeTestCase.id, 'execution_date', e.target.value)}
                    placeholder="입력..."
                    className="w-full bg-[#11131c]/60 border border-border-color rounded-lg px-2.5 py-1.5 text-zinc-200 mt-1 text-xs outline-none focus:border-zinc-700 font-mono font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3 border-t border-zinc-900 pt-4">
              <div className="flex items-center gap-2 font-bold text-zinc-400">
                REVIEW & COMMENTS
                <span className="rounded bg-zinc-800 px-2 py-0.5 font-mono text-[10px] text-zinc-400">{activeComments.length}</span>
              </div>
              <div className="space-y-3">
                {activeComments.length > 0 ? (
                  activeComments.map((com, idx) => (
                    <div key={idx} className="border-b border-zinc-900 pb-3 leading-relaxed">
                      <div className="flex items-center justify-between gap-2 text-[11px]">
                        <span className="font-bold text-zinc-200">{com.author} <span className="text-zinc-500 font-medium">({com.role})</span></span>
                        <span className="font-mono text-zinc-600">{com.date}</span>
                      </div>
                      <p className="mt-1 text-zinc-400">{com.text}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-zinc-600 italic">등록된 의견이 없습니다.</p>
                )}
              </div>
              <div className="rounded-xl border border-border-color bg-zinc-950 p-3 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase shrink-0">WRITER NICKNAME</span>
                  <input
                    type="text"
                    placeholder="이름 (예: 이다연)"
                    value={commentAuthorInputs[activeTestCase.id] || ''}
                    onChange={(e) => setCommentAuthorInputs({ ...commentAuthorInputs, [activeTestCase.id]: e.target.value })}
                    className="min-w-0 flex-1 bg-[#11131c]/60 border border-border-color rounded-lg px-2.5 py-1 text-zinc-200 text-xs outline-none focus:border-zinc-700"
                  />
                </div>
                <textarea
                  rows={2}
                  placeholder="여기에 댓글 내용을 입력하세요..."
                  value={commentInputs[activeTestCase.id] || ''}
                  onChange={(e) => setCommentInputs({ ...commentInputs, [activeTestCase.id]: e.target.value })}
                  className="w-full bg-transparent text-zinc-200 placeholder-zinc-600 border border-border-color/30 rounded-lg p-2.5 outline-none text-xs resize-none focus:border-zinc-700/60"
                />
                <button
                  onClick={() => handleAddComment(activeTestCase.id)}
                  className="ml-auto block px-4 py-1.5 bg-accent-green hover:bg-emerald-600 text-white font-bold rounded-lg cursor-pointer text-[11px]"
                >
                  댓글 등록
                </button>
              </div>
            </div>

            <div className="space-y-2 border-t border-zinc-900 pt-4">
              <Button variant="outline" size="sm" className="hover:border-accent-green hover:text-accent-green w-full" onClick={() => updateStatus(activeTestCase.id, 'PASS')}>PASS 로 판정 완료</Button>
              <Button variant="outline" size="sm" className="hover:border-accent-red hover:text-accent-red w-full" onClick={() => updateStatus(activeTestCase.id, 'FAIL')}>FAIL 로 판정 완료</Button>
              <Button variant="outline" size="sm" className="hover:border-zinc-500 hover:text-zinc-300 w-full" onClick={() => updateStatus(activeTestCase.id, 'UNTESTED')}>미실시 상태로 변경</Button>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => toggleTag(activeTestCase.id, '개선 필요')}
                  className={`px-2 py-1.5 rounded-lg border text-[11px] font-black transition-all cursor-pointer ${
                    activeTestCase.tags?.includes('개선 필요')
                      ? 'bg-yellow-500/10 border-yellow-500/40 text-yellow-500'
                      : 'border-zinc-800 hover:border-zinc-700 text-zinc-400'
                  }`}
                >
                  개선 필요 {activeTestCase.tags?.includes('개선 필요') ? '✓' : ''}
                </button>
                <button
                  type="button"
                  onClick={() => toggleTag(activeTestCase.id, '정책 확인 필요')}
                  className={`px-2 py-1.5 rounded-lg border text-[11px] font-black transition-all cursor-pointer ${
                    activeTestCase.tags?.includes('정책 확인 필요')
                      ? 'bg-purple-500/10 border-purple-500/40 text-purple-400'
                      : 'border-zinc-800 hover:border-zinc-700 text-zinc-400'
                  }`}
                >
                  정책 확인 필요 {activeTestCase.tags?.includes('정책 확인 필요') ? '✓' : ''}
                </button>
              </div>

              {activeTestCase.tags?.includes('개선 필요') && (
                <div className="mt-2 space-y-1.5 bg-[#151821]/40 border border-yellow-500/20 rounded-xl p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-yellow-500 font-bold">개선 필요 내용 입력</span>
                    <button type="button" onClick={() => handleSaveOpinion(activeTestCase.id, 'refinement')} className="px-2 py-0.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded text-[10px] font-bold cursor-pointer">저장</button>
                  </div>
                  <input
                    type="text"
                    value={opinionTextsState[activeTestCase.id]?.refinement || ''}
                    onChange={(e) => handleOpinionTextChange(activeTestCase.id, 'refinement', e.target.value)}
                    placeholder="개선이 필요한 내용을 입력하세요..."
                    className="w-full bg-[#11131c]/60 border border-zinc-800 rounded px-2.5 py-1 text-zinc-200 text-xs outline-none focus:border-yellow-500/50"
                  />
                </div>
              )}

              {activeTestCase.tags?.includes('정책 확인 필요') && (
                <div className="mt-2 space-y-1.5 bg-[#151821]/40 border border-purple-500/20 rounded-xl p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-purple-400 font-bold">정책 확인 필요 내용 입력</span>
                    <button type="button" onClick={() => handleSaveOpinion(activeTestCase.id, 'policy')} className="px-2 py-0.5 bg-purple-500 hover:bg-purple-600 text-white rounded text-[10px] font-bold cursor-pointer">저장</button>
                  </div>
                  <input
                    type="text"
                    value={opinionTextsState[activeTestCase.id]?.policy || ''}
                    onChange={(e) => handleOpinionTextChange(activeTestCase.id, 'policy', e.target.value)}
                    placeholder="정책 확인이 필요한 내용을 입력하세요..."
                    className="w-full bg-[#11131c]/60 border border-zinc-800 rounded px-2.5 py-1 text-zinc-200 text-xs outline-none focus:border-purple-500/50"
                  />
                </div>
              )}
            </div>
          </div>
        </aside>
      )}

      {activeTestCase && showImageViewer && (
        <aside className="sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto rounded-2xl border border-border-color bg-[#11131c]/95 p-5 shadow-2xl shadow-black/20 text-xs min-w-0">
          <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
            <h3 className="text-lg font-black text-white">이미지 보기</h3>
            <button
              onClick={() => setShowImageViewer(false)}
              className="rounded-full border border-zinc-800 px-2.5 py-1 text-zinc-400 hover:text-white hover:border-zinc-600 transition cursor-pointer"
              aria-label="이미지 뷰어 닫기"
            >
              ✕
            </button>
          </div>

          <div className="py-4 text-center font-mono text-zinc-300">
            {activeImages.length > 0 ? `${activeImageIndex + 1} / ${activeImages.length}` : '0 / 0'}
          </div>

          <div className="flex min-h-[520px] items-center justify-center overflow-hidden rounded-2xl bg-black/40 p-5">
            {activePreviewUrl ? (
              <img
                src={activePreviewUrl}
                alt="Evidence preview"
                className="max-h-[680px] max-w-full rounded-xl object-contain transition-transform duration-200"
                style={{ transform: `scale(${zoomLevel / 100}) rotate(${rotationAngle}deg)` }}
              />
            ) : (
              <div className="text-zinc-500">등록된 증적 이미지가 없습니다.</div>
            )}
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950">
              <button onClick={() => setZoomLevel(prev => Math.max(50, prev - 10))} className="px-3 py-2 text-zinc-300 hover:bg-zinc-800 cursor-pointer">-</button>
              <span className="min-w-16 px-3 py-2 text-center font-mono text-zinc-200">{zoomLevel}%</span>
              <button onClick={() => setZoomLevel(prev => Math.min(200, prev + 10))} className="px-3 py-2 text-zinc-300 hover:bg-zinc-800 cursor-pointer">+</button>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setRotationAngle(prev => prev - 90)} className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-zinc-300 hover:bg-zinc-800 cursor-pointer">↶</button>
              <button onClick={() => setRotationAngle(prev => prev + 90)} className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-zinc-300 hover:bg-zinc-800 cursor-pointer">↷</button>
              <button onClick={() => { setZoomLevel(100); setRotationAngle(0) }} className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-zinc-300 hover:bg-zinc-800 cursor-pointer">초기화</button>
            </div>
            <button
              onClick={downloadActiveImage}
              disabled={!activePreviewUrl}
              className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-zinc-300 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              다운로드
            </button>
          </div>
        </aside>
      )}
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
              <div className="space-y-1">
                <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">기능 분류 (Category Group)</div>
                <div className="text-sm font-bold text-zinc-100">
                  {categoryGroups.find(g => g.id === selectedAddGroupId)
                    ? getFullGroupTitle(categoryGroups.find(g => g.id === selectedAddGroupId)!)
                    : '기능 분류가 선택되지 않았습니다'}
                </div>
              </div>

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

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">실행일</label>
                  <input
                    type="text"
                    placeholder="예: 2026-06-16"
                    value={newExecutionDate}
                    onChange={(e) => setNewExecutionDate(e.target.value)}
                    className="w-full bg-[#090A0D] border border-border-color rounded-xl px-3.5 py-2.5 text-xs text-zinc-200 outline-none focus:border-zinc-700"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">테스터</label>
                  <input
                    type="text"
                    placeholder="예: 이다은, 이다연"
                    value={newTester}
                    onChange={(e) => setNewTester(e.target.value)}
                    className="w-full bg-[#090A0D] border border-border-color rounded-xl px-3.5 py-2.5 text-xs text-zinc-200 outline-none focus:border-zinc-700"
                  />
                </div>

                <div className="space-y-1.5 col-span-2">
                  <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">디바이스</label>
                  <input
                    type="text"
                    placeholder="예: iPhone 15 Pro"
                    value={newDevice}
                    onChange={(e) => setNewDevice(e.target.value)}
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
                <textarea
                  rows={3}
                  placeholder="예: 선택한 램프와 즉시 통신 세션이 연결됩니다."
                  value={newExpected}
                  onChange={(e) => setNewExpected(e.target.value)}
                  className="w-full bg-[#090A0D] border border-border-color rounded-xl p-3 text-xs text-zinc-200 outline-none resize-none focus:border-zinc-700"
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
              <h3 className="text-lg font-black text-white">새 기능 분류 추가</h3>
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
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setGroupCreateMode('parent')}
                  className={`rounded-xl border px-3 py-2 text-xs font-bold transition cursor-pointer ${
                    groupCreateMode === 'parent'
                      ? 'border-accent-green bg-accent-green/10 text-accent-green'
                      : 'border-border-color bg-[#090A0D] text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  상위 기능 생성
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setGroupCreateMode('child')
                    if (!parentGroupIdForChild && topGroups[0]) {
                      setParentGroupIdForChild(topGroups[0].id)
                    }
                  }}
                  disabled={topGroups.length === 0}
                  className={`rounded-xl border px-3 py-2 text-xs font-bold transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                    groupCreateMode === 'child'
                      ? 'border-accent-green bg-accent-green/10 text-accent-green'
                      : 'border-border-color bg-[#090A0D] text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  하위 기능 생성
                </button>
              </div>

              {groupCreateMode === 'child' && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">상위 기능 선택</label>
                  <select
                    value={parentGroupIdForChild || topGroups[0]?.id || ''}
                    onChange={(e) => setParentGroupIdForChild(e.target.value)}
                    className="w-full bg-[#090A0D] border border-border-color rounded-xl px-3 py-2.5 text-xs text-zinc-300 outline-none cursor-pointer focus:border-zinc-700"
                  >
                    {topGroups.map((group, idx) => {
                      const info = getNumberedGroupInfo(group, idx)
                      return (
                        <option key={group.id} value={group.id}>
                          {info.code} {info.title}
                        </option>
                      )
                    })}
                  </select>
                </div>
              )}

              <div className="rounded-xl border border-accent-green/20 bg-accent-green/5 px-3.5 py-2 text-xs font-bold text-accent-green">
                생성될 번호: {groupNumberPreview}
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">기능 분류명 (Title)</label>
                <input
                  type="text"
                  required
                  placeholder="예: 신규 네트워크 및 BLE 테스트"
                  value={newGroupTitle}
                  onChange={(e) => setNewGroupTitle(e.target.value)}
                  className="w-full bg-[#090A0D] border border-border-color rounded-xl px-3.5 py-2.5 text-xs text-zinc-200 outline-none focus:border-zinc-700"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">테스트 카테고리 (Test Category)</label>
                <select
                  value={categorySelectType}
                  onChange={(e) => setCategorySelectType(e.target.value)}
                  className="w-full bg-[#090A0D] border border-border-color rounded-xl px-3 py-2.5 text-xs text-zinc-300 outline-none cursor-pointer focus:border-zinc-700"
                >
                  <option value="HW">HW</option>
                  <option value="SW">SW</option>
                  <option value="공통">공통</option>
                  <option value="custom">직접 입력</option>
                </select>
              </div>

              {categorySelectType === 'custom' && (
                <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
                  <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">카테고리 직접 입력</label>
                  <input
                    type="text"
                    required
                    placeholder="예: BLE, 기기 전환, 동기화, 통신"
                    value={newGroupTestCategory}
                    onChange={(e) => setNewGroupTestCategory(e.target.value)}
                    className="w-full bg-[#090A0D] border border-border-color rounded-xl px-3.5 py-2.5 text-xs text-zinc-200 outline-none focus:border-zinc-700"
                  />
                </div>
              )}

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
                  {isAddingGroup ? '추가 중...' : '기능 분류 생성'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Edit Category Group Modal */}
      {editingGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#11131c] border border-border-color rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border-color pb-3 mb-4">
              <h3 className="text-lg font-black text-white">기능 분류 수정</h3>
              <button 
                onClick={() => setEditingGroup(null)}
                className="text-zinc-500 hover:text-zinc-300 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>
            
            {editGroupErrorMsg && (
              <div className="bg-red-500/10 border border-red-500/20 text-[#DE3A3A] px-3.5 py-2.5 rounded-xl text-xs mb-4">
                {editGroupErrorMsg}
              </div>
            )}
            
            <form onSubmit={handleEditCategoryGroup} className="space-y-4 text-left">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">기능 분류명 (Title)</label>
                <input
                  type="text"
                  required
                  placeholder="예: 5-2-F. 신규 네트워크 및 BLE 테스트"
                  value={editGroupTitle}
                  onChange={(e) => setEditGroupTitle(e.target.value)}
                  className="w-full bg-[#090A0D] border border-border-color rounded-xl px-3.5 py-2.5 text-xs text-zinc-200 outline-none focus:border-zinc-700"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">테스트 카테고리 (Test Category)</label>
                <select
                  value={editGroupCategoryType}
                  onChange={(e) => setEditGroupCategoryType(e.target.value)}
                  className="w-full bg-[#090A0D] border border-border-color rounded-xl px-3 py-2.5 text-xs text-zinc-300 outline-none cursor-pointer focus:border-zinc-700"
                >
                  <option value="HW">HW</option>
                  <option value="SW">SW</option>
                  <option value="공통">공통</option>
                  <option value="custom">직접 입력</option>
                </select>
              </div>

              {editGroupCategoryType === 'custom' && (
                <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
                  <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">카테고리 직접 입력</label>
                  <input
                    type="text"
                    required
                    placeholder="예: BLE, 기기 전환, 동기화, 통신"
                    value={editGroupCustomCategory}
                    onChange={(e) => setEditGroupCustomCategory(e.target.value)}
                    className="w-full bg-[#090A0D] border border-border-color rounded-xl px-3.5 py-2.5 text-xs text-zinc-200 outline-none focus:border-zinc-700"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border-color mt-4">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setEditingGroup(null)}
                  className="font-bold"
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isSavingGroup}
                  className="font-bold shadow-lg shadow-accent-green/20"
                >
                  {isSavingGroup ? '저장 중...' : '변경사항 저장'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Edit TestCase Modal */}
      {editingTestCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-xl bg-[#11131c] border border-border-color rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 my-8">
            <div className="flex items-center justify-between border-b border-border-color pb-3 mb-4">
              <h3 className="text-lg font-black text-white">테스트 케이스 수정</h3>
              <button 
                onClick={() => setEditingTestCase(null)}
                className="text-zinc-500 hover:text-zinc-300 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>
            
            {editTcErrorMsg && (
              <div className="bg-red-500/10 border border-red-500/20 text-[#DE3A3A] px-3.5 py-2.5 rounded-xl text-xs mb-4">
                {editTcErrorMsg}
              </div>
            )}
            
            <form onSubmit={handleEditTestCase} className="space-y-4 text-left">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 col-span-2">
                  <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">테스트 항목명 (Title)</label>
                  <input
                    type="text"
                    required
                    placeholder="예: 다중 램프 동시 스캔 및 식별 검증"
                    value={editTcTitle}
                    onChange={(e) => setEditTcTitle(e.target.value)}
                    className="w-full bg-[#090A0D] border border-border-color rounded-xl px-3.5 py-2.5 text-xs text-zinc-200 outline-none focus:border-zinc-700"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">기능 분류 (Category Group)</label>
                  <select
                    value={editTcGroupId}
                    onChange={(e) => setEditTcGroupId(e.target.value)}
                    className="w-full bg-[#090A0D] border border-border-color rounded-xl px-3 py-2.5 text-xs text-zinc-300 outline-none cursor-pointer focus:border-zinc-700"
                  >
                    {categoryGroups.length === 0 ? (
                      <option value="">(기능 분류를 먼저 생성해 주세요)</option>
                    ) : (
                      categoryGroups.map(g => (
                        <option key={g.id} value={g.id}>
                          {g.title.includes('|||') ? `${g.title.split('|||')[0]} [${g.title.split('|||')[1]}]` : g.title}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">TC 코드</label>
                  <input
                    type="text"
                    placeholder="예: INT-SCAN-005"
                    value={editTcCode}
                    onChange={(e) => setEditTcCode(e.target.value)}
                    className="w-full bg-[#090A0D] border border-border-color rounded-xl px-3.5 py-2.5 text-xs text-zinc-200 outline-none focus:border-zinc-700 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">태그 (쉼표구분)</label>
                  <input
                    type="text"
                    placeholder="예: 페어링, UX 개선"
                    value={editTcTags}
                    onChange={(e) => setEditTcTags(e.target.value)}
                    className="w-full bg-[#090A0D] border border-border-color rounded-xl px-3.5 py-2.5 text-xs text-zinc-200 outline-none focus:border-zinc-700"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">담당 테스터</label>
                  <input
                    type="text"
                    placeholder="예: 이다연"
                    value={editTcTester}
                    onChange={(e) => setEditTcTester(e.target.value)}
                    className="w-full bg-[#090A0D] border border-border-color rounded-xl px-3.5 py-2.5 text-xs text-zinc-200 outline-none focus:border-zinc-700"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">사전 조건 (라인구분)</label>
                <textarea
                  rows={2}
                  placeholder="예: 두 대 이상의 스마트폰에 앱 설치 확인"
                  value={editTcPrereqs}
                  onChange={(e) => setEditTcPrereqs(e.target.value)}
                  className="w-full bg-[#090A0D] border border-border-color rounded-xl p-3 text-xs text-zinc-200 outline-none resize-none focus:border-zinc-700"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">테스트 절차 (라인구분)</label>
                <textarea
                  rows={3}
                  placeholder="예: 스마트폰 A에서 스캔 시작"
                  value={editTcSteps}
                  onChange={(e) => setEditTcSteps(e.target.value)}
                  className="w-full bg-[#090A0D] border border-border-color rounded-xl p-3 text-xs text-zinc-200 outline-none resize-none focus:border-zinc-700"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">예상 결과</label>
                <input
                  type="text"
                  placeholder="예: 선택한 램프와 즉시 통신 세션이 연결됩니다."
                  value={editTcExpected}
                  onChange={(e) => setEditTcExpected(e.target.value)}
                  className="w-full bg-[#090A0D] border border-border-color rounded-xl px-3.5 py-2.5 text-xs text-zinc-200 outline-none focus:border-zinc-700"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border-color mt-4">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setEditingTestCase(null)}
                  className="font-bold"
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isSavingTestCase}
                  className="font-bold shadow-lg shadow-accent-green/20"
                >
                  {isSavingTestCase ? '저장 중...' : '변경사항 저장'}
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
