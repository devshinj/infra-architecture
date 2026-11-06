---
title: "config.ts"
sidebar_position: 48
---
# config.ts

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 17 nodes · cohesion 0.19

## Key Concepts

- **env.ts** (7 connections) — `src/env.ts`
- **config.ts** (7 connections) — `src/server/llm/config.ts`
- **llmConfig** (7 connections) — `src/server/llm/config.ts`
- **health.ts** (7 connections) — `src/server/llm/health.ts`
- **health/route.ts** (6 connections) — `src/app/api/llm/health/route.ts`
- **mailer.ts** (5 connections) — `src/server/auth/mailer.ts`
- **checkLlmHealth()** (5 connections) — `src/server/llm/health.ts`
- **env** (4 connections) — `src/env.ts`
- **GET()** (3 connections) — `src/app/api/llm/health/route.ts`
- **parseEnv()** (3 connections) — `src/env.ts`
- **normalizeQwenBaseUrl()** (3 connections) — `src/server/llm/config.ts`
- **Qwen URL 정규화** (2 connections) — `docs/superpowers/specs/2026-10-29-infra-architecture-visualizer-design.md`
- **probe()** (2 connections) — `src/server/llm/health.ts`
- **ref_nodemailer** (1 connections)
- **envSchema** (1 connections) — `src/env.ts`
- **LlmHealth** (1 connections) — `src/server/llm/health.ts`
- **resetHealthCacheForTest()** (1 connections) — `src/server/llm/health.ts`

## Relationships

- [ask/route.ts](ask-route.ts.md) (4 shared connections)
- [reset.ts](reset.ts.md) (4 shared connections)
- [auth](auth.md) (2 shared connections)
- [InfraSketch 설계 문서](InfraSketch_설계_문서.md) (1 shared connections)
- [ref_react](ref_react.md) (1 shared connections)
- [auth.ts](auth.ts.md) (1 shared connections)

## Source Files

- `docs/superpowers/specs/2026-10-29-infra-architecture-visualizer-design.md`
- `src/app/api/llm/health/route.ts`
- `src/env.ts`
- `src/server/auth/mailer.ts`
- `src/server/llm/config.ts`
- `src/server/llm/health.ts`

## Audit Trail

- EXTRACTED: 39 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*