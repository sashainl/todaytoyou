import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { tarotCards, topicInfo } from '../data/tarotCards'
import { getTarotHistory, createTarotRecord, deleteTarotRecord } from '../services/firestoreService'
import { getAIResponse } from '../services/openRouterService'

export default function Tarot() {
  const { user, isAuthenticated } = useAuth()
  const [history, setHistory] = useState([])
  const [shuffledDeck, setShuffledDeck] = useState([])
  const [selectedCards, setSelectedCards] = useState([])
  const [spreadMode, setSpreadMode] = useState('past-present-future')
  const [currentTopic, setCurrentTopic] = useState('love')
  const [question, setQuestion] = useState('')
  const [showResult, setShowResult] = useState(false)
  const [aiInterpretation, setAiInterpretation] = useState('')
  const [isLoadingAI, setIsLoadingAI] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)

  // Firestore에서 타로 기록 로드
  useEffect(() => {
    if (isAuthenticated && user) {
      loadHistory()
    } else {
      setHistory([])
    }
  }, [isAuthenticated, user])

  const loadHistory = async () => {
    if (!user) return
    setIsLoadingHistory(true)
    try {
      const userHistory = await getTarotHistory(user.uid)
      // Firestore Timestamp를 Date로 변환
      const formattedHistory = userHistory.map(record => ({
        ...record,
        date: record.date?.toDate ? record.date.toDate().toISOString() : record.date || new Date().toISOString()
      }))
      setHistory(formattedHistory)
    } catch (error) {
      console.error('타로 기록 로드 실패:', error)
    } finally {
      setIsLoadingHistory(false)
    }
  }

  useEffect(() => {
    shuffleDeck()
  }, [])

  const shuffleDeck = () => {
    const shuffled = [...tarotCards]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    setShuffledDeck(shuffled)
    setSelectedCards([])
  }

  const selectCard = (index) => {
    if (selectedCards.length >= 3) {
      alert('이미 3장의 카드를 선택하셨습니다.')
      return
    }

    const card = shuffledDeck[index]
    const isReversed = Math.random() > 0.5

    const newSelectedCards = [...selectedCards, { index, card, reversed: isReversed }]
    setSelectedCards(newSelectedCards)

    if (newSelectedCards.length === 3) {
      setTimeout(() => {
        setShowResult(true)
        saveHistory(newSelectedCards)
        getAIInterpretation(newSelectedCards)
      }, 500)
    }
  }

  const getAIInterpretation = async (cards) => {
    setIsLoadingAI(true)
    setAiInterpretation('')
    
    try {
      const spreadLabels = spreadMode === 'past-present-future' ? ['과거', '현재', '미래'] : ['상황', '조언', '결과']
      const topicName = topicInfo[currentTopic].name
      const userQuestion = question || topicInfo[currentTopic].defaultQuestion
      
      const cardsDescription = cards.map((sc, idx) => {
        const orientation = sc.reversed ? '역방향' : '정방향'
        const interpretation = sc.reversed ? sc.card.reversed : sc.card.upright
        return `- ${spreadLabels[idx]}: ${sc.card.name} (${orientation})
  키워드: ${sc.card.keywords}
  의미: ${interpretation}`
      }).join('\n')

      const prompt = `당신은 전문 타로 리더입니다.
질문자의 상황과 뽑은 카드를 기반으로, 심리적 통찰과 구체적인 조언을 제공합니다.

[입력 데이터]
- 질문자 질문: "${userQuestion}" (주제: ${topicName})
- 스프레드 방식: ${spreadLabels.join(' / ')}
- 뽑은 카드:
${cardsDescription}

[출력 형식]
1. 🌕 카드별 기본 의미 요약 (정방향/역방향 구분)
2. 💬 질문자의 상황과 연결한 해석
3. 💡 앞으로의 방향 또는 조언

[톤 스타일]
- 따뜻하고 직관적인 어조
- 점술가가 아닌 인생 코치처럼 이야기
- 불안감을 유발하는 단어 사용 금지

위 형식에 맞춰 400자 내외로 해석해주세요.`

      const response = await getAIResponse(prompt)
      setAiInterpretation(response)
    } catch (error) {
      console.error('AI 해석 실패:', error)
      setAiInterpretation('AI 해석을 불러오는데 실패했습니다. 각 카드의 개별 메시지를 참고해주세요.')
    } finally {
      setIsLoadingAI(false)
    }
  }

  const saveHistory = async (cards) => {
    if (!isAuthenticated || !user) {
      console.warn('로그인이 필요합니다.')
      return
    }

    const q = question || topicInfo[currentTopic].defaultQuestion
    
    try {
      const newRecord = await createTarotRecord(user.uid, {
        question: q,
        cards: cards,
        mode: spreadMode,
        topic: currentTopic
      })
      
      // 로컬 상태 업데이트
      const formattedRecord = {
        ...newRecord,
        date: newRecord.date?.toDate ? newRecord.date.toDate().toISOString() : new Date().toISOString()
      }
      setHistory([formattedRecord, ...history.slice(0, 9)])
    } catch (error) {
      console.error('타로 기록 저장 실패:', error)
    }
  }

  const resetTarot = () => {
    setShowResult(false)
    setSelectedCards([])
    setQuestion('')
    setAiInterpretation('')
    setIsLoadingAI(false)
    shuffleDeck()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const changeTopic = (topic) => {
    setCurrentTopic(topic)
  }

  const changeSpreadMode = (mode) => {
    setSpreadMode(mode)
  }

  const showHistoryDetail = (item) => {
    const date = new Date(item.date)
    const dateStr = date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })

    const modeText = item.mode === 'past-present-future' ? '과거 / 현재 / 미래' : '상황 / 조언 / 결과'
    const spreadLabels = item.mode === 'past-present-future' ? ['과거', '현재', '미래'] : ['상황', '조언', '결과']
    const topicIcon = item.topic && topicInfo[item.topic] ? topicInfo[item.topic].icon : '🌟'
    const topicName = item.topic && topicInfo[item.topic] ? topicInfo[item.topic].name : '종합운'

    const cardsHTML = item.cards.map((selectedCard, index) => {
      const interpretation = selectedCard.reversed ? selectedCard.card.reversed : selectedCard.card.upright

      return `
        <div class="col-md-4 mb-3">
          <div class="text-center">
            <div class="card-position-label">${spreadLabels[index]}</div>
            <div style="font-size: 3rem; margin: 0.5rem 0;">${selectedCard.card.icon}</div>
            <h6 class="fw-bold">${selectedCard.card.name}</h6>
            ${selectedCard.reversed ? '<span class="badge bg-secondary mb-2">역방향</span>' : '<span class="badge bg-primary mb-2">정방향</span>'}
            <p class="small mt-2">${interpretation}</p>
          </div>
        </div>
      `
    }).join('')

    const modalHTML = `
      <div class="modal fade" id="historyModal" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered modal-xl">
          <div class="modal-content">
            <div class="modal-header" style="background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); color: white;">
              <h5 class="modal-title">
                <i class="bi bi-stars me-2"></i>${topicIcon} ${topicName} - ${modeText}
              </h5>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <div class="text-center mb-4">
                <span class="badge bg-secondary">
                  <i class="bi bi-calendar3 me-1"></i>${dateStr}
                </span>
              </div>

              <div class="mb-4">
                <h6 class="fw-bold text-muted mb-2">질문</h6>
                <p class="lead">${item.question}</p>
              </div>

              <hr>

              <div class="row">
                ${cardsHTML}
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-danger" onclick="window.deleteHistory(${item.id})">
                <i class="bi bi-trash me-2"></i>삭제
              </button>
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">닫기</button>
            </div>
          </div>
        </div>
      </div>
    `

    const existingModal = document.getElementById('historyModal')
    if (existingModal) {
      existingModal.remove()
    }

    document.body.insertAdjacentHTML('beforeend', modalHTML)
    const modal = new window.bootstrap.Modal(document.getElementById('historyModal'))
    modal.show()
  }

  const deleteHistory = async (id) => {
    if (!window.confirm('이 기록을 삭제하시겠습니까?')) {
      return
    }

    if (!isAuthenticated || !user) {
      console.warn('로그인이 필요합니다.')
      return
    }

    try {
      await deleteTarotRecord(user.uid, id)
      setHistory(history.filter(h => h.id !== id))
      const modal = window.bootstrap.Modal.getInstance(document.getElementById('historyModal'))
      if (modal) modal.hide()
    } catch (error) {
      console.error('타로 기록 삭제 실패:', error)
    }
  }

  useEffect(() => {
    window.deleteHistory = deleteHistory
    return () => {
      delete window.deleteHistory
    }
  })

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const spreadLabels = spreadMode === 'past-present-future' ? ['과거', '현재', '미래'] : ['상황', '조언', '결과']

  return (
    <section id="tarot" className="py-5 bg-gradient-light theme-section tarot-section" style={{ paddingTop: '120px' }}>
      <div className="container tarot-container">
        {!showResult ? (
          <div className="row justify-content-center" id="cardSelectionSection">
            <div className="col-12 col-xl-10">
              <div className="diary-form-card">
                <div className="card-header-custom" style={{ background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)' }}>
                  <div className="d-flex align-items-center justify-content-center flex-wrap">
                    <div className="form-icon-wrapper me-3">
                      <i className="bi bi-magic"></i>
                    </div>
                    <div className="text-center">
                      <h4 className="mb-0 fw-bold">카드 3장을 선택하세요</h4>
                      <small className="text-muted opacity-75">마음을 가다듬고 직관을 믿으세요</small>
                    </div>
                  </div>
                </div>

                <div className="p-4 p-md-5">
                  <div className="mb-4 text-center">
                    <label className="form-label-custom mb-3">
                      <i className="bi bi-star-fill me-2"></i>
                      어떤 주제가 궁금하신가요?
                    </label>
                    <div className="d-flex gap-2 justify-content-center flex-wrap">
                      {Object.entries(topicInfo).map(([key, info]) => (
                        <button 
                          key={key}
                          className={`btn btn-outline-${key === 'love' ? 'danger' : key === 'money' ? 'success' : key === 'study' ? 'primary' : key === 'career' ? 'warning' : key === 'health' ? 'info' : 'secondary'} topic-btn ${currentTopic === key ? 'active' : ''}`}
                          onClick={() => changeTopic(key)}
                        >
                          {info.icon} {info.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mb-4 text-center">
                    <label className="form-label-custom mb-3">
                      <i className="bi bi-compass me-2"></i>
                      어떤 방식으로 알아보시겠어요?
                    </label>
                    <div className="d-flex gap-2 justify-content-center flex-wrap">
                      <button 
                        className={`btn btn-outline-primary spread-mode-btn ${spreadMode === 'past-present-future' ? 'active' : ''}`}
                        onClick={() => changeSpreadMode('past-present-future')}
                      >
                        ⏳ 과거 / 현재 / 미래
                      </button>
                      <button 
                        className={`btn btn-outline-secondary spread-mode-btn ${spreadMode === 'situation-advice-outcome' ? 'active' : ''}`}
                        onClick={() => changeSpreadMode('situation-advice-outcome')}
                      >
                        🎯 상황 / 조언 / 결과
                      </button>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="form-label-custom mb-3">
                      <i className="bi bi-question-circle me-2"></i>
                      궁금한 것이 있나요?
                    </label>
                    <input 
                      type="text" 
                      className="form-control form-control-custom text-center"
                      placeholder={topicInfo[currentTopic].placeholder}
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      style={{ fontSize: '1.1rem', padding: '1.25rem' }}
                    />
                    <small className="text-muted d-block mt-2">
                      <i className="bi bi-lightbulb me-1"></i>
                      <span>{topicInfo[currentTopic].hint}</span>
                    </small>
                  </div>

                  {/* 선택된 카드 스프레드 (항상 표시) */}
                  <div className="selected-cards-spread-container mb-3">
                    <div className="selected-cards-spread-mobile">
                      <div className="spread-slots-mobile">
                        {[0, 1, 2].map((slotIndex) => {
                          const selectedCard = selectedCards[slotIndex]
                          const spreadLabels = spreadMode === 'past-present-future' ? ['과거', '현재', '미래'] : ['상황', '조언', '결과']
                          return (
                            <div key={slotIndex} className="spread-slot-mobile">
                              {selectedCard ? (
                                <div className={`spread-card-mobile ${selectedCard.reversed ? 'reversed' : ''}`}>
                                  <div className="spread-card-icon-mobile">{selectedCard.card.icon}</div>
                                  <div className="spread-card-name-mobile">{selectedCard.card.name}</div>
                                  {selectedCard.reversed && (
                                    <span className="spread-card-badge-mobile">역</span>
                                  )}
                                </div>
                              ) : (
                                <div className="spread-slot-empty-mobile">
                                  <div className="slot-placeholder-mobile">
                                    <div className="slot-label-mobile">{spreadLabels[slotIndex]}</div>
                                    <i className="bi bi-plus-circle"></i>
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="text-center mb-1">
                    <button className="btn btn-outline-primary" onClick={shuffleDeck}>
                      <i className="bi bi-shuffle me-2"></i>
                      카드 다시 섞기
                    </button>
                  </div>

                  <div className="tarot-deck-container">
                    {/* 데스크톱용 그리드 덱 */}
                    <div className="tarot-deck tarot-deck-desktop">
                      {shuffledDeck.map((card, index) => (
                        <div 
                          key={index}
                          className={`tarot-card ${selectedCards.some(sc => sc.index === index) ? 'selected' : ''}`}
                          onClick={() => !selectedCards.some(sc => sc.index === index) && selectCard(index)}
                        >
                          <div className="card-back-pattern">
                            <i className="bi bi-stars"></i>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* 모바일용 부채꼴 덱 */}
                    <div className="tarot-deck tarot-deck-mobile">
                      {shuffledDeck.slice(0, 22).map((card, index) => {
                        const isSelected = selectedCards.some(sc => sc.index === index)
                        const totalCards = Math.min(shuffledDeck.length, 22)
                        const angle = 5 // 모든 카드에 동일한 약간의 기울기
                        const yOffset = 0 // 증가치 없음
                        
                        return (
                          <div 
                            key={index}
                            className={`tarot-card tarot-card-mobile ${isSelected ? 'selected' : ''}`}
                            data-card-index={index}
                            style={{
                              transform: `rotate(${angle}deg)`,
                              transformOrigin: 'left bottom',
                              zIndex: isSelected ? 1 : index + 1,
                              '--card-angle': `${angle}deg`
                            }}
                            onClick={() => !isSelected && selectCard(index)}
                          >
                            <div className="card-back-pattern">
                              <i className="bi bi-stars"></i>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div className="mt-4 text-center">
                    <p className="text-muted">
                      <i className="bi bi-info-circle me-2"></i>
                      마음이 이끄는 대로 카드 3장을 선택해주세요 ({selectedCards.length}/3)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="row justify-content-center" id="cardResultSection">
            <div className="col-12 col-xl-10">
              <div className="diary-form-card">
                <div className="card-header-custom" style={{ background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)' }}>
                  <div className="text-center">
                    <h4 className="mb-0 fw-bold">당신의 타로 리딩 결과</h4>
                    <small className="text-muted opacity-75">
                      {topicInfo[currentTopic].icon} {topicInfo[currentTopic].name}: {question || topicInfo[currentTopic].defaultQuestion}
                    </small>
                    <div className="mt-2">
                      <span className="badge bg-light text-dark">
                        {spreadMode === 'past-present-future' ? '과거 / 현재 / 미래' : '상황 / 조언 / 결과'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 p-md-5">
                  <div className="selected-cards-result-container">
                    {selectedCards.map((selectedCard, index) => {
                      const interpretation = selectedCard.reversed ? selectedCard.card.reversed : selectedCard.card.upright

                      return (
                        <div key={index} className="selected-card-result-item">
                          <div className="selected-card-item">
                            <div className="card-position-label">{spreadLabels[index]}</div>
                            <div className={`tarot-card-display ${selectedCard.reversed ? 'reversed' : ''}`}>
                              <div className="card-content-wrapper">
                                <div className="card-icon-large">{selectedCard.card.icon}</div>
                                <h5 className="card-name-result">{selectedCard.card.name}</h5>
                                <p className="card-keywords">{selectedCard.card.keywords}</p>
                                {selectedCard.reversed ? (
                                  <span className="badge bg-secondary mb-2">역방향</span>
                                ) : (
                                  <span className="badge bg-primary mb-2">정방향</span>
                                )}
                              </div>
                            </div>
                            <div className="card-interpretation-box">
                              <p>{interpretation}</p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <div className="card-interpretation mt-5">
                    <h5 className="fw-bold mb-3 text-center">
                      <i className="bi bi-stars me-2" style={{ color: '#ec4899' }}></i>
                      AI 종합 해석
                    </h5>
                    <div className="interpretation-section">
                      {isLoadingAI ? (
                        <div className="text-center py-4">
                          <div className="spinner-border text-primary mb-3" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                          <p className="text-muted">AI가 카드를 해석하고 있습니다...</p>
                        </div>
                      ) : aiInterpretation ? (
                        <div 
                          className="p-4 rounded" 
                          style={{ 
                            background: 'linear-gradient(135deg, #ec489910 0%, #8b5cf610 100%)',
                            borderLeft: '4px solid #ec4899'
                          }}
                        >
                          <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8', fontSize: '1.05rem' }}>
                            {aiInterpretation}
                          </p>
                        </div>
                      ) : (
                        <p className="lead text-center text-muted">
                          카드 해석을 준비중입니다...
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 text-center">
                    <button 
                      className="btn btn-save-diary" 
                      onClick={resetTarot}
                      style={{ background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)' }}
                    >
                      <i className="bi bi-arrow-clockwise me-2"></i>
                      <span>다시 뽑기</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="row justify-content-center mt-4 mb-2">
          <div className="col-12 col-xl-10">
            <div className="sidebar-card">
              <div className="sidebar-header">
                <div className="sidebar-icon" style={{ background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)' }}>
                  <i className="bi bi-clock-history"></i>
                </div>
                <div>
                  <h5 className="sidebar-title">최근 뽑은 카드</h5>
                  <small className="sidebar-subtitle">지난 타로 기록</small>
                </div>
              </div>
              <div className="sidebar-content">
                {!isAuthenticated ? (
                  <div className="empty-state">
                    <div className="empty-icon">
                      <i className="bi bi-lock"></i>
                    </div>
                    <p className="empty-text">로그인이 필요합니다</p>
                    <small className="empty-subtext">타로 기록을 저장하려면 로그인해주세요</small>
                  </div>
                ) : isLoadingHistory ? (
                  <div className="text-center py-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : history.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">
                      <i className="bi bi-inbox"></i>
                    </div>
                    <p className="empty-text">아직 뽑은 카드가 없습니다</p>
                    <small className="empty-subtext">첫 번째 카드를 선택해보세요</small>
                  </div>
                ) : (
                  history.slice(0, 5).map(item => {
                    const modeText = item.mode === 'past-present-future' ? '과거/현재/미래' : '상황/조언/결과'
                    const cardIcons = item.cards.map(c => c.card.icon).join(' ')
                    const topicIcon = item.topic && topicInfo[item.topic] ? topicInfo[item.topic].icon : '🌟'
                    const topicName = item.topic && topicInfo[item.topic] ? topicInfo[item.topic].name : '종합운'

                    return (
                      <div 
                        key={item.id}
                        className="diary-list-item" 
                        onClick={() => showHistoryDetail(item)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div 
                          className="diary-item-mood-indicator" 
                          style={{ 
                            background: 'linear-gradient(135deg, #ec489920 0%, #8b5cf620 100%)', 
                            borderLeftColor: '#ec4899' 
                          }}
                        >
                          <span className="mood-emoji-small" style={{ fontSize: '0.8rem' }}>{cardIcons}</span>
                        </div>
                        <div className="diary-item-content">
                          <h6 className="diary-item-title">{topicIcon} {topicName} - {modeText}</h6>
                          <p className="diary-item-date">
                            <i className="bi bi-calendar3 me-1"></i>{formatDate(item.date)}
                          </p>
                          <p className="diary-item-preview">{item.question}</p>
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
    </section>
  )
}

