---
title: "domain/warnings.ts"
sidebar_position: 6
---
# domain/warnings.ts

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 49 nodes · cohesion 0.08

## Key Concepts

- **domain/warnings.ts** (26 connections) — `src/domain/warnings.ts`
- **chat/warnings.ts** (25 connections) — `src/server/chat/warnings.ts`
- **createJsonlParser()** (15 connections) — `src/server/llm/jsonl.ts`
- **qwen.ts** (13 connections) — `src/server/llm/qwen.ts`
- **evaluateRules()** (11 connections) — `src/domain/warnings.ts`
- **jsonl.ts** (11 connections) — `src/server/llm/jsonl.ts`
- **Task 2: 서버 점검 — Clef 판정과 Qwen 문구** (10 connections) — `docs/superpowers/plans/2026-10-30-infrasketch-phase3b-warnings.md`
- **checkWarnings()** (9 connections) — `src/server/chat/warnings.ts`
- **QwenClient** (9 connections) — `src/server/llm/qwen.ts`
- **파일 구조** (8 connections) — `docs/superpowers/plans/2026-10-30-infrasketch-phase3b-warnings.md`
- **ClefClient** (8 connections) — `src/server/llm/clef.ts`
- **categoryOf()** (7 connections) — `src/domain/catalog.ts`
- **judgeExposed()** (7 connections) — `src/server/chat/warnings.ts`
- **createQwenClient()** (6 connections) — `src/server/llm/qwen.ts`
- **.streamCompletion()** (6 connections) — `src/server/llm/qwen.ts`
- **writeTexts()** (5 connections) — `src/server/chat/warnings.ts`
- **noulProbability()** (5 connections) — `src/server/llm/clef.ts`
- **Task 3: 대화 차례에 점검 단계 넣기** (4 connections) — `docs/superpowers/plans/2026-10-30-infrasketch-phase3b-warnings.md`
- **WarningLevel** (4 connections) — `src/domain/types.ts`
- **buildWarningMessages()** (4 connections) — `src/server/chat/prompt.ts`
- **.decide()** (4 connections) — `src/server/llm/clef.ts`
- **ChatMessage** (4 connections) — `src/server/llm/qwen.ts`
- **Task 6: smoke 와 가짜 AI 서버** (3 connections) — `docs/superpowers/plans/2026-10-30-infrasketch-phase3b-warnings.md`
- **Rule** (3 connections) — `src/domain/warnings.ts`
- **carryExposed()** (3 connections) — `src/server/chat/warnings.ts`
- *... and 24 more nodes in this community*

## Relationships

- [pipeline.ts](pipeline.ts.md) (15 shared connections)
- [flowSuggest.ts](flowSuggest.ts.md) (11 shared connections)
- [types.ts](types.ts.md) (7 shared connections)
- [설명 생성과 품질 검사](설명_생성과_품질_검사.md) (7 shared connections)
- [prompt.ts](prompt.ts.md) (5 shared connections)
- [Flow](Flow.md) (5 shared connections)
- [ask/route.ts](ask-route.ts.md) (5 shared connections)
- [NodeInfo.tsx](NodeInfo.tsx.md) (3 shared connections)
- [domain/flows.ts](domain-flows.ts.md) (3 shared connections)
- [missing.ts](missing.ts.md) (3 shared connections)
- [useExplanations.ts](useExplanations.ts.md) (2 shared connections)
- [projects.ts](projects.ts.md) (2 shared connections)

## Source Files

- `docs/superpowers/plans/2026-10-30-infrasketch-phase3b-warnings.md`
- `src/domain/catalog.ts`
- `src/domain/types.ts`
- `src/domain/warnings.ts`
- `src/server/chat/prompt.ts`
- `src/server/chat/warnings.ts`
- `src/server/explain.ts`
- `src/server/flowSuggest.ts`
- `src/server/llm/clef.ts`
- `src/server/llm/jsonl.ts`
- `src/server/llm/qwen.ts`

## Audit Trail

- EXTRACTED: 146 (87%)
- INFERRED: 21 (13%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*