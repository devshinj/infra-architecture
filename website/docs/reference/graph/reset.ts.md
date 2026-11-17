---
title: "reset.ts"
sidebar_position: 41
---
# reset.ts

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 26 nodes · cohesion 0.16

## Key Concepts

- **reset.ts** (32 connections) — `src/server/auth/reset.ts`
- **password.ts** (23 connections) — `src/server/auth/password.ts`
- **rateLimit.ts** (15 connections) — `src/server/auth/rateLimit.ts`
- **normalizeUsername()** (9 connections) — `src/server/auth/rules.ts`
- **attemptLogin()** (7 connections) — `src/server/auth/password.ts`
- **requestPasswordReset()** (7 connections) — `src/server/auth/reset.ts`
- **[token]/page.tsx** (5 connections) — `src/app/(auth)/reset/[token]/page.tsx`
- **sendMail()** (5 connections) — `src/server/auth/mailer.ts`
- **clearAttempts()** (5 connections) — `src/server/auth/rateLimit.ts`
- **isLimited()** (5 connections) — `src/server/auth/rateLimit.ts`
- **recordAttempt()** (5 connections) — `src/server/auth/rateLimit.ts`
- **users** (4 connections) — `src/db/schema.ts`
- **isResetTokenUsable()** (4 connections) — `src/server/auth/reset.ts`
- **sha256()** (4 connections) — `src/server/auth/reset.ts`
- **ResetPasswordPage()** (3 connections) — `src/app/(auth)/reset/[token]/page.tsx`
- **verifyCredentials()** (3 connections) — `src/server/auth/password.ts`
- **attemptKey** (3 connections) — `src/server/auth/rateLimit.ts`
- **LIMITS** (3 connections) — `src/server/auth/rateLimit.ts`
- **deliverResetLink()** (3 connections) — `src/server/auth/reset.ts`
- **clientIp()** (2 connections) — `src/server/auth/rateLimit.ts`
- **ref_bcryptjs** (1 connections)
- **LoginResult** (1 connections) — `src/server/auth/password.ts`
- **VerifiedUser** (1 connections) — `src/server/auth/password.ts`
- **Limit** (1 connections) — `src/server/auth/rateLimit.ts`
- **Defer** (1 connections) — `src/server/auth/reset.ts`
- *... and 1 more nodes in this community*

## Relationships

- [auth/actions.ts](auth-actions.ts.md) (19 shared connections)
- [schema.ts](schema.ts.md) (15 shared connections)
- [ResetPasswordForm.tsx](ResetPasswordForm.tsx.md) (5 shared connections)
- [auth.ts](auth.ts.md) (5 shared connections)
- [env.ts](env.ts.md) (4 shared connections)
- [NotFoundError](NotFoundError.md) (1 shared connections)

## Source Files

- `src/app/(auth)/reset/[token]/page.tsx`
- `src/db/schema.ts`
- `src/server/auth/mailer.ts`
- `src/server/auth/password.ts`
- `src/server/auth/rateLimit.ts`
- `src/server/auth/reset.ts`
- `src/server/auth/rules.ts`

## Audit Trail

- EXTRACTED: 101 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*