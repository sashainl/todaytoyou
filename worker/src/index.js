/**
 * Cloudflare Worker for Emotion Sanctuary
 * OpenRouter API 프록시를 통한 API 키 보안
 */

// CORS 헤더 설정
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

// 성격별 System Prompt 정의 (프론트엔드와 동일)
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

export default {
  async fetch(request, env) {
    // OPTIONS 요청 처리 (CORS preflight)
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders,
      })
    }

    const url = new URL(request.url)
    
    // 임베딩 엔드포인트 처리
    if (url.pathname === '/embedding' && request.method === 'POST') {
      return handleEmbedding(request, env)
    }

    // POST 요청만 허용
    if (request.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    try {
      // 요청 본문 파싱
      const requestData = await request.json()
      const { message, personality = 'calm', systemPrompt } = requestData

      // 메시지 검증
      if (!message || typeof message !== 'string') {
        return new Response(
          JSON.stringify({ error: 'Message is required' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      // API 키 확인
      const apiKey = env.OPENROUTER_API_KEY
      if (!apiKey) {
        console.error('OPENROUTER_API_KEY is not set')
        return new Response(
          JSON.stringify({ error: 'API key not configured' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      // System Prompt 결정 (요청에서 제공되거나 성격별 프롬프트 사용)
      const finalSystemPrompt = systemPrompt || PERSONALITY_PROMPTS[personality] || DEFAULT_PROMPT

      // OpenRouter API 호출
      const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': request.headers.get('Origin') || 'https://emotion-sanctuary.com',
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
              content: message
            }
          ],
          temperature: 0.8,
          max_tokens: 1000
        })
      })

      // OpenRouter 응답 처리
      if (!openRouterResponse.ok) {
        const errorData = await openRouterResponse.json().catch(() => ({}))
        console.error('OpenRouter API Error:', errorData)
        
        return new Response(
          JSON.stringify({
            error: 'OpenRouter API error',
            details: errorData
          }),
          {
            status: openRouterResponse.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      const data = await openRouterResponse.json()
      
      // 응답 검증
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        console.error('Invalid OpenRouter response:', data)
        return new Response(
          JSON.stringify({
            error: 'Invalid response from OpenRouter API',
            message: '응답을 생성할 수 없습니다.'
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      const aiResponse = data.choices[0].message.content || '응답을 생성할 수 없습니다.'

      // 성공 응답
      return new Response(
        JSON.stringify({ response: aiResponse }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )

    } catch (error) {
      console.error('Worker error:', error)
      return new Response(
        JSON.stringify({
          error: 'Internal server error',
          message: error.message
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }
  },
}

/**
 * 임베딩 요청 처리
 */
async function handleEmbedding(request, env) {
  try {
    const requestData = await request.json()
    const { text } = requestData

    if (!text || typeof text !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Text is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // API 키 확인
    const apiKey = env.OPENROUTER_API_KEY
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // 텍스트가 너무 길면 잘라내기
    const maxLength = 8000
    const truncatedText = text.length > maxLength ? text.substring(0, maxLength) : text

    // OpenRouter API를 통해 임베딩 생성
    const openRouterResponse = await fetch('https://openrouter.ai/api/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': request.headers.get('Origin') || 'https://emotion-sanctuary.com',
        'X-Title': 'Emotion Sanctuary'
      },
      body: JSON.stringify({
        model: 'text-embedding-ada-002',
        input: truncatedText
      })
    })

    if (!openRouterResponse.ok) {
      const errorData = await openRouterResponse.json().catch(() => ({}))
      return new Response(
        JSON.stringify({
          error: 'Embedding API error',
          details: errorData
        }),
        {
          status: openRouterResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const data = await openRouterResponse.json()
    
    if (!data.data || !data.data[0] || !data.data[0].embedding) {
      return new Response(
        JSON.stringify({
          error: 'Invalid embedding response'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    return new Response(
      JSON.stringify({ 
        embedding: data.data[0].embedding,
        vector: data.data[0].embedding // 호환성을 위해 둘 다 제공
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Embedding error:', error)
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
}

