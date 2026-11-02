---
title: "ask.ts"
sidebar_position: 22
---
# ask.ts

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 18 nodes · cohesion 0.24

## Key Concepts

- **ask.ts** (52 connections) — `src/server/chat/ask.ts`
- **runAskTurn()** (14 connections) — `src/server/chat/ask.ts`
- **askInSession()** (12 connections) — `src/server/chat/ask.ts`
- **withDiagramLock()** (12 connections) — `src/server/chat/lock.ts`
- **Task 2: 질문 차례(서버)** (9 connections) — `docs/superpowers/plans/2026-11-01-infrasketch-phase3c2-ask-node.md`
- **ChatEvent** (9 connections) — `src/server/chat/events.ts`
- **lockedAsk()** (8 connections) — `src/server/chat/ask.ts`
- **createMessage()** (7 connections) — `src/server/chat/messages.ts`
- **lock.ts** (6 connections) — `src/server/chat/lock.ts`
- **buildAskMessages()** (6 connections) — `src/server/chat/prompt.ts`
- **cachedNodeExplanation()** (6 connections) — `src/server/explain.ts`
- **.emit()** (5 connections) — `src/server/chat/ask.ts`
- **turnSignals()** (4 connections) — `src/server/chat/pipeline.ts`
- **createSession()** (4 connections) — `src/server/chat/sessions.ts`
- **touchSession()** (4 connections) — `src/server/chat/sessions.ts`
- **hasNode()** (3 connections) — `src/server/chat/ask.ts`
- **AskArgs** (2 connections) — `src/server/chat/ask.ts`
- **HANDOFF_REPLY** (1 connections) — `src/server/chat/ask.ts`

## Relationships

- [(app)/actions.ts](app-actions.ts.md) (22 shared connections)
- [pipeline.ts](pipeline.ts.md) (16 shared connections)
- [\[sessionId\]/route.ts]([sessionId]-route.ts.md) (8 shared connections)
- [ask/route.ts](ask-route.ts.md) (7 shared connections)
- [useSessions.ts](useSessions.ts.md) (6 shared connections)
- [prompt.ts](prompt.ts.md) (5 shared connections)
- [createThinkStripper](createThinkStripper.md) (4 shared connections)
- [intent.ts](intent.ts.md) (4 shared connections)
- [설명 생성과 품질 검사](설명_생성과_품질_검사.md) (4 shared connections)
- [missing.ts](missing.ts.md) (3 shared connections)
- [chat/warnings.ts](chat-warnings.ts.md) (3 shared connections)
- [schema.ts](schema.ts.md) (3 shared connections)

## Source Files

- `docs/superpowers/plans/2026-11-01-infrasketch-phase3c2-ask-node.md`
- `src/server/chat/ask.ts`
- `src/server/chat/events.ts`
- `src/server/chat/lock.ts`
- `src/server/chat/messages.ts`
- `src/server/chat/pipeline.ts`
- `src/server/chat/prompt.ts`
- `src/server/chat/sessions.ts`
- `src/server/explain.ts`

## Audit Trail

- EXTRACTED: 116 (91%)
- INFERRED: 11 (9%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*