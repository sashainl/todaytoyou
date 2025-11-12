import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  where,
  Timestamp
} from 'firebase/firestore'
import { db } from '../config/firebase'

// ============ 감정 일기 관련 ============

/**
 * 사용자의 모든 일기 조회
 */
export async function getDiaries(userId) {
  try {
    const diariesRef = collection(db, 'users', userId, 'diaries')
    const q = query(diariesRef, orderBy('createdAt', 'desc'))
    const snapshot = await getDocs(q)
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  } catch (error) {
    console.error('Error getting diaries:', error)
    throw error
  }
}

/**
 * 특정 일기 조회
 */
export async function getDiary(userId, diaryId) {
  try {
    const diaryRef = doc(db, 'users', userId, 'diaries', diaryId)
    const diarySnap = await getDoc(diaryRef)
    
    if (!diarySnap.exists()) {
      throw new Error('Diary not found')
    }
    
    return {
      id: diarySnap.id,
      ...diarySnap.data()
    }
  } catch (error) {
    console.error('Error getting diary:', error)
    throw error
  }
}

/**
 * 일기 생성
 */
export async function createDiary(userId, diaryData) {
  try {
    const { date, title, mood, content } = diaryData

    // 유효성 검사
    if (!date || !mood || !content) {
      throw new Error('date, mood, and content are required')
    }

    const validMoods = ['매우 좋음', '좋음', '보통', '안 좋음', '매우 안 좋음']
    if (!validMoods.includes(mood)) {
      throw new Error('Invalid mood value')
    }

    if (content.length > 500) {
      throw new Error('Content exceeds 500 characters')
    }

    const diariesRef = collection(db, 'users', userId, 'diaries')
    const newDiary = {
      date,
      title: title || '',
      mood,
      content,
      createdAt: Timestamp.now()
    }

    const docRef = await addDoc(diariesRef, newDiary)
    return {
      id: docRef.id,
      ...newDiary
    }
  } catch (error) {
    console.error('Error creating diary:', error)
    throw error
  }
}

/**
 * 일기 수정
 */
export async function updateDiary(userId, diaryId, updates) {
  try {
    const diaryRef = doc(db, 'users', userId, 'diaries', diaryId)
    
    // 유효성 검사
    if (updates.mood) {
      const validMoods = ['매우 좋음', '좋음', '보통', '안 좋음', '매우 안 좋음']
      if (!validMoods.includes(updates.mood)) {
        throw new Error('Invalid mood value')
      }
    }

    if (updates.content && updates.content.length > 500) {
      throw new Error('Content exceeds 500 characters')
    }

    await updateDoc(diaryRef, updates)
    
    const updatedSnap = await getDoc(diaryRef)
    return {
      id: updatedSnap.id,
      ...updatedSnap.data()
    }
  } catch (error) {
    console.error('Error updating diary:', error)
    throw error
  }
}

/**
 * 일기 삭제
 */
export async function deleteDiary(userId, diaryId) {
  try {
    const diaryRef = doc(db, 'users', userId, 'diaries', diaryId)
    await deleteDoc(diaryRef)
  } catch (error) {
    console.error('Error deleting diary:', error)
    throw error
  }
}

// ============ 타로 기록 관련 ============

/**
 * 사용자의 모든 타로 기록 조회 (최대 10개)
 * 카드 ID를 실제 카드 정보로 복원
 */
export async function getTarotHistory(userId) {
  try {
    const tarotRef = collection(db, 'users', userId, 'tarotHistory')
    const q = query(tarotRef, orderBy('date', 'desc'), limit(10))
    const snapshot = await getDocs(q)
    
    // tarotCards 데이터 import
    const { tarotCards } = await import('../data/tarotCards.js')
    
    return snapshot.docs.map(doc => {
      const data = doc.data()
      // 저장된 cardId로 실제 카드 정보 복원
      const restoredCards = data.cards.map(savedCard => {
        const fullCard = tarotCards.find(c => c.id === savedCard.cardId)
        if (!fullCard) {
          console.warn(`Card with id ${savedCard.cardId} not found`)
          return null
        }
        return {
          index: savedCard.cardId,
          card: fullCard,
          reversed: savedCard.reversed
        }
      }).filter(Boolean) // null 제거
      
      return {
        id: doc.id,
        ...data,
        cards: restoredCards
      }
    })
  } catch (error) {
    console.error('Error getting tarot history:', error)
    throw error
  }
}

/**
 * 타로 기록 생성
 * 카드 ID만 저장 (카드 전체 정보는 저장하지 않음)
 */
export async function createTarotRecord(userId, tarotData) {
  try {
    const { question, cards, mode, topic } = tarotData

    // 유효성 검사
    if (!question || !cards || !mode || !topic) {
      throw new Error('question, cards, mode, and topic are required')
    }

    if (!Array.isArray(cards) || cards.length !== 3) {
      throw new Error('cards must be an array of 3 items')
    }

    const validModes = ['past-present-future', 'situation-advice-outcome']
    if (!validModes.includes(mode)) {
      throw new Error('Invalid mode value')
    }

    const validTopics = ['love', 'money', 'study', 'career', 'health', 'general']
    if (!validTopics.includes(topic)) {
      throw new Error('Invalid topic value')
    }

    // cards 배열을 간소화 (cardId와 reversed만 저장)
    const simplifiedCards = cards.map(card => ({
      cardId: card.card.id,
      reversed: card.reversed
    }))

    const tarotRef = collection(db, 'users', userId, 'tarotHistory')
    const newRecord = {
      question,
      cards: simplifiedCards,  // 간소화된 카드 정보
      mode,
      topic,
      date: Timestamp.now()
    }

    const docRef = await addDoc(tarotRef, newRecord)

    // 최대 10개 유지 (가장 오래된 것 삭제)
    const allRecords = await getTarotHistory(userId)
    if (allRecords.length > 10) {
      const recordsToDelete = allRecords.slice(10)
      for (const record of recordsToDelete) {
        await deleteTarotRecord(userId, record.id)
      }
    }

    // 반환 시 카드 정보 복원
    const { tarotCards } = await import('../data/tarotCards.js')
    const restoredCards = simplifiedCards.map(savedCard => {
      const fullCard = tarotCards.find(c => c.id === savedCard.cardId)
      return {
        index: savedCard.cardId,
        card: fullCard,
        reversed: savedCard.reversed
      }
    })

    return {
      id: docRef.id,
      question,
      cards: restoredCards,
      mode,
      topic,
      date: newRecord.date
    }
  } catch (error) {
    console.error('Error creating tarot record:', error)
    throw error
  }
}

/**
 * 타로 기록 삭제
 */
export async function deleteTarotRecord(userId, recordId) {
  try {
    const recordRef = doc(db, 'users', userId, 'tarotHistory', recordId)
    await deleteDoc(recordRef)
  } catch (error) {
    console.error('Error deleting tarot record:', error)
    throw error
  }
}

// ============ 통계 관련 ============

/**
 * 통계 데이터 계산
 */
export async function getStatistics(userId, period = 'all') {
  try {
    const diaries = await getDiaries(userId)

    // 기간 필터링
    let filteredDiaries = diaries
    if (period !== 'all') {
      const now = new Date()
      const filterDate = new Date()

      if (period === 'week') {
        filterDate.setDate(now.getDate() - 7)
      } else if (period === 'month') {
        filterDate.setMonth(now.getMonth() - 1)
      }

      filteredDiaries = diaries.filter(diary => {
        const diaryDate = diary.createdAt?.toDate ? diary.createdAt.toDate() : new Date(diary.date)
        return diaryDate >= filterDate
      })
    }

    // 감정 통계
    const moodCount = {}
    filteredDiaries.forEach(diary => {
      moodCount[diary.mood] = (moodCount[diary.mood] || 0) + 1
    })

    const moodStats = Object.entries(moodCount)
      .sort((a, b) => b[1] - a[1])
      .map(([mood, count]) => ({
        mood,
        count,
        percentage: Math.round((count / filteredDiaries.length) * 100)
      }))

    // 가장 많은 감정
    const mostFrequentMood = moodStats.length > 0 ? moodStats[0] : null

    // 평균 감정 점수
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

    const averageScore = filteredDiaries.length > 0
      ? (totalScore / filteredDiaries.length).toFixed(1)
      : 0

    // 최근 7일 추이
    const last7Days = []
    const now = new Date()
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(now.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]

      const dayDiaries = filteredDiaries.filter(d => {
        const diaryDate = d.date || (d.createdAt?.toDate ? d.createdAt.toDate().toISOString().split('T')[0] : '')
        return diaryDate === dateStr
      })

      const avgScore = dayDiaries.length > 0
        ? dayDiaries.reduce((sum, d) => {
            return sum + moodScores[d.mood]
          }, 0) / dayDiaries.length
        : 0

      last7Days.push({
        date: dateStr,
        day: date.toLocaleDateString('ko-KR', { weekday: 'short' }),
        score: avgScore,
        count: dayDiaries.length
      })
    }

    // 감정 인사이트
    const positivePercentage = moodStats
      .filter(s => s.mood === '매우 좋음' || s.mood === '좋음')
      .reduce((sum, s) => sum + s.percentage, 0)

    const neutralPercentage = moodStats
      .find(s => s.mood === '보통')?.percentage || 0

    const negativePercentage = moodStats
      .filter(s => s.mood === '안 좋음' || s.mood === '매우 안 좋음')
      .reduce((sum, s) => sum + s.percentage, 0)

    return {
      period,
      totalCount: filteredDiaries.length,
      moodStats,
      mostFrequentMood,
      averageScore: parseFloat(averageScore),
      weeklyTrend: last7Days,
      insights: {
        positive: Math.round(positivePercentage),
        neutral: Math.round(neutralPercentage),
        negative: Math.round(negativePercentage)
      }
    }
  } catch (error) {
    console.error('Error getting statistics:', error)
    throw error
  }
}

