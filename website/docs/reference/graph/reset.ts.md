---
title: "reset.ts"
sidebar_position: 37
---
# reset.ts

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 28 nodes · cohesion 0.15

## Key Concepts

- **reset.ts** (32 connections) — `src/server/auth/reset.ts`
- **password.ts** (23 connections) — `src/server/auth/password.ts`
- **ref_drizzle_orm** (19 connections)
- **rateLimit.ts** (15 connections) — `src/server/auth/rateLimit.ts`
- **normalizeUsername()** (9 connections) — `src/server/auth/rules.ts`
- **attemptLogin()** (7 connections) — `src/server/auth/password.ts`
- **requestPasswordReset()** (7 connections) — `src/server/auth/reset.ts`
- **resetPassword()** (7 connections) — `src/server/auth/reset.ts`
- **[token]/page.tsx** (5 connections) — `src/app/(auth)/reset/[token]/page.tsx`
- **sendMail()** (5 connections) — `src/server/auth/mailer.ts`
- **hashPassword()** (5 connections) — `src/server/auth/password.ts`
- **clearAttempts()** (5 connections) — `src/server/auth/rateLimit.ts`
- **isLimited()** (5 connections) — `src/server/auth/rateLimit.ts`
- **recordAttempt()** (5 connections) — `src/server/auth/rateLimit.ts`
- **isResetTokenUsable()** (4 connections) — `src/server/auth/reset.ts`
- **sha256()** (4 connections) — `src/server/auth/reset.ts`
- **ResetPasswordPage()** (3 connections) — `src/app/(auth)/reset/[token]/page.tsx`
- **verifyCredentials()** (3 connections) — `src/server/auth/password.ts`
- **attemptKey** (3 connections) — `src/server/auth/rateLimit.ts`
- **LIMITS** (3 connections) — `src/server/auth/rateLimit.ts`
- **deliverResetLink()** (3 connections) — `src/server/auth/reset.ts`
- **authAttempts** (2 connections) — `src/db/schema.ts`
- **ref_bcryptjs** (1 connections)
- **LoginResult** (1 connections) — `src/server/auth/password.ts`
- **VerifiedUser** (1 connections) — `src/server/auth/password.ts`
- *... and 3 more nodes in this community*

## Relationships

- [auth/actions.ts](auth-actions.ts.md) (21 shared connections)
- [schema.ts](schema.ts.md) (14 shared connections)
- [ResetPasswordForm.tsx](ResetPasswordForm.tsx.md) (5 shared connections)
- [auth.ts](auth.ts.md) (5 shared connections)
- [env.ts](env.ts.md) (4 shared connections)
- [mcpKeys.ts](mcpKeys.ts.md) (2 shared connections)
- [auth](auth.md) (1 shared connections)
- [\[sessionId\]/route.ts]([sessionId]-route.ts.md) (1 shared connections)
- [설명 생성과 품질 검사](설명_생성과_품질_검사.md) (1 shared connections)
- [server/flows.ts](server-flows.ts.md) (1 shared connections)
- [flowSuggest.ts](flowSuggest.ts.md) (1 shared connections)
- [glossary.ts](glossary.ts.md) (1 shared connections)

## Source Files

- `src/app/(auth)/reset/[token]/page.tsx`
- `src/db/schema.ts`
- `src/server/auth/mailer.ts`
- `src/server/auth/password.ts`
- `src/server/auth/rateLimit.ts`
- `src/server/auth/reset.ts`
- `src/server/auth/rules.ts`

## Audit Trail

- EXTRACTED: 121 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*