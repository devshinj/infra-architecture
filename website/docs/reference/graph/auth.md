---
title: "auth"
sidebar_position: 39
sidebar_label: "핵심 노드: auth"
---
# auth

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 24 nodes · cohesion 0.14

## Key Concepts

- **auth** (34 connections) — `src/auth.ts`
- **[diagramId]/page.tsx** (21 connections) — `src/app/(app)/p/[projectId]/d/[diagramId]/page.tsx`
- **getNetworkKnowledge()** (20 connections) — `src/server/network.ts`
- **explain/route.ts** (18 connections) — `src/app/api/diagrams/[id]/explain/route.ts`
- **sessions/route.ts** (18 connections) — `src/app/api/diagrams/[id]/sessions/route.ts`
- **sessionPayload()** (11 connections) — `src/server/chat/events.ts`
- **ref_zod** (9 connections)
- **DiagramPage()** (9 connections) — `src/app/(app)/p/[projectId]/d/[diagramId]/page.tsx`
- **GET()** (8 connections) — `src/app/api/diagrams/[id]/sessions/route.ts`
- **listSessionPage()** (6 connections) — `src/server/chat/sessions.ts`
- **GENERIC_ERROR_MESSAGE** (5 connections) — `src/server/chat/pipeline.ts`
- **GET()** (4 connections) — `src/app/api/diagrams/[id]/explain/route.ts`
- **POST()** (4 connections) — `src/app/api/diagrams/[id]/explain/route.ts`
- **isDbTimestamp()** (4 connections) — `src/server/chat/sessions.ts`
- **parseCursor()** (4 connections) — `src/server/chat/sessions.ts`
- **failure()** (3 connections) — `src/app/api/diagrams/[id]/explain/route.ts`
- **json()** (2 connections) — `src/app/api/diagrams/[id]/sessions/route.ts`
- **BodySchema** (1 connections) — `src/app/api/diagrams/[id]/explain/route.ts`
- **Ctx** (1 connections) — `src/app/api/diagrams/[id]/explain/route.ts`
- **dynamic** (1 connections) — `src/app/api/diagrams/[id]/explain/route.ts`
- **maxDuration** (1 connections) — `src/app/api/diagrams/[id]/explain/route.ts`
- **runtime** (1 connections) — `src/app/api/diagrams/[id]/explain/route.ts`
- **dynamic** (1 connections) — `src/app/api/diagrams/[id]/sessions/route.ts`
- **runtime** (1 connections) — `src/app/api/diagrams/[id]/sessions/route.ts`

## Relationships

- [\[sessionId\]/route.ts]([sessionId]-route.ts.md) (15 shared connections)
- [ask/route.ts](ask-route.ts.md) (14 shared connections)
- [ref_react](ref_react.md) (7 shared connections)
- [getOwnedDiagram](getOwnedDiagram.md) (6 shared connections)
- [pipeline.ts](pipeline.ts.md) (6 shared connections)
- [read.ts](read.ts.md) (5 shared connections)
- [projects.ts](projects.ts.md) (5 shared connections)
- [설명 생성과 품질 검사](설명_생성과_품질_검사.md) (5 shared connections)
- [(app)/actions.ts](app-actions.ts.md) (4 shared connections)
- [server/flows.ts](server-flows.ts.md) (4 shared connections)
- [Shell.tsx](Shell.tsx.md) (4 shared connections)
- [ask.ts](ask.ts.md) (4 shared connections)

## Source Files

- `src/app/(app)/p/[projectId]/d/[diagramId]/page.tsx`
- `src/app/api/diagrams/[id]/explain/route.ts`
- `src/app/api/diagrams/[id]/sessions/route.ts`
- `src/auth.ts`
- `src/server/chat/events.ts`
- `src/server/chat/pipeline.ts`
- `src/server/chat/sessions.ts`
- `src/server/network.ts`

## Audit Trail

- EXTRACTED: 142 (97%)
- INFERRED: 5 (3%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*