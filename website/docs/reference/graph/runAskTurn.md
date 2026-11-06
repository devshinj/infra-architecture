---
title: "runAskTurn"
sidebar_position: 59
---
# runAskTurn

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 13 nodes · cohesion 0.26

## Key Concepts

- **runAskTurn()** (14 connections) — `src/server/chat/ask.ts`
- **getSession()** (14 connections) — `src/server/chat/sessions.ts`
- **runChatTurn()** (12 connections) — `src/server/chat/pipeline.ts`
- **lockedAsk()** (10 connections) — `src/server/chat/ask.ts`
- **ChatEvent** (9 connections) — `src/server/chat/events.ts`
- **sessionTurn()** (8 connections) — `src/server/chat/pipeline.ts`
- **.emit()** (7 connections) — `src/server/chat/pipeline.ts`
- **.emit()** (5 connections) — `src/server/chat/ask.ts`
- **guardEmit()** (5 connections) — `src/server/chat/pipeline.ts`
- **Task 3: 대화 차례에 점검 단계 넣기** (4 connections) — `docs/superpowers/plans/2026-10-30-infrasketch-phase3b-warnings.md`
- **hasNode()** (3 connections) — `src/server/chat/ask.ts`
- **AskArgs** (2 connections) — `src/server/chat/ask.ts`
- **TurnArgs** (2 connections) — `src/server/chat/pipeline.ts`

## Relationships

- [pipeline.ts](pipeline.ts.md) (21 shared connections)
- [projects.ts](projects.ts.md) (11 shared connections)
- [ask/route.ts](ask-route.ts.md) (10 shared connections)
- [\[sessionId\]/route.ts]([sessionId]-route.ts.md) (6 shared connections)
- [domain/warnings.ts](domain-warnings.ts.md) (2 shared connections)
- [auth](auth.md) (2 shared connections)
- [Review Focus](Review_Focus.md) (1 shared connections)
- [types.ts](types.ts.md) (1 shared connections)
- [InfraSketch 설계 문서](InfraSketch_설계_문서.md) (1 shared connections)

## Source Files

- `docs/superpowers/plans/2026-10-30-infrasketch-phase3b-warnings.md`
- `src/server/chat/ask.ts`
- `src/server/chat/events.ts`
- `src/server/chat/pipeline.ts`
- `src/server/chat/sessions.ts`

## Audit Trail

- EXTRACTED: 70 (93%)
- INFERRED: 5 (7%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*