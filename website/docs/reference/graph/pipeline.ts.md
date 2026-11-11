---
title: "pipeline.ts"
sidebar_position: 5
---
# pipeline.ts

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 49 nodes · cohesion 0.10

## Key Concepts

- **pipeline.ts** (115 connections) — `src/server/chat/pipeline.ts`
- **ask.ts** (57 connections) — `src/server/chat/ask.ts`
- **lockedTurn()** (40 connections) — `src/server/chat/pipeline.ts`
- **getNetworkKnowledge()** (20 connections) — `src/server/network.ts`
- **runAskTurn()** (14 connections) — `src/server/chat/ask.ts`
- **askInSession()** (13 connections) — `src/server/chat/ask.ts`
- **intent.ts** (13 connections) — `src/server/chat/intent.ts`
- **lockedAsk()** (10 connections) — `src/server/chat/ask.ts`
- **Task 2: 질문 차례(서버)** (9 connections) — `docs/superpowers/plans/2026-11-01-infrasketch-phase3c2-ask-node.md`
- **ChatEvent** (9 connections) — `src/server/chat/events.ts`
- **createThinkStripper()** (9 connections) — `src/server/llm/think.ts`
- **createMessage()** (7 connections) — `src/server/chat/messages.ts`
- **.emit()** (7 connections) — `src/server/chat/pipeline.ts`
- **splitFlowSteps()** (6 connections) — `src/domain/linkGuess.ts`
- **resolveIntent()** (6 connections) — `src/server/chat/intent.ts`
- **buildAskMessages()** (6 connections) — `src/server/chat/prompt.ts`
- **touchSession()** (6 connections) — `src/server/chat/sessions.ts`
- **.emit()** (5 connections) — `src/server/chat/ask.ts`
- **ChatDeps** (5 connections) — `src/server/chat/pipeline.ts`
- **guardEmit()** (5 connections) — `src/server/chat/pipeline.ts`
- **streamFailure()** (5 connections) — `src/server/chat/pipeline.ts`
- **skips.ts** (5 connections) — `src/server/chat/skips.ts`
- **Intent** (5 connections) — `src/server/llm/clef.ts`
- **think.ts** (5 connections) — `src/server/llm/think.ts`
- **keepStepText()** (4 connections) — `src/domain/flows.ts`
- *... and 24 more nodes in this community*

## Relationships

- [getOwnedDiagram](getOwnedDiagram.md) (30 shared connections)
- [ask/route.ts](ask-route.ts.md) (25 shared connections)
- [\[sessionId\]/route.ts]([sessionId]-route.ts.md) (23 shared connections)
- [mcp/apply.ts](mcp-apply.ts.md) (15 shared connections)
- [prompt.ts](prompt.ts.md) (11 shared connections)
- [chat/warnings.ts](chat-warnings.ts.md) (10 shared connections)
- [server/network.ts](server-network.ts.md) (10 shared connections)
- [useChatTurn.ts](useChatTurn.ts.md) (9 shared connections)
- [domain/apply.ts](domain-apply.ts.md) (9 shared connections)
- [DiagramState](DiagramState.md) (9 shared connections)
- [missing.ts](missing.ts.md) (8 shared connections)
- [createJsonlParser](createJsonlParser.md) (6 shared connections)

## Source Files

- `docs/superpowers/plans/2026-11-01-infrasketch-phase3c2-ask-node.md`
- `src/domain/assumptions.ts`
- `src/domain/commands.ts`
- `src/domain/flows.ts`
- `src/domain/linkGuess.ts`
- `src/server/chat/ask.ts`
- `src/server/chat/events.ts`
- `src/server/chat/intent.ts`
- `src/server/chat/lock.ts`
- `src/server/chat/messages.ts`
- `src/server/chat/pipeline.ts`
- `src/server/chat/prompt.ts`
- `src/server/chat/sessions.ts`
- `src/server/chat/skips.ts`
- `src/server/llm/clef.ts`
- `src/server/llm/think.ts`
- `src/server/network.ts`

## Audit Trail

- EXTRACTED: 312 (95%)
- INFERRED: 15 (5%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*