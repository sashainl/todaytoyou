import { useState, useRef, useEffect, useCallback } from 'react'
import { getAIResponse } from '../services/openRouterService'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useAuth } from '../context/AuthContext'
import { saveChatMessageWithVector, searchSimilarMessages, getChatMessages, getDiaries } from '../services/firestoreService'

export default function Chat() {
  const { user, isAuthenticated } = useAuth()
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [selectedPersonality, setSelectedPersonality] = useLocalStorage('chatPersonality', 'calm')
  const messagesCacheRef = useRef({}) // 캐릭터별 메시지 캐시
  const messagesEndRef = useRef(null)
  const chatMessagesRef = useRef(null)
  const isMountedRef = useRef(false) // 컴포넌트 마운트 상태 추적
  const loadingRef = useRef(false) // 로딩 중 중복 호출 방지

  const personalities = {
    energetic: {
      name: '활기찬 친구',
      icon: '🟢',
      description: '태양처럼 밝고 긍정적인 에너지',
      color: '#10b981',
      initialMessage: '안녕! 오늘 하루 어땠어? 😊 힘들면 나랑 같이 풀자!'
    },
    logical: {
      name: '다정한 친구',
      icon: '🔵',
      description: '따뜻하고 친절한 조언',
      color: '#3b82f6',
      initialMessage: '안녕! 무슨 일 있어? 편하게 이야기해봐 '
    },
    calm: {
      name: '차분한 친구',
      icon: '🟣',
      description: '부드럽고 따뜻한 공감',
      color: '#8b5cf6',
      initialMessage: '괜찮아, 여기 앉아서 천천히 얘기하자 '
    }
  }

  const scrollToBottom = () => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTo({
        top: chatMessagesRef.current.scrollHeight,
        behavior: 'smooth'
      })
    }
  }

  // Firestore에서 메시지를 UI 형식으로 변환
  const convertFirestoreMessageToUI = (firestoreMessage) => {
    const timestamp = firestoreMessage.timestamp?.toDate 
      ? firestoreMessage.timestamp.toDate() 
      : (firestoreMessage.createdAt?.toDate 
        ? firestoreMessage.createdAt.toDate() 
        : new Date(firestoreMessage.timestamp || firestoreMessage.createdAt))
    
    return {
      id: firestoreMessage.id || Date.now(),
      text: firestoreMessage.text,
      isUser: firestoreMessage.isUser,
      time: timestamp.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    }
  }

  // 캐릭터별 메시지 불러오기
  const loadMessagesForPersonality = useCallback(async (personality, forceRefresh = true) => {
    // 중복 호출 방지
    if (loadingRef.current) {
      console.log('Already loading messages, skipping...')
      return
    }
    
    // 캐시에 메시지가 있고 강제 새로고침이 아니면 먼저 표시 (즉시 전환)
    if (!forceRefresh && messagesCacheRef.current[personality]) {
      setMessages(messagesCacheRef.current[personality])
      setIsLoadingMessages(false)
      return
    }
    
    // 로딩 시작
    loadingRef.current = true
    setIsLoadingMessages(true)
    
    if (!isAuthenticated || !user) {
      // 로그인하지 않은 경우 초기 메시지만 표시
      const initialMessage = personalities[personality].initialMessage
      const botMessage = {
        id: `initial-${personality}`, // 고정 ID 사용
        text: initialMessage,
        isUser: false,
        time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
      }
      const cachedMessages = [botMessage]
      messagesCacheRef.current[personality] = cachedMessages
      setMessages(cachedMessages)
      setIsLoadingMessages(false)
      loadingRef.current = false
      return
    }

    try {
      // Firestore에서 해당 캐릭터의 메시지 불러오기 (항상 최신 데이터)
      console.log('Loading messages for personality:', personality, 'userId:', user.uid)
      const firestoreMessages = await getChatMessages(user.uid, personality, 100)
      console.log('Loaded messages from Firestore:', firestoreMessages.length)
      
      let finalMessages = []
      
      if (firestoreMessages.length > 0) {
        // 시간순으로 정렬 (오래된 것부터)
        const sortedMessages = firestoreMessages.sort((a, b) => {
          const timeA = a.timestamp?.toDate 
            ? a.timestamp.toDate().getTime() 
            : (a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0)
          const timeB = b.timestamp?.toDate 
            ? b.timestamp.toDate().getTime() 
            : (b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0)
          return timeA - timeB
        })

        // UI 형식으로 변환
        finalMessages = sortedMessages.map(convertFirestoreMessageToUI)
        console.log('Converted messages:', finalMessages.length)
      } else {
        // 저장된 메시지가 없으면 초기 메시지 표시
        console.log('No messages found, showing initial message')
        const initialMessage = personalities[personality].initialMessage
        const botMessage = {
          id: `initial-${personality}`, // 고정 ID 사용
          text: initialMessage,
          isUser: false,
          time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
        }
        finalMessages = [botMessage]
      }
      
      // 캐시에 저장하고 메시지 업데이트
      messagesCacheRef.current[personality] = finalMessages
      setMessages(finalMessages)
      console.log('Messages set:', finalMessages.length)
    } catch (error) {
      console.error('Error loading messages:', error)
      // 에러 발생 시 캐시된 메시지가 있으면 사용, 없으면 초기 메시지 표시
      if (messagesCacheRef.current[personality]) {
        setMessages(messagesCacheRef.current[personality])
      } else {
        const initialMessage = personalities[personality].initialMessage
        const botMessage = {
          id: `initial-${personality}`, // 고정 ID 사용
          text: initialMessage,
          isUser: false,
          time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
        }
        setMessages([botMessage])
      }
    } finally {
      setIsLoadingMessages(false)
      loadingRef.current = false
    }
  }, [isAuthenticated, user])

  // 컴포넌트 마운트 시 메시지 불러오기
  useEffect(() => {
    if (!isMountedRef.current) {
      // 첫 마운트 시에만 메시지 불러오기
      isMountedRef.current = true
      loadMessagesForPersonality(selectedPersonality, true)
    }
    
    // 언마운트 시 플래그 리셋
    return () => {
      isMountedRef.current = false
    }
  }, []) // 빈 배열 - 마운트 시에만 실행

  // 캐릭터 변경 시 메시지 불러오기
  useEffect(() => {
    if (isMountedRef.current) {
      loadMessagesForPersonality(selectedPersonality, true)
    }
  }, [selectedPersonality, loadMessagesForPersonality])

  // 사용자 로그인 상태가 변경될 때도 메시지 불러오기
  useEffect(() => {
    if (isAuthenticated && user && isMountedRef.current) {
      // 로그인했을 때 최신 메시지 불러오기
      loadMessagesForPersonality(selectedPersonality, true)
    }
  }, [isAuthenticated, user, selectedPersonality, loadMessagesForPersonality])

  useEffect(() => {
    // 메시지가 로드되거나 새 메시지가 추가되면 스크롤을 맨 아래로
    if (!isLoadingMessages) {
      scrollToBottom()
    }
  }, [messages, isTyping, isLoadingMessages])
  
  useEffect(() => {
    // Chat 페이지에서 body에 클래스 추가
    document.body.classList.add('chat-page')
    return () => {
      // 컴포넌트 언마운트 시 클래스 제거
      document.body.classList.remove('chat-page')
    }
  }, [])
 
  const sendMessage = async () => {
    const message = inputValue.trim()
    if (!message) return

    const newMessage = {
      id: Date.now(),
      text: message,
      isUser: true,
      time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    }

    setMessages(prev => {
      const updatedMessages = [...prev, newMessage]
      // 캐시도 업데이트
      messagesCacheRef.current[selectedPersonality] = updatedMessages
      return updatedMessages
    })
    setInputValue('')
    setIsTyping(true)

    try {
      // 벡터 검색으로 유사한 과거 메시지 찾기 (컨텍스트로 활용)
      let contextMessages = []
      if (isAuthenticated && user) {
        try {
          contextMessages = await searchSimilarMessages(user.uid, message, {
            limit: 5, // 더 많은 맥락을 위해 5개로 증가
            minSimilarity: 0.65, // 약간 낮춰서 더 많은 관련 메시지 찾기
            personality: selectedPersonality
          })
        } catch (searchError) {
          console.warn('Error searching similar messages:', searchError)
          // 검색 실패해도 계속 진행
        }
      }

      // 일기 데이터 가져오기 (대화 컨텍스트에 활용)
      // 해당 캐릭터와 관련된 일기만 가져오기
      let recentDiaries = []
      if (isAuthenticated && user) {
        try {
          // 해당 캐릭터의 일기만 가져오기
          const diaries = await getDiaries(user.uid, selectedPersonality)
          // 최근 10개 일기 가져오기 (날짜와 기분, 내용 일부 포함)
          recentDiaries = diaries.slice(0, 10).map(diary => ({
            date: diary.date,
            mood: diary.mood,
            content: diary.content.substring(0, 200) // 일기 내용 일부만 (너무 길면 안 됨)
          }))
        } catch (diaryError) {
          console.warn('Error loading diaries for context:', diaryError)
          // 일기 로드 실패해도 계속 진행
        }
      }

      // 컨텍스트를 포함한 프롬프트 생성
      let enhancedMessage = message
      if (contextMessages.length > 0) {
        const contextText = contextMessages
          .map(m => `${m.isUser ? '사용자' : 'AI'}: ${m.text}`)
          .join('\n')
        enhancedMessage = `과거 대화 맥락:\n${contextText}\n\n현재 질문: ${message}`
      }

      // 최근 대화 내용 수집 (사용자 기억을 위한 맥락 활용)
      // 최근 10개 메시지만 사용하여 대화 흐름에 집중 (너무 많은 맥락은 혼란을 줄 수 있음)
      const recentMessages = messages.slice(-15) // 최근 10개 메시지
      const conversationContext = recentMessages
        .map(m => `${m.isUser ? '사용자' : 'AI'}: ${m.text}`)
        .join('\n')
      
      // 일기 내용을 텍스트로 변환
      let diaryContext = ''
      if (recentDiaries.length > 0) {
        diaryContext = recentDiaries.map(diary => {
          return `날짜: ${diary.date}, 기분: ${diary.mood}, 내용: ${diary.content}${diary.content.length >= 200 ? '...' : ''}`
        }).join('\n')
      }
      
      // 사용자를 기억하는 느낌의 자연스러운 대화를 위한 프롬프트 생성
      let fullContext
      if (conversationContext && recentMessages.length > 2) {
        // 과거 대화 맥락이 있는 경우
        // 주의: 아래 대화 내용은 오직 이 캐릭터(${personalities[selectedPersonality].name})와의 대화만 포함되어 있습니다.
        let contextParts = [`당신은 사용자와 오랫동안 대화를 나눈 친구입니다. 아래는 당신(${personalities[selectedPersonality].name})과 사용자의 최근 대화 내용입니다:\n\n${conversationContext}`]
        
        // 일기 내용이 있으면 추가
        if (diaryContext) {
          contextParts.push(`\n또한 사용자가 작성한 일기 내용도 있습니다:\n\n${diaryContext}`)
        }
        
        contextParts.push(`\n위 대화 내용을 바탕으로 사용자의 현재 메시지에 직접적으로 응답해주세요.

중요 지침:
1. **현재 사용자 메시지에 직접 응답**: "${message}" 이 메시지에 대해 먼저 응답하고, 필요시 이전 대화나 일기 내용을 자연스럽게 연결하세요.
2. **대화의 연속성 유지**: 위 대화 내용의 흐름을 이어가며 자연스럽게 대화하세요. 각 메시지가 독립적이지 않고 이전 대화와 연결되어야 합니다.
3. **일기 언급은 자연스럽게**: 일기 내용을 언급할 때는 대화 맥락에 자연스럽게 맞을 때만 언급하세요. 강제로 일기를 언급하지 마세요.
4. **감정 공감**: 사용자의 감정을 이해하고 공감하며, 따뜻하게 위로해주세요.
5. **간결한 답변**: 1~2문장으로 간결하게 작성하세요.
6. **대화 흐름**: 이전 대화에서 언급된 내용이 있으면 자연스럽게 이어가되, 현재 메시지에 대한 응답이 주가 되어야 합니다.

현재 사용자 메시지: "${message}"`)
        
        fullContext = contextParts.join('')
      } else if (contextMessages.length > 0 || diaryContext) {
        // 벡터 검색 결과나 일기 내용이 있는 경우
        // 주의: 아래 대화 내용은 오직 이 캐릭터(${personalities[selectedPersonality].name})와의 대화만 포함되어 있습니다.
        let contextParts = [`당신은 사용자와 대화를 나눈 친구입니다. 당신은 ${personalities[selectedPersonality].name}입니다.`]
        
        if (contextMessages.length > 0) {
          contextParts.push(`\n아래는 당신(${personalities[selectedPersonality].name})과 사용자의 과거 대화 맥락입니다:\n\n${enhancedMessage}`)
        }
        
        if (diaryContext) {
          contextParts.push(`\n또한 사용자가 작성한 일기 내용도 있습니다:\n\n${diaryContext}`)
        }
        
        contextParts.push(`\n위 맥락을 바탕으로 사용자의 현재 메시지 "${message}"에 직접적으로 응답해주세요.

중요 지침:
1. **현재 메시지에 직접 응답**: 사용자의 현재 메시지를 먼저 이해하고 응답하세요.
2. **대화 연속성**: 이전 대화나 일기 내용을 언급할 때는 현재 대화 맥락에 자연스럽게 맞을 때만 언급하세요.
3. **간결한 답변**: 1~2문장으로 간결하게 작성하세요.
4. **자연스러운 대화**: 각 메시지가 독립적이지 않고 대화의 흐름을 이어가세요.`)
        
        fullContext = contextParts.join('')
      } else {
        // 대화 맥락이 없는 경우
        fullContext = enhancedMessage
      }

      // OpenRouter API 호출 (선택된 성격 사용, 사용자를 기억하는 자연스러운 대화)
      const response = await getAIResponse(fullContext, selectedPersonality)
      const botMessage = {
        id: Date.now() + 1,
        text: response,
        isUser: false,
        time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
      }
      setMessages(prev => {
        const updatedMessages = [...prev, botMessage]
        // 캐시도 업데이트
        messagesCacheRef.current[selectedPersonality] = updatedMessages
        return updatedMessages
      })

      // Firestore에 메시지 저장
      if (isAuthenticated && user) {
        // 사용자 메시지 저장 (임베딩 포함)
        saveChatMessageWithVector(user.uid, {
          text: message,
          isUser: true,
          personality: selectedPersonality,
          timestamp: new Date(),
          includeVector: true
        }).catch(err => console.warn('Failed to save user message:', err))

        // AI 응답 저장 (임베딩 없이)
        saveChatMessageWithVector(user.uid, {
          text: response,
          isUser: false,
          personality: selectedPersonality,
          timestamp: new Date(),
          includeVector: false
        }).catch(err => console.warn('Failed to save bot message:', err))
      }
    } catch (error) {
      console.error('Error getting AI response:', error)
      // 에러 발생 시 간단한 메시지 표시
      const botMessage = {
        id: Date.now() + 1,
        text: '죄송해요, 잠시 연결에 문제가 있었어요. 다시 말씀해주시면 도와드릴게요 💙',
        isUser: false,
        time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
      }
      setMessages(prev => {
        const updatedMessages = [...prev, botMessage]
        // 캐시도 업데이트
        if (messagesCacheRef.current[selectedPersonality]) {
          messagesCacheRef.current[selectedPersonality] = updatedMessages
        }
        return updatedMessages
      })
    } finally {
      setIsTyping(false)
    }
  }

  const quickEmotion = (emotion) => {
    setInputValue(emotion)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      sendMessage()
    }
  }

  const changePersonality = async (personality) => {
    setSelectedPersonality(personality)
    // 메시지는 useEffect에서 자동으로 불러옴
  }

  return (
    <section id="chat" className="instagram-dm-container">
      <div className="instagram-dm-layout">
        {/* 좌측 사이드바 (데스크탑 전용) */}
        <aside className="chat-sidebar">
          <div className="chat-sidebar-header">
            <h5 className="mb-0">대화</h5>
            {/* 캐릭터 선택 (상단 배치) */}
            <div className="sidebar-section sidebar-section-top">
              <div className="sidebar-section-title">
                <i className="bi bi-person-circle me-2"></i>
                <span>캐릭터 선택</span>
              </div>
              <div className="personality-list">
                {Object.entries(personalities).map(([key, info]) => (
                  <button
                    key={key}
                    className={`personality-item ${selectedPersonality === key ? 'active' : ''}`}
                    onClick={() => changePersonality(key)}
                    style={{ borderLeftColor: info.color }}
                  >
                    <div className="personality-icon">{info.icon}</div>
                    <div className="personality-info">
                      <div className="personality-name">{info.name}</div>
                      <div className="personality-desc">{info.description}</div>
                    </div>
                    {selectedPersonality === key && (
                      <i className="bi bi-check-circle-fill check-icon"></i>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="chat-sidebar-content">
          </div>
        </aside>

        {/* 메인 채팅 영역 */}
        <div className="instagram-dm-wrapper">
          {/* 상단 헤더 */}
          <div className="instagram-dm-header">
            <div className="d-flex align-items-center justify-content-between w-100">
              <div className="d-flex align-items-center">
                <div className="instagram-profile-avatar me-3">
                  <span>{personalities[selectedPersonality].icon}</span>
                </div>
                <div>
                  <h6 className="mb-0 fw-bold">{personalities[selectedPersonality].name}</h6>
                  <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                    {personalities[selectedPersonality].description}
                  </small>
                </div>
              </div>
              {/* 모바일용 성격 선택 드롭다운 */}
              <div className="d-flex align-items-center gap-2 mobile-personality-selector">
                <span className="text-muted" style={{ fontSize: '0.875rem' }}>캐릭터 변경</span>
                <div className="dropdown">
                  <button 
                    className="btn btn-sm btn-outline-secondary" 
                    type="button" 
                    data-bs-toggle="dropdown"
                    style={{ borderRadius: '20px' }}
                  >
                    <i className="bi bi-three-dots"></i>
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end">
                    {Object.entries(personalities).map(([key, info]) => (
                      <li key={key}>
                        <button 
                          className={`dropdown-item ${selectedPersonality === key ? 'active' : ''}`}
                          onClick={() => changePersonality(key)}
                        >
                          <span className="me-2">{info.icon}</span>
                          {info.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

        {/* 메시지 영역 */}
        <div className="instagram-dm-messages" id="chatMessages" ref={chatMessagesRef}>
          {isLoadingMessages && messages.length === 0 && (
            <div className="text-center text-muted py-5">
              <div className="spinner-border spinner-border-sm text-primary me-2" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mb-0 d-inline">대화를 불러오는 중...</p>
            </div>
          )}
          {!isLoadingMessages && messages.length === 0 && (
            <div className="text-center text-muted py-5">
              <p className="mb-0">대화를 시작해보세요 💬</p>
            </div>
          )}
          {messages.length > 0 && messages.map((message, index) => {
              const showAvatar = index === 0 || 
                messages[index - 1].isUser !== message.isUser
              
              return (
                <div 
                  key={message.id} 
                  className={`instagram-message ${message.isUser ? 'instagram-message-user' : 'instagram-message-bot'}`}
                >
                  <div className="instagram-message-avatar-placeholder">
                    {!message.isUser && showAvatar ? (
                      <div className="instagram-message-avatar">
                        <span>{personalities[selectedPersonality].icon}</span>
                      </div>
                    ) : !message.isUser ? (
                      <div className="instagram-message-avatar-empty"></div>
                    ) : null}
                  </div>
                  <div className={`instagram-message-bubble ${message.isUser ? 'instagram-bubble-user' : 'instagram-bubble-bot'}`}>
                    <p className="mb-0">{message.text}</p>
                    <small className="instagram-message-time">{message.time}</small>
                  </div>
                  <div className="instagram-message-avatar-placeholder">
                    {message.isUser ? (
                      <div className="instagram-message-avatar-empty"></div>
                    ) : null}
                  </div>
                </div>
              )
            })}
          {isTyping && (
            <div className="instagram-message instagram-message-bot">
              <div className="instagram-message-avatar-placeholder">
                <div className="instagram-message-avatar">
                  <span>{personalities[selectedPersonality].icon}</span>
                </div>
              </div>
              <div className="instagram-message-bubble instagram-bubble-bot">
                <div className="typing-indicator-instagram">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
              <div className="instagram-message-avatar-placeholder"></div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 입력 영역 */}
        <div className="instagram-dm-input-area">
          <div className="instagram-input-wrapper">
            <input 
              type="text" 
              className="instagram-input"
              placeholder="메시지 입력..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              autoComplete="off"
            />
            <button 
              className="instagram-send-btn"
              onClick={sendMessage}
              disabled={!inputValue.trim()}
            >
              <i className="bi bi-send-fill"></i>
            </button>
          </div>
          {/* 빠른 감정 버튼 */}
          <div className="instagram-quick-emotions">
            {['😊', '😢', '😰', '😡', '😴', '🤔'].map((emoji, idx) => (
              <button
                key={idx}
                className="instagram-emoji-btn"
                onClick={() => quickEmotion(emoji)}
                title={['기뻐요', '슬퍼요', '불안해요', '화나요', '피곤해요', '복잡해요'][idx]}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      </div>
      </div>
    </section>
  )
}

