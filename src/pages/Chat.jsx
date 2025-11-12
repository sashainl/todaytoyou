import { useState, useRef, useEffect } from 'react'
import { getAIResponse } from '../services/openRouterService'
import { useLocalStorage } from '../hooks/useLocalStorage'

export default function Chat() {
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [selectedPersonality, setSelectedPersonality] = useLocalStorage('chatPersonality', 'calm')
  const messagesEndRef = useRef(null)
  const chatMessagesRef = useRef(null)

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
      initialMessage: '안녕! 무슨 일 있어? 편하게 이야기해봐 💙'
    },
    calm: {
      name: '차분한 친구',
      icon: '🟣',
      description: '부드럽고 따뜻한 공감',
      color: '#8b5cf6',
      initialMessage: '괜찮아, 여기 앉아서 천천히 얘기하자 💙'
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

  // 컴포넌트 마운트 시 또는 성격 변경 시 초기 인사 메시지 생성
  useEffect(() => {
    const initialMessage = personalities[selectedPersonality].initialMessage
    const botMessage = {
      id: Date.now(),
      text: initialMessage,
      isUser: false,
      time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    }
    setMessages([botMessage])
  }, [selectedPersonality])

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])
  
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

    setMessages(prev => [...prev, newMessage])
    setInputValue('')
    setIsTyping(true)

    try {
      // OpenRouter API 호출 (선택된 성격 사용)
      const response = await getAIResponse(message, selectedPersonality)
      const botMessage = {
        id: Date.now() + 1,
        text: response,
        isUser: false,
        time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
      }
      setMessages(prev => [...prev, botMessage])
    } catch (error) {
      console.error('Error getting AI response:', error)
      // 에러 발생 시 간단한 메시지 표시
      const botMessage = {
        id: Date.now() + 1,
        text: '죄송해요, 잠시 연결에 문제가 있었어요. 다시 말씀해주시면 도와드릴게요 💙',
        isUser: false,
        time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
      }
      setMessages(prev => [...prev, botMessage])
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

  const changePersonality = (personality) => {
    setSelectedPersonality(personality)
    setMessages([]) // 대화 초기화
  }

  return (
    <section id="chat" className="instagram-dm-container">
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
            {/* 성격 선택 드롭다운 */}
            <div className="d-flex align-items-center gap-2">
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
          {messages.length === 0 && (
            <div className="text-center text-muted py-5">
              <p className="mb-0">대화를 시작해보세요 💬</p>
            </div>
          )}
          {messages.map((message, index) => {
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
    </section>
  )
}

