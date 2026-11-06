---
title: "auth"
sidebar_position: 80
---
# auth

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 23 nodes · cohesion 0.14

## Key Concepts

- **auth** (28 connections) — `src/auth.ts`
- **auth.ts** (24 connections) — `src/auth.ts`
- **ref_zod** (8 connections)
- **env.ts** (7 connections) — `src/env.ts`
- **config.ts** (7 connections) — `src/server/llm/config.ts`
- **llmConfig** (7 connections) — `src/server/llm/config.ts`
- **health.ts** (7 connections) — `src/server/llm/health.ts`
- **health/route.ts** (6 connections) — `src/app/api/llm/health/route.ts`
- **mailer.ts** (5 connections) — `src/server/auth/mailer.ts`
- **sendMail()** (5 connections) — `src/server/auth/mailer.ts`
- **checkLlmHealth()** (5 connections) — `src/server/llm/health.ts`
- **env** (4 connections) — `src/env.ts`
- **GET()** (3 connections) — `src/app/api/llm/health/route.ts`
- **parseEnv()** (3 connections) — `src/env.ts`
- **verifyCredentials()** (3 connections) — `src/server/auth/password.ts`
- **normalizeQwenBaseUrl()** (3 connections) — `src/server/llm/config.ts`
- **[...nextauth]/route.ts** (2 connections) — `src/app/api/auth/[...nextauth]/route.ts`
- **handlers** (2 connections) — `src/auth.ts`
- **probe()** (2 connections) — `src/server/llm/health.ts`
- **ref_nodemailer** (1 connections)
- **envSchema** (1 connections) — `src/env.ts`
- **LlmHealth** (1 connections) — `src/server/llm/health.ts`
- **resetHealthCacheForTest()** (1 connections) — `src/server/llm/health.ts`

## Relationships

- [ask/route.ts](ask-route.ts.md) (10 shared connections)
- [\[sessionId\]/route.ts]([sessionId]-route.ts.md) (10 shared connections)
- [projects.ts](projects.ts.md) (10 shared connections)
- [ref_react](ref_react.md) (8 shared connections)
- [auth](auth.md) (6 shared connections)
- [explain/route.ts](explain-route.ts.md) (5 shared connections)
- [suggest/route.ts](suggest-route.ts.md) (4 shared connections)
- [(app)/actions.ts](app-actions.ts.md) (4 shared connections)
- [GlossaryPage.tsx](GlossaryPage.tsx.md) (3 shared connections)
- [commands.ts](commands.ts.md) (1 shared connections)
- [ask.ts](ask.ts.md) (1 shared connections)
- [InfraSketch 설계 문서](InfraSketch_설계_문서.md) (1 shared connections)

## Source Files

- `src/app/api/auth/[...nextauth]/route.ts`
- `src/app/api/llm/health/route.ts`
- `src/auth.ts`
- `src/env.ts`
- `src/server/auth/mailer.ts`
- `src/server/auth/password.ts`
- `src/server/llm/config.ts`
- `src/server/llm/health.ts`

## Audit Trail

- EXTRACTED: 99 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*