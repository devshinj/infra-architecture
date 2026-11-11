---
title: "auth/actions.ts"
sidebar_position: 22
---
# auth/actions.ts

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 31 nodes · cohesion 0.13

## Key Concepts

- **reset.ts** (24 connections) — `src/server/auth/reset.ts`
- **auth/rules.ts** (20 connections) — `src/server/auth/rules.ts`
- **signup.ts** (18 connections) — `src/server/auth/signup.ts`
- **password.ts** (13 connections) — `src/server/auth/password.ts`
- **checkNewPassword()** (9 connections) — `src/server/auth/rules.ts`
- **signup()** (9 connections) — `src/server/auth/signup.ts`
- **normalizeUsername()** (8 connections) — `src/server/auth/rules.ts`
- **resetPassword()** (6 connections) — `src/server/auth/reset.ts`
- **checkUsername()** (6 connections) — `src/server/auth/rules.ts`
- **MESSAGES** (6 connections) — `src/server/auth/rules.ts`
- **[token]/page.tsx** (5 connections) — `src/app/(auth)/reset/[token]/page.tsx`
- **validate()** (5 connections) — `src/app/(auth)/signup/page.tsx`
- **sendMail()** (5 connections) — `src/server/auth/mailer.ts`
- **hashPassword()** (5 connections) — `src/server/auth/password.ts`
- **requestPasswordReset()** (5 connections) — `src/server/auth/reset.ts`
- **users** (4 connections) — `src/db/schema.ts`
- **isResetTokenUsable()** (4 connections) — `src/server/auth/reset.ts`
- **sha256()** (4 connections) — `src/server/auth/reset.ts`
- **ref_node_crypto** (3 connections)
- **ResetPasswordPage()** (3 connections) — `src/app/(auth)/reset/[token]/page.tsx`
- **verifyCredentials()** (3 connections) — `src/server/auth/password.ts`
- **HINTS** (3 connections) — `src/server/auth/rules.ts`
- **RESET_TTL_HOURS** (3 connections) — `src/server/auth/rules.ts`
- **ref_bcryptjs** (1 connections)
- **ResetResult** (1 connections) — `src/server/auth/reset.ts`
- *... and 6 more nodes in this community*

## Relationships

- [ResetPasswordForm.tsx](ResetPasswordForm.tsx.md) (20 shared connections)
- [auth/actions.ts](auth-actions.ts.md) (17 shared connections)
- [schema.ts](schema.ts.md) (15 shared connections)
- [env.ts](env.ts.md) (4 shared connections)
- [auth.ts](auth.ts.md) (2 shared connections)
- [server/network.ts](server-network.ts.md) (1 shared connections)

## Source Files

- `src/app/(auth)/reset/[token]/page.tsx`
- `src/app/(auth)/signup/page.tsx`
- `src/db/schema.ts`
- `src/server/auth/mailer.ts`
- `src/server/auth/password.ts`
- `src/server/auth/reset.ts`
- `src/server/auth/rules.ts`
- `src/server/auth/signup.ts`

## Audit Trail

- EXTRACTED: 118 (99%)
- INFERRED: 1 (1%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*