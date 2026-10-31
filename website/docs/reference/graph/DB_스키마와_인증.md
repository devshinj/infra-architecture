---
title: "DB 스키마와 인증"
sidebar_position: 11
---
# DB 스키마와 인증

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 32 nodes · cohesion 0.12

## Key Concepts

- **schema.ts** (33 connections) — `src/db/schema.ts`
- **reset.ts** (17 connections) — `src/server/auth/reset.ts`
- **messages.ts** (14 connections) — `src/server/chat/messages.ts`
- **client.ts** (13 connections) — `src/db/client.ts`
- **password.ts** (11 connections) — `src/server/auth/password.ts`
- **signup.ts** (11 connections) — `src/server/auth/signup.ts`
- **ref_drizzle_orm** (10 connections)
- **db** (9 connections) — `src/db/client.ts`
- **sendMail()** (5 connections) — `src/server/auth/mailer.ts`
- **hashPassword()** (5 connections) — `src/server/auth/password.ts`
- **requestPasswordReset()** (5 connections) — `src/server/auth/reset.ts`
- **resetPassword()** (5 connections) — `src/server/auth/reset.ts`
- **users** (4 connections) — `src/db/schema.ts`
- **VersionSource** (3 connections) — `src/db/schema.ts`
- **VersionStatus** (3 connections) — `src/db/schema.ts`
- **sha256()** (3 connections) — `src/server/auth/reset.ts`
- **CreateVersionOpts** (3 connections) — `src/server/versions.ts`
- **ref_postgres** (2 connections)
- **diagrams** (2 connections) — `src/db/schema.ts`
- **diagramVersions** (2 connections) — `src/db/schema.ts`
- **explanations** (2 connections) — `src/db/schema.ts`
- **messages** (2 connections) — `src/db/schema.ts`
- **passwordResetTokens** (2 connections) — `src/db/schema.ts`
- **projects** (2 connections) — `src/db/schema.ts`
- **ref_bcryptjs** (1 connections)
- *... and 7 more nodes in this community*

## Relationships

- [서버 액션과 작업 화면](서버_액션과_작업_화면.md) (19 shared connections)
- [ref_react](ref_react.md) (10 shared connections)
- [useChatTurn.ts](useChatTurn.ts.md) (7 shared connections)
- [설명 생성과 품질 검사](설명_생성과_품질_검사.md) (5 shared connections)
- [용어 사전 저장과 시드](용어_사전_저장과_시드.md) (5 shared connections)
- [환경 변수와 AI 상태 점검](환경_변수와_AI_상태_점검.md) (4 shared connections)
- [오른쪽 패널과 설명 화면](오른쪽_패널과_설명_화면.md) (3 shared connections)
- [pipeline.ts](pipeline.ts.md) (2 shared connections)
- [설명 모양·길이·서명](설명_모양·길이·서명.md) (1 shared connections)
- [경고 규칙과 점검](경고_규칙과_점검.md) (1 shared connections)
- [ExplainRepo](ExplainRepo.md) (1 shared connections)

## Source Files

- `src/db/client.ts`
- `src/db/schema.ts`
- `src/server/auth/mailer.ts`
- `src/server/auth/password.ts`
- `src/server/auth/reset.ts`
- `src/server/auth/signup.ts`
- `src/server/chat/messages.ts`
- `src/server/versions.ts`

## Audit Trail

- EXTRACTED: 117 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*