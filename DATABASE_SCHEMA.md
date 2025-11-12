# 데이터베이스 정의서 (Database Schema)

## 프로젝트 개요
- **프로젝트명**: Emotion Sanctuary (감정 안식처)
- **저장 방식**: 브라우저 LocalStorage
- **데이터 형식**: JSON
- **프레임워크**: React + Vite

---

## 테이블 구조

### 1. 감정 일기 (emotionDiaries)

#### 테이블 정보
- **LocalStorage Key**: `emotionDiaries`
- **데이터 타입**: Array
- **설명**: 사용자가 작성한 감정 일기 데이터를 저장

#### 필드 정의

| 필드명 | 데이터 타입 | 제약조건 | 설명 | 예시 |
|--------|------------|---------|------|------|
| `id` | Number | PRIMARY KEY, NOT NULL, UNIQUE | 일기 고유 식별자 (타임스탬프 기반) | `1704067200000` |
| `date` | String | NOT NULL | 일기 작성 날짜 (YYYY-MM-DD 형식) | `"2024-01-01"` |
| `title` | String | NOT NULL | 일기 제목 | `"오늘 하루"` |
| `mood` | String | NOT NULL, ENUM | 오늘의 기분 | `"매우 좋음"`, `"좋음"`, `"보통"`, `"안 좋음"`, `"매우 안 좋음"` |
| `content` | String | NOT NULL, MAX 500자 | 일기 내용 | `"오늘은 정말 좋은 하루였다..."` |
| `createdAt` | String | NOT NULL | 생성 일시 (ISO 8601 형식) | `"2024-01-01T12:00:00.000Z"` |

#### 데이터 예시
```json
[
  {
    "id": 1704067200000,
    "date": "2024-01-01",
    "title": "새해 첫 날",
    "mood": "좋음",
    "content": "오늘은 정말 좋은 하루였다. 새로운 시작에 설렌다.",
    "createdAt": "2024-01-01T12:00:00.000Z"
  }
]
```

#### 기분(Mood) Enum 값
- `"매우 좋음"` (점수: 5)
- `"좋음"` (점수: 4)
- `"보통"` (점수: 3)
- `"안 좋음"` (점수: 2)
- `"매우 안 좋음"` (점수: 1)

---

### 2. 타로 기록 (tarotHistory)

#### 테이블 정보
- **LocalStorage Key**: `tarotHistory`
- **데이터 타입**: Array
- **설명**: 사용자가 뽑은 타로 카드 기록을 저장 (최대 10개 유지)

#### 필드 정의

| 필드명 | 데이터 타입 | 제약조건 | 설명 | 예시 |
|--------|------------|---------|------|------|
| `id` | Number | PRIMARY KEY, NOT NULL, UNIQUE | 기록 고유 식별자 (타임스탬프 기반) | `1704067200000` |
| `question` | String | NOT NULL | 사용자 질문 | `"나의 연애운은?"` |
| `cards` | Array | NOT NULL, LENGTH 3 | 선택된 카드 3장 | `[{...}, {...}, {...}]` |
| `mode` | String | NOT NULL, ENUM | 스프레드 방식 | `"past-present-future"`, `"situation-advice-outcome"` |
| `topic` | String | NOT NULL, ENUM | 주제 카테고리 | `"love"`, `"money"`, `"study"`, `"career"`, `"health"`, `"general"` |
| `date` | String | NOT NULL | 기록 생성 일시 (ISO 8601 형식) | `"2024-01-01T12:00:00.000Z"` |

#### cards 배열 내부 구조

| 필드명 | 데이터 타입 | 제약조건 | 설명 | 예시 |
|--------|------------|---------|------|------|
| `index` | Number | NOT NULL | 카드 덱 내 인덱스 | `5` |
| `card` | Object | NOT NULL | 타로 카드 정보 | `{id, name, icon, keywords, upright, reversed}` |
| `reversed` | Boolean | NOT NULL | 역방향 여부 | `true`, `false` |

#### card 객체 구조

| 필드명 | 데이터 타입 | 제약조건 | 설명 | 예시 |
|--------|------------|---------|------|------|
| `id` | Number | NOT NULL | 카드 ID (0-21) | `0` |
| `name` | String | NOT NULL | 카드 이름 | `"광대 (The Fool)"` |
| `icon` | String | NOT NULL | 카드 이모지 | `"🃏"` |
| `keywords` | String | NOT NULL | 카드 키워드 | `"새로운 시작, 순수함, 자유, 모험"` |
| `upright` | String | NOT NULL | 정방향 해석 | `"새로운 시작과 무한한 가능성을 상징합니다..."` |
| `reversed` | String | NOT NULL | 역방향 해석 | `"무모함, 경솔한 결정을 경계하세요..."` |

#### 데이터 예시
```json
[
  {
    "id": 1704067200000,
    "question": "나의 연애운은?",
    "cards": [
      {
        "index": 5,
        "card": {
          "id": 6,
          "name": "연인 (The Lovers)",
          "icon": "💕",
          "keywords": "사랑, 선택, 조화, 관계",
          "upright": "사랑과 조화로운 관계가 형성됩니다...",
          "reversed": "불화나 잘못된 선택을 조심하세요..."
        },
        "reversed": false
      }
    ],
    "mode": "past-present-future",
    "topic": "love",
    "date": "2024-01-01T12:00:00.000Z"
  }
]
```

#### 스프레드 모드(Mode) Enum 값
- `"past-present-future"`: 과거 / 현재 / 미래
- `"situation-advice-outcome"`: 상황 / 조언 / 결과

#### 주제(Topic) Enum 값
- `"love"`: 연애운 💝
- `"money"`: 재물운 💰
- `"study"`: 학업운 📚
- `"career"`: 직업운 💼
- `"health"`: 건강운 🏥
- `"general"`: 종합운 🌟

---

### 3. 채팅 메시지 (Chat Messages)

#### 테이블 정보
- **LocalStorage Key**: 없음 (메모리 내 저장)
- **데이터 타입**: Array (컴포넌트 state)
- **설명**: AI 채팅 메시지 목록 (페이지 새로고침 시 초기화)

#### 필드 정의

| 필드명 | 데이터 타입 | 제약조건 | 설명 | 예시 |
|--------|------------|---------|------|------|
| `id` | Number | PRIMARY KEY, NOT NULL, UNIQUE | 메시지 고유 식별자 | `1704067200000` |
| `text` | String | NOT NULL | 메시지 내용 | `"안녕하세요! 오늘 기분은 어떠세요?"` |
| `isUser` | Boolean | NOT NULL | 사용자 메시지 여부 | `true`, `false` |
| `time` | String | NOT NULL | 메시지 시간 (HH:MM 형식) | `"14:30"` |

#### 데이터 예시
```json
[
  {
    "id": 1704067200000,
    "text": "안녕하세요! 오늘 기분은 어떠세요?",
    "isUser": false,
    "time": "14:30"
  },
  {
    "id": 1704067201000,
    "text": "오늘 기분이 좀 안 좋아요",
    "isUser": true,
    "time": "14:31"
  }
]
```

---

## 통계 데이터 (Statistics)

### 개요
- **저장 방식**: 계산된 데이터 (별도 저장 없음)
- **데이터 소스**: `emotionDiaries` 배열
- **기간 필터**: 전체, 최근 7일, 최근 30일

### 계산 항목

#### 1. 감정 통계 (Mood Statistics)
- **기간별 감정 분포**: 각 기분별 개수 및 비율
- **가장 많은 기분**: 빈도가 가장 높은 기분
- **평균 감정 점수**: 1-5점 척도의 평균값

#### 2. 감정 추이 (Mood Trend)
- **최근 7일 감정 추이**: 날짜별 평균 감정 점수
- **작성 빈도**: 최근 30일간 일일 작성 횟수

#### 3. 감정 인사이트 (Mood Insights)
- **긍정 비율**: "매우 좋음" + "좋음" 비율
- **중립 비율**: "보통" 비율
- **부정 비율**: "안 좋음" + "매우 안 좋음" 비율

---

## 외부 데이터 구조

### 1. 타로 카드 마스터 데이터 (tarotCards)

#### 테이블 정보
- **파일 위치**: `src/data/tarotCards.js`
- **데이터 타입**: Array (정적 데이터)
- **총 카드 수**: 22장 (메이저 아르카나)

#### 구조
각 카드는 위의 `card 객체 구조`와 동일합니다.

### 2. 주제 정보 (topicInfo)

#### 테이블 정보
- **파일 위치**: `src/data/tarotCards.js`
- **데이터 타입**: Object

#### 필드 정의

| 필드명 | 데이터 타입 | 설명 | 예시 |
|--------|------------|------|------|
| `name` | String | 주제 이름 | `"연애운"` |
| `icon` | String | 주제 아이콘 | `"💝"` |
| `placeholder` | String | 입력 필드 플레이스홀더 | `"예: 나의 연애운은 어떨까요?"` |
| `hint` | String | 도움말 텍스트 | `"현재의 연애 상황이나..."` |
| `defaultQuestion` | String | 기본 질문 | `"나의 연애운은?"` |

---

## 인덱스 및 제약조건

### Primary Key
- `emotionDiaries.id`: 일기 고유 식별자
- `tarotHistory.id`: 타로 기록 고유 식별자

### 제약조건
- `emotionDiaries.content`: 최대 500자
- `tarotHistory.cards`: 정확히 3개의 카드
- `emotionDiaries.mood`: Enum 값만 허용
- `tarotHistory.mode`: Enum 값만 허용
- `tarotHistory.topic`: Enum 값만 허용

### 데이터 보관 정책
- `tarotHistory`: 최대 10개 유지 (가장 최근 기록)
- `emotionDiaries`: 모든 기록 보관 (제한 없음)
- `Chat Messages`: 메모리 내 저장 (페이지 새로고침 시 초기화)

---

## API 연동 데이터

### OpenRouter API

#### 요청 데이터
- **엔드포인트**: `https://openrouter.ai/api/v1/chat/completions`
- **모델**: `google/gemma-2-9b-it:free`
- **요청 형식**: JSON
- **헤더**: Authorization Bearer Token

#### 응답 데이터
- **형식**: JSON
- **필드**: `choices[0].message.content` (String)

#### 사용 시나리오
1. **감정 일기 저장 시**: 일기 내용 기반 위로 메시지 및 음악 추천
2. **채팅**: 실시간 대화 응답
3. **타로 해석**: 선택된 카드 기반 종합 해석

---

## 데이터 무결성 규칙

### 1. 일기 데이터 (emotionDiaries)
- `id`는 고유해야 함 (중복 불가)
- `date`는 유효한 날짜 형식이어야 함
- `content`는 500자를 초과할 수 없음
- `mood`는 허용된 Enum 값이어야 함

### 2. 타로 기록 (tarotHistory)
- `cards` 배열은 정확히 3개의 요소를 가져야 함
- `mode`는 허용된 Enum 값이어야 함
- `topic`는 허용된 Enum 값이어야 함
- 최대 10개까지만 저장 (초과 시 가장 오래된 기록 삭제)

### 3. 채팅 메시지
- `isUser`는 boolean 값이어야 함
- `time`은 "HH:MM" 형식이어야 함

---

## 데이터 마이그레이션 및 백업

### 현재 구현
- **백업**: LocalStorage에 JSON 형식으로 저장 (브라우저 자동 관리)
- **마이그레이션**: 구현되지 않음
- **데이터 내보내기**: 구현되지 않음
- **데이터 가져오기**: 구현되지 않음

### 권장 사항
1. 데이터 내보내기 기능 (JSON 파일 다운로드)
2. 데이터 가져오기 기능 (JSON 파일 업로드)
3. 버전 관리 및 마이그레이션 스크립트
4. 클라우드 백업 연동 (선택사항)

---

## 보안 고려사항

### 현재 상태
- **데이터 저장 위치**: 클라이언트 측 LocalStorage
- **암호화**: 없음
- **인증**: 없음
- **데이터 공유**: 없음

### 개인정보 보호
- 모든 데이터는 사용자의 브라우저에만 저장됨
- 서버로 전송되지 않음
- OpenRouter API 호출 시 일기 내용 일부만 전송 (최대 100자)

---

## 참고사항

### 기술 스택
- **프론트엔드**: React 18.2.0
- **빌드 도구**: Vite 5.0.8
- **라우팅**: React Router DOM 6.20.0
- **UI 프레임워크**: Bootstrap 5.3.0

### LocalStorage 사용법
- `useLocalStorage` 커스텀 훅 사용
- 자동 JSON 직렬화/역직렬화
- 실시간 동기화 (React state와 연동)

### 데이터 형식
- 모든 날짜는 ISO 8601 형식 사용
- 모든 배열은 시간 역순으로 정렬 (최신순)
- ID는 `Date.now()`를 사용하여 생성

---


