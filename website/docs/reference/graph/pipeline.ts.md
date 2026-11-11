---
title: "pipeline.ts"
sidebar_position: 4
---
# pipeline.ts

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 59 nodes · cohesion 0.08

## Key Concepts

- **pipeline.ts** (115 connections) — `src/server/chat/pipeline.ts`
- **ask.ts** (57 connections) — `src/server/chat/ask.ts`
- **lockedTurn()** (40 connections) — `src/server/chat/pipeline.ts`
- **runAskTurn()** (14 connections) — `src/server/chat/ask.ts`
- **getSession()** (14 connections) — `src/server/chat/sessions.ts`
- **askInSession()** (13 connections) — `src/server/chat/ask.ts`
- **intent.ts** (13 connections) — `src/server/chat/intent.ts`
- **runChatTurn()** (12 connections) — `src/server/chat/pipeline.ts`
- **sessionPayload()** (11 connections) — `src/server/chat/events.ts`
- **lockedAsk()** (10 connections) — `src/server/chat/ask.ts`
- **Task 2: 질문 차례(서버)** (9 connections) — `docs/superpowers/plans/2026-11-01-infrasketch-phase3c2-ask-node.md`
- **ChatEvent** (9 connections) — `src/server/chat/events.ts`
- **createThinkStripper()** (9 connections) — `src/server/llm/think.ts`
- **sessionTurn()** (8 connections) — `src/server/chat/pipeline.ts`
- **createSession()** (8 connections) — `src/server/chat/sessions.ts`
- **createMessage()** (7 connections) — `src/server/chat/messages.ts`
- **.emit()** (7 connections) — `src/server/chat/pipeline.ts`
- **resolveIntent()** (6 connections) — `src/server/chat/intent.ts`
- **buildAskMessages()** (6 connections) — `src/server/chat/prompt.ts`
- **touchSession()** (6 connections) — `src/server/chat/sessions.ts`
- **cachedNodeExplanation()** (6 connections) — `src/server/explain.ts`
- **.emit()** (5 connections) — `src/server/chat/ask.ts`
- **ChatDeps** (5 connections) — `src/server/chat/pipeline.ts`
- **guardEmit()** (5 connections) — `src/server/chat/pipeline.ts`
- **streamFailure()** (5 connections) — `src/server/chat/pipeline.ts`
- *... and 34 more nodes in this community*

## Relationships

- [getOwnedDiagram](getOwnedDiagram.md) (32 shared connections)
- [\[sessionId\]/route.ts]([sessionId]-route.ts.md) (31 shared connections)
- [ask/route.ts](ask-route.ts.md) (29 shared connections)
- [domain/flows.ts](domain-flows.ts.md) (17 shared connections)
- [prompt.ts](prompt.ts.md) (11 shared connections)
- [MissingChecklist.tsx](MissingChecklist.tsx.md) (8 shared connections)
- [parseCommand](parseCommand.md) (7 shared connections)
- [domain/linkGuess.ts](domain-linkGuess.ts.md) (7 shared connections)
- [auth](auth.md) (6 shared connections)
- [projects.ts](projects.ts.md) (6 shared connections)
- [clef.ts](clef.ts.md) (5 shared connections)
- [mcp/apply.ts](mcp-apply.ts.md) (5 shared connections)

## Source Files

- `docs/superpowers/plans/2026-10-30-infrasketch-phase3b-warnings.md`
- `docs/superpowers/plans/2026-11-01-infrasketch-phase3c2-ask-node.md`
- `src/domain/assumptions.ts`
- `src/domain/commands.ts`
- `src/domain/flows.ts`
- `src/server/chat/ask.ts`
- `src/server/chat/events.ts`
- `src/server/chat/intent.ts`
- `src/server/chat/lock.ts`
- `src/server/chat/messages.ts`
- `src/server/chat/pipeline.ts`
- `src/server/chat/prompt.ts`
- `src/server/chat/sessions.ts`
- `src/server/chat/skips.ts`
- `src/server/explain.ts`
- `src/server/llm/clef.ts`
- `src/server/llm/think.ts`

## Audit Trail

- EXTRACTED: 333 (96%)
- INFERRED: 15 (4%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*