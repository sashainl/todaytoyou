# Firebase 설정 가이드

## 1. Firebase 프로젝트 생성

1. [Firebase Console](https://console.firebase.google.com/)에 접속
2. "프로젝트 추가" 클릭
3. 프로젝트 이름 입력 (예: emotion-sanctuary)
4. Google Analytics 설정 (선택사항)

## 2. Firestore Database 설정

1. 좌측 메뉴에서 "Firestore Database" 선택
2. "데이터베이스 만들기" 클릭
3. 보안 규칙 선택:
   - **테스트 모드**: 개발 중 사용 (30일 후 자동 비활성화)
   - **프로덕션 모드**: Security Rules 설정 필요

### Security Rules 설정

프로덕션 모드 사용 시 다음 규칙을 설정하세요:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 사용자별 데이터 접근 제어
    match /users/{userId}/{document=**} {
      // 인증된 사용자만 자신의 데이터에 접근 가능
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 3. Authentication 설정

1. 좌측 메뉴에서 "Authentication" 선택
2. "시작하기" 클릭
3. "Sign-in method" 탭에서 다음 제공업체 활성화:
   - **이메일/비밀번호**: 활성화
   - **Google**: 활성화 (선택사항)

### Google 로그인 설정 (선택사항)

1. Google 제공업체 클릭
2. "사용 설정" 토글 활성화
3. 프로젝트 지원 이메일 선택
4. 저장

## 4. 웹 앱 등록

1. 프로젝트 개요 페이지에서 웹 아이콘(</>) 클릭
2. 앱 닉네임 입력 (예: Emotion Sanctuary Web)
3. "Firebase Hosting도 설정" 체크 해제 (Cloudflare Pages 사용 시)
4. "앱 등록" 클릭
5. Firebase SDK 설정 정보 복사

## 5. 환경 변수 설정

복사한 Firebase 설정 정보를 `.env` 파일에 추가:

```bash
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=emotion-sanctuary.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=emotion-sanctuary
VITE_FIREBASE_STORAGE_BUCKET=emotion-sanctuary.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

## 6. Firestore 인덱스 설정 (선택사항)

대량의 데이터를 쿼리할 경우 인덱스가 필요할 수 있습니다.
Firebase Console에서 자동으로 인덱스 생성 요청이 표시됩니다.

## 7. 테스트

1. 개발 서버 실행: `npm run dev`
2. 회원가입/로그인 기능 테스트
3. 일기 작성 및 저장 테스트
4. Firestore Console에서 데이터 확인

## 문제 해결

### 인증 오류
- Firebase Console에서 Authentication이 활성화되어 있는지 확인
- 이메일/비밀번호 제공업체가 활성화되어 있는지 확인

### Firestore 접근 오류
- Security Rules 확인
- 사용자가 로그인되어 있는지 확인
- 브라우저 콘솔에서 에러 메시지 확인

### CORS 오류
- Firebase 설정에서 허용된 도메인 확인
- 로컬 개발 시 `localhost`가 허용되어 있는지 확인

