---
title: "pipeline.ts"
sidebar_position: 5
---
# pipeline.ts

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 60 nodes · cohesion 0.08

## Key Concepts

- **pipeline.ts** (114 connections) — `src/server/chat/pipeline.ts`
- **ask.ts** (56 connections) — `src/server/chat/ask.ts`
- **lockedTurn()** (40 connections) — `src/server/chat/pipeline.ts`
- **domain/assumptions.ts** (18 connections) — `src/domain/assumptions.ts`
- **runAskTurn()** (14 connections) — `src/server/chat/ask.ts`
- **getSession()** (14 connections) — `src/server/chat/sessions.ts`
- **askInSession()** (13 connections) — `src/server/chat/ask.ts`
- **intent.ts** (13 connections) — `src/server/chat/intent.ts`
- **runChatTurn()** (12 connections) — `src/server/chat/pipeline.ts`
- **lockedAsk()** (10 connections) — `src/server/chat/ask.ts`
- **Task 2: 질문 차례(서버)** (9 connections) — `docs/superpowers/plans/2026-11-01-infrasketch-phase3c2-ask-node.md`
- **ChatEvent** (9 connections) — `src/server/chat/events.ts`
- **QwenClient** (9 connections) — `src/server/llm/qwen.ts`
- **createThinkStripper()** (9 connections) — `src/server/llm/think.ts`
- **sessionTurn()** (8 connections) — `src/server/chat/pipeline.ts`
- **createSession()** (8 connections) — `src/server/chat/sessions.ts`
- **toFlowOp()** (7 connections) — `src/domain/commands.ts`
- **createMessage()** (7 connections) — `src/server/chat/messages.ts`
- **.emit()** (7 connections) — `src/server/chat/pipeline.ts`
- **splitFlowSteps()** (6 connections) — `src/domain/linkGuess.ts`
- **MissingItem** (6 connections) — `src/domain/missing.ts`
- **resolveIntent()** (6 connections) — `src/server/chat/intent.ts`
- **buildAskMessages()** (6 connections) — `src/server/chat/prompt.ts`
- **touchSession()** (6 connections) — `src/server/chat/sessions.ts`
- **.emit()** (5 connections) — `src/server/chat/ask.ts`
- *... and 35 more nodes in this community*

## Relationships

- [getOwnedDiagram](getOwnedDiagram.md) (40 shared connections)
- [ask/route.ts](ask-route.ts.md) (22 shared connections)
- [mcp/apply.ts](mcp-apply.ts.md) (20 shared connections)
- [domain/flows.ts](domain-flows.ts.md) (19 shared connections)
- [\[diagramId\]/page.tsx]([diagramId]-page.tsx.md) (12 shared connections)
- [\[sessionId\]/route.ts]([sessionId]-route.ts.md) (12 shared connections)
- [missing.ts](missing.ts.md) (11 shared connections)
- [useChatTurn.ts](useChatTurn.ts.md) (10 shared connections)
- [prompt.ts](prompt.ts.md) (10 shared connections)
- [DiagramState](DiagramState.md) (10 shared connections)
- [samples.ts](samples.ts.md) (9 shared connections)
- [clef.ts](clef.ts.md) (8 shared connections)

## Source Files

- `docs/superpowers/plans/2026-10-30-infrasketch-phase3b-warnings.md`
- `docs/superpowers/plans/2026-11-01-infrasketch-phase3c2-ask-node.md`
- `src/domain/assumptions.ts`
- `src/domain/commands.ts`
- `src/domain/flows.ts`
- `src/domain/linkGuess.ts`
- `src/domain/missing.ts`
- `src/server/chat/ask.ts`
- `src/server/chat/events.ts`
- `src/server/chat/intent.ts`
- `src/server/chat/messages.ts`
- `src/server/chat/pipeline.ts`
- `src/server/chat/prompt.ts`
- `src/server/chat/sessions.ts`
- `src/server/chat/skips.ts`
- `src/server/flowSuggest.ts`
- `src/server/llm/clef.ts`
- `src/server/llm/qwen.ts`
- `src/server/llm/think.ts`

## Audit Trail

- EXTRACTED: 358 (96%)
- INFERRED: 14 (4%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*