---
title: "pipeline.ts"
sidebar_position: 12
---
# pipeline.ts

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 35 nodes · cohesion 0.12

## Key Concepts

- **pipeline.ts** (117 connections) — `src/server/chat/pipeline.ts`
- **ask.ts** (59 connections) — `src/server/chat/ask.ts`
- **lockedTurn()** (41 connections) — `src/server/chat/pipeline.ts`
- **askInSession()** (14 connections) — `src/server/chat/ask.ts`
- **intent.ts** (13 connections) — `src/server/chat/intent.ts`
- **createMessage()** (7 connections) — `src/server/chat/messages.ts`
- **matchUserTerms()** (7 connections) — `src/server/glossary.ts`
- **resolveIntent()** (6 connections) — `src/server/chat/intent.ts`
- **cachedNodeExplanation()** (6 connections) — `src/server/explain.ts`
- **ChatDeps** (5 connections) — `src/server/chat/pipeline.ts`
- **streamFailure()** (5 connections) — `src/server/chat/pipeline.ts`
- **skips.ts** (5 connections) — `src/server/chat/skips.ts`
- **Intent** (5 connections) — `src/server/llm/clef.ts`
- **keepStepText()** (4 connections) — `src/domain/flows.ts`
- **turnSignals()** (4 connections) — `src/server/chat/pipeline.ts`
- **parseMentions()** (4 connections) — `src/server/chat/prompt.ts`
- **isAssumptionChangeMessage()** (3 connections) — `src/domain/assumptions.ts`
- **createFlowRetarget()** (3 connections) — `src/domain/commands.ts`
- **asksStepText()** (3 connections) — `src/domain/flows.ts`
- **clefOpenItems()** (3 connections) — `src/server/chat/intent.ts`
- **USER_TURN_LOCK_WAIT_MS** (3 connections) — `src/server/chat/lock.ts`
- **ChatTurnResult** (3 connections) — `src/server/chat/pipeline.ts`
- **createSkipTally()** (3 connections) — `src/server/chat/skips.ts`
- **skipKey()** (3 connections) — `src/server/chat/skips.ts`
- **abortError()** (2 connections) — `src/server/chat/pipeline.ts`
- *... and 10 more nodes in this community*

## Relationships

- [getOwnedDiagram](getOwnedDiagram.md) (21 shared connections)
- [ask/route.ts](ask-route.ts.md) (19 shared connections)
- [commands.ts](commands.ts.md) (12 shared connections)
- [runAskTurn](runAskTurn.md) (12 shared connections)
- [createJsonlParser](createJsonlParser.md) (9 shared connections)
- [\[diagramId\]/page.tsx]([diagramId]-page.tsx.md) (8 shared connections)
- [domain/apply.ts](domain-apply.ts.md) (8 shared connections)
- [missing.ts](missing.ts.md) (7 shared connections)
- [\[sessionId\]/route.ts]([sessionId]-route.ts.md) (7 shared connections)
- [prompt.ts](prompt.ts.md) (7 shared connections)
- [useChatTurn.ts](useChatTurn.ts.md) (6 shared connections)
- [mcp/apply.ts](mcp-apply.ts.md) (6 shared connections)

## Source Files

- `src/domain/assumptions.ts`
- `src/domain/commands.ts`
- `src/domain/flows.ts`
- `src/server/chat/ask.ts`
- `src/server/chat/intent.ts`
- `src/server/chat/lock.ts`
- `src/server/chat/messages.ts`
- `src/server/chat/pipeline.ts`
- `src/server/chat/prompt.ts`
- `src/server/chat/skips.ts`
- `src/server/explain.ts`
- `src/server/glossary.ts`
- `src/server/llm/clef.ts`

## Audit Trail

- EXTRACTED: 268 (100%)
- INFERRED: 1 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*