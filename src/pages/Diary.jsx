import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { getDiaries, createDiary, updateDiary, deleteDiary as deleteDiaryFromFirestore } from '../services/firestoreService'
import { getAIResponse } from '../services/openRouterService'

const MOOD_EMOJIS = {
  '매우 좋음': '😄',
  '좋음': '😊',
  '보통': '😐',
  '안 좋음': '😔',
  '매우 안 좋음': '😢'
}

const MOOD_COLORS = {
  '매우 좋음': '#10b981',
  '좋음': '#3b82f6',
  '보통': '#6b7280',
  '안 좋음': '#f59e0b',
  '매우 안 좋음': '#ef4444'
}

const MOOD_OPTIONS = Object.keys(MOOD_EMOJIS)

export default function Diary() {
  const { user, isAuthenticated } = useAuth()
  const [diaries, setDiaries] = useState([])
  const [selectedPersonality, setSelectedPersonality] = useLocalStorage('diaryPersonality', 'calm')
  // 오늘 날짜를 로컬 시간 기준으로 가져오기 (타임존 문제 방지)
  const getTodayDateString = () => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const [formData, setFormData] = useState({
    date: getTodayDateString(),
    content: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingDiaries, setIsLoadingDiaries] = useState(false)
  const dateInputRef = useRef(null)

  // Firestore에서 일기 목록 로드
  useEffect(() => {
    if (isAuthenticated && user) {
      loadDiaries()
    } else {
      setDiaries([])
    }
  }, [isAuthenticated, user])

  const loadDiaries = async () => {
    if (!user) return
    setIsLoadingDiaries(true)
    try {
      const userDiaries = await getDiaries(user.uid)
      // Firestore Timestamp를 Date로 변환 (타임존 문제 방지)
      const formattedDiaries = userDiaries.map(diary => {
        let dateStr = diary.date
        
        // date가 없으면 createdAt에서 추출 (로컬 날짜 기준)
        if (!dateStr && diary.createdAt) {
          const createdAtDate = diary.createdAt?.toDate 
            ? diary.createdAt.toDate() 
            : (diary.createdAt instanceof Date 
              ? diary.createdAt 
              : new Date(diary.createdAt))
          
          // 로컬 날짜로 변환 (YYYY-MM-DD)
          const year = createdAtDate.getFullYear()
          const month = String(createdAtDate.getMonth() + 1).padStart(2, '0')
          const day = String(createdAtDate.getDate()).padStart(2, '0')
          dateStr = `${year}-${month}-${day}`
        }
        
        // date가 없으면 오늘 날짜 사용
        if (!dateStr) {
          const today = new Date()
          const year = today.getFullYear()
          const month = String(today.getMonth() + 1).padStart(2, '0')
          const day = String(today.getDate()).padStart(2, '0')
          dateStr = `${year}-${month}-${day}`
        }
        
        return {
          ...diary,
          date: dateStr,
          aiComfort: diary.aiComfort || null, // AI 위로 메시지 포함
          createdAt: diary.createdAt?.toDate 
            ? diary.createdAt.toDate().toISOString() 
            : (diary.createdAt instanceof Date 
              ? diary.createdAt.toISOString() 
              : diary.createdAt)
        }
      })
      setDiaries(formattedDiaries)
    } catch (error) {
      console.error('일기 로드 실패:', error)
      showToast('일기를 불러오는데 실패했습니다.')
    } finally {
      setIsLoadingDiaries(false)
    }
  }

  const personalities = {
    energetic: {
      name: '활기찬 친구',
      icon: '🟢',
      description: '태양처럼 밝고 긍정적인 에너지',
      color: '#10b981'
    },
    logical: {
      name: '다정한 친구',
      icon: '🔵',
      description: '따뜻하고 친절한 조언',
      color: '#3b82f6'
    },
    calm: {
      name: '차분한 친구',
      icon: '🟣',
      description: '부드럽고 따뜻한 공감',
      color: '#8b5cf6'
    }
  }

  const detectMoodFromContent = useCallback(async (content) => {
    if (!content || !content.trim()) return null

    const analysisPrompt = `다음 일기의 전반적인 감정을 아래 다섯 가지 중 하나로만 답해주세요. 반드시 해당 단어 하나만 반환하세요.

일기 내용:
"${content.trim()}"

가능한 답변: 매우 좋음, 좋음, 보통, 안 좋음, 매우 안 좋음

정확히 위 단어 중 하나만 답변하고, 다른 말은 덧붙이지 마세요.`

    try {
      const response = await getAIResponse(analysisPrompt, selectedPersonality)
      if (!response) return null

      const normalized = response.replace(/[\s"']/g, '').trim()
      const detected = MOOD_OPTIONS.find(option => {
        const normalizedOption = option.replace(/\s/g, '')
        return normalized.includes(normalizedOption)
      })
      return detected || null
    } catch (error) {
      console.error('Mood detection failed:', error)
      return null
    }
  }, [selectedPersonality])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!isAuthenticated || !user) {
      showToast('로그인이 필요합니다.')
      return
    }
    
    setIsLoading(true)
    try {
      const detectedMood = await detectMoodFromContent(formData.content)
      const moodForStorage = detectedMood || '보통'

      // AI에게 위로 메시지 받기 (전체 일기 내용을 바탕으로)
      const prompt = `오늘 기분이 "${moodForStorage}"이고, 이런 일기를 썼어:

"${formData.content}"

위 일기 내용을 바탕으로 사용자에게 따뜻하고 공감적인 위로 메시지를 작성해주세요. 일기의 전체 내용을 고려하여 구체적이고 진심 어린 위로를 해주세요. 필요하다면 간단한 조언이나 격려도 포함해주세요. 음악 추천은 선택사항이며, 위로 메시지가 주가 되어야 합니다. 자연스럽게 대화하듯이 말해줘.`
      
      let aiComfort = null
      try {
        console.log('AI 위로 메시지 요청 중...')
        aiComfort = await getAIResponse(prompt, selectedPersonality)
        console.log('AI 위로 메시지 받음:', aiComfort ? aiComfort.substring(0, 50) + '...' : 'null')
      } catch (error) {
        console.error('AI 추천 실패:', error)
        // AI 응답 실패해도 일기는 저장
      }
      
      // Firestore에 일기 저장 (AI 위로 메시지 포함)
      console.log('일기 저장 시작, aiComfort:', aiComfort ? aiComfort.substring(0, 50) + '...' : 'null')
      const newDiary = await createDiary(user.uid, {
        date: formData.date,
        title: '',
        mood: moodForStorage,
        content: formData.content,
        aiComfort: aiComfort, // AI 위로 메시지 저장 (임베딩 없이)
        personality: selectedPersonality // 일기 작성 시 선택한 캐릭터 저장
      })
      console.log('일기 저장 완료, 반환된 데이터:', { ...newDiary, embedding: newDiary.embedding ? '[embedding]' : null })
      
      // 로컬 상태 업데이트
      const formattedDiary = {
        ...newDiary,
        date: formData.date,
        mood: moodForStorage,
        aiComfort: aiComfort,
        createdAt: newDiary.createdAt?.toDate ? newDiary.createdAt.toDate().toISOString() : new Date().toISOString()
      }
      setDiaries(prev => [formattedDiary, ...prev])
      
      // AI 응답이 있으면 모달 표시
      if (aiComfort) {
        showComfortModal(aiComfort, { mood: moodForStorage, personalityKey: selectedPersonality })
      } else {
        showToast('일기가 저장되었습니다! 💝')
      }
    } catch (error) {
      console.error('일기 저장 실패:', error)
      showToast('일기 저장에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
    
    setFormData({
      date: getTodayDateString(),
      content: ''
    })
  }

  const showComfortModal = (message, options = {}) => {
    const { mood = null, personalityKey = selectedPersonality } = options
    const fallbackColor = personalities[personalityKey]?.color || '#6366f1'
    const moodColor = mood && MOOD_COLORS[mood] ? MOOD_COLORS[mood] : fallbackColor
    const moodEmoji = mood && MOOD_EMOJIS[mood] ? MOOD_EMOJIS[mood] : (personalities[personalityKey]?.icon || '💖')
    const modalHTML = `
      <div class="modal fade" id="comfortModal" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered modal-lg">
          <div class="modal-content">
            <div class="modal-header" style="background: linear-gradient(135deg, ${moodColor} 0%, ${moodColor}dd 100%); color: white;">
              <h5 class="modal-title">
                <i class="bi bi-heart-fill me-2"></i>오늘 하루 수고했어요
              </h5>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body p-4">
              <div class="text-center mb-3">
                <div style="font-size: 3rem;">${moodEmoji}</div>
              </div>
              <div style="white-space: pre-wrap; line-height: 1.8; font-size: 1.05rem;">
                ${message}
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-primary" data-bs-dismiss="modal">
                <i class="bi bi-check-circle me-2"></i>고마워!
              </button>
            </div>
          </div>
        </div>
      </div>
    `
    
    const existingModal = document.getElementById('comfortModal')
    if (existingModal) {
      existingModal.remove()
    }
    
    document.body.insertAdjacentHTML('beforeend', modalHTML)
    const modal = new window.bootstrap.Modal(document.getElementById('comfortModal'))
    modal.show()
    
    // 모달이 닫힌 후 토스트 표시
    document.getElementById('comfortModal').addEventListener('hidden.bs.modal', () => {
      showToast('일기가 저장되었습니다! 💝')
    }, { once: true })
  }

  const showDiaryDetail = (diary) => {
    const personalityInfo = diary.personality ? personalities[diary.personality] : null
    const displayColor = diary.mood && MOOD_COLORS[diary.mood] ? MOOD_COLORS[diary.mood] : (personalityInfo?.color || '#6366f1')
    const displayBadge = diary.mood
      ? `<span class="badge bg-primary" style="background-color: ${displayColor} !important;">
            ${MOOD_EMOJIS[diary.mood] || '💖'} ${diary.mood}
         </span>`
      : personalityInfo
        ? `<span class="badge bg-secondary" style="background-color: ${personalityInfo.color} !important;">
             ${personalityInfo.icon} ${personalityInfo.name}
           </span>`
        : ''

    const modalHTML = `
      <div class="modal fade" id="diaryModal" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">
                <i class="bi bi-journal-text me-2"></i>${formatDate(diary.date)}
              </h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              ${displayBadge ? `<div class="mb-3">${displayBadge}</div>` : ''}
              <div class="border-start border-4 border-primary ps-3 mb-4">
                <p style="white-space: pre-wrap; line-height: 1.8;">${diary.content}</p>
              </div>
              ${diary.aiComfort ? `
              <div class="ai-comfort-section mt-4 p-3 rounded" style="background: linear-gradient(135deg, ${displayColor}15 0%, ${displayColor}05 100%); border-left: 3px solid ${displayColor};">
                <div class="d-flex align-items-center mb-2">
                  <i class="bi bi-heart-fill me-2" style="color: ${displayColor}"></i>
                  <h6 class="mb-0" style="color: ${displayColor}">AI의 위로</h6>
                </div>
                <p style="white-space: pre-wrap; line-height: 1.8; margin: 0;">${diary.aiComfort}</p>
              </div>
              ` : ''}
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-primary" onclick="window.editDiary('${diary.id}')">
                <i class="bi bi-pencil me-2"></i>수정
              </button>
              <button type="button" class="btn btn-danger" onclick="window.deleteDiary('${diary.id}')">
                <i class="bi bi-trash me-2"></i>삭제
              </button>
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">닫기</button>
            </div>
          </div>
        </div>
      </div>
    `
    
    const existingModal = document.getElementById('diaryModal')
    if (existingModal) {
      existingModal.remove()
    }
    
    document.body.insertAdjacentHTML('beforeend', modalHTML)
    const modal = new window.bootstrap.Modal(document.getElementById('diaryModal'))
    modal.show()
  }

  const deleteDiary = useCallback(async (id) => {
    if (!window.confirm('정말 이 일기를 삭제하시겠습니까?')) {
      return
    }
    
    if (!isAuthenticated || !user) {
      showToast('로그인이 필요합니다.')
      return
    }
    
    try {
      await deleteDiaryFromFirestore(user.uid, id)
      setDiaries(prev => prev.filter(d => d.id !== id))
      const modal = window.bootstrap?.Modal?.getInstance(document.getElementById('diaryModal'))
      if (modal) modal.hide()
      showToast('일기가 삭제되었습니다.')
    } catch (error) {
      console.error('일기 삭제 실패:', error)
      showToast('일기 삭제에 실패했습니다.')
    }
  }, [isAuthenticated, user])

  const editDiary = useCallback(async (diaryId) => {
    // 기존 모달 닫기
    const existingModal = window.bootstrap?.Modal?.getInstance(document.getElementById('diaryModal'))
    if (existingModal) {
      existingModal.hide()
    }
    
    // 일기 찾기
    const diary = diaries.find(d => d.id === diaryId)
    if (!diary) {
      showToast('일기를 찾을 수 없습니다.')
      return
    }
    
    // 수정 모달 표시
    showEditDiaryModal(diary)
  }, [diaries])

  // HTML 이스케이프 함수
  const escapeHtml = (text) => {
    if (!text) return ''
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  const showEditDiaryModal = (diary) => {
    // HTML 이스케이프 처리
    const escapedContent = escapeHtml(diary.content || '')
    const escapedDate = escapeHtml(diary.date || '')
    const escapedId = escapeHtml(diary.id || '')
    
    const modalHTML = `
      <div class="modal fade" id="editDiaryModal" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">
                <i class="bi bi-pencil-square me-2"></i>일기 수정
              </h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <form id="editDiaryForm">
              <div class="modal-body">
                <input type="hidden" id="editDiaryId" value="${escapedId}">
                
                <!-- 날짜 선택 -->
                <div class="mb-4">
                  <label class="form-label fw-bold">날짜</label>
                  <input 
                    type="date" 
                    class="form-control" 
                    id="editDiaryDate" 
                    value="${escapedDate}"
                    required
                  />
                </div>

                <!-- 일기 내용 -->
                <div class="mb-4">
                  <label class="form-label fw-bold">일기 내용</label>
                  <textarea 
                    class="form-control" 
                    id="editDiaryContent" 
                    rows="6"
                    maxlength="500"
                    required
                  >${escapedContent}</textarea>
                  <div class="d-flex justify-content-between mt-2">
                    <small class="text-muted">최대 500자</small>
                    <small id="editCharCount" class="text-muted">${(diary.content || '').length} / 500</small>
                  </div>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">취소</button>
                <button type="submit" class="btn btn-primary" id="editDiarySubmitBtn">
                  <i class="bi bi-check-circle me-2"></i>수정 완료
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `
    
    const existingModal = document.getElementById('editDiaryModal')
    if (existingModal) {
      existingModal.remove()
    }
    
    document.body.insertAdjacentHTML('beforeend', modalHTML)
    
    // Bootstrap 모달 초기화
    if (window.bootstrap && window.bootstrap.Modal) {
      const modal = new window.bootstrap.Modal(document.getElementById('editDiaryModal'))
      modal.show()
    } else {
      console.error('Bootstrap Modal is not available')
      showToast('모달을 열 수 없습니다.')
      return
    }
    
    // 문자 수 카운터
    const contentTextarea = document.getElementById('editDiaryContent')
    const charCount = document.getElementById('editCharCount')
    contentTextarea.addEventListener('input', (e) => {
      const length = e.target.value.length
      charCount.textContent = `${length} / 500`
      charCount.style.color = length > 450 ? '#ef4444' : length > 350 ? '#f59e0b' : '#6b7280'
    })
    
    // 폼 제출 처리
    const form = document.getElementById('editDiaryForm')
    form.addEventListener('submit', async (e) => {
      e.preventDefault()
      await handleEditDiary(diary.id)
    })
  }

  const handleEditDiary = async (diaryId) => {
    if (!isAuthenticated || !user) {
      showToast('로그인이 필요합니다.')
      return
    }
    
    const submitBtn = document.getElementById('editDiarySubmitBtn')
    const originalText = submitBtn.innerHTML
    submitBtn.disabled = true
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>수정 중...'
    
    try {
      const diary = diaries.find(d => d.id === diaryId)
      if (!diary) {
        showToast('일기를 찾을 수 없습니다.')
        return
      }

      const date = document.getElementById('editDiaryDate').value
      const content = document.getElementById('editDiaryContent').value.trim()
      
      if (!date || !content) {
        showToast('모든 필드를 입력해주세요.')
        return
      }
      
      if (content.length > 500) {
        showToast('일기 내용은 500자 이하여야 합니다.')
        return
      }

      const detectedMood = await detectMoodFromContent(content)
      const finalMood = detectedMood || diary.mood || '보통'
      
      // AI에게 새로운 위로 메시지 받기 (전체 일기 내용을 바탕으로)
      const prompt = `오늘 기분이 "${finalMood}"이고, 이런 일기를 썼어:

"${content}"

위 일기 내용을 바탕으로 사용자에게 따뜻하고 공감적인 위로 메시지를 작성해주세요. 일기의 전체 내용을 고려하여 구체적이고 진심 어린 위로를 해주세요. 필요하다면 간단한 조언이나 격려도 포함해주세요. 음악 추천은 선택사항이며, 위로 메시지가 주가 되어야 합니다. 자연스럽게 대화하듯이 말해줘.`
      
      let aiComfort = null
      try {
        console.log('AI 위로 메시지 요청 중 (수정)...')
        aiComfort = await getAIResponse(prompt, selectedPersonality)
        console.log('AI 위로 메시지 받음 (수정):', aiComfort ? aiComfort.substring(0, 50) + '...' : 'null')
      } catch (error) {
        console.error('AI 추천 실패 (수정):', error)
        // AI 응답 실패해도 일기는 수정
      }
      
      // 일기 수정 (새로운 AI 위로 메시지 포함)
      const updateData = {
        date,
        content
      }

      if (finalMood) {
        updateData.mood = finalMood
      }
      
      // AI 위로 메시지가 있으면 포함
      if (aiComfort && aiComfort.trim().length > 0) {
        updateData.aiComfort = aiComfort.trim()
      }
      
      const updatedDiary = await updateDiary(user.uid, diaryId, updateData)
      
      // 임베딩 업데이트를 위해 일기 내용으로 다시 임베딩 생성
      try {
        const { getEmbedding } = await import('../services/embeddingService')
        const embedding = await getEmbedding(content)
        await updateDiary(user.uid, diaryId, {
          embedding
        })
      } catch (embeddingError) {
        console.warn('임베딩 업데이트 실패:', embeddingError)
      }
      
      // 로컬 상태 업데이트
      const updatedDiaryWithFormat = {
        ...updatedDiary,
        date,
        mood: finalMood,
        aiComfort: aiComfort || updatedDiary.aiComfort || null,
        createdAt: updatedDiary.createdAt?.toDate 
          ? updatedDiary.createdAt.toDate().toISOString() 
          : (updatedDiary.createdAt instanceof Date 
            ? updatedDiary.createdAt.toISOString() 
            : updatedDiary.createdAt)
      }
      
      setDiaries(prev => prev.map(d => d.id === diaryId ? updatedDiaryWithFormat : d))
      
      // 모달 닫기
      const modal = window.bootstrap.Modal.getInstance(document.getElementById('editDiaryModal'))
      if (modal) modal.hide()
      
      // AI 응답이 있으면 모달 표시
      if (aiComfort) {
        showComfortModal(aiComfort, { mood: finalMood, personalityKey: diary.personality || selectedPersonality })
      } else {
        showToast('일기가 수정되었습니다! 💝')
      }
    } catch (error) {
      console.error('일기 수정 실패:', error)
      showToast('일기 수정에 실패했습니다.')
    } finally {
      submitBtn.disabled = false
      submitBtn.innerHTML = originalText
    }
  }

  useEffect(() => {
    // window 객체에 함수 등록
    if (typeof window !== 'undefined') {
      window.deleteDiary = deleteDiary
      window.editDiary = editDiary
    }
    return () => {
      // 정리 함수
      if (typeof window !== 'undefined') {
        delete window.deleteDiary
        delete window.editDiary
      }
    }
  }, [deleteDiary, editDiary])

  const formatDate = (dateString) => {
    // "YYYY-MM-DD" 형식인 경우 직접 파싱 (타임존 문제 방지)
    if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = dateString.split('-').map(Number)
      return `${year}년 ${month}월 ${day}일`
    }
    
    // Date 객체이거나 다른 형식인 경우
    const date = dateString instanceof Date 
      ? dateString 
      : new Date(dateString)
    
    if (isNaN(date.getTime())) {
      console.error('Invalid date:', dateString)
      return '날짜 없음'
    }
    
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    return `${year}년 ${month}월 ${day}일`
  }

  const showToast = (message) => {
    const toastHTML = `
      <div class="position-fixed bottom-0 end-0 p-3" style="z-index: 11">
        <div class="toast show" role="alert">
          <div class="toast-header bg-primary text-white">
            <i class="bi bi-check-circle-fill me-2"></i>
            <strong class="me-auto">알림</strong>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
          </div>
          <div class="toast-body">
            ${message}
          </div>
        </div>
      </div>
    `
    
    const toastContainer = document.createElement('div')
    toastContainer.innerHTML = toastHTML
    document.body.appendChild(toastContainer)
    
    setTimeout(() => {
      toastContainer.remove()
    }, 3000)
  }

  // 1주치 일기 일괄 생성 함수
  const createWeekDiaries = useCallback(async () => {
    if (!isAuthenticated || !user) {
      showToast('로그인이 필요합니다.')
      return
    }

    if (!window.confirm('1주치 일기를 생성하시겠습니까? (7개의 일기가 생성됩니다)')) {
      return
    }

    setIsLoading(true)
    
    const fallbackMoods = ['매우 좋음', '좋음', '보통', '안 좋음', '매우 안 좋음']
    const sampleContents = [
      '오늘은 날씨가 좋아서 기분이 좋았다. 산책을 하면서 마음이 편안해졌다. 하루 종일 긍정적인 에너지가 느껴졌다.',
      '친구들과 만나서 즐거운 시간을 보냈다. 오랜만에 웃음이 많았고, 좋은 대화를 나눌 수 있어서 행복했다.',
      '평범한 하루였다. 특별한 일은 없었지만 무난하게 하루를 보냈다. 조용하고 평화로운 하루였다.',
      '오늘은 조금 피곤했다. 일이 많아서 힘들었지만 잘 해결했다. 휴식이 필요하다고 느꼈다.',
      '스트레스가 많았던 하루였다. 하지만 끝까지 포기하지 않고 잘 해결했다. 자신이 자랑스럽다.',
      '새로운 도전을 시작했다. 설레고 기대되는 마음이다. 앞으로가 기대된다.',
      '가족과 함께 시간을 보냈다. 따뜻한 하루였고, 소중한 사람들과 함께 있어서 행복했다.'
    ]

    const today = new Date()
    let successCount = 0
    let failCount = 0

    try {
      for (let i = 0; i < 7; i++) {
        const date = new Date(today)
        date.setDate(date.getDate() - i) // 오늘부터 과거로

        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        const dateString = `${year}-${month}-${day}`

        const randomMood = fallbackMoods[Math.floor(Math.random() * fallbackMoods.length)]
        const content = sampleContents[i] || sampleContents[Math.floor(Math.random() * sampleContents.length)]

        try {
          const detectedMood = await detectMoodFromContent(content)
          const moodForEntry = detectedMood || randomMood

          // AI에게 위로 메시지 받기
          const prompt = `오늘 기분이 "${moodForEntry}"이고, 이런 일기를 썼어:

"${content}"

위 일기 내용을 바탕으로 사용자에게 따뜻하고 공감적인 위로 메시지를 작성해주세요. 일기의 전체 내용을 고려하여 구체적이고 진심 어린 위로를 해주세요. 필요하다면 간단한 조언이나 격려도 포함해주세요. 음악 추천은 선택사항이며, 위로 메시지가 주가 되어야 합니다. 자연스럽게 대화하듯이 말해줘.`
          
          let aiComfort = null
          try {
            console.log(`AI 위로 메시지 요청 중 (${dateString})...`)
            aiComfort = await getAIResponse(prompt, selectedPersonality)
            console.log(`AI 위로 메시지 받음 (${dateString}):`, aiComfort ? aiComfort.substring(0, 50) + '...' : 'null')
          } catch (error) {
            console.error(`AI 추천 실패 (${dateString}):`, error)
            // AI 응답 실패해도 일기는 저장
          }

          // 일기 저장 (AI 위로 메시지 포함)
          const newDiary = await createDiary(user.uid, {
            date: dateString,
            title: '',
            mood: moodForEntry,
            content: content,
            aiComfort: aiComfort, // AI 위로 메시지 저장
            personality: selectedPersonality,
            includeVector: true // 임베딩은 생성
          })

          successCount++
          console.log(`✅ ${dateString} 일기 생성 완료`)
        } catch (error) {
          failCount++
          console.error(`❌ ${dateString} 일기 생성 실패:`, error)
        }

        // API 호출 제한을 피하기 위해 약간의 딜레이 (AI 응답 시간 고려)
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      // 일기 목록 다시 불러오기
      if (user) {
        const userDiaries = await getDiaries(user.uid)
        const formattedDiaries = userDiaries.map(diary => {
          let dateStr = diary.date
          
          if (!dateStr && diary.createdAt) {
            const createdAtDate = diary.createdAt?.toDate 
              ? diary.createdAt.toDate() 
              : (diary.createdAt instanceof Date 
                ? diary.createdAt 
                : new Date(diary.createdAt))
            
            const year = createdAtDate.getFullYear()
            const month = String(createdAtDate.getMonth() + 1).padStart(2, '0')
            const day = String(createdAtDate.getDate()).padStart(2, '0')
            dateStr = `${year}-${month}-${day}`
          }
          
          if (!dateStr) {
            const today = new Date()
            const year = today.getFullYear()
            const month = String(today.getMonth() + 1).padStart(2, '0')
            const day = String(today.getDate()).padStart(2, '0')
            dateStr = `${year}-${month}-${day}`
          }
          
          return {
            ...diary,
            date: dateStr,
            aiComfort: diary.aiComfort || null,
            createdAt: diary.createdAt?.toDate 
              ? diary.createdAt.toDate().toISOString() 
              : (diary.createdAt instanceof Date 
                ? diary.createdAt.toISOString() 
                : diary.createdAt)
          }
        })
        setDiaries(formattedDiaries)
      }

      if (successCount > 0) {
        showToast(`✅ ${successCount}개의 일기가 생성되었습니다!`)
      }
      if (failCount > 0) {
        showToast(`⚠️ ${failCount}개의 일기 생성에 실패했습니다.`)
      }
    } catch (error) {
      console.error('일기 일괄 생성 실패:', error)
      showToast('일기 생성 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated, user, selectedPersonality, detectMoodFromContent])


  return (
    <section id="diary" className="py-5 bg-gradient-light theme-section diary-section" style={{ paddingTop: '120px' }}>
      <div className="container">
        <div className="row g-4 mt-2">
          <div className="col-12 col-xl-8">
            <div className="diary-form-card">
              <div className="card-header-custom">
                <div className="d-flex align-items-center">
                  <div className="form-icon-wrapper">
                    <i className="bi bi-pen-fill"></i>
                  </div>
                  <div>
                    <h4 className="mb-0 fw-bold">오늘의 감정 일기</h4>
                    <small className="text-muted">마음 속 이야기를 자유롭게 써보세요</small>
                  </div>
                </div>
              </div>
              
              <form onSubmit={handleSubmit} className="diary-form">
                {/* 날짜 선택 */}
                <div className="mb-4">
                  <div className="date-display-container position-relative">
                    <div 
                      className="date-display-box"
                      onClick={() => {
                        if (dateInputRef.current) {
                          if (typeof dateInputRef.current.showPicker === 'function') {
                            dateInputRef.current.showPicker()
                          } else {
                            dateInputRef.current.click()
                          }
                        }
                      }}
                    >
                      <span className="date-label">날짜</span>
                      <div className="date-text">{formatDate(formData.date)}</div>
                    </div>
                    <input 
                      type="date" 
                      ref={dateInputRef}
                      id="diaryDate"
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                      className="position-absolute"
                      style={{ 
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        opacity: 0,
                        cursor: 'pointer',
                        zIndex: 1
                      }}
                      required
                    />
                  </div>
                </div>

                {/* 성격 선택 */}
                <div className="mb-4">
                  <label className="form-label-custom mb-3">
                    <i className="bi bi-person-heart me-2"></i>
                    어떤 성격의 AI가 위로해줄까요?
                  </label>
                  <div className="d-flex flex-wrap gap-2">
                    {Object.entries(personalities).map(([key, info]) => (
                      <button
                        key={key}
                        type="button"
                        className={`btn btn-sm ${selectedPersonality === key ? 'btn-primary' : 'btn-outline-primary'}`}
                        onClick={() => setSelectedPersonality(key)}
                        style={{
                          borderColor: info.color,
                          backgroundColor: selectedPersonality === key ? info.color : 'transparent',
                          color: selectedPersonality === key ? 'white' : info.color
                        }}
                      >
                        <span className="me-1">{info.icon}</span>
                        {info.name}
                      </button>
                    ))}
                  </div>
                </div>
                
                
                <div className="mb-4">
                  <label className="form-label-custom mb-3">
                    <i className="bi bi-heart-fill me-2"></i>
                    오늘 하루는 어땠나요?
                  </label>
                  <div className="diary-textarea-wrapper">
                    <textarea 
                      className="form-control form-control-custom diary-textarea" 
                      id="diaryContent"
                      rows="6"
                      placeholder="편하게 당신의 감정을 표현해주세요. 모든 감정은 소중합니다..."
                      value={formData.content}
                      onChange={(e) => setFormData({...formData, content: e.target.value.substring(0, 500)})}
                      required
                    ></textarea>
                    <div className="textarea-footer">
                      <div className="security-notice">
                        <i className="bi bi-shield-check me-1"></i>
                        <small>당신의 일기는 안전하게 보관됩니다</small>
                      </div>
                      <div className="char-counter">
                        <small style={{ color: formData.content.length > 450 ? '#ef4444' : formData.content.length > 350 ? '#f59e0b' : '#6b7280' }}>
                          {formData.content.length} / 500
                        </small>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="diary-submit-wrapper">
                  <button type="submit" className="btn btn-save-diary" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        <span>AI가 응답을 준비중...</span>
                      </>
                    ) : (
                      <>
                        <i className="bi bi-bookmark-heart-fill me-2"></i>
                        <span>일기 저장하기</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
          
          <div className="col-12 col-xl-4">
            <div className="diary-sidebar">
              <div className="sidebar-card mb-4">
                <div className="sidebar-header">
                  <div className="sidebar-icon">
                    <i className="bi bi-journal-bookmark"></i>
                  </div>
                  <div>
                    <h5 className="sidebar-title">저장된 일기</h5>
                    <small className="sidebar-subtitle">지금까지의 기록</small>
                  </div>
                </div>
                <div className="sidebar-content">
                  {!isAuthenticated ? (
                    <div className="empty-state">
                      <div className="empty-icon">
                        <i className="bi bi-lock"></i>
                      </div>
                      <p className="empty-text">로그인이 필요합니다</p>
                      <small className="empty-subtext">일기를 작성하려면 로그인해주세요</small>
                    </div>
                  ) : null}
                  {!isAuthenticated ? null : isLoadingDiaries ? (
                    <div className="text-center py-4">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </div>
                  ) : diaries.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-icon">
                        <i className="bi bi-inbox"></i>
                      </div>
                      <p className="empty-text">아직 작성된 일기가 없습니다</p>
                      <small className="empty-subtext">첫 번째 일기를 작성해보세요</small>
                    </div>
                  ) : (
                    diaries.slice(0, 5).map(diary => {
                      const indicatorColor = diary.mood && MOOD_COLORS[diary.mood]
                        ? MOOD_COLORS[diary.mood]
                        : ((diary.personality && personalities[diary.personality]?.color) || '#6b7280')
                      const indicatorIcon = diary.mood
                        ? (MOOD_EMOJIS[diary.mood] || '💖')
                        : (diary.personality ? personalities[diary.personality]?.icon : '💬')

                      return (
                        <div 
                          key={diary.id} 
                          className="diary-list-item" 
                          onClick={() => showDiaryDetail(diary)}
                          style={{ cursor: 'pointer' }}
                        >
                          <div 
                            className="diary-item-mood-indicator" 
                            style={{ 
                              background: `${indicatorColor}20`, 
                              borderLeftColor: indicatorColor 
                            }}
                          >
                            <span className="mood-emoji-small">{indicatorIcon}</span>
                          </div>
                          <div className="diary-item-content">
                            <p className="diary-item-date mb-2">
                              <i className="bi bi-calendar3 me-1"></i>{formatDate(diary.date)}
                            </p>
                            <p className="diary-item-preview">
                              {diary.content.substring(0, 60)}{diary.content.length > 60 ? '...' : ''}
                            </p>
                          </div>
                          <div className="diary-item-action">
                            <i className="bi bi-chevron-right"></i>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

