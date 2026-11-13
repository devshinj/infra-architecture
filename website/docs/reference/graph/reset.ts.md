---
title: "reset.ts"
sidebar_position: 59
---
# reset.ts

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 19 nodes · cohesion 0.17

## Key Concepts

- **reset.ts** (24 connections) — `src/server/auth/reset.ts`
- **ResetPasswordForm()** (11 connections) — `src/app/(auth)/reset/[token]/ResetPasswordForm.tsx`
- **env.ts** (8 connections) — `src/env.ts`
- **[token]/page.tsx** (5 connections) — `src/app/(auth)/reset/[token]/page.tsx`
- **env** (5 connections) — `src/env.ts`
- **mailer.ts** (5 connections) — `src/server/auth/mailer.ts`
- **sendMail()** (5 connections) — `src/server/auth/mailer.ts`
- **requestPasswordReset()** (5 connections) — `src/server/auth/reset.ts`
- **url.ts** (5 connections) — `src/server/mcp/url.ts`
- **isResetTokenUsable()** (4 connections) — `src/server/auth/reset.ts`
- **sha256()** (4 connections) — `src/server/auth/reset.ts`
- **ref_node_crypto** (3 connections)
- **ResetPasswordPage()** (3 connections) — `src/app/(auth)/reset/[token]/page.tsx`
- **validate()** (3 connections) — `src/app/(auth)/reset/[token]/ResetPasswordForm.tsx`
- **RESET_TTL_HOURS** (3 connections) — `src/server/auth/rules.ts`
- **passwordResetTokens** (2 connections) — `src/db/schema.ts`
- **ref_nodemailer** (1 connections)
- **envSchema** (1 connections) — `src/env.ts`
- **ResetResult** (1 connections) — `src/server/auth/reset.ts`

## Relationships

- [auth/actions.ts](auth-actions.ts.md) (13 shared connections)
- [ResetPasswordForm.tsx](ResetPasswordForm.tsx.md) (10 shared connections)
- [projects.ts](projects.ts.md) (4 shared connections)
- [env.ts](env.ts.md) (3 shared connections)
- [schema.ts](schema.ts.md) (2 shared connections)
- [server/network.ts](server-network.ts.md) (1 shared connections)
- [AuthStage.tsx](AuthStage.tsx.md) (1 shared connections)
- [explain/route.ts](explain-route.ts.md) (1 shared connections)
- [mcp/apply.ts](mcp-apply.ts.md) (1 shared connections)
- [read.ts](read.ts.md) (1 shared connections)
- [getOwnedDiagram](getOwnedDiagram.md) (1 shared connections)

## Source Files

- `src/app/(auth)/reset/[token]/ResetPasswordForm.tsx`
- `src/app/(auth)/reset/[token]/page.tsx`
- `src/db/schema.ts`
- `src/env.ts`
- `src/server/auth/mailer.ts`
- `src/server/auth/reset.ts`
- `src/server/auth/rules.ts`
- `src/server/mcp/url.ts`

## Audit Trail

- EXTRACTED: 66 (97%)
- INFERRED: 2 (3%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*