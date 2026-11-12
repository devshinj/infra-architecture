---
title: "chat/warnings.ts"
sidebar_position: 14
---
# chat/warnings.ts

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 34 nodes · cohesion 0.12

## Key Concepts

- **chat/warnings.ts** (36 connections) — `src/server/chat/warnings.ts`
- **checkWarnings()** (17 connections) — `src/server/chat/warnings.ts`
- **createJsonlParser()** (15 connections) — `src/server/llm/jsonl.ts`
- **checkCodeWarnings()** (13 connections) — `src/server/chat/warnings.ts`
- **Task 6: 대화 차례 — 프롬프트, 종류 검사, 망연계 추정 기록, 흐름 나누기, 경고 점검** (11 connections) — `docs/superpowers/plans/2026-11-06-network-knowledge-link-guess.md`
- **jsonl.ts** (11 connections) — `src/server/llm/jsonl.ts`
- **Task 2: 서버 점검 — Clef 판정과 Qwen 문구** (10 connections) — `docs/superpowers/plans/2026-10-30-infrasketch-phase3b-warnings.md`
- **파일 구조** (8 connections) — `docs/superpowers/plans/2026-10-30-infrasketch-phase3b-warnings.md`
- **judgeExposed()** (7 connections) — `src/server/chat/warnings.ts`
- **writeTexts()** (6 connections) — `src/server/chat/warnings.ts`
- **.streamCompletion()** (6 connections) — `src/server/llm/qwen.ts`
- **noulProbability()** (5 connections) — `src/server/llm/clef.ts`
- **Task 3: 대화 차례에 점검 단계 넣기** (4 connections) — `docs/superpowers/plans/2026-10-30-infrasketch-phase3b-warnings.md`
- **buildWarningMessages()** (4 connections) — `src/server/chat/prompt.ts`
- **carryExposed()** (4 connections) — `src/server/chat/warnings.ts`
- **mergeWarnings()** (4 connections) — `src/server/chat/warnings.ts`
- **.decide()** (4 connections) — `src/server/llm/clef.ts`
- **Task 6: smoke 와 가짜 AI 서버** (3 connections) — `docs/superpowers/plans/2026-10-30-infrasketch-phase3b-warnings.md`
- **describeTarget()** (3 connections) — `src/server/chat/warnings.ts`
- **flaggedPublic()** (3 connections) — `src/server/chat/warnings.ts`
- **isFixedText()** (3 connections) — `src/server/chat/warnings.ts`
- **unjudged()** (3 connections) — `src/server/chat/warnings.ts`
- **withFresh()** (3 connections) — `src/server/chat/warnings.ts`
- **scanLine()** (3 connections) — `src/server/llm/jsonl.ts`
- **step()** (3 connections) — `src/server/llm/jsonl.ts`
- *... and 9 more nodes in this community*

## Relationships

- [domain/warnings.ts](domain-warnings.ts.md) (10 shared connections)
- [pipeline.ts](pipeline.ts.md) (10 shared connections)
- [flowSuggest.ts](flowSuggest.ts.md) (5 shared connections)
- [prompt.ts](prompt.ts.md) (4 shared connections)
- [domain/apply.ts](domain-apply.ts.md) (4 shared connections)
- [mcp/apply.ts](mcp-apply.ts.md) (4 shared connections)
- [QwenClient](QwenClient.md) (4 shared connections)
- [drawing/rules.ts](drawing-rules.ts.md) (3 shared connections)
- [getOwnedDiagram](getOwnedDiagram.md) (3 shared connections)
- [useChatTurn.ts](useChatTurn.ts.md) (2 shared connections)
- [domain/explain.ts](domain-explain.ts.md) (2 shared connections)
- [types.ts](types.ts.md) (2 shared connections)

## Source Files

- `docs/superpowers/plans/2026-10-30-infrasketch-phase3b-warnings.md`
- `docs/superpowers/plans/2026-11-06-network-knowledge-link-guess.md`
- `src/domain/warnings.ts`
- `src/server/chat/prompt.ts`
- `src/server/chat/warnings.ts`
- `src/server/llm/clef.ts`
- `src/server/llm/jsonl.ts`
- `src/server/llm/qwen.ts`

## Audit Trail

- EXTRACTED: 100 (74%)
- INFERRED: 35 (26%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*