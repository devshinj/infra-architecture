---
title: "deps.ts"
sidebar_position: 64
---
# deps.ts

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 14 nodes · cohesion 0.18

## Key Concepts

- **qwen.ts** (13 connections) — `src/server/llm/qwen.ts`
- **QwenClient** (9 connections) — `src/server/llm/qwen.ts`
- **createQwenClient()** (6 connections) — `src/server/llm/qwen.ts`
- **.streamCompletion()** (6 connections) — `src/server/llm/qwen.ts`
- **ChatMessage** (4 connections) — `src/server/llm/qwen.ts`
- **complete()** (3 connections) — `src/server/explain.ts`
- **ExplainDeps** (3 connections) — `src/server/explain.ts`
- **complete()** (3 connections) — `src/server/flowSuggest.ts`
- **abortError()** (3 connections) — `src/server/llm/qwen.ts`
- **attempt()** (3 connections) — `src/server/llm/qwen.ts`
- **FlowSuggestDeps** (2 connections) — `src/server/flowSuggest.ts`
- **isRetryable()** (2 connections) — `src/server/llm/qwen.ts`
- **ref_openai** (1 connections)
- **RETRY_DELAYS** (1 connections) — `src/server/llm/qwen.ts`

## Relationships

- [설명 생성과 품질 검사](설명_생성과_품질_검사.md) (6 shared connections)
- [DiagramState](DiagramState.md) (6 shared connections)
- [pipeline.ts](pipeline.ts.md) (4 shared connections)
- [domain/flows.ts](domain-flows.ts.md) (4 shared connections)
- [env.ts](env.ts.md) (2 shared connections)
- [prompt.ts](prompt.ts.md) (2 shared connections)
- [3C-1 계획 작업 목록](3C-1_계획_작업_목록.md) (1 shared connections)
- [InfraSketch 설계 문서](InfraSketch_설계_문서.md) (1 shared connections)
- [domain/explain.ts](domain-explain.ts.md) (1 shared connections)

## Source Files

- `src/server/explain.ts`
- `src/server/flowSuggest.ts`
- `src/server/llm/qwen.ts`

## Audit Trail

- EXTRACTED: 38 (88%)
- INFERRED: 5 (12%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*