---
title: "auth"
sidebar_position: 86
---
# auth

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 23 nodes · cohesion 0.15

## Key Concepts

- **auth** (24 connections) — `src/auth.ts`
- **[diagramId]/page.tsx** (19 connections) — `src/app/(app)/p/[projectId]/d/[diagramId]/page.tsx`
- **explain/route.ts** (18 connections) — `src/app/api/diagrams/[id]/explain/route.ts`
- **sessions/route.ts** (18 connections) — `src/app/api/diagrams/[id]/sessions/route.ts`
- **listMessages()** (12 connections) — `src/server/chat/messages.ts`
- **sessionPayload()** (11 connections) — `src/server/chat/events.ts`
- **GET()** (8 connections) — `src/app/api/diagrams/[id]/sessions/route.ts`
- **DiagramPage()** (8 connections) — `src/app/(app)/p/[projectId]/d/[diagramId]/page.tsx`
- **listSessionPage()** (6 connections) — `src/server/chat/sessions.ts`
- **GET()** (4 connections) — `src/app/api/diagrams/[id]/explain/route.ts`
- **POST()** (4 connections) — `src/app/api/diagrams/[id]/explain/route.ts`
- **isDbTimestamp()** (4 connections) — `src/server/chat/sessions.ts`
- **parseCursor()** (4 connections) — `src/server/chat/sessions.ts`
- **failure()** (3 connections) — `src/app/api/diagrams/[id]/explain/route.ts`
- **SAMPLES** (3 connections) — `src/server/samples.ts`
- **json()** (2 connections) — `src/app/api/diagrams/[id]/sessions/route.ts`
- **BodySchema** (1 connections) — `src/app/api/diagrams/[id]/explain/route.ts`
- **Ctx** (1 connections) — `src/app/api/diagrams/[id]/explain/route.ts`
- **dynamic** (1 connections) — `src/app/api/diagrams/[id]/explain/route.ts`
- **maxDuration** (1 connections) — `src/app/api/diagrams/[id]/explain/route.ts`
- **runtime** (1 connections) — `src/app/api/diagrams/[id]/explain/route.ts`
- **dynamic** (1 connections) — `src/app/api/diagrams/[id]/sessions/route.ts`
- **runtime** (1 connections) — `src/app/api/diagrams/[id]/sessions/route.ts`

## Relationships

- [(app)/actions.ts](app-actions.ts.md) (20 shared connections)
- [\[sessionId\]/route.ts]([sessionId]-route.ts.md) (12 shared connections)
- [auth.ts](auth.ts.md) (7 shared connections)
- [ask/route.ts](ask-route.ts.md) (7 shared connections)
- [설명 생성과 품질 검사](설명_생성과_품질_검사.md) (5 shared connections)
- [pipeline.ts](pipeline.ts.md) (4 shared connections)
- [auth](auth.md) (4 shared connections)
- [ask.ts](ask.ts.md) (4 shared connections)
- [lines.ts](lines.ts.md) (3 shared connections)
- [schema.ts](schema.ts.md) (2 shared connections)
- [samples.ts](samples.ts.md) (2 shared connections)
- [getSession](getSession.md) (2 shared connections)

## Source Files

- `src/app/(app)/p/[projectId]/d/[diagramId]/page.tsx`
- `src/app/api/diagrams/[id]/explain/route.ts`
- `src/app/api/diagrams/[id]/sessions/route.ts`
- `src/auth.ts`
- `src/server/chat/events.ts`
- `src/server/chat/messages.ts`
- `src/server/chat/sessions.ts`
- `src/server/samples.ts`

## Audit Trail

- EXTRACTED: 113 (97%)
- INFERRED: 3 (3%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*