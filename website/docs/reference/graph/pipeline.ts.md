---
title: "pipeline.ts"
sidebar_position: 8
---
# pipeline.ts

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 42 nodes · cohesion 0.11

## Key Concepts

- **pipeline.ts** (70 connections) — `src/server/chat/pipeline.ts`
- **ask.ts** (52 connections) — `src/server/chat/ask.ts`
- **lockedTurn()** (26 connections) — `src/server/chat/pipeline.ts`
- **askInSession()** (12 connections) — `src/server/chat/ask.ts`
- **Task 2: 질문 차례(서버)** (9 connections) — `docs/superpowers/plans/2026-11-01-infrasketch-phase3c2-ask-node.md`
- **ChatEvent** (9 connections) — `src/server/chat/events.ts`
- **runChatTurn()** (9 connections) — `src/server/chat/pipeline.ts`
- **createThinkStripper()** (9 connections) — `src/server/llm/think.ts`
- **lockedAsk()** (8 connections) — `src/server/chat/ask.ts`
- **intent.ts** (8 connections) — `src/server/chat/intent.ts`
- **createMessage()** (7 connections) — `src/server/chat/messages.ts`
- **resolveIntent()** (6 connections) — `src/server/chat/intent.ts`
- **.emit()** (6 connections) — `src/server/chat/pipeline.ts`
- **buildAskMessages()** (6 connections) — `src/server/chat/prompt.ts`
- **.emit()** (5 connections) — `src/server/chat/ask.ts`
- **guardEmit()** (5 connections) — `src/server/chat/pipeline.ts`
- **streamFailure()** (5 connections) — `src/server/chat/pipeline.ts`
- **skips.ts** (5 connections) — `src/server/chat/skips.ts`
- **Intent** (5 connections) — `src/server/llm/clef.ts`
- **think.ts** (5 connections) — `src/server/llm/think.ts`
- **turnSignals()** (4 connections) — `src/server/chat/pipeline.ts`
- **parseMentions()** (4 connections) — `src/server/chat/prompt.ts`
- **createSession()** (4 connections) — `src/server/chat/sessions.ts`
- **touchSession()** (4 connections) — `src/server/chat/sessions.ts`
- **isAssumptionChangeMessage()** (3 connections) — `src/domain/assumptions.ts`
- *... and 17 more nodes in this community*

## Relationships

- [projects.ts](projects.ts.md) (24 shared connections)
- [ask/route.ts](ask-route.ts.md) (20 shared connections)
- [types.ts](types.ts.md) (17 shared connections)
- [prompt.ts](prompt.ts.md) (10 shared connections)
- [\[sessionId\]/route.ts]([sessionId]-route.ts.md) (10 shared connections)
- [명령 적용과 샘플](명령_적용과_샘플.md) (8 shared connections)
- [설계 문서와 계획](설계_문서와_계획.md) (7 shared connections)
- [missing.ts](missing.ts.md) (6 shared connections)
- [createThinkStripper](createThinkStripper.md) (6 shared connections)
- [설명 생성과 품질 검사](설명_생성과_품질_검사.md) (3 shared connections)
- [normalize.ts](normalize.ts.md) (3 shared connections)
- [chat/warnings.ts](chat-warnings.ts.md) (3 shared connections)

## Source Files

- `docs/superpowers/plans/2026-11-01-infrasketch-phase3c2-ask-node.md`
- `src/domain/assumptions.ts`
- `src/domain/commands.ts`
- `src/server/chat/ask.ts`
- `src/server/chat/events.ts`
- `src/server/chat/intent.ts`
- `src/server/chat/messages.ts`
- `src/server/chat/pipeline.ts`
- `src/server/chat/prompt.ts`
- `src/server/chat/sessions.ts`
- `src/server/chat/skips.ts`
- `src/server/llm/clef.ts`
- `src/server/llm/think.ts`

## Audit Trail

- EXTRACTED: 214 (96%)
- INFERRED: 9 (4%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*