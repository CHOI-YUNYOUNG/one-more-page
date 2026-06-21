# 📚 One More Page

> 나만의 독서 기록 & AI 독서 친구

한 페이지씩 읽어가는 독서 습관을 돕는 모바일 퍼스트 웹앱입니다. 책을 검색해서 책장에 담고, AI 요약과 독서 루틴을 생성하며, 하이라이트를 기록하고, AI와 책에 대해 토론할 수 있습니다.

---

## 🔗 바로가기

| 항목 | 링크 |
|------|------|
| 프로덕션 | TBD |
| 디자인 (Figma) | TBD |
| DB 스키마 (Supabase) | TBD |

---

## ✨ 주요 기능

### 📖 책장 관리
- 알라딘 API로 책 검색 및 책장에 추가
- 독서 상태 관리 — 읽고 싶어요 / 읽는 중 / 완독
- 현재 페이지 및 진행률 트래킹
- 별점 평가

### 🤖 AI 기능 (Claude Haiku)
- **AI 책 요약** — 책의 핵심을 3~5문장으로 요약
- **독서 루틴 생성** — 주차별 목표, 하루 권장 독서 시간, 팁 자동 생성
- **AI 토론** — 책을 읽은 AI 친구와 스트리밍 대화

### 🖊️ 하이라이트
- 인상 깊은 구절 및 페이지 번호 저장
- 나의 감상 메모 추가
- 하이라이트 수정 / 삭제

### 📅 출석 & 스트릭
- 매일 독서 체크인
- 연속 출석 스트릭 및 최고 기록 표시
- 월별 출석 캘린더

### 🎯 독서 목표
- 연간 독서 목표 일수 설정
- 현재 스트릭 및 목표 달성률 확인

### 🔐 인증
- 이메일 / 비밀번호 회원가입 및 로그인 (Supabase Auth)

---

## 🛠️ 기술 스택

| 영역 | 기술 |
|------|------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| UI Components | shadcn/ui |
| Backend / DB | Supabase (PostgreSQL + Auth) |
| AI | Anthropic Claude Haiku |
| 책 검색 | 알라딘 Open API |
| PWA | next/manifest (standalone) |

---

## 🗂️ 프로젝트 구조

```
bookmind/
├── app/
│   ├── (auth)/              # 로그인 / 회원가입
│   ├── (main)/
│   │   └── (routes)/
│   │       ├── page.tsx         # 홈 대시보드
│   │       ├── books/           # 책장, 책 상세, 검색, AI 토론
│   │       ├── attendance/      # 출석 캘린더
│   │       ├── goals/           # 독서 목표
│   │       └── profile/         # 프로필
│   └── api/
│       ├── ai/chat/         # AI 토론 스트리밍 API
│       ├── ai/summary/      # AI 요약 & 루틴 생성 API
│       └── books/           # 책 검색 / 랭킹 API
├── components/
│   ├── books/               # 하이라이트 폼, 책 카드
│   ├── attendance/          # 캘린더, 스트릭 디스플레이
│   ├── chat/                # AI 채팅 인터페이스
│   ├── layout/              # 사이드바, 하단 네비게이션
│   └── ui/                  # shadcn 공통 컴포넌트
├── lib/
│   ├── supabase.ts          # DB 클라이언트 & 타입 정의
│   ├── claude.ts            # Anthropic 클라이언트
│   ├── aladin.ts            # 알라딘 API 유틸
│   └── gemini.ts            # Google Gemini (TBD)
└── hooks/
    ├── use-user.ts          # 현재 로그인 유저
    ├── use-streak.ts        # 스트릭 & 체크인
    └── use-theme.ts         # 테마 관리
```

---

## 🚀 로컬 실행

```bash
# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env.local
# .env.local에 아래 값을 채워주세요

# 개발 서버 실행
npm run dev
```

### 필요한 환경 변수

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
ANTHROPIC_API_KEY=
ALADIN_TTB_KEY=
```

---

## 🗄️ 데이터베이스 스키마

| 테이블 | 설명 |
|--------|------|
| `books` | 알라딘에서 가져온 책 정보 |
| `user_books` | 유저별 책장 (상태, 진행률, AI 요약, 루틴) |
| `highlights` | 하이라이트 및 감상 메모 |
| `ai_conversations` | AI 토론 대화 내역 |
| `attendance` | 일별 독서 체크인 기록 |
| `reading_goals` | 유저별 독서 목표 및 스트릭 |

---

## 🗺️ 로드맵 (TBD)

- [ ] 소셜 로그인 (Google, Kakao)
- [ ] 독서 통계 페이지 (월별 완독 수, 장르 분포)
- [ ] 책 추천 기능 (읽은 책 기반 AI 추천)
- [ ] 친구 기능 — 독서 현황 공유
- [ ] 푸시 알림 (PWA) — 매일 독서 리마인더
- [ ] Gemini 모델 연동 (현재 코드 준비 완료)
- [ ] 다크 모드 완성도 개선
- [ ] E2E 테스트 작성

---

## 📝 개발 메모

- 모바일 퍼스트 PWA로 설계 (`display: standalone`)
- 하단 네비게이션은 모바일 전용 (`md:hidden`), 데스크탑은 사이드바
- AI 토론은 Server-Sent Events 방식 스트리밍 응답
- 알라딘 API는 SSL 인증서 이슈로 `rejectUnauthorized: false` 처리 중
