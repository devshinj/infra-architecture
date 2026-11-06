---
title: "reset.ts"
sidebar_position: 57
---
# reset.ts

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 14 nodes · cohesion 0.24

## Key Concepts

- **reset.ts** (24 connections) — `src/server/auth/reset.ts`
- **ResetPasswordForm()** (9 connections) — `src/app/(auth)/reset/[token]/ResetPasswordForm.tsx`
- **checkNewPassword()** (9 connections) — `src/server/auth/rules.ts`
- **resetPassword()** (6 connections) — `src/server/auth/reset.ts`
- **[token]/page.tsx** (5 connections) — `src/app/(auth)/reset/[token]/page.tsx`
- **sendMail()** (5 connections) — `src/server/auth/mailer.ts`
- **requestPasswordReset()** (5 connections) — `src/server/auth/reset.ts`
- **isResetTokenUsable()** (4 connections) — `src/server/auth/reset.ts`
- **sha256()** (4 connections) — `src/server/auth/reset.ts`
- **ResetPasswordPage()** (3 connections) — `src/app/(auth)/reset/[token]/page.tsx`
- **validate()** (3 connections) — `src/app/(auth)/reset/[token]/ResetPasswordForm.tsx`
- **passwordResetTokens** (2 connections) — `src/db/schema.ts`
- **ref_node_crypto** (1 connections)
- **ResetResult** (1 connections) — `src/server/auth/reset.ts`

## Relationships

- [ref_react](ref_react.md) (10 shared connections)
- [rules.ts](rules.ts.md) (10 shared connections)
- [auth/actions.ts](auth-actions.ts.md) (6 shared connections)
- [schema.ts](schema.ts.md) (5 shared connections)
- [config.ts](config.ts.md) (4 shared connections)

## Source Files

- `src/app/(auth)/reset/[token]/ResetPasswordForm.tsx`
- `src/app/(auth)/reset/[token]/page.tsx`
- `src/db/schema.ts`
- `src/server/auth/mailer.ts`
- `src/server/auth/reset.ts`
- `src/server/auth/rules.ts`

## Audit Trail

- EXTRACTED: 56 (97%)
- INFERRED: 2 (3%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*