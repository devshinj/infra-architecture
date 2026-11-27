---
title: "password.ts"
sidebar_position: 70
---
# password.ts

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 20 nodes · cohesion 0.17

## Key Concepts

- **password.ts** (24 connections) — `src/server/auth/password.ts`
- **rateLimit.ts** (22 connections) — `src/server/auth/rateLimit.ts`
- **claimAttempt()** (10 connections) — `src/server/auth/rateLimit.ts`
- **normalizeUsername()** (9 connections) — `src/server/auth/rules.ts`
- **attemptLogin()** (6 connections) — `src/server/auth/password.ts`
- **clientIp()** (6 connections) — `src/server/auth/rateLimit.ts`
- **clearAttempts()** (5 connections) — `src/server/auth/rateLimit.ts`
- **users** (4 connections) — `src/db/schema.ts`
- **attemptKey** (4 connections) — `src/server/auth/rateLimit.ts`
- **LIMITS** (4 connections) — `src/server/auth/rateLimit.ts`
- **항목** (3 connections) — `docs/superpowers/specs/2026-11-27-security-small-fixes-design.md`
- **verifyCredentials()** (3 connections) — `src/server/auth/password.ts`
- **UNKNOWN_IP** (3 connections) — `src/server/auth/rateLimit.ts`
- **countRecent()** (2 connections) — `src/server/auth/rateLimit.ts`
- **Limit** (2 connections) — `src/server/auth/rateLimit.ts`
- **NO_RELEASE()** (2 connections) — `src/server/auth/rateLimit.ts`
- **ref_bcryptjs** (1 connections)
- **LoginResult** (1 connections) — `src/server/auth/password.ts`
- **VerifiedUser** (1 connections) — `src/server/auth/password.ts`
- **Claim** (1 connections) — `src/server/auth/rateLimit.ts`

## Relationships

- [auth/actions.ts](auth-actions.ts.md) (17 shared connections)
- [reset.ts](reset.ts.md) (11 shared connections)
- [projects.ts](projects.ts.md) (10 shared connections)
- [auth.ts](auth.ts.md) (5 shared connections)
- [mcp/route.ts](mcp-route.ts.md) (2 shared connections)
- [ResetPasswordForm.tsx](ResetPasswordForm.tsx.md) (2 shared connections)

## Source Files

- `docs/superpowers/specs/2026-11-27-security-small-fixes-design.md`
- `src/db/schema.ts`
- `src/server/auth/password.ts`
- `src/server/auth/rateLimit.ts`
- `src/server/auth/rules.ts`

## Audit Trail

- EXTRACTED: 76 (95%)
- INFERRED: 4 (5%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*