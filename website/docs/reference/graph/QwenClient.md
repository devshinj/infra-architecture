---
title: "QwenClient"
sidebar_position: 70
---
# QwenClient

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 13 nodes · cohesion 0.15

## Key Concepts

- **QwenClient** (9 connections) — `src/server/llm/qwen.ts`
- **ClefClient** (8 connections) — `src/server/llm/clef.ts`
- **.streamCompletion()** (6 connections) — `src/server/llm/qwen.ts`
- **easeScore()** (5 connections) — `src/server/explain.ts`
- **.decide()** (4 connections) — `src/server/llm/clef.ts`
- **scoreValue()** (4 connections) — `src/server/llm/clef.ts`
- **complete()** (3 connections) — `src/server/explain.ts`
- **ExplainDeps** (3 connections) — `src/server/explain.ts`
- **complete()** (3 connections) — `src/server/flowSuggest.ts`
- **Task 9: 가짜 AI·smoke·E2E** (2 connections) — `docs/superpowers/plans/2026-10-30-infrasketch-phase3c1-explanations-glossary.md`
- **scoredText()** (2 connections) — `src/server/explain.ts`
- **FlowSuggestDeps** (2 connections) — `src/server/flowSuggest.ts`
- **.classifyIntent()** (1 connections) — `src/server/llm/clef.ts`

## Relationships

- [설명 생성과 품질 검사](설명_생성과_품질_검사.md) (9 shared connections)
- [domain/flows.ts](domain-flows.ts.md) (6 shared connections)
- [DiagramState](DiagramState.md) (4 shared connections)
- [pipeline.ts](pipeline.ts.md) (4 shared connections)
- [clef.ts](clef.ts.md) (2 shared connections)
- [3C-1 계획 작업 목록](3C-1_계획_작업_목록.md) (1 shared connections)
- [deps.ts](deps.ts.md) (1 shared connections)
- [domain/explain.ts](domain-explain.ts.md) (1 shared connections)

## Source Files

- `docs/superpowers/plans/2026-10-30-infrasketch-phase3c1-explanations-glossary.md`
- `src/server/explain.ts`
- `src/server/flowSuggest.ts`
- `src/server/llm/clef.ts`
- `src/server/llm/qwen.ts`

## Audit Trail

- EXTRACTED: 31 (78%)
- INFERRED: 9 (22%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*