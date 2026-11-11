---
title: "deps.ts"
sidebar_position: 27
---
# deps.ts

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 26 nodes · cohesion 0.12

## Key Concepts

- **deps.ts** (14 connections) — `src/server/chat/deps.ts`
- **defaultChatDeps()** (13 connections) — `src/server/chat/deps.ts`
- **qwen.ts** (13 connections) — `src/server/llm/qwen.ts`
- **config.ts** (7 connections) — `src/server/llm/config.ts`
- **llmConfig** (7 connections) — `src/server/llm/config.ts`
- **health.ts** (7 connections) — `src/server/llm/health.ts`
- **health/route.ts** (6 connections) — `src/app/api/llm/health/route.ts`
- **createQwenClient()** (6 connections) — `src/server/llm/qwen.ts`
- **checkLlmHealth()** (5 connections) — `src/server/llm/health.ts`
- **Task 5: 설명 API** (4 connections) — `docs/superpowers/plans/2026-10-30-infrasketch-phase3c1-explanations-glossary.md`
- **ChatMessage** (4 connections) — `src/server/llm/qwen.ts`
- **GET()** (3 connections) — `src/app/api/llm/health/route.ts`
- **parseEnv()** (3 connections) — `src/env.ts`
- **resolveDeps()** (3 connections) — `src/server/explain.ts`
- **resolveDeps()** (3 connections) — `src/server/flowSuggest.ts`
- **normalizeQwenBaseUrl()** (3 connections) — `src/server/llm/config.ts`
- **abortError()** (3 connections) — `src/server/llm/qwen.ts`
- **attempt()** (3 connections) — `src/server/llm/qwen.ts`
- **Qwen URL 정규화** (2 connections) — `docs/superpowers/specs/2026-10-29-infra-architecture-visualizer-design.md`
- **setChatDepsForTest()** (2 connections) — `src/server/chat/deps.ts`
- **probe()** (2 connections) — `src/server/llm/health.ts`
- **isRetryable()** (2 connections) — `src/server/llm/qwen.ts`
- **ref_openai** (1 connections)
- **LlmHealth** (1 connections) — `src/server/llm/health.ts`
- **resetHealthCacheForTest()** (1 connections) — `src/server/llm/health.ts`
- *... and 1 more nodes in this community*

## Relationships

- [pipeline.ts](pipeline.ts.md) (10 shared connections)
- [설명 생성과 품질 검사](설명_생성과_품질_검사.md) (6 shared connections)
- [schema.ts](schema.ts.md) (5 shared connections)
- [ref_react](ref_react.md) (4 shared connections)
- [clef.ts](clef.ts.md) (3 shared connections)
- [InfraSketch 설계 문서](InfraSketch_설계_문서.md) (2 shared connections)
- [auth](auth.md) (2 shared connections)
- [prompt.ts](prompt.ts.md) (2 shared connections)
- [3C-1 계획 작업 목록](3C-1_계획_작업_목록.md) (1 shared connections)
- [getOwnedDiagram](getOwnedDiagram.md) (1 shared connections)
- [auth.ts](auth.ts.md) (1 shared connections)
- [suggestFlows](suggestFlows.md) (1 shared connections)

## Source Files

- `docs/superpowers/plans/2026-10-30-infrasketch-phase3c1-explanations-glossary.md`
- `docs/superpowers/specs/2026-10-29-infra-architecture-visualizer-design.md`
- `src/app/api/llm/health/route.ts`
- `src/env.ts`
- `src/server/chat/deps.ts`
- `src/server/explain.ts`
- `src/server/flowSuggest.ts`
- `src/server/llm/config.ts`
- `src/server/llm/health.ts`
- `src/server/llm/qwen.ts`

## Audit Trail

- EXTRACTED: 76 (96%)
- INFERRED: 3 (4%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*