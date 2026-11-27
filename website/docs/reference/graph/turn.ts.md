---
title: "turn.ts"
sidebar_position: 52
---
# turn.ts

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 25 nodes · cohesion 0.24

## Key Concepts

- **turn.ts** (73 connections) — `src/server/guide/turn.ts`
- **Task 6: 가이드 차례와 대화 경로 연결** (21 connections) — `docs/superpowers/plans/2026-11-19-learning-mode.md`
- **stepTurn()** (19 connections) — `src/server/guide/turn.ts`
- **createMessage()** (18 connections) — `src/server/chat/messages.ts`
- **runGuideTurn()** (14 connections) — `src/server/guide/turn.ts`
- **confirmGuideEnv()** (13 connections) — `src/server/guide/turn.ts`
- **envTurn()** (10 connections) — `src/server/guide/turn.ts`
- **saveAuthoredExplanations()** (9 connections) — `src/server/explain.ts`
- **saveGuideRun()** (9 connections) — `src/server/guide/runs.ts`
- **quietMeta()** (9 connections) — `src/server/guide/turn.ts`
- **quitTurn()** (9 connections) — `src/server/guide/turn.ts`
- **.emit()** (8 connections) — `src/server/guide/turn.ts`
- **quietDone()** (8 connections) — `src/server/guide/turn.ts`
- **askClef()** (7 connections) — `src/server/guide/judge.ts`
- **missTurn()** (7 connections) — `src/server/guide/turn.ts`
- **findConflict()** (6 connections) — `src/domain/guides/judge.ts`
- **warningDelta()** (6 connections) — `src/domain/warnings.ts`
- **doneEvent** (6 connections) — `src/server/chat/events.ts`
- **saveGuideFlows()** (6 connections) — `src/server/flows.ts`
- **abortedTurn()** (6 connections) — `src/server/guide/turn.ts`
- **counts()** (5 connections) — `src/server/guide/turn.ts`
- **GuideTurnArgs** (5 connections) — `src/server/guide/turn.ts`
- **GUIDE_BROKEN_MESSAGE** (2 connections) — `src/server/guide/runs.ts`
- **GuideTurnOutcome** (1 connections) — `src/server/guide/turn.ts`
- **HANDLED** (1 connections) — `src/server/guide/turn.ts`

## Relationships

- [projects.ts](projects.ts.md) (24 shared connections)
- [guides/judge.ts](guides-judge.ts.md) (14 shared connections)
- [runs.ts](runs.ts.md) (13 shared connections)
- [chat/warnings.ts](chat-warnings.ts.md) (11 shared connections)
- [clarify.ts](clarify.ts.md) (11 shared connections)
- [getOwnedDiagram](getOwnedDiagram.md) (7 shared connections)
- [guides/apply.ts](guides-apply.ts.md) (7 shared connections)
- [pipeline.ts](pipeline.ts.md) (6 shared connections)
- [missing.ts](missing.ts.md) (5 shared connections)
- [설명 생성과 품질 검사](설명_생성과_품질_검사.md) (4 shared connections)
- [GuideEnv](GuideEnv.md) (4 shared connections)
- [events.ts](events.ts.md) (3 shared connections)

## Source Files

- `docs/superpowers/plans/2026-11-19-learning-mode.md`
- `src/domain/guides/judge.ts`
- `src/domain/warnings.ts`
- `src/server/chat/events.ts`
- `src/server/chat/messages.ts`
- `src/server/explain.ts`
- `src/server/flows.ts`
- `src/server/guide/judge.ts`
- `src/server/guide/runs.ts`
- `src/server/guide/turn.ts`

## Audit Trail

- EXTRACTED: 180 (87%)
- INFERRED: 26 (13%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*