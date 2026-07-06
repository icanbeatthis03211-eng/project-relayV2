# Project Relay

프로젝트형 부트캠프 수강생이 받은 피드백을 저장하고, 반복적으로 등장하는
피드백을 찾아 다음 프로젝트 체크리스트로 바꿔주는 성장 관리 웹 서비스입니다.

- 피드백을 태그별로 정리하고 반복 패턴을 감지합니다.
- 반복 피드백을 다음 프로젝트 점검용 체크리스트로 자동 변환합니다.
- 공유 가능한 피드백은 민감정보를 제거한 익명 카드로 만들어 학습
  라이브러리에 공유할 수 있습니다.

GitHub 저장소: https://github.com/icanbeatthis03211-eng/project-relayV2

## 기술 스택

- Next.js 15 (App Router, TypeScript)
- Tailwind CSS 3
- Supabase (Postgres + `@supabase/supabase-js`)
- 로그인 없이 `localStorage` 기반 익명 `user_id`로 개인 데이터를 구분합니다.

## 실행 방법

```bash
npm install
npm run dev
```

`http://localhost:3000` 에서 확인할 수 있습니다.

프로덕션 빌드 확인:

```bash
npm run build
npm run start
```

## Supabase 연동 방식 (하드코딩)

별도의 `.env.local` 환경 변수 파일을 사용하지 않고, Supabase 프로젝트
자격증명을 `lib/supabase/client.ts` 안에 문자열로 직접 하드코딩했습니다.

```ts
const SUPABASE_PROJECT_ID = "lkjxzrrkzpdtbdcmqhjo";
const SUPABASE_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co`;
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_...";
```

`.env.local` 파일은 더 이상 사용되지 않으며(내용도 비워둠), 삭제해도 앱
동작에는 영향이 없습니다.

## Supabase 스키마 적용 방법 (필수, 수동 작업)

이 프로젝트는 Supabase 대시보드에 직접 접속할 수 없으므로, 아래 절차를
**사용자가 직접** 수행해야 합니다.

1. [Supabase 대시보드](https://supabase.com/dashboard) 에서 프로젝트
   `lkjxzrrkzpdtbdcmqhjo` 를 엽니다.
2. 좌측 메뉴에서 **SQL Editor** 로 이동합니다.
3. 이 저장소의 [`database/schema.sql`](./database/schema.sql) 파일 내용을
   전체 복사하여 붙여넣고 실행(Run)합니다.
4. `feedbacks`, `checklist_status`, `shared_cards` 세 개의 테이블과 RLS
   정책이 생성되었는지 **Table Editor** 에서 확인합니다.

이 앱은 정식 로그인 기능이 없으므로, RLS는 anon/publishable key로 누구나
자유롭게 CRUD 할 수 있도록 permissive 정책(`using (true)`,
`with check (true)`)으로 구성되어 있습니다. 각 사용자는 브라우저에 저장된
`user_id` 값으로 자신의 피드백만 필터링해서 봅니다.

## 폴더 구조

```
app/
  page.tsx                  # 대시보드 (메인 화면)
  feedback/new/page.tsx     # 피드백 저장 화면
  feedbacks/page.tsx        # 내가 저장한 피드백 목록
  pattern/page.tsx          # 내 반복 피드백 화면
  checklist/page.tsx        # 다음 프로젝트 체크리스트
  cards/[feedbackId]/page.tsx  # 공유 카드 생성/편집
  library/page.tsx          # 공유 피드백 라이브러리
  layout.tsx, globals.css
components/
  Header.tsx, Nav.tsx, Logo.tsx, CardEditor.tsx
  ui/                       # Button, Card, Tag, EmptyState, Spinner, Skeleton, ProgressBar, Toast
lib/
  supabase/client.ts        # 브라우저용 Supabase client (자격증명 하드코딩)
  queries.ts                # 모든 CRUD 쿼리 함수 모음
  constants.ts               # PROJECT_TYPES, FEEDBACK_SOURCES, TAGS, CHECKLIST_MAP
  types.ts                   # Feedback, SharedCard, ChecklistStatus 타입
  user.ts                    # localStorage 기반 익명 user_id 유틸
database/
  schema.sql                 # Supabase SQL Editor에서 실행할 최신 전체 스키마
supabase/
  schema.sql                 # (구버전, database/schema.sql로 대체됨)
```

## MVP 범위

포함: 피드백 저장, 역량 태그별 정리, 반복 피드백 감지, 체크리스트 생성,
공유 카드 생성, 공유 라이브러리 확인.

제외: AI 자동 태그 추천, Notion 연동, 튜터용 대시보드, 팀별 비교, 댓글/좋아요,
실시간 채팅, 고급 분석 리포트, 정식 로그인 인증.
