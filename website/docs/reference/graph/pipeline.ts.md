---
title: "pipeline.ts"
sidebar_position: 7
---
# pipeline.ts

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 42 nodes · cohesion 0.11

## Key Concepts

- **pipeline.ts** (94 connections) — `src/server/chat/pipeline.ts`
- **ask.ts** (54 connections) — `src/server/chat/ask.ts`
- **lockedTurn()** (35 connections) — `src/server/chat/pipeline.ts`
- **intent.ts** (13 connections) — `src/server/chat/intent.ts`
- **askInSession()** (12 connections) — `src/server/chat/ask.ts`
- **MessageMeta** (12 connections) — `src/server/chat/events.ts`
- **listMessages()** (12 connections) — `src/server/chat/messages.ts`
- **Task 2: 질문 차례(서버)** (9 connections) — `docs/superpowers/plans/2026-11-01-infrasketch-phase3c2-ask-node.md`
- **createThinkStripper()** (9 connections) — `src/server/llm/think.ts`
- **createMessage()** (7 connections) — `src/server/chat/messages.ts`
- **pickFlows()** (7 connections) — `src/server/flowSuggest.ts`
- **parseCommand()** (6 connections) — `src/domain/commands.ts`
- **resolveIntent()** (6 connections) — `src/server/chat/intent.ts`
- **buildAskMessages()** (6 connections) — `src/server/chat/prompt.ts`
- **touchSession()** (6 connections) — `src/server/chat/sessions.ts`
- **cachedNodeExplanation()** (6 connections) — `src/server/explain.ts`
- **toFlowOp()** (5 connections) — `src/domain/commands.ts`
- **streamFailure()** (5 connections) — `src/server/chat/pipeline.ts`
- **skips.ts** (5 connections) — `src/server/chat/skips.ts`
- **Intent** (5 connections) — `src/server/llm/clef.ts`
- **think.ts** (5 connections) — `src/server/llm/think.ts`
- **turnSignals()** (4 connections) — `src/server/chat/pipeline.ts`
- **parseMentions()** (4 connections) — `src/server/chat/prompt.ts`
- **isAssumptionChangeMessage()** (3 connections) — `src/domain/assumptions.ts`
- **asksStepText()** (3 connections) — `src/domain/flows.ts`
- *... and 17 more nodes in this community*

## Relationships

- [projects.ts](projects.ts.md) (23 shared connections)
- [runAskTurn](runAskTurn.md) (21 shared connections)
- [ask/route.ts](ask-route.ts.md) (17 shared connections)
- [domain/warnings.ts](domain-warnings.ts.md) (12 shared connections)
- [types.ts](types.ts.md) (11 shared connections)
- [\[sessionId\]/route.ts]([sessionId]-route.ts.md) (10 shared connections)
- [prompt.ts](prompt.ts.md) (10 shared connections)
- [schema.ts](schema.ts.md) (9 shared connections)
- [flowSuggest.ts](flowSuggest.ts.md) (8 shared connections)
- [auth](auth.md) (8 shared connections)
- [server/flows.ts](server-flows.ts.md) (7 shared connections)
- [clef.ts](clef.ts.md) (6 shared connections)

## Source Files

- `docs/superpowers/plans/2026-11-01-infrasketch-phase3c2-ask-node.md`
- `src/domain/assumptions.ts`
- `src/domain/commands.ts`
- `src/domain/flows.ts`
- `src/server/chat/ask.ts`
- `src/server/chat/events.ts`
- `src/server/chat/intent.ts`
- `src/server/chat/messages.ts`
- `src/server/chat/pipeline.ts`
- `src/server/chat/prompt.ts`
- `src/server/chat/sessions.ts`
- `src/server/chat/skips.ts`
- `src/server/explain.ts`
- `src/server/flowSuggest.ts`
- `src/server/llm/clef.ts`
- `src/server/llm/think.ts`

## Audit Trail

- EXTRACTED: 263 (96%)
- INFERRED: 10 (4%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*