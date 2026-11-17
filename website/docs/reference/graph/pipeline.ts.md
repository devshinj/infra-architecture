---
title: "pipeline.ts"
sidebar_position: 8
---
# pipeline.ts

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 45 nodes · cohesion 0.10

## Key Concepts

- **pipeline.ts** (127 connections) — `src/server/chat/pipeline.ts`
- **ask.ts** (60 connections) — `src/server/chat/ask.ts`
- **lockedTurn()** (46 connections) — `src/server/chat/pipeline.ts`
- **getNetworkKnowledge()** (22 connections) — `src/server/network.ts`
- **askInSession()** (14 connections) — `src/server/chat/ask.ts`
- **intent.ts** (13 connections) — `src/server/chat/intent.ts`
- **matchUserTerms()** (11 connections) — `src/server/glossary.ts`
- **createThinkStripper()** (9 connections) — `src/server/llm/think.ts`
- **createMessage()** (7 connections) — `src/server/chat/messages.ts`
- **cachedNodeExplanation()** (7 connections) — `src/server/explain.ts`
- **splitFlowSteps()** (6 connections) — `src/domain/linkGuess.ts`
- **resolveIntent()** (6 connections) — `src/server/chat/intent.ts`
- **detectForks()** (5 connections) — `src/domain/clarify.ts`
- **ChatDeps** (5 connections) — `src/server/chat/pipeline.ts`
- **streamFailure()** (5 connections) — `src/server/chat/pipeline.ts`
- **skips.ts** (5 connections) — `src/server/chat/skips.ts`
- **Intent** (5 connections) — `src/server/llm/clef.ts`
- **think.ts** (5 connections) — `src/server/llm/think.ts`
- **choicesOf()** (4 connections) — `src/domain/clarify.ts`
- **validChoices()** (4 connections) — `src/domain/clarify.ts`
- **keepStepText()** (4 connections) — `src/domain/flows.ts`
- **warningDelta()** (4 connections) — `src/domain/warnings.ts`
- **turnSignals()** (4 connections) — `src/server/chat/pipeline.ts`
- **parseMentions()** (4 connections) — `src/server/chat/prompt.ts`
- **isAssumptionChangeMessage()** (3 connections) — `src/domain/assumptions.ts`
- *... and 20 more nodes in this community*

## Relationships

- [ask.ts](ask.ts.md) (24 shared connections)
- [mcp/apply.ts](mcp-apply.ts.md) (23 shared connections)
- [getOwnedDiagram](getOwnedDiagram.md) (21 shared connections)
- [useChatTurn.ts](useChatTurn.ts.md) (14 shared connections)
- [missing.ts](missing.ts.md) (12 shared connections)
- [ask/route.ts](ask-route.ts.md) (12 shared connections)
- [clarify.ts](clarify.ts.md) (11 shared connections)
- [chat/warnings.ts](chat-warnings.ts.md) (11 shared connections)
- [prompt.ts](prompt.ts.md) (10 shared connections)
- [DiagramState](DiagramState.md) (9 shared connections)
- [domain/apply.ts](domain-apply.ts.md) (9 shared connections)
- [\[sessionId\]/route.ts]([sessionId]-route.ts.md) (6 shared connections)

## Source Files

- `src/domain/assumptions.ts`
- `src/domain/clarify.ts`
- `src/domain/commands.ts`
- `src/domain/flows.ts`
- `src/domain/linkGuess.ts`
- `src/domain/warnings.ts`
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
- `src/server/llm/think.ts`
- `src/server/network.ts`

## Audit Trail

- EXTRACTED: 321 (98%)
- INFERRED: 8 (2%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*