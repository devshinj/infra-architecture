---
title: "auth"
sidebar_position: 21
sidebar_label: "핵심 노드: auth"
---
# auth

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 31 nodes · cohesion 0.08

## Key Concepts

- **auth** (34 connections) — `src/auth.ts`
- **explain/route.ts** (18 connections) — `src/app/api/diagrams/[id]/explain/route.ts`
- **suggest/route.ts** (17 connections) — `src/app/api/diagrams/[id]/flows/suggest/route.ts`
- **flows/route.ts** (12 connections) — `src/app/api/diagrams/[id]/flows/route.ts`
- **head/route.ts** (12 connections) — `src/app/api/diagrams/[id]/head/route.ts`
- **ref_zod** (9 connections)
- **GET()** (4 connections) — `src/app/api/diagrams/[id]/explain/route.ts`
- **POST()** (4 connections) — `src/app/api/diagrams/[id]/explain/route.ts`
- **getDiagramHead()** (4 connections) — `src/server/flows.ts`
- **failure()** (3 connections) — `src/app/api/diagrams/[id]/explain/route.ts`
- **GET()** (3 connections) — `src/app/api/diagrams/[id]/flows/route.ts`
- **POST()** (3 connections) — `src/app/api/diagrams/[id]/flows/suggest/route.ts`
- **GET()** (3 connections) — `src/app/api/diagrams/[id]/head/route.ts`
- **FLOW_BUSY_MESSAGE** (3 connections) — `src/server/flows.ts`
- **FLOW_SUGGEST_BUSY_MESSAGE** (2 connections) — `src/server/flowSuggest.ts`
- **BodySchema** (1 connections) — `src/app/api/diagrams/[id]/explain/route.ts`
- **Ctx** (1 connections) — `src/app/api/diagrams/[id]/explain/route.ts`
- **dynamic** (1 connections) — `src/app/api/diagrams/[id]/explain/route.ts`
- **maxDuration** (1 connections) — `src/app/api/diagrams/[id]/explain/route.ts`
- **runtime** (1 connections) — `src/app/api/diagrams/[id]/explain/route.ts`
- **Ctx** (1 connections) — `src/app/api/diagrams/[id]/flows/route.ts`
- **dynamic** (1 connections) — `src/app/api/diagrams/[id]/flows/route.ts`
- **runtime** (1 connections) — `src/app/api/diagrams/[id]/flows/route.ts`
- **BodySchema** (1 connections) — `src/app/api/diagrams/[id]/flows/suggest/route.ts`
- **Ctx** (1 connections) — `src/app/api/diagrams/[id]/flows/suggest/route.ts`
- *... and 6 more nodes in this community*

## Relationships

- [auth.ts](auth.ts.md) (9 shared connections)
- [ask/route.ts](ask-route.ts.md) (6 shared connections)
- [NotFoundError](NotFoundError.md) (6 shared connections)
- [server/network.ts](server-network.ts.md) (6 shared connections)
- [projects.ts](projects.ts.md) (5 shared connections)
- [설명 생성과 품질 검사](설명_생성과_품질_검사.md) (5 shared connections)
- [DiagramState](DiagramState.md) (5 shared connections)
- [versions.ts](versions.ts.md) (4 shared connections)
- [\[diagramId\]/page.tsx]([diagramId]-page.tsx.md) (4 shared connections)
- [Shell.tsx](Shell.tsx.md) (4 shared connections)
- [\[sessionId\]/route.ts]([sessionId]-route.ts.md) (3 shared connections)
- [env.ts](env.ts.md) (3 shared connections)

## Source Files

- `src/app/api/diagrams/[id]/explain/route.ts`
- `src/app/api/diagrams/[id]/flows/route.ts`
- `src/app/api/diagrams/[id]/flows/suggest/route.ts`
- `src/app/api/diagrams/[id]/head/route.ts`
- `src/auth.ts`
- `src/server/flowSuggest.ts`
- `src/server/flows.ts`

## Audit Trail

- EXTRACTED: 108 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*