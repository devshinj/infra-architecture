---
title: "auth/actions.ts"
sidebar_position: 48
---
# auth/actions.ts

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 21 nodes · cohesion 0.20

## Key Concepts

- **auth/rules.ts** (20 connections) — `src/server/auth/rules.ts`
- **signup.ts** (18 connections) — `src/server/auth/signup.ts`
- **password.ts** (13 connections) — `src/server/auth/password.ts`
- **checkEmail()** (10 connections) — `src/server/auth/rules.ts`
- **checkNewPassword()** (9 connections) — `src/server/auth/rules.ts`
- **signup()** (9 connections) — `src/server/auth/signup.ts`
- **normalizeUsername()** (8 connections) — `src/server/auth/rules.ts`
- **checkUsername()** (6 connections) — `src/server/auth/rules.ts`
- **MESSAGES** (6 connections) — `src/server/auth/rules.ts`
- **normalizeEmail()** (6 connections) — `src/server/auth/rules.ts`
- **validate()** (5 connections) — `src/app/(auth)/signup/page.tsx`
- **hashPassword()** (5 connections) — `src/server/auth/password.ts`
- **users** (4 connections) — `src/db/schema.ts`
- **verifyCredentials()** (3 connections) — `src/server/auth/password.ts`
- **ref_bcryptjs** (1 connections)
- **EMAIL_PATTERN** (1 connections) — `src/server/auth/rules.ts`
- **PASSWORD_MAX_BYTES** (1 connections) — `src/server/auth/rules.ts`
- **PASSWORD_MIN** (1 connections) — `src/server/auth/rules.ts`
- **USERNAME_PATTERN** (1 connections) — `src/server/auth/rules.ts`
- **SignupInput** (1 connections) — `src/server/auth/signup.ts`
- **SignupResult** (1 connections) — `src/server/auth/signup.ts`

## Relationships

- [ResetPasswordForm.tsx](ResetPasswordForm.tsx.md) (19 shared connections)
- [auth/actions.ts](auth-actions.ts.md) (9 shared connections)
- [reset.ts](reset.ts.md) (8 shared connections)
- [projects.ts](projects.ts.md) (6 shared connections)
- [schema.ts](schema.ts.md) (3 shared connections)
- [auth.ts](auth.ts.md) (2 shared connections)

## Source Files

- `src/app/(auth)/signup/page.tsx`
- `src/db/schema.ts`
- `src/server/auth/password.ts`
- `src/server/auth/rules.ts`
- `src/server/auth/signup.ts`

## Audit Trail

- EXTRACTED: 87 (99%)
- INFERRED: 1 (1%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*