# 마음의 안식처 (Emotion Sanctuary)

감정 위로와 힐링을 제공하는 React 기반 웹 애플리케이션

## 주요 기능

- 🏠 **홈페이지**: 서비스 소개 및 안내
- 💬 **감정 대화**: AI 상담사와 감정에 대해 대화하기
- 📔 **감정 일기**: 하루의 감정을 기록하고 AI 위로 받기
- 📊 **통계**: 감정 패턴 분석 및 인사이트 제공
- 🔮 **타로 카드**: 3장 타로 리딩으로 조언 받기
- 🌙 **다크 모드**: 라이트/다크 테마 지원
- 🔐 **사용자 인증**: Firebase Authentication으로 안전한 로그인

## 기술 스택

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Routing**: React Router DOM v6
- **UI Framework**: Bootstrap 5.3
- **Icons**: Bootstrap Icons

### Backend
- **Database**: Firebase Firestore
- **Authentication**: Firebase Authentication
- **AI API**: OpenRouter (Claude 3.5 Sonnet) - Cloudflare Worker를 통한 프록시 호출
- **Worker**: Cloudflare Workers (API 키 보안을 위한 프록시)

## 설치 및 실행

### 필수 요구사항

- Node.js 16+
- npm 또는 yarn
- Firebase 프로젝트 (Firestore 및 Authentication 활성화)
- OpenRouter API 키 (AI 기능 사용 시)
- Cloudflare 계정 (Worker 사용 시, 선택사항)

### 1. 프로젝트 클론 및 의존성 설치

```bash
npm install
```

### 2. Firebase 설정

1. [Firebase Console](https://console.firebase.google.com/)에서 새 프로젝트 생성
2. Firestore Database 활성화 (테스트 모드 또는 프로덕션 모드)
3. Authentication 활성화 (이메일/비밀번호 및 Google 로그인)
4. 웹 앱 추가 후 Firebase 설정 정보 복사

### 3. 환경 변수 설정

프로젝트 루트에 `.env` 파일을 생성하고 다음 내용을 추가하세요:

```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Cloudflare Worker 설정 (권장)
VITE_WORKER_URL=http://localhost:8787  # 개발 환경: 로컬 Worker
# VITE_WORKER_URL=https://your-worker.your-subdomain.workers.dev  # 프로덕션: 배포된 Worker URL
VITE_USE_WORKER=true  # Worker 사용 여부 (기본값: true)

# OpenRouter API Key (Fallback: Worker를 사용하지 않는 경우)
# Worker를 사용하는 경우 프론트엔드에 API 키가 노출되지 않으므로 이 값은 필요 없습니다
VITE_OPENROUTER_API_KEY=your_openrouter_api_key
```

### 4. Cloudflare Worker 설정 (권장)

API 키 보안을 위해 Cloudflare Worker를 사용하는 것을 권장합니다.

#### 4.1 Worker 개발 환경 설정

1. `worker` 디렉토리로 이동:
```bash
cd worker
```

2. 의존성 설치 (이미 설치되어 있을 수 있음):
```bash
npm install
```

3. 환경 변수 설정:
```bash
# .dev.vars.example 파일을 복사하여 .dev.vars 파일 생성
cp .dev.vars.example .dev.vars
```

4. `.dev.vars` 파일에 OpenRouter API 키 추가:
```bash
OPENROUTER_API_KEY=your_openrouter_api_key
```

5. 로컬 개발 서버 실행:
```bash
npm run dev
```

Worker는 기본적으로 `http://localhost:8787`에서 실행됩니다.

#### 4.2 Worker 프로덕션 배포

1. Cloudflare 계정에 로그인:
```bash
npx wrangler login
```

2. Worker 배포:
```bash
cd worker
npx wrangler deploy
```

3. 환경 변수 설정 (프로덕션):
```bash
npx wrangler secret put OPENROUTER_API_KEY
# 프롬프트가 나타나면 OpenRouter API 키를 입력하세요
```

4. 배포된 Worker URL 확인:
   - Cloudflare Dashboard → Workers & Pages → 해당 Worker 선택
   - Worker URL을 복사하여 프론트엔드 `.env` 파일의 `VITE_WORKER_URL`에 설정

**참고**: Worker를 사용하지 않고 직접 API를 호출하려면 `VITE_USE_WORKER=false`로 설정하세요. (보안상 권장하지 않음)

### 5. 개발 서버 실행

#### 프론트엔드 개발 서버
```bash
npm run dev
```
개발 서버는 기본적으로 `http://localhost:5173`에서 실행됩니다.

#### Worker 개발 서버 (별도 터미널)
```bash
cd worker
npm run dev
```
Worker는 `http://localhost:8787`에서 실행됩니다.

**참고**: Worker를 사용하는 경우 두 서버를 모두 실행해야 합니다.

### 6. 프로덕션 빌드

```bash
npm run build
```

빌드된 파일은 `dist` 폴더에 생성됩니다.

## 프로젝트 구조

```
page/
├── src/
│   ├── components/          # 재사용 가능한 컴포넌트
│   │   ├── Layout.jsx
│   │   ├── Navbar.jsx
│   │   └── Footer.jsx
│   ├── config/              # 설정 파일
│   │   └── firebase.js      # Firebase 초기화
│   ├── context/             # Context API
│   │   └── ThemeContext.jsx
│   ├── data/                # 정적 데이터
│   │   └── tarotCards.js
│   ├── hooks/              # 커스텀 훅
│   │   └── useLocalStorage.js
│   ├── pages/              # 페이지 컴포넌트
│   │   ├── Home.jsx
│   │   ├── Chat.jsx
│   │   ├── Diary.jsx
│   │   ├── Statistics.jsx
│   │   └── Tarot.jsx
│   ├── services/           # 서비스 레이어
│   │   ├── authService.js      # Firebase Auth
│   │   ├── firestoreService.js # Firestore
│   │   └── openRouterService.js # AI API (Worker 프록시)
│   ├── App.jsx
│   ├── main.jsx
│   └── style.css
├── worker/                  # Cloudflare Worker
│   ├── src/
│   │   └── index.js        # Worker 메인 파일
│   ├── package.json
│   ├── wrangler.toml       # Worker 설정
│   └── .dev.vars.example   # 환경 변수 예시
├── package.json
├── vite.config.js
└── README.md
```

## 데이터베이스 구조

### Firestore Collections

```
users/
  {userId}/
    diaries/          # 감정 일기
      {diaryId}
        - date: string
        - title: string
        - mood: string
        - content: string
        - createdAt: Timestamp
    
    tarotHistory/     # 타로 기록
      {recordId}
        - question: string
        - cards: array
        - mode: string
        - topic: string
        - date: Timestamp
```

## 기능 상세

### 사용자 인증
- 이메일/비밀번호 회원가입 및 로그인
- Google 소셜 로그인
- 자동 로그인 상태 유지

### 감정 대화 (Chat)
- Cloudflare Worker를 통한 OpenRouter API 호출 (API 키 보안)
- 성격별 AI 응답 (활기찬 친구, 다정한 친구, 차분한 친구)
- 실시간 대화형 인터페이스
- Worker 오류 시 자동 Fallback (직접 API 호출)

### 감정 일기 (Diary)
- Firestore에 일기 저장
- 5단계 감정 선택
- AI 위로 메시지 및 음악 추천

### 통계 (Statistics)
- 기간별 필터링 (최근 7일, 30일, 전체)
- 감정 분포 및 추이 분석
- AI 인사이트 제공

### 타로 카드 (Tarot)
- 22장 메이저 아르카나
- 3장 카드 리딩
- AI 종합 해석
- Firestore에 기록 저장

## 보안 고려사항

- Firebase Security Rules 설정 필요
- **OpenRouter API 키 보안**: Cloudflare Worker를 사용하여 API 키를 프론트엔드에 노출하지 않음
  - Worker를 사용하지 않는 경우 API 키가 프론트엔드에 노출되므로 프로덕션 환경에서는 반드시 Worker 사용 권장
- 사용자별 데이터 격리 (Firestore Security Rules)
- CORS 설정: Worker에서 적절한 CORS 헤더 설정

### Firestore Security Rules 예시

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 배포

### Cloudflare Pages (프론트엔드)

1. GitHub에 코드 푸시
2. Cloudflare Dashboard에서 Pages 프로젝트 생성
3. 빌드 설정:
   - Build command: `npm run build`
   - Build output directory: `dist`
4. 환경 변수 설정:
   - Firebase 설정 변수들
   - `VITE_WORKER_URL`: 배포된 Worker URL (예: `https://your-worker.your-subdomain.workers.dev`)
   - `VITE_USE_WORKER=true` (Worker 사용 시)
   - `VITE_OPENROUTER_API_KEY`: Worker를 사용하지 않는 경우에만 필요 (권장하지 않음)

### Cloudflare Workers (백엔드)

1. Worker 디렉토리로 이동:
```bash
cd worker
```

2. Cloudflare에 로그인:
```bash
npx wrangler login
```

3. Worker 배포:
```bash
npx wrangler deploy
```

4. 환경 변수 설정 (Secret):
```bash
npx wrangler secret put OPENROUTER_API_KEY
```

5. 배포된 Worker URL을 프론트엔드 환경 변수에 설정

**참고**: Worker는 무료 플랜에서도 사용 가능하며, 월 100,000회 요청까지 무료입니다.

## 라이센스

이 프로젝트는 개인 프로젝트입니다.

## 연락처

문제가 발생하거나 제안사항이 있으시면 이슈를 등록해주세요.

---

**중요 안내**: 
- 이 애플리케이션은 전문적인 심리 상담을 대체할 수 없습니다.
- 심각한 심리적 어려움을 겪고 계시다면 전문가의 도움을 받으시기 바랍니다.
- 자살예방 상담전화: 1393
- 정신건강 위기상담: 1577-0199
