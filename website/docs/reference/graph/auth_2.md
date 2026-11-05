---
title: "auth"
sidebar_position: 94
---
# auth

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 17 nodes · cohesion 0.24

## Key Concepts

- **auth** (28 connections) — `src/auth.ts`
- **auth.ts** (24 connections) — `src/auth.ts`
- **[diagramId]/page.tsx** (19 connections) — `src/app/(app)/p/[projectId]/d/[diagramId]/page.tsx`
- **sessions/route.ts** (18 connections) — `src/app/api/diagrams/[id]/sessions/route.ts`
- **listMessages()** (12 connections) — `src/server/chat/messages.ts`
- **sessionPayload()** (11 connections) — `src/server/chat/events.ts`
- **GET()** (8 connections) — `src/app/api/diagrams/[id]/sessions/route.ts`
- **DiagramPage()** (8 connections) — `src/app/(app)/p/[projectId]/d/[diagramId]/page.tsx`
- **listSessionPage()** (6 connections) — `src/server/chat/sessions.ts`
- **isDbTimestamp()** (4 connections) — `src/server/chat/sessions.ts`
- **parseCursor()** (4 connections) — `src/server/chat/sessions.ts`
- **verifyCredentials()** (3 connections) — `src/server/auth/password.ts`
- **[...nextauth]/route.ts** (2 connections) — `src/app/api/auth/[...nextauth]/route.ts`
- **json()** (2 connections) — `src/app/api/diagrams/[id]/sessions/route.ts`
- **handlers** (2 connections) — `src/auth.ts`
- **dynamic** (1 connections) — `src/app/api/diagrams/[id]/sessions/route.ts`
- **runtime** (1 connections) — `src/app/api/diagrams/[id]/sessions/route.ts`

## Relationships

- [\[sessionId\]/route.ts]([sessionId]-route.ts.md) (13 shared connections)
- [ref_react](ref_react.md) (8 shared connections)
- [(app)/actions.ts](app-actions.ts.md) (8 shared connections)
- [ask/route.ts](ask-route.ts.md) (6 shared connections)
- [auth](auth.md) (6 shared connections)
- [getOwnedDiagram](getOwnedDiagram.md) (4 shared connections)
- [projects.ts](projects.ts.md) (4 shared connections)
- [pipeline.ts](pipeline.ts.md) (4 shared connections)
- [schema.ts](schema.ts.md) (4 shared connections)
- [explain/route.ts](explain-route.ts.md) (4 shared connections)
- [ask.ts](ask.ts.md) (4 shared connections)
- [types.ts](types.ts.md) (3 shared connections)

## Source Files

- `src/app/(app)/p/[projectId]/d/[diagramId]/page.tsx`
- `src/app/api/auth/[...nextauth]/route.ts`
- `src/app/api/diagrams/[id]/sessions/route.ts`
- `src/auth.ts`
- `src/server/auth/password.ts`
- `src/server/chat/events.ts`
- `src/server/chat/messages.ts`
- `src/server/chat/sessions.ts`

## Audit Trail

- EXTRACTED: 118 (98%)
- INFERRED: 3 (2%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*