import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { getDiaries, getStatistics } from '../services/firestoreService'

export default function Statistics() {
  const { user, isAuthenticated } = useAuth()
  const [diaries, setDiaries] = useState([])
  const [selectedPeriod, setSelectedPeriod] = useState('all') // all, week, month
  const [isLoading, setIsLoading] = useState(false)

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
    setIsLoading(true)
    try {
      const userDiaries = await getDiaries(user.uid)
      // Firestore Timestamp를 Date로 변환
      const formattedDiaries = userDiaries.map(diary => ({
        ...diary,
        date: diary.date || (diary.createdAt?.toDate ? diary.createdAt.toDate().toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
        createdAt: diary.createdAt?.toDate ? diary.createdAt.toDate().toISOString() : diary.createdAt
      }))
      setDiaries(formattedDiaries)
    } catch (error) {
      console.error('일기 로드 실패:', error)
    } finally {
      setIsLoading(false)
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

  // 기간별 필터링
  const getFilteredDiaries = () => {
    if (selectedPeriod === 'all') return diaries
    
    const now = new Date()
    const filterDate = new Date()
    
    if (selectedPeriod === 'week') {
      filterDate.setDate(now.getDate() - 7)
    } else if (selectedPeriod === 'month') {
      filterDate.setMonth(now.getMonth() - 1)
    }
    
    return diaries.filter(diary => new Date(diary.date) >= filterDate)
  }

  const filteredDiaries = getFilteredDiaries()

  // 감정 통계
  const getMoodStats = () => {
    if (filteredDiaries.length === 0) return null
    
    const moodCount = {}
    filteredDiaries.forEach(diary => {
      moodCount[diary.mood] = (moodCount[diary.mood] || 0) + 1
    })
    
    return Object.entries(moodCount)
      .sort((a, b) => b[1] - a[1])
      .map(([mood, count]) => ({
        mood,
        count,
        percentage: Math.round((count / filteredDiaries.length) * 100)
      }))
  }

  // 가장 많은 감정
  const getMostFrequentMood = () => {
    const stats = getMoodStats()
    return stats && stats.length > 0 ? stats[0] : null
  }

  // 평균 감정 점수 (1-5점)
  const getAverageMoodScore = () => {
    if (filteredDiaries.length === 0) return 0
    
    const moodScores = {
      '매우 좋음': 5,
      '좋음': 4,
      '보통': 3,
      '안 좋음': 2,
      '매우 안 좋음': 1
    }
    
    const totalScore = filteredDiaries.reduce((sum, diary) => {
      return sum + (moodScores[diary.mood] || 0)
    }, 0)
    
    return (totalScore / filteredDiaries.length).toFixed(1)
  }

  // 일주일 동안의 감정 추이
  const getWeeklyTrend = () => {
    const last7Days = []
    const now = new Date()
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(now.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
      const dayDiaries = diaries.filter(d => d.date === dateStr)
      const avgScore = dayDiaries.length > 0 
        ? dayDiaries.reduce((sum, d) => {
            const scores = { '매우 좋음': 5, '좋음': 4, '보통': 3, '안 좋음': 2, '매우 안 좋음': 1 }
            return sum + scores[d.mood]
          }, 0) / dayDiaries.length
        : 0
      
      last7Days.push({
        date: dateStr,
        day: date.toLocaleDateString('ko-KR', { weekday: 'short' }),
        score: avgScore,
        count: dayDiaries.length
      })
    }
    
    return last7Days
  }

  // 작성 빈도
  const getWritingFrequency = () => {
    const last30Days = []
    const now = new Date()
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date()
      date.setDate(now.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      const count = diaries.filter(d => d.date === dateStr).length
      last30Days.push({ date: dateStr, count })
    }
    
    return last30Days
  }

  const stats = getMoodStats()
  const mostFrequentMood = getMostFrequentMood()
  const avgScore = getAverageMoodScore()
  const weeklyTrend = getWeeklyTrend()

  return (
    <section className="py-5 bg-gradient-light theme-section statistics-section" style={{ paddingTop: '120px' }}>
      <div className="container statistics-container">
        {/* 기간 선택 */}
        <div className="text-center mb-4">
          <div className="btn-group" role="group">
            <button 
              type="button" 
              className={`btn ${selectedPeriod === 'week' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setSelectedPeriod('week')}
            >
              최근 7일
            </button>
            <button 
              type="button" 
              className={`btn ${selectedPeriod === 'month' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setSelectedPeriod('month')}
            >
              최근 30일
            </button>
            <button 
              type="button" 
              className={`btn ${selectedPeriod === 'all' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setSelectedPeriod('all')}
            >
              전체
            </button>
          </div>
        </div>

        {!isAuthenticated ? (
          <div className="text-center py-5">
            <div className="empty-icon mb-3" style={{ fontSize: '4rem', opacity: 0.3 }}>
              <i className="bi bi-lock"></i>
            </div>
            <h4 className="text-muted">로그인이 필요합니다</h4>
            <p className="text-muted">통계를 보려면 로그인해주세요</p>
          </div>
        ) : isLoading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary mb-3" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="text-muted">데이터를 불러오는 중...</p>
          </div>
        ) : filteredDiaries.length === 0 ? (
          <div className="text-center py-5">
            <div className="empty-icon mb-3" style={{ fontSize: '4rem', opacity: 0.3 }}>
              <i className="bi bi-clipboard-data"></i>
            </div>
            <h4 className="text-muted">아직 작성된 일기가 없습니다</h4>
            <p className="text-muted">감정 일기를 작성하면 통계를 확인할 수 있습니다</p>
          </div>
        ) : (
          <>
            {/* 요약 카드 */}
            <div className="row g-4 mb-4">
              <div className="col-md-6 col-lg-3">
                <div className="sidebar-card text-center">
                  <div className="p-4">
                    <i className="bi bi-journal-text" style={{ fontSize: '2.5rem', color: '#667eea' }}></i>
                    <h3 className="mt-3 mb-1">{filteredDiaries.length}개</h3>
                    <p className="text-muted mb-0">작성된 일기</p>
                  </div>
                </div>
              </div>
              
              <div className="col-md-6 col-lg-3">
                <div className="sidebar-card text-center">
                  <div className="p-4">
                    {mostFrequentMood && (
                      <>
                        <div style={{ fontSize: '2.5rem' }}>{moodEmojis[mostFrequentMood.mood]}</div>
                        <h3 className="mt-3 mb-1">{mostFrequentMood.mood}</h3>
                        <p className="text-muted mb-0">가장 많은 기분</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="col-md-6 col-lg-3">
                <div className="sidebar-card text-center">
                  <div className="p-4">
                    <i className="bi bi-speedometer2" style={{ fontSize: '2.5rem', color: '#10b981' }}></i>
                    <h3 className="mt-3 mb-1">{avgScore}점</h3>
                    <p className="text-muted mb-0">평균 감정 점수</p>
                  </div>
                </div>
              </div>
              
              <div className="col-md-6 col-lg-3">
                <div className="sidebar-card text-center">
                  <div className="p-4">
                    <i className="bi bi-calendar-check" style={{ fontSize: '2.5rem', color: '#f59e0b' }}></i>
                    <h3 className="mt-3 mb-1">{Math.round(filteredDiaries.length / (selectedPeriod === 'week' ? 7 : selectedPeriod === 'month' ? 30 : 30))}회</h3>
                    <p className="text-muted mb-0">평균 작성 빈도</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="row g-4">
              {/* 감정 분포 */}
              <div className="col-lg-6">
                <div className="sidebar-card">
                  <div className="sidebar-header">
                    <div className="sidebar-icon">
                      <i className="bi bi-pie-chart"></i>
                    </div>
                    <div>
                      <h5 className="sidebar-title">감정 분포</h5>
                      <small className="sidebar-subtitle">기분별 비율</small>
                    </div>
                  </div>
                  <div className="sidebar-content">
                    {stats && stats.map(({ mood, count, percentage }) => (
                      <div key={mood} className="mb-4">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <div className="d-flex align-items-center">
                            <span style={{ fontSize: '1.5rem', marginRight: '0.5rem' }}>{moodEmojis[mood]}</span>
                            <span className="fw-bold">{mood}</span>
                          </div>
                          <div>
                            <span className="badge" style={{ background: moodColors[mood] }}>
                              {count}회 ({percentage}%)
                            </span>
                          </div>
                        </div>
                        <div className="progress" style={{ height: '10px' }}>
                          <div 
                            className="progress-bar" 
                            style={{ 
                              width: `${percentage}%`, 
                              background: moodColors[mood] 
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 최근 7일 추이 */}
              <div className="col-lg-6">
                <div className="sidebar-card">
                  <div className="sidebar-header">
                    <div className="sidebar-icon">
                      <i className="bi bi-graph-up"></i>
                    </div>
                    <div>
                      <h5 className="sidebar-title">최근 7일 감정 추이</h5>
                      <small className="sidebar-subtitle">날짜별 평균 점수</small>
                    </div>
                  </div>
                  <div className="sidebar-content">
                    <div className="d-flex align-items-end justify-content-between" style={{ height: '250px', gap: '8px' }}>
                      {weeklyTrend.map((day, index) => (
                        <div key={index} className="text-center" style={{ flex: 1 }}>
                          <div 
                            className="rounded-top" 
                            style={{ 
                              height: `${day.score * 20}%`, 
                              background: day.score >= 4 ? '#10b981' : day.score >= 3 ? '#3b82f6' : day.score >= 2 ? '#f59e0b' : '#ef4444',
                              minHeight: day.count > 0 ? '20px' : '2px',
                              opacity: day.count > 0 ? 1 : 0.2,
                              transition: 'all 0.3s'
                            }}
                            title={`${day.count}개 일기, 평균 ${day.score.toFixed(1)}점`}
                          ></div>
                          <small className="d-block mt-2 text-muted" style={{ fontSize: '0.75rem' }}>
                            {day.day}
                          </small>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 text-center">
                      <small className="text-muted">
                        <i className="bi bi-info-circle me-1"></i>
                        막대 위에 마우스를 올려보세요
                      </small>
                    </div>
                  </div>
                </div>
              </div>

              {/* 감정 인사이트 */}
              <div className="col-12">
                <div className="sidebar-card">
                  <div className="sidebar-header">
                    <div className="sidebar-icon">
                      <i className="bi bi-lightbulb"></i>
                    </div>
                    <div>
                      <h5 className="sidebar-title">감정 인사이트</h5>
                      <small className="sidebar-subtitle">AI 분석 결과</small>
                    </div>
                  </div>
                  <div className="sidebar-content">
                    <div className="row g-3">
                      <div className="col-md-4">
                        <div className="p-3 rounded" style={{ background: 'var(--bg-secondary)' }}>
                          <div className="d-flex align-items-center mb-2">
                            <i className="bi bi-emoji-smile me-2" style={{ color: '#10b981', fontSize: '1.5rem' }}></i>
                            <strong>긍정 비율</strong>
                          </div>
                          <p className="mb-0">
                            {stats ? Math.round(
                              stats.filter(s => s.mood === '매우 좋음' || s.mood === '좋음')
                                .reduce((sum, s) => sum + s.percentage, 0)
                            ) : 0}%
                          </p>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="p-3 rounded" style={{ background: 'var(--bg-secondary)' }}>
                          <div className="d-flex align-items-center mb-2">
                            <i className="bi bi-emoji-neutral me-2" style={{ color: '#6b7280', fontSize: '1.5rem' }}></i>
                            <strong>중립 비율</strong>
                          </div>
                          <p className="mb-0">
                            {stats ? stats.find(s => s.mood === '보통')?.percentage || 0 : 0}%
                          </p>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="p-3 rounded" style={{ background: 'var(--bg-secondary)' }}>
                          <div className="d-flex align-items-center mb-2">
                            <i className="bi bi-emoji-frown me-2" style={{ color: '#ef4444', fontSize: '1.5rem' }}></i>
                            <strong>부정 비율</strong>
                          </div>
                          <p className="mb-0">
                            {stats ? Math.round(
                              stats.filter(s => s.mood === '안 좋음' || s.mood === '매우 안 좋음')
                                .reduce((sum, s) => sum + s.percentage, 0)
                            ) : 0}%
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 p-3 rounded" style={{ background: '#667eea15', borderLeft: '4px solid #667eea' }}>
                      <p className="mb-0">
                        <i className="bi bi-stars me-2" style={{ color: '#667eea' }}></i>
                        {avgScore >= 4 
                          ? '전반적으로 긍정적인 감정 상태를 유지하고 있어요! 😊' 
                          : avgScore >= 3 
                          ? '안정적인 감정 상태를 보이고 있어요. 계속 기록해보세요! 💙'
                          : '힘든 시기를 보내고 있는 것 같아요. 주변에 도움을 요청하는 것도 좋은 방법이에요. 🫂'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  )
}

