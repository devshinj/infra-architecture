---
title: "pipeline.ts"
sidebar_position: 13
---
# pipeline.ts

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 24 nodes · cohesion 0.15

## Key Concepts

- **pipeline.ts** (70 connections) — `src/server/chat/pipeline.ts`
- **lockedTurn()** (26 connections) — `src/server/chat/pipeline.ts`
- **askInSession()** (12 connections) — `src/server/chat/ask.ts`
- **runChatTurn()** (9 connections) — `src/server/chat/pipeline.ts`
- **createMessage()** (7 connections) — `src/server/chat/messages.ts`
- **.emit()** (6 connections) — `src/server/chat/pipeline.ts`
- **guardEmit()** (5 connections) — `src/server/chat/pipeline.ts`
- **streamFailure()** (5 connections) — `src/server/chat/pipeline.ts`
- **skips.ts** (5 connections) — `src/server/chat/skips.ts`
- **turnSignals()** (4 connections) — `src/server/chat/pipeline.ts`
- **parseMentions()** (4 connections) — `src/server/chat/prompt.ts`
- **노드 참조 (@WAS#1 칩)** (3 connections) — `docs/superpowers/specs/2026-10-29-infra-architecture-visualizer-design.md`
- **createSkipTally()** (3 connections) — `src/server/chat/skips.ts`
- **skipKey()** (3 connections) — `src/server/chat/skips.ts`
- **AI_UNAVAILABLE_MESSAGE** (2 connections) — `src/server/chat/pipeline.ts`
- **HISTORY_FETCH** (2 connections) — `src/server/chat/pipeline.ts`
- **opName()** (2 connections) — `src/server/chat/pipeline.ts`
- **prunedOrder()** (2 connections) — `src/server/chat/pipeline.ts`
- **TurnArgs** (2 connections) — `src/server/chat/pipeline.ts`
- **HISTORY_REPLY** (1 connections) — `src/server/chat/pipeline.ts`
- **KNOWN_OPS** (1 connections) — `src/server/chat/pipeline.ts`
- **LAYOUT_REPLY** (1 connections) — `src/server/chat/pipeline.ts`
- **TIMEOUT_MESSAGE** (1 connections) — `src/server/chat/pipeline.ts`
- **SkipKind** (1 connections) — `src/server/chat/skips.ts`

## Relationships

- [ask.ts](ask.ts.md) (16 shared connections)
- [(app)/actions.ts](app-actions.ts.md) (16 shared connections)
- [경고 규칙과 점검](경고_규칙과_점검.md) (9 shared connections)
- [commands.ts](commands.ts.md) (7 shared connections)
- [\[sessionId\]/route.ts]([sessionId]-route.ts.md) (5 shared connections)
- [intent.ts](intent.ts.md) (5 shared connections)
- [prompt.ts](prompt.ts.md) (5 shared connections)
- [createThinkStripper](createThinkStripper.md) (5 shared connections)
- [명령 적용과 샘플](명령_적용과_샘플.md) (5 shared connections)
- [ask/route.ts](ask-route.ts.md) (5 shared connections)
- [missing.ts](missing.ts.md) (4 shared connections)
- [normalize.ts](normalize.ts.md) (3 shared connections)

## Source Files

- `docs/superpowers/specs/2026-10-29-infra-architecture-visualizer-design.md`
- `src/server/chat/ask.ts`
- `src/server/chat/messages.ts`
- `src/server/chat/pipeline.ts`
- `src/server/chat/prompt.ts`
- `src/server/chat/skips.ts`

## Audit Trail

- EXTRACTED: 136 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*