---
title: "QwenClient"
sidebar_position: 88
---
# QwenClient

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 6 nodes · cohesion 0.40

## Key Concepts

- **QwenClient** (9 connections) — `src/server/llm/qwen.ts`
- **ClefClient** (8 connections) — `src/server/llm/clef.ts`
- **ChatDeps** (5 connections) — `src/server/chat/pipeline.ts`
- **ExplainDeps** (3 connections) — `src/server/explain.ts`
- **FlowSuggestDeps** (2 connections) — `src/server/flowSuggest.ts`
- **.classifyIntent()** (1 connections) — `src/server/llm/clef.ts`

## Relationships

- [pipeline.ts](pipeline.ts.md) (3 shared connections)
- [설명 생성과 품질 검사](설명_생성과_품질_검사.md) (3 shared connections)
- [deps.ts](deps.ts.md) (2 shared connections)
- [flowSuggest.ts](flowSuggest.ts.md) (2 shared connections)
- [chat/warnings.ts](chat-warnings.ts.md) (2 shared connections)
- [ask.ts](ask.ts.md) (1 shared connections)
- [clef.ts](clef.ts.md) (1 shared connections)
- [Task 2: 서버 점검 — Clef 판정과 Qwen 문구](Task_2-_서버_점검_—_Clef_판정과_Qwen_문구.md) (1 shared connections)
- [3C-1 계획 작업 목록](3C-1_계획_작업_목록.md) (1 shared connections)

## Source Files

- `src/server/chat/pipeline.ts`
- `src/server/explain.ts`
- `src/server/flowSuggest.ts`
- `src/server/llm/clef.ts`
- `src/server/llm/qwen.ts`

## Audit Trail

- EXTRACTED: 22 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*