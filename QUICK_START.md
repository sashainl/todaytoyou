# 빠른 시작 가이드

## 1. 의존성 설치

```bash
npm install
```

## 2. Firebase 설정

1. [Firebase Console](https://console.firebase.google.com/)에서 프로젝트 생성
2. Firestore Database 활성화
3. Authentication 활성화 (이메일/비밀번호, Google)
4. 웹 앱 등록 후 설정 정보 복사

자세한 내용은 [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) 참고

## 3. 환경 변수 설정

`.env` 파일 생성:

```bash
# Firebase
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# OpenRouter API Key (AI 기능 사용 시)
VITE_OPENROUTER_API_KEY=your_openrouter_api_key
```

## 4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:5173` 접속

## 6. Firestore Security Rules 설정

Firebase Console > Firestore Database > Rules:

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

## 다음 단계

- [README.md](./README.md) - 전체 문서
- [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) - Firebase 상세 설정

## 문제 해결

### Firebase 연결 오류
- `.env` 파일의 Firebase 설정 확인
- Firebase Console에서 Authentication 활성화 확인

### AI 기능 오류
- `.env` 파일에 `VITE_OPENROUTER_API_KEY`가 설정되어 있는지 확인
- OpenRouter API 키가 유효한지 확인

### 인증 오류
- Firebase Console에서 Authentication 제공업체 활성화 확인
- 브라우저 콘솔에서 에러 메시지 확인

