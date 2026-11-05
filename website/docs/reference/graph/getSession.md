---
title: "getSession"
sidebar_position: 77
---
# getSession

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 7 nodes · cohesion 0.48

## Key Concepts

- **getSession()** (14 connections) — `src/server/chat/sessions.ts`
- **runChatTurn()** (12 connections) — `src/server/chat/pipeline.ts`
- **sessionTurn()** (8 connections) — `src/server/chat/pipeline.ts`
- **POST()** (7 connections) — `src/app/api/diagrams/[id]/chat/route.ts`
- **.emit()** (7 connections) — `src/server/chat/pipeline.ts`
- **guardEmit()** (5 connections) — `src/server/chat/pipeline.ts`
- **TurnArgs** (2 connections) — `src/server/chat/pipeline.ts`

## Relationships

- [ask.ts](ask.ts.md) (10 shared connections)
- [pipeline.ts](pipeline.ts.md) (7 shared connections)
- [ask/route.ts](ask-route.ts.md) (6 shared connections)
- [\[sessionId\]/route.ts]([sessionId]-route.ts.md) (4 shared connections)
- [auth](auth.md) (2 shared connections)
- [getOwnedDiagram](getOwnedDiagram.md) (2 shared connections)
- [deps.ts](deps.ts.md) (1 shared connections)
- [projects.ts](projects.ts.md) (1 shared connections)
- [ValidationError](ValidationError.md) (1 shared connections)
- [설계 문서와 계획](설계_문서와_계획.md) (1 shared connections)

## Source Files

- `src/app/api/diagrams/[id]/chat/route.ts`
- `src/server/chat/pipeline.ts`
- `src/server/chat/sessions.ts`

## Audit Trail

- EXTRACTED: 45 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*