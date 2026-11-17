---
title: "auth"
sidebar_position: 76
---
# auth

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 15 nodes · cohesion 0.26

## Key Concepts

- **auth** (34 connections) — `src/auth.ts`
- **[diagramId]/page.tsx** (21 connections) — `src/app/(app)/p/[projectId]/d/[diagramId]/page.tsx`
- **sessions/route.ts** (18 connections) — `src/app/api/diagrams/[id]/sessions/route.ts`
- **sessionPayload()** (11 connections) — `src/server/chat/events.ts`
- **DiagramPage()** (9 connections) — `src/app/(app)/p/[projectId]/d/[diagramId]/page.tsx`
- **GET()** (8 connections) — `src/app/api/diagrams/[id]/sessions/route.ts`
- **listSessionPage()** (6 connections) — `src/server/chat/sessions.ts`
- **GET()** (4 connections) — `src/app/api/diagrams/[id]/explain/route.ts`
- **POST()** (4 connections) — `src/app/api/diagrams/[id]/explain/route.ts`
- **isDbTimestamp()** (4 connections) — `src/server/chat/sessions.ts`
- **parseCursor()** (4 connections) — `src/server/chat/sessions.ts`
- **failure()** (3 connections) — `src/app/api/diagrams/[id]/explain/route.ts`
- **json()** (2 connections) — `src/app/api/diagrams/[id]/sessions/route.ts`
- **dynamic** (1 connections) — `src/app/api/diagrams/[id]/sessions/route.ts`
- **runtime** (1 connections) — `src/app/api/diagrams/[id]/sessions/route.ts`

## Relationships

- [\[sessionId\]/route.ts]([sessionId]-route.ts.md) (10 shared connections)
- [useChatTurn.ts](useChatTurn.ts.md) (9 shared connections)
- [NotFoundError](NotFoundError.md) (6 shared connections)
- [pipeline.ts](pipeline.ts.md) (5 shared connections)
- [explain/route.ts](explain-route.ts.md) (4 shared connections)
- [ask/route.ts](ask-route.ts.md) (4 shared connections)
- [getOwnedDiagram](getOwnedDiagram.md) (4 shared connections)
- [(app)/actions.ts](app-actions.ts.md) (4 shared connections)
- [Shell.tsx](Shell.tsx.md) (4 shared connections)
- [auth.ts](auth.ts.md) (3 shared connections)
- [ask.ts](ask.ts.md) (3 shared connections)
- [설명 생성과 품질 검사](설명_생성과_품질_검사.md) (2 shared connections)

## Source Files

- `src/app/(app)/p/[projectId]/d/[diagramId]/page.tsx`
- `src/app/api/diagrams/[id]/explain/route.ts`
- `src/app/api/diagrams/[id]/sessions/route.ts`
- `src/auth.ts`
- `src/server/chat/events.ts`
- `src/server/chat/sessions.ts`

## Audit Trail

- EXTRACTED: 101 (98%)
- INFERRED: 2 (2%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*