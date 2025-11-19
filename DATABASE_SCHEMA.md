# Firestore 데이터베이스 구조

## 전체 구조

```
users/
  └── {userId}/
      ├── diaries/          # 일기 컬렉션
      ├── chatMessages/     # 채팅 메시지 컬렉션
      └── tarotHistory/     # 타로 기록 컬렉션
```

---

## 1. 일기 컬렉션 (`users/{userId}/diaries`)

### 문서 구조
```javascript
{
  id: string,                    // 문서 ID (자동 생성)
  date: string,                  // 날짜 (YYYY-MM-DD 형식)
  title: string,                 // 제목 (기본값: '')
  mood: string,                  // 기분 ('매우 좋음', '좋음', '보통', '안 좋음', '매우 안 좋음')
  content: string,               // 일기 내용 (최대 500자)
  personality: string,           // 캐릭터 정보 ('energetic', 'logical', 'calm') - 최근 추가됨
  aiComfort: string,             // AI 위로 메시지 (임베딩 없이 저장)
  embedding: number[],           // 벡터 임베딩 (일기 내용만 임베딩, AI 위로는 제외)
  createdAt: Timestamp          // 생성 시간
}
```

### 주요 함수
- `getDiaries(userId, personality?)` - 일기 조회 (캐릭터별 필터링 가능)
- `getDiary(userId, diaryId)` - 특정 일기 조회
- `createDiary(userId, diaryData)` - 일기 생성
- `updateDiary(userId, diaryId, updates)` - 일기 수정
- `deleteDiary(userId, diaryId)` - 일기 삭제
- `searchSimilarDiaries(userId, queryText, options)` - 유사한 일기 검색 (벡터 기반)

### 인덱스 필요
- `personality` + `createdAt` 복합 인덱스 (캐릭터별 일기 조회용)

---

## 2. 채팅 메시지 컬렉션 (`users/{userId}/chatMessages`)

### 문서 구조
```javascript
{
  id: string,                    // 문서 ID (자동 생성)
  text: string,                  // 메시지 내용
  isUser: boolean,               // 사용자 메시지 여부 (true: 사용자, false: AI)
  personality: string,           // 캐릭터 정보 ('energetic', 'logical', 'calm')
  embedding: number[],           // 벡터 임베딩 (사용자 메시지만, AI 응답은 제외)
  timestamp: Timestamp,          // 메시지 시간
  createdAt: Timestamp           // 생성 시간
}
```

### 주요 함수
- `getChatMessages(userId, personality?, limit?)` - 채팅 메시지 조회 (캐릭터별 필터링 가능)
- `saveChatMessageWithVector(userId, messageData)` - 메시지 저장 (임베딩 옵션)
- `searchSimilarMessages(userId, queryText, options)` - 유사한 메시지 검색 (벡터 기반)

### 인덱스 필요
- `personality` + `createdAt` 복합 인덱스 (캐릭터별 메시지 조회용)

---

## 3. 타로 기록 컬렉션 (`users/{userId}/tarotHistory`)

### 문서 구조
```javascript
{
  id: string,                    // 문서 ID (자동 생성)
  question: string,              // 질문
  cards: Array<{                 // 선택된 카드들
    cardId: number,              // 카드 ID
    reversed: boolean            // 역방향 여부
  }>,
  mode: string,                  // 타로 모드
  topic: string,                 // 주제
  date: Timestamp,               // 날짜
  createdAt: Timestamp           // 생성 시간
}
```

### 주요 함수
- `getTarotHistory(userId)` - 타로 기록 조회 (최근 10개)
- `createTarotRecord(userId, tarotData)` - 타로 기록 생성
- `deleteTarotRecord(userId, recordId)` - 타로 기록 삭제

---

## 중요 사항

### 1. 캐릭터별 데이터 분리
- **일기**: `personality` 필드로 캐릭터별 구분
- **채팅**: `personality` 필드로 캐릭터별 구분
- 대화 시 해당 캐릭터의 데이터만 사용

### 2. 벡터 임베딩
- **일기**: `content`만 임베딩, `aiComfort`는 임베딩하지 않음
- **채팅**: 사용자 메시지만 임베딩, AI 응답은 임베딩하지 않음
- 벡터 검색을 통한 유사한 내용 찾기

### 3. 인덱스 설정 필요
Firestore 콘솔에서 다음 복합 인덱스를 생성해야 합니다:

1. **일기 컬렉션**:
   - Collection: `users/{userId}/diaries`
   - Fields: `personality` (Ascending), `createdAt` (Descending)

2. **채팅 메시지 컬렉션**:
   - Collection: `users/{userId}/chatMessages`
   - Fields: `personality` (Ascending), `createdAt` (Descending)

### 4. 기존 데이터 마이그레이션
- 기존 일기 중 `personality` 필드가 없는 경우가 있을 수 있음
- 이 경우 `getDiaries`에서 클라이언트 측 필터링으로 처리
- 새로 작성하는 일기는 자동으로 `personality` 필드가 저장됨

---

## 데이터 흐름

### 일기 작성
1. 사용자가 일기 작성 (캐릭터 선택)
2. AI 위로 메시지 생성
3. 일기 내용 임베딩 생성
4. Firestore에 저장 (`personality` 포함)

### 대화
1. 사용자 메시지 전송
2. 해당 캐릭터의 최근 30개 메시지 수집
3. 해당 캐릭터의 최근 10개 일기 수집
4. 벡터 검색으로 유사한 과거 메시지 찾기
5. AI 응답 생성 (1-2문장, 해당 캐릭터의 대화와 일기만 참조)
6. 사용자 메시지는 임베딩과 함께 저장
7. AI 응답은 임베딩 없이 저장
