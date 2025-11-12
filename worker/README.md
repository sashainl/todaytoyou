# Emotion Sanctuary Cloudflare Worker

OpenRouter API 프록시를 위한 Cloudflare Worker입니다. API 키를 프론트엔드에 노출하지 않고 안전하게 API를 호출할 수 있습니다.

## 기능

- OpenRouter API 프록시
- API 키 보안 (프론트엔드에 노출되지 않음)
- CORS 지원
- 성격별 AI 프롬프트 처리
- 에러 처리 및 로깅

## 개발 환경 설정

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.dev.vars.example` 파일을 복사하여 `.dev.vars` 파일을 생성하고 OpenRouter API 키를 설정하세요:

```bash
cp .dev.vars.example .dev.vars
```

`.dev.vars` 파일 내용:
```bash
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

**주의**: `.dev.vars` 파일은 Git에 커밋되지 않습니다 (`.gitignore`에 포함됨).

### 3. 로컬 개발 서버 실행

```bash
npm run dev
```

Worker는 기본적으로 `http://localhost:8787`에서 실행됩니다.

### 4. 테스트

Worker가 정상적으로 작동하는지 테스트:

```bash
curl -X POST http://localhost:8787 \
  -H "Content-Type: application/json" \
  -d '{
    "message": "안녕하세요",
    "personality": "calm"
  }'
```

## 프로덕션 배포

### 1. Cloudflare 계정 로그인

```bash
npx wrangler login
```

브라우저가 열리면 Cloudflare 계정으로 로그인하세요.

### 2. Worker 배포

```bash
npx wrangler deploy
```

### 3. 환경 변수 설정 (Secret)

프로덕션 환경에서 API 키를 안전하게 설정:

```bash
npx wrangler secret put OPENROUTER_API_KEY
```

프롬프트가 나타나면 OpenRouter API 키를 입력하세요.

### 4. 배포 확인

배포 후 Cloudflare Dashboard에서 Worker URL을 확인할 수 있습니다:
- Cloudflare Dashboard → Workers & Pages → 해당 Worker 선택
- Worker URL을 복사하여 프론트엔드 `.env` 파일의 `VITE_WORKER_URL`에 설정

## API 엔드포인트

### POST /

OpenRouter API를 통해 AI 응답을 가져옵니다.

**요청 본문:**
```json
{
  "message": "사용자 메시지",
  "personality": "calm",  // 'energetic', 'logical', 'calm' 중 선택
  "systemPrompt": "커스텀 시스템 프롬프트 (선택사항)"
}
```

**응답:**
```json
{
  "response": "AI 응답 텍스트"
}
```

**에러 응답:**
```json
{
  "error": "에러 메시지",
  "details": {}
}
```

## 환경 변수

### 개발 환경 (`.dev.vars`)

- `OPENROUTER_API_KEY`: OpenRouter API 키

### 프로덕션 환경 (Cloudflare Secrets)

- `OPENROUTER_API_KEY`: OpenRouter API 키 (Secret으로 설정)

## CORS 설정

Worker는 모든 도메인에서의 요청을 허용하도록 설정되어 있습니다 (`Access-Control-Allow-Origin: *`).

프로덕션 환경에서 특정 도메인만 허용하려면 `worker/src/index.js`의 `corsHeaders`를 수정하세요.

## 트러블슈팅

### Worker가 시작되지 않는 경우

1. `.dev.vars` 파일이 올바르게 설정되었는지 확인
2. `npm install`이 완료되었는지 확인
3. 포트 8787이 사용 중인지 확인

### API 호출 실패

1. OpenRouter API 키가 올바른지 확인
2. Cloudflare Dashboard에서 Worker 로그 확인
3. 네트워크 연결 확인

### CORS 오류

프론트엔드에서 CORS 오류가 발생하는 경우:
1. Worker의 CORS 헤더가 올바르게 설정되었는지 확인
2. 프론트엔드의 요청 헤더 확인

## 참고 자료

- [Cloudflare Workers 문서](https://developers.cloudflare.com/workers/)
- [Wrangler CLI 문서](https://developers.cloudflare.com/workers/wrangler/)
- [OpenRouter API 문서](https://openrouter.ai/docs)

