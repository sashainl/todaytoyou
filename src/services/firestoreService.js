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
import { getEmbedding, findSimilarVectors } from './embeddingService'

// ============ 감정 일기 관련 ============

/**
 * 사용자의 모든 일기 조회
 */
export async function getDiaries(userId, personality = null) {
  try {
    const diariesRef = collection(db, 'users', userId, 'diaries')
    let q
    
    // 캐릭터별 필터링
    if (personality) {
      q = query(
        diariesRef, 
        where('personality', '==', personality),
        orderBy('createdAt', 'desc')
      )
    } else {
      q = query(diariesRef, orderBy('createdAt', 'desc'))
    }
    
    const snapshot = await getDocs(q)
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  } catch (error) {
    console.error('Error getting diaries:', error)
    // 인덱스 에러인 경우 personality 필터 없이 재시도
    if (error.code === 'failed-precondition' && personality) {
      console.warn('Index error, retrying without personality filter')
      try {
        const diariesRef = collection(db, 'users', userId, 'diaries')
        const q = query(diariesRef, orderBy('createdAt', 'desc'))
        const snapshot = await getDocs(q)
        // 클라이언트 측에서 필터링
        return snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(diary => diary.personality === personality)
      } catch (retryError) {
        console.error('Error retrying getDiaries:', retryError)
        throw retryError
      }
    }
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
 * 일기 생성 (벡터 임베딩 포함)
 */
export async function createDiary(userId, diaryData) {
  try {
    const { date, title, mood, content, aiComfort, personality, includeVector = true } = diaryData

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

    // 캐릭터 정보 저장 (일기 작성 시 선택한 캐릭터)
    if (personality) {
      newDiary.personality = personality
    }

    // AI 위로 메시지 저장 (임베딩 없이)
    if (aiComfort && aiComfort.trim().length > 0) {
      newDiary.aiComfort = aiComfort.trim()
      console.log('AI 위로 메시지 저장:', aiComfort.substring(0, 50) + '...')
    } else {
      console.log('AI 위로 메시지가 없어서 저장하지 않음, aiComfort:', aiComfort)
    }

    // 벡터 임베딩 생성 (옵션) - 일기 내용만 임베딩, AI 위로는 임베딩하지 않음
    if (includeVector) {
      try {
        const embedding = await getEmbedding(content)
        newDiary.embedding = embedding
      } catch (embeddingError) {
        console.warn('Failed to create embedding for diary, continuing without it:', embeddingError)
        // 임베딩 실패해도 일기는 저장
      }
    }

    console.log('일기 저장 데이터:', { ...newDiary, embedding: newDiary.embedding ? '[embedding]' : null })
    const docRef = await addDoc(diariesRef, newDiary)
    console.log('일기 저장 완료, 문서 ID:', docRef.id)
    
    // 저장된 문서 다시 읽어서 확인
    const savedDoc = await getDoc(docRef)
    const savedData = savedDoc.data()
    console.log('저장된 일기 데이터 확인:', { ...savedData, embedding: savedData.embedding ? '[embedding]' : null })
    
    return {
      id: docRef.id,
      ...savedData
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

    // includeVector는 업데이트 객체에서 제거 (메타데이터)
    const { includeVector, ...updateData } = updates
    
    // 임베딩이 직접 전달된 경우 포함
    if (updates.embedding) {
      updateData.embedding = updates.embedding
    }
    
    // aiComfort가 null이면 명시적으로 null로 설정 (필드 삭제)
    if (updates.aiComfort === null) {
      updateData.aiComfort = null
    }

    await updateDoc(diaryRef, updateData)
    
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

// ============ 벡터 검색 관련 ============

/**
 * 채팅 메시지를 벡터와 함께 저장
 */
export async function saveChatMessageWithVector(userId, messageData) {
  try {
    const { text, isUser, personality, timestamp, includeVector = true } = messageData

    if (!text || text.trim().length === 0) {
      throw new Error('Text cannot be empty')
    }

    const messagesRef = collection(db, 'users', userId, 'chatMessages')
    const newMessage = {
      text,
      isUser,
      personality: personality || 'calm',
      timestamp: timestamp || Timestamp.now(),
      createdAt: Timestamp.now()
    }

    // 벡터 임베딩 생성 (옵션)
    if (includeVector) {
      try {
        const embedding = await getEmbedding(text)
        newMessage.embedding = embedding
      } catch (embeddingError) {
        console.warn('Failed to create embedding for message, continuing without it:', embeddingError)
        // 임베딩 실패해도 메시지는 저장
      }
    }

    const docRef = await addDoc(messagesRef, newMessage)
    return {
      id: docRef.id,
      ...newMessage
    }
  } catch (error) {
    console.error('Error saving chat message with vector:', error)
    throw error
  }
}

/**
 * 유사한 메시지 검색 (벡터 유사도 기반)
 */
export async function searchSimilarMessages(userId, queryText, options = {}) {
  try {
    const {
      limit: topK = 5,
      minSimilarity = 0.7,
      personality = null,
      includeVector = true
    } = options

    if (!queryText || queryText.trim().length === 0) {
      return []
    }

    // 쿼리 텍스트의 벡터 임베딩 생성
    let queryEmbedding = null
    if (includeVector) {
      try {
        queryEmbedding = await getEmbedding(queryText)
      } catch (embeddingError) {
        console.warn('Failed to create query embedding:', embeddingError)
        return [] // 임베딩 실패 시 빈 배열 반환
      }
    } else {
      return [] // 벡터 없이는 검색 불가
    }

    // 메시지 가져오기 (성격 필터링 옵션)
    const messagesRef = collection(db, 'users', userId, 'chatMessages')
    let q = query(messagesRef, orderBy('createdAt', 'desc'), limit(100)) // 최근 100개만 검색
    
    if (personality) {
      q = query(messagesRef, where('personality', '==', personality), orderBy('createdAt', 'desc'), limit(100))
    }

    const snapshot = await getDocs(q)
    
    // 벡터가 있는 메시지만 필터링
    const messagesWithVectors = snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .filter(msg => msg.embedding && Array.isArray(msg.embedding) && msg.embedding.length > 0)

    if (messagesWithVectors.length === 0) {
      return []
    }

    // 유사도 계산 및 정렬
    const results = findSimilarVectors(queryEmbedding, messagesWithVectors, topK, minSimilarity)

    return results
  } catch (error) {
    console.error('Error searching similar messages:', error)
    throw error
  }
}

/**
 * 유사한 일기 검색 (벡터 유사도 기반)
 */
export async function searchSimilarDiaries(userId, queryText, options = {}) {
  try {
    const {
      limit: topK = 5,
      minSimilarity = 0.7,
      includeVector = true
    } = options

    if (!queryText || queryText.trim().length === 0) {
      return []
    }

    // 쿼리 텍스트의 벡터 임베딩 생성
    let queryEmbedding = null
    if (includeVector) {
      try {
        queryEmbedding = await getEmbedding(queryText)
      } catch (embeddingError) {
        console.warn('Failed to create query embedding:', embeddingError)
        return []
      }
    } else {
      return []
    }

    // 모든 일기 가져오기
    const diariesRef = collection(db, 'users', userId, 'diaries')
    const q = query(diariesRef, orderBy('createdAt', 'desc'), limit(100))
    const snapshot = await getDocs(q)

    // 벡터가 있는 일기만 필터링
    const diariesWithVectors = snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .filter(diary => diary.embedding && Array.isArray(diary.embedding) && diary.embedding.length > 0)

    if (diariesWithVectors.length === 0) {
      return []
    }

    // 유사도 계산 및 정렬
    const results = findSimilarVectors(queryEmbedding, diariesWithVectors, topK, minSimilarity)

    return results
  } catch (error) {
    console.error('Error searching similar diaries:', error)
    throw error
  }
}

/**
 * 사용자의 모든 채팅 메시지 조회 (벡터 포함)
 */
export async function getChatMessages(userId, personality = null, limitCount = 50) {
  try {
    const messagesRef = collection(db, 'users', userId, 'chatMessages')
    let q
    
    if (personality) {
      // personality 필터가 있으면 복합 쿼리 사용
      // 인덱스가 없을 수 있으므로 에러 처리 추가
      try {
        q = query(messagesRef, where('personality', '==', personality), orderBy('createdAt', 'desc'), limit(limitCount))
      } catch (indexError) {
        // 인덱스 오류 시 personality만 필터링하고 정렬 없이 가져오기
        console.warn('Index error, fetching without orderBy:', indexError)
        q = query(messagesRef, where('personality', '==', personality), limit(limitCount))
      }
    } else {
      q = query(messagesRef, orderBy('createdAt', 'desc'), limit(limitCount))
    }

    const snapshot = await getDocs(q)
    
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    
    console.log(`getChatMessages: Found ${messages.length} messages for personality: ${personality || 'all'}`)
    
    return messages
  } catch (error) {
    console.error('Error getting chat messages:', error)
    // 인덱스 오류인 경우 personality 필터 없이 재시도
    if (error.code === 'failed-precondition' && personality) {
      console.warn('Retrying without personality filter due to index error')
      try {
        const messagesRef = collection(db, 'users', userId, 'chatMessages')
        const q = query(messagesRef, orderBy('createdAt', 'desc'), limit(limitCount * 2))
        const snapshot = await getDocs(q)
        const allMessages = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        // 클라이언트 측에서 personality 필터링
        const filteredMessages = allMessages.filter(msg => msg.personality === personality)
        console.log(`getChatMessages: Filtered ${filteredMessages.length} messages for personality: ${personality}`)
        return filteredMessages
      } catch (retryError) {
        console.error('Retry also failed:', retryError)
        throw error
      }
    }
    throw error
  }
}

