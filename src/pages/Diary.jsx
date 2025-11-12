import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { getDiaries, createDiary, deleteDiary as deleteDiaryFromFirestore } from '../services/firestoreService'
import { getAIResponse } from '../services/openRouterService'

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
    mood: '보통',
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

  const moodEmojis = {
    '매우 좋음': '😄',
    '좋음': '😊',
    '보통': '😐',
    '안 좋음': '😔',
    '매우 안 좋음': '😢'
  }

  const moodColors = {
    '매우 좋음': '#10b981',
    '좋음': '#3b82f6',
    '보통': '#6b7280',
    '안 좋음': '#f59e0b',
    '매우 안 좋음': '#ef4444'
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!isAuthenticated || !user) {
      showToast('로그인이 필요합니다.')
      return
    }
    
    setIsLoading(true)
    try {
      // Firestore에 일기 저장
      const newDiary = await createDiary(user.uid, {
        date: formData.date,
        title: '',
        mood: formData.mood,
        content: formData.content
      })
      
      // 로컬 상태 업데이트
      const formattedDiary = {
        ...newDiary,
        date: formData.date,
        createdAt: newDiary.createdAt?.toDate ? newDiary.createdAt.toDate().toISOString() : new Date().toISOString()
      }
      setDiaries([formattedDiary, ...diaries])
      
      // AI에게 위로와 음악 추천 받기
      const prompt = `오늘 기분이 "${formData.mood}"이고, 이런 일기를 썼어: "${formData.content.substring(0, 100)}..."
      
간단한 위로 한마디와 이 기분에 어울리는 음악 1-2곡을 추천해줘. 자연스럽게 대화하듯이 말해줘.`
      
      try {
        const aiResponse = await getAIResponse(prompt, selectedPersonality)
        showComfortModal(aiResponse, formData.mood)
      } catch (error) {
        console.error('AI 추천 실패:', error)
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
      mood: '보통',
      content: ''
    })
  }

  const showComfortModal = (message, mood) => {
    const moodColor = moodColors[mood]
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
                <div style="font-size: 3rem;">${moodEmojis[mood]}</div>
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
              <div class="mb-3">
                <span class="badge bg-primary">
                  ${moodEmojis[diary.mood]} ${diary.mood}
                </span>
              </div>
              <div class="border-start border-4 border-primary ps-3">
                <p style="white-space: pre-wrap; line-height: 1.8;">${diary.content}</p>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-danger" onclick="window.deleteDiary(${diary.id})">
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

  const deleteDiary = async (id) => {
    if (!window.confirm('정말 이 일기를 삭제하시겠습니까?')) {
      return
    }
    
    if (!isAuthenticated || !user) {
      showToast('로그인이 필요합니다.')
      return
    }
    
    try {
      await deleteDiaryFromFirestore(user.uid, id)
      setDiaries(diaries.filter(d => d.id !== id))
      const modal = window.bootstrap.Modal.getInstance(document.getElementById('diaryModal'))
      if (modal) modal.hide()
      showToast('일기가 삭제되었습니다.')
    } catch (error) {
      console.error('일기 삭제 실패:', error)
      showToast('일기 삭제에 실패했습니다.')
    }
  }

  useEffect(() => {
    window.deleteDiary = deleteDiary
    return () => {
      delete window.deleteDiary
    }
  })

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
                    <i className="bi bi-emoji-smile me-2"></i>
                    오늘의 기분은 어떠셨나요?
                  </label>
                  <div className="mood-selector-grid">
                    {Object.keys(moodEmojis).map(mood => (
                      <div key={mood} className="mood-option">
                        <input 
                          type="radio" 
                          className="mood-radio" 
                          name="mood" 
                          id={`mood-${mood}`}
                          value={mood}
                          checked={formData.mood === mood}
                          onChange={(e) => setFormData({...formData, mood: e.target.value})}
                        />
                        <label htmlFor={`mood-${mood}`} className={`mood-label mood-${mood === '매우 좋음' ? 'excellent' : mood === '좋음' ? 'good' : mood === '보통' ? 'normal' : mood === '안 좋음' ? 'bad' : 'terrible'}`}>
                          <span className="mood-emoji">{moodEmojis[mood]}</span>
                          <span className="mood-text">{mood}</span>
                        </label>
                      </div>
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
                  ) : isLoadingDiaries ? (
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
                    diaries.slice(0, 5).map(diary => (
                      <div 
                        key={diary.id} 
                        className="diary-list-item" 
                        onClick={() => showDiaryDetail(diary)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div 
                          className="diary-item-mood-indicator" 
                          style={{ 
                            background: `${moodColors[diary.mood]}20`, 
                            borderLeftColor: moodColors[diary.mood] 
                          }}
                        >
                          <span className="mood-emoji-small">{moodEmojis[diary.mood]}</span>
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
                    ))
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

