// Cloudflare Worker URL 설정 (임베딩용)
const WORKER_URL = import.meta.env.VITE_WORKER_URL || 'http://localhost:8787'
const USE_WORKER = import.meta.env.VITE_USE_WORKER !== 'false'
const API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY

/**
 * 텍스트를 벡터 임베딩으로 변환
 * OpenRouter API를 통해 임베딩 생성
 */
export async function getEmbedding(text) {
  try {
    if (!text || text.trim().length === 0) {
      throw new Error('Text cannot be empty')
    }

    // 텍스트가 너무 길면 잘라내기 (임베딩 모델 제한 고려)
    const maxLength = 8000
    const truncatedText = text.length > maxLength ? text.substring(0, maxLength) : text

    // Worker를 사용하는 경우
    if (USE_WORKER && WORKER_URL) {
      try {
        const response = await fetch(`${WORKER_URL}/embedding`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: truncatedText
          })
        })

        if (response.ok) {
          const data = await response.json()
          return data.embedding || data.vector
        }
      } catch (workerError) {
        console.warn('Worker embedding failed, trying direct API:', workerError)
      }
    }

    // Fallback: 직접 API 호출
    if (!API_KEY) {
      throw new Error('OpenRouter API 키가 설정되지 않았습니다.')
    }

    const response = await fetch('https://openrouter.ai/api/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Emotion Sanctuary'
      },
      body: JSON.stringify({
        model: 'text-embedding-ada-002', // OpenAI 임베딩 모델
        input: truncatedText
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`Embedding API Error: ${response.status} - ${JSON.stringify(errorData)}`)
    }

    const data = await response.json()
    if (!data.data || !data.data[0] || !data.data[0].embedding) {
      throw new Error('Invalid embedding response format')
    }

    return data.data[0].embedding
  } catch (error) {
    console.error('Error getting embedding:', error)
    throw error
  }
}

/**
 * 벡터 간 코사인 유사도 계산
 * @param {number[]} vecA - 첫 번째 벡터
 * @param {number[]} vecB - 두 번째 벡터
 * @returns {number} 코사인 유사도 (0~1)
 */
export function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || !Array.isArray(vecA) || !Array.isArray(vecB)) {
    throw new Error('Both arguments must be arrays')
  }

  if (vecA.length !== vecB.length) {
    throw new Error(`Vectors must have the same length: ${vecA.length} vs ${vecB.length}`)
  }

  if (vecA.length === 0) {
    return 0
  }

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < vecA.length; i++) {
    const a = vecA[i] || 0
    const b = vecB[i] || 0
    dotProduct += a * b
    normA += a * a
    normB += b * b
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB)
  if (denominator === 0) {
    return 0
  }

  return dotProduct / denominator
}

/**
 * 여러 벡터 중에서 쿼리 벡터와 가장 유사한 벡터들을 찾기
 * @param {number[]} queryVector - 검색할 벡터
 * @param {Array<{id: string, embedding: number[], [key: string]: any}>} vectors - 검색 대상 벡터 배열
 * @param {number} topK - 반환할 상위 개수
 * @param {number} minSimilarity - 최소 유사도 임계값 (0~1)
 * @returns {Array} 유사도가 높은 순으로 정렬된 결과 배열
 */
export function findSimilarVectors(queryVector, vectors, topK = 5, minSimilarity = 0.7) {
  if (!queryVector || !Array.isArray(queryVector)) {
    throw new Error('Query vector must be an array')
  }

  if (!vectors || !Array.isArray(vectors)) {
    return []
  }

  const results = vectors
    .map(item => {
      if (!item.embedding || !Array.isArray(item.embedding)) {
        return null
      }

      try {
        const similarity = cosineSimilarity(queryVector, item.embedding)
        return {
          ...item,
          similarity
        }
      } catch (error) {
        console.warn('Error calculating similarity:', error, item)
        return null
      }
    })
    .filter(item => item !== null && item.similarity >= minSimilarity)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK)

  return results
}

