---
title: "reset.ts"
sidebar_position: 20
---
# reset.ts

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 23 nodes · cohesion 0.16

## Key Concepts

- **reset.ts** (24 connections) — `src/server/auth/reset.ts`
- **ResetPasswordForm.tsx** (20 connections) — `src/app/(auth)/reset/[token]/ResetPasswordForm.tsx`
- **rules.ts** (20 connections) — `src/server/auth/rules.ts`
- **ResetPasswordForm()** (9 connections) — `src/app/(auth)/reset/[token]/ResetPasswordForm.tsx`
- **checkNewPassword()** (9 connections) — `src/server/auth/rules.ts`
- **resetPassword()** (6 connections) — `src/server/auth/reset.ts`
- **MESSAGES** (6 connections) — `src/server/auth/rules.ts`
- **[token]/page.tsx** (5 connections) — `src/app/(auth)/reset/[token]/page.tsx`
- **sendMail()** (5 connections) — `src/server/auth/mailer.ts`
- **hashPassword()** (5 connections) — `src/server/auth/password.ts`
- **requestPasswordReset()** (5 connections) — `src/server/auth/reset.ts`
- **isResetTokenUsable()** (4 connections) — `src/server/auth/reset.ts`
- **sha256()** (4 connections) — `src/server/auth/reset.ts`
- **ResetPasswordPage()** (3 connections) — `src/app/(auth)/reset/[token]/page.tsx`
- **validate()** (3 connections) — `src/app/(auth)/reset/[token]/ResetPasswordForm.tsx`
- **HINTS** (3 connections) — `src/server/auth/rules.ts`
- **RESET_TTL_HOURS** (3 connections) — `src/server/auth/rules.ts`
- **ref_node_crypto** (1 connections)
- **ResetResult** (1 connections) — `src/server/auth/reset.ts`
- **EMAIL_PATTERN** (1 connections) — `src/server/auth/rules.ts`
- **PASSWORD_MAX_BYTES** (1 connections) — `src/server/auth/rules.ts`
- **PASSWORD_MIN** (1 connections) — `src/server/auth/rules.ts`
- **USERNAME_PATTERN** (1 connections) — `src/server/auth/rules.ts`

## Relationships

- [signup/page.tsx](signup-page.tsx.md) (25 shared connections)
- [schema.ts](schema.ts.md) (14 shared connections)
- [auth/actions.ts](auth-actions.ts.md) (11 shared connections)
- [ask/route.ts](ask-route.ts.md) (4 shared connections)
- [ref_next](ref_next.md) (1 shared connections)
- [ref_react](ref_react.md) (1 shared connections)

## Source Files

- `src/app/(auth)/reset/[token]/ResetPasswordForm.tsx`
- `src/app/(auth)/reset/[token]/page.tsx`
- `src/server/auth/mailer.ts`
- `src/server/auth/password.ts`
- `src/server/auth/reset.ts`
- `src/server/auth/rules.ts`

## Audit Trail

- EXTRACTED: 96 (98%)
- INFERRED: 2 (2%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*