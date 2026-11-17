---
title: "auth"
sidebar_position: 68
---
# auth

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 18 nodes · cohesion 0.24

## Key Concepts

- **auth** (34 connections) — `src/auth.ts`
- **events.ts** (29 connections) — `src/server/chat/events.ts`
- **[diagramId]/page.tsx** (21 connections) — `src/app/(app)/p/[projectId]/d/[diagramId]/page.tsx`
- **sessions/route.ts** (18 connections) — `src/app/api/diagrams/[id]/sessions/route.ts`
- **messages.ts** (17 connections) — `src/server/chat/messages.ts`
- **MessageMeta** (15 connections) — `src/server/chat/events.ts`
- **listMessages()** (13 connections) — `src/server/chat/messages.ts`
- **sessionPayload()** (11 connections) — `src/server/chat/events.ts`
- **DiagramPage()** (9 connections) — `src/app/(app)/p/[projectId]/d/[diagramId]/page.tsx`
- **GET()** (8 connections) — `src/app/api/diagrams/[id]/sessions/route.ts`
- **WarningCounts** (6 connections) — `src/domain/warnings.ts`
- **listSessionPage()** (6 connections) — `src/server/chat/sessions.ts`
- **isDbTimestamp()** (4 connections) — `src/server/chat/sessions.ts`
- **parseCursor()** (4 connections) — `src/server/chat/sessions.ts`
- **json()** (2 connections) — `src/app/api/diagrams/[id]/sessions/route.ts`
- **withoutCommands()** (2 connections) — `src/server/chat/messages.ts`
- **dynamic** (1 connections) — `src/app/api/diagrams/[id]/sessions/route.ts`
- **runtime** (1 connections) — `src/app/api/diagrams/[id]/sessions/route.ts`

## Relationships

- [\[sessionId\]/route.ts]([sessionId]-route.ts.md) (14 shared connections)
- [ask.ts](ask.ts.md) (13 shared connections)
- [ask/route.ts](ask-route.ts.md) (11 shared connections)
- [useChatTurn.ts](useChatTurn.ts.md) (10 shared connections)
- [pipeline.ts](pipeline.ts.md) (8 shared connections)
- [schema.ts](schema.ts.md) (7 shared connections)
- [getOwnedDiagram](getOwnedDiagram.md) (4 shared connections)
- [server/flows.ts](server-flows.ts.md) (4 shared connections)
- [Shell.tsx](Shell.tsx.md) (4 shared connections)
- [SessionPicker.tsx](SessionPicker.tsx.md) (4 shared connections)
- [auth.ts](auth.ts.md) (3 shared connections)
- [DiagramWorkspace.tsx](DiagramWorkspace.tsx.md) (3 shared connections)

## Source Files

- `src/app/(app)/p/[projectId]/d/[diagramId]/page.tsx`
- `src/app/api/diagrams/[id]/sessions/route.ts`
- `src/auth.ts`
- `src/domain/warnings.ts`
- `src/server/chat/events.ts`
- `src/server/chat/messages.ts`
- `src/server/chat/sessions.ts`

## Audit Trail

- EXTRACTED: 160 (98%)
- INFERRED: 4 (2%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*