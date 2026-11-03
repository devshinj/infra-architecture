---
title: "deps.ts"
sidebar_position: 27
---
# deps.ts

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 19 nodes · cohesion 0.17

## Key Concepts

- **deps.ts** (13 connections) — `src/server/chat/deps.ts`
- **qwen.ts** (12 connections) — `src/server/llm/qwen.ts`
- **defaultChatDeps()** (11 connections) — `src/server/chat/deps.ts`
- **config.ts** (7 connections) — `src/server/llm/config.ts`
- **llmConfig** (7 connections) — `src/server/llm/config.ts`
- **QwenClient** (7 connections) — `src/server/llm/qwen.ts`
- **createQwenClient()** (6 connections) — `src/server/llm/qwen.ts`
- **ChatDeps** (5 connections) — `src/server/chat/pipeline.ts`
- **Task 5: 설명 API** (4 connections) — `docs/superpowers/plans/2026-10-30-infrasketch-phase3c1-explanations-glossary.md`
- **parseEnv()** (3 connections) — `src/env.ts`
- **normalizeQwenBaseUrl()** (3 connections) — `src/server/llm/config.ts`
- **abortError()** (3 connections) — `src/server/llm/qwen.ts`
- **ChatMessage** (3 connections) — `src/server/llm/qwen.ts`
- **attempt()** (3 connections) — `src/server/llm/qwen.ts`
- **Qwen URL 정규화** (2 connections) — `docs/superpowers/specs/2026-10-29-infra-architecture-visualizer-design.md`
- **setChatDepsForTest()** (2 connections) — `src/server/chat/deps.ts`
- **isRetryable()** (2 connections) — `src/server/llm/qwen.ts`
- **ref_openai** (1 connections)
- **RETRY_DELAYS** (1 connections) — `src/server/llm/qwen.ts`

## Relationships

- [ask/route.ts](ask-route.ts.md) (6 shared connections)
- [설명 생성과 품질 검사](설명_생성과_품질_검사.md) (6 shared connections)
- [설계 문서와 계획](설계_문서와_계획.md) (4 shared connections)
- [pipeline.ts](pipeline.ts.md) (4 shared connections)
- [schema.ts](schema.ts.md) (3 shared connections)
- [clef.ts](clef.ts.md) (3 shared connections)
- [auth](auth.md) (3 shared connections)
- [chat/warnings.ts](chat-warnings.ts.md) (3 shared connections)
- [prompt.ts](prompt.ts.md) (2 shared connections)
- [3C-1 계획 작업 목록](3C-1_계획_작업_목록.md) (1 shared connections)
- [(app)/actions.ts](app-actions.ts.md) (1 shared connections)
- [ask.ts](ask.ts.md) (1 shared connections)

## Source Files

- `docs/superpowers/plans/2026-10-30-infrasketch-phase3c1-explanations-glossary.md`
- `docs/superpowers/specs/2026-10-29-infra-architecture-visualizer-design.md`
- `src/env.ts`
- `src/server/chat/deps.ts`
- `src/server/chat/pipeline.ts`
- `src/server/llm/config.ts`
- `src/server/llm/qwen.ts`

## Audit Trail

- EXTRACTED: 63 (95%)
- INFERRED: 3 (5%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*