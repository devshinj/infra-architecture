---
title: "DB 스키마와 인증"
sidebar_position: 4
---
# DB 스키마와 인증

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 49 nodes · cohesion 0.09

## Key Concepts

- **schema.ts** (33 connections) — `src/db/schema.ts`
- **ref_react** (23 connections)
- **auth/actions.ts** (19 connections) — `src/server/auth/actions.ts`
- **reset.ts** (17 connections) — `src/server/auth/reset.ts`
- **messages.ts** (14 connections) — `src/server/chat/messages.ts`
- **client.ts** (13 connections) — `src/db/client.ts`
- **password.ts** (11 connections) — `src/server/auth/password.ts`
- **signup.ts** (11 connections) — `src/server/auth/signup.ts`
- **ref_drizzle_orm** (10 connections)
- **db** (9 connections) — `src/db/client.ts`
- **login/page.tsx** (7 connections) — `src/app/(auth)/login/page.tsx`
- **reset/page.tsx** (7 connections) — `src/app/(auth)/reset/page.tsx`
- **[token]/page.tsx** (7 connections) — `src/app/(auth)/reset/[token]/page.tsx`
- **signup/page.tsx** (7 connections) — `src/app/(auth)/signup/page.tsx`
- **signupAction()** (6 connections) — `src/server/auth/actions.ts`
- **FormState** (5 connections) — `src/server/auth/actions.ts`
- **loginAction()** (5 connections) — `src/server/auth/actions.ts`
- **requestResetAction()** (5 connections) — `src/server/auth/actions.ts`
- **resetPasswordAction()** (5 connections) — `src/server/auth/actions.ts`
- **text()** (5 connections) — `src/server/auth/actions.ts`
- **sendMail()** (5 connections) — `src/server/auth/mailer.ts`
- **hashPassword()** (5 connections) — `src/server/auth/password.ts`
- **requestPasswordReset()** (5 connections) — `src/server/auth/reset.ts`
- **resetPassword()** (5 connections) — `src/server/auth/reset.ts`
- **src_app_auth_auth_module** (4 connections)
- *... and 24 more nodes in this community*

## Relationships

- [대화 파이프라인과 저장](대화_파이프라인과_저장.md) (17 shared connections)
- [서버 액션과 작업 화면](서버_액션과_작업_화면.md) (17 shared connections)
- [대화 이벤트와 빠진 정보 체크리스트](대화_이벤트와_빠진_정보_체크리스트.md) (9 shared connections)
- [설명 생성과 품질 검사](설명_생성과_품질_검사.md) (6 shared connections)
- [용어 사전 저장과 시드](용어_사전_저장과_시드.md) (5 shared connections)
- [환경 변수와 AI 상태 점검](환경_변수와_AI_상태_점검.md) (4 shared connections)
- [가정과 대화 패널 UI](가정과_대화_패널_UI.md) (3 shared connections)
- [오른쪽 패널과 설명 화면](오른쪽_패널과_설명_화면.md) (3 shared connections)
- [설명 요청 차례](설명_요청_차례.md) (3 shared connections)
- [캔버스 옵션과 노드 메뉴](캔버스_옵션과_노드_메뉴.md) (2 shared connections)
- [연결선 개발용 화면](연결선_개발용_화면.md) (1 shared connections)
- [연결선 그리기](연결선_그리기.md) (1 shared connections)

## Source Files

- `src/app/(auth)/login/page.tsx`
- `src/app/(auth)/reset/[token]/page.tsx`
- `src/app/(auth)/reset/page.tsx`
- `src/app/(auth)/signup/page.tsx`
- `src/auth.ts`
- `src/db/client.ts`
- `src/db/schema.ts`
- `src/server/auth/actions.ts`
- `src/server/auth/mailer.ts`
- `src/server/auth/password.ts`
- `src/server/auth/reset.ts`
- `src/server/auth/signup.ts`
- `src/server/chat/messages.ts`

## Audit Trail

- EXTRACTED: 179 (98%)
- INFERRED: 4 (2%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*