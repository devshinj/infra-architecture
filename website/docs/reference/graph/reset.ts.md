---
title: "reset.ts"
sidebar_position: 27
---
# reset.ts

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 39 nodes · cohesion 0.12

## Key Concepts

- **reset.ts** (32 connections) — `src/server/auth/reset.ts`
- **client.ts** (27 connections) — `src/db/client.ts`
- **signup.ts** (24 connections) — `src/server/auth/signup.ts`
- **password.ts** (23 connections) — `src/server/auth/password.ts`
- **ref_drizzle_orm** (21 connections)
- **db** (21 connections) — `src/db/client.ts`
- **rateLimit.ts** (18 connections) — `src/server/auth/rateLimit.ts`
- **normalizeUsername()** (9 connections) — `src/server/auth/rules.ts`
- **attemptLogin()** (7 connections) — `src/server/auth/password.ts`
- **isLimited()** (7 connections) — `src/server/auth/rateLimit.ts`
- **recordAttempt()** (7 connections) — `src/server/auth/rateLimit.ts`
- **requestPasswordReset()** (7 connections) — `src/server/auth/reset.ts`
- **resetPassword()** (7 connections) — `src/server/auth/reset.ts`
- **checkUsername()** (6 connections) — `src/server/auth/rules.ts`
- **[token]/page.tsx** (5 connections) — `src/app/(auth)/reset/[token]/page.tsx`
- **sendMail()** (5 connections) — `src/server/auth/mailer.ts`
- **hashPassword()** (5 connections) — `src/server/auth/password.ts`
- **clearAttempts()** (5 connections) — `src/server/auth/rateLimit.ts`
- **users** (4 connections) — `src/db/schema.ts`
- **attemptKey** (4 connections) — `src/server/auth/rateLimit.ts`
- **LIMITS** (4 connections) — `src/server/auth/rateLimit.ts`
- **isResetTokenUsable()** (4 connections) — `src/server/auth/reset.ts`
- **sha256()** (4 connections) — `src/server/auth/reset.ts`
- **ResetPasswordPage()** (3 connections) — `src/app/(auth)/reset/[token]/page.tsx`
- **verifyCredentials()** (3 connections) — `src/server/auth/password.ts`
- *... and 14 more nodes in this community*

## Relationships

- [auth/actions.ts](auth-actions.ts.md) (16 shared connections)
- [start.ts](start.ts.md) (13 shared connections)
- [ResetPasswordForm.tsx](ResetPasswordForm.tsx.md) (10 shared connections)
- [auth/rules.ts](auth-rules.ts.md) (8 shared connections)
- [getOwnedDiagram](getOwnedDiagram.md) (7 shared connections)
- [\[sessionId\]/route.ts]([sessionId]-route.ts.md) (6 shared connections)
- [mcp/apply.ts](mcp-apply.ts.md) (6 shared connections)
- [mcpKeys.ts](mcpKeys.ts.md) (4 shared connections)
- [deps.ts](deps.ts.md) (4 shared connections)
- [auth.ts](auth.ts.md) (4 shared connections)
- [설명 생성과 품질 검사](설명_생성과_품질_검사.md) (3 shared connections)
- [flowSuggest.ts](flowSuggest.ts.md) (3 shared connections)

## Source Files

- `src/app/(auth)/reset/[token]/page.tsx`
- `src/db/client.ts`
- `src/db/schema.ts`
- `src/server/auth/mailer.ts`
- `src/server/auth/password.ts`
- `src/server/auth/rateLimit.ts`
- `src/server/auth/reset.ts`
- `src/server/auth/rules.ts`
- `src/server/auth/signup.ts`

## Audit Trail

- EXTRACTED: 191 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*