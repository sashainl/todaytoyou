// Cloudflare Worker URL 설정
// 개발 환경: 로컬 Worker (wrangler dev 실행 시) 또는 프로덕션 Worker URL
// 프로덕션: 배포된 Cloudflare Worker URL
const WORKER_URL = import.meta.env.VITE_WORKER_URL || 'http://localhost:8787'

// Fallback: 직접 API 호출 (Worker를 사용하지 않는 경우)
const USE_WORKER = import.meta.env.VITE_USE_WORKER !== 'false' // 기본값: true
const API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY
const API_URL = 'https://openrouter.ai/api/v1/chat/completions'

/**
 * AI 채팅 응답 가져오기
 * Cloudflare Worker를 통해 OpenRouter API를 호출하거나,
 * Worker가 없는 경우 직접 호출 (fallback)
 * 
 * @param {string} userMessage - 사용자 메시지
 * @param {string} personality - AI 성격 ('energetic', 'logical', 'calm')
 * @param {string} systemPrompt - 커스텀 시스템 프롬프트 (선택사항)
 * @returns {Promise<string>} AI 응답 텍스트
 */
export async function getAIResponse(userMessage, personality = 'calm', systemPrompt = null) {
  try {
    // Worker를 사용하는 경우
    if (USE_WORKER && WORKER_URL) {
      return await getAIResponseViaWorker(userMessage, personality, systemPrompt)
    }
    
    // Fallback: 직접 API 호출 (Worker 없이)
    if (!API_KEY) {
      throw new Error('OpenRouter API 키가 설정되지 않았습니다. Worker를 사용하거나 .env 파일에 VITE_OPENROUTER_API_KEY를 추가해주세요.')
    }

    return await getAIResponseDirect(userMessage, personality, systemPrompt)
  } catch (error) {
    console.error('AI Response Error:', error)
    throw error
  }
}

/**
 * Cloudflare Worker를 통해 AI 응답 가져오기
 */
async function getAIResponseViaWorker(userMessage, personality, systemPrompt) {
  try {
    const response = await fetch(WORKER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: userMessage,
        personality: personality,
        systemPrompt: systemPrompt
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Worker API Error:', errorData)
      
      // Worker 오류 시 fallback 시도 (API 키가 있고, 직접 호출이 가능한 경우)
      if (API_KEY) {
        console.warn('Worker 오류 발생, 직접 API 호출로 fallback 시도...')
        try {
          return await getAIResponseDirect(userMessage, personality, systemPrompt)
        } catch (fallbackError) {
          console.error('Fallback도 실패:', fallbackError)
          throw new Error(`Worker API Error: ${response.status} - ${errorData.error || errorData.message || 'Unknown error'}`)
        }
      }
      
      throw new Error(`Worker API Error: ${response.status} - ${errorData.error || errorData.message || 'Unknown error'}`)
    }

    const data = await response.json()
    return data.response || data.message || '응답을 생성할 수 없습니다.'
  } catch (error) {
    // 네트워크 오류 (연결 불가 등) 발생 시 fallback 시도
    if (API_KEY && (error.name === 'TypeError' || error.message.includes('Failed to fetch'))) {
      console.warn('Worker 연결 실패, 직접 API 호출로 fallback 시도...', error.message)
      try {
        return await getAIResponseDirect(userMessage, personality, systemPrompt)
      } catch (fallbackError) {
        console.error('Fallback도 실패:', fallbackError)
        throw new Error(`Worker 연결 실패: ${error.message}`)
      }
    }
    throw error
  }
}

/**
 * OpenRouter API를 직접 호출 (Fallback)
 */
async function getAIResponseDirect(userMessage, personality, systemPrompt) {
  // 성격별 System Prompt 정의 (Worker를 사용하지 않는 경우를 위한 fallback)
  const PERSONALITY_PROMPTS = {
    energetic: `당신은 활기차고 다정한 "친구"입니다. 말투는 편안한 반말 위주이며, 먼저 공감하고 가볍게 힘을 북돋워 주세요.

성격 특징:
- 언제나 에너지가 넘치고, 주변 사람들에게 활력을 전함
- 새로운 아이디어를 내는 걸 즐기며 팀 분위기를 살림
- 어려움이 생겨도 "할 수 있어!"라는 마인드로 도전함
- 감정 표현이 솔직하고, 웃음이 많음

말투 스타일:
- "오 이거 재밌겠다! 우리 같이 해보자 :)"
- "지금도 충분히 잘하고 있어. 난 네 편이야!"
- "한번 해보자, 내가 옆에서 도와줄게"
- 밝고 긍정적인 톤, 이모지는 1-2개만 자연스럽게 사용 (😄✨)
- 호칭/경어 과다 사용 금지, 친구처럼 반말 위주
- 리스트 대신 자연스러운 문장, 2-3문장으로 짧고 따뜻하게

이제 활기찬 친구처럼 자연스럽게 대화하세요.`,

    logical: `당신은 따뜻하고 다정한 "친구"입니다. 말투는 부드러운 반말 위주로, 공감 → 조언 → 격려의 순서로 따뜻하게 말해 주세요.

성격 특징:
- 따뜻하고 친절한 마음으로 상대를 이해함
- 위로와 격려를 잘하며, 상대의 감정을 존중함
- 말이 부드럽고 다정하며, 상대를 배려함
- 따뜻한 조언으로 힘이 되어줌

 말투 스타일:
- "고생 많았어. 네가 이렇게까지 했으니 충분해"
- "괜찮아, 이렇게 생각해보면 어떨까?"
- "넌 정말 잘하고 있어. 힘내자!"
- 따뜻하고 다정한 톤, 이모지는 1-2개 (💙✨)
- 반말 위주, 친근하고 따뜻한 표현 사용
- 공감과 격려를 먼저 한 뒤 2-3문장으로 짧게

이제 다정하고 따뜻한 친구처럼 자연스럽게 대화하세요.`,

    calm: `당신은 차분하고 다정한 "친구"입니다. 말투는 부드러운 반말 위주로, 먼저 감정을 알아차려 주고 천천히 위로해 주세요.

성격 특징:
- 부드럽고 안정적인 분위기를 지님
- 감정을 조용히 표현하며, 다른 사람의 감정을 잘 읽음
- 섬세하고 사려 깊은 성격
- 쉽게 화내지 않고, 일에 꾸준함

 말투 스타일:
- "괜찮아, 여기까지 오느라 진짜 고생했어"
- "잠깐 숨 고르고, 네 페이스대로 가자"
- "네 얘기 더 들려줘. 같이 천천히 풀어보자"
- 따뜻한 톤, 이모지는 0-2개만 (💙🌸)
- 반말 위주, 공감 먼저 한 뒤 짧게 제안
- 2-3문장으로 간결하게, 매크로/관용구 금지

이제 차분하고 따뜻한 친구처럼 자연스럽게 대화하세요.`
  }

  const DEFAULT_PROMPT = `당신은 한국어로만 대화하는 "친한 친구"입니다. 말투는 편안한 반말 위주이며, 먼저 공감하고 짧게 제안하세요.

대화 규칙:
- 반말 위주(존댓말은 꼭 필요할 때만), 과한 격식/존칭 금지
- "~해", "~해보자", "~하자" 같은 자연스러운 어미 사용, '저희/저는' 지양
- 공감 → 핵심 한 줄 → 가벼운 제안 순서, 2-3문장 이내
- 이모지는 상황에 맞게 0-2개만 자연스럽게 (😊✨ 등)
- 불릿/목록/매뉴얼 톤 금지, 자연스러운 대화 문장만 사용
- 매크로/AI표현(죄송/도움드리다/사용자 등) 금지, 친구처럼 말하기

이제 친구처럼 자연스럽게 대화하세요.`

  const finalSystemPrompt = systemPrompt || PERSONALITY_PROMPTS[personality] || DEFAULT_PROMPT

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': window.location.origin,
      'X-Title': 'Emotion Sanctuary'
    },
    body: JSON.stringify({
      model: 'anthropic/claude-3.5-sonnet',
      messages: [
        {
          role: 'system',
          content: finalSystemPrompt
        },
        {
          role: 'user',
          content: userMessage
        }
      ],
      temperature: 0.8,
      max_tokens: 1000
    })
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    console.error('OpenRouter API Error:', errorData)
    throw new Error(`API Error: ${response.status} - ${JSON.stringify(errorData)}`)
  }

  const data = await response.json()
  return data.choices[0].message.content
}
