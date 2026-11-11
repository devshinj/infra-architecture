---
title: "env.ts"
sidebar_position: 50
---
# env.ts

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 19 nodes · cohesion 0.18

## Key Concepts

- **deps.ts** (14 connections) — `src/server/chat/deps.ts`
- **env.ts** (8 connections) — `src/env.ts`
- **config.ts** (7 connections) — `src/server/llm/config.ts`
- **llmConfig** (7 connections) — `src/server/llm/config.ts`
- **health.ts** (7 connections) — `src/server/llm/health.ts`
- **health/route.ts** (6 connections) — `src/app/api/llm/health/route.ts`
- **env** (5 connections) — `src/env.ts`
- **mailer.ts** (5 connections) — `src/server/auth/mailer.ts`
- **checkLlmHealth()** (5 connections) — `src/server/llm/health.ts`
- **url.ts** (5 connections) — `src/server/mcp/url.ts`
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

- [auth/actions.ts](auth-actions.ts.md) (4 shared connections)
- [auth](auth.md) (3 shared connections)
- [pipeline.ts](pipeline.ts.md) (3 shared connections)
- [3C-1 계획 작업 목록](3C-1_계획_작업_목록.md) (3 shared connections)
- [InfraSketch 설계 문서](InfraSketch_설계_문서.md) (2 shared connections)
- [auth.ts](auth.ts.md) (2 shared connections)
- [deps.ts](deps.ts.md) (2 shared connections)
- [ask/route.ts](ask-route.ts.md) (2 shared connections)
- [설명 생성과 품질 검사](설명_생성과_품질_검사.md) (1 shared connections)
- [DiagramState](DiagramState.md) (1 shared connections)
- [mcp/apply.ts](mcp-apply.ts.md) (1 shared connections)
- [drawing/rules.ts](drawing-rules.ts.md) (1 shared connections)

## Source Files

- `docs/superpowers/specs/2026-10-29-infra-architecture-visualizer-design.md`
- `src/app/api/llm/health/route.ts`
- `src/env.ts`
- `src/server/auth/mailer.ts`
- `src/server/chat/deps.ts`
- `src/server/llm/config.ts`
- `src/server/llm/health.ts`
- `src/server/mcp/url.ts`

## Audit Trail

- EXTRACTED: 56 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*