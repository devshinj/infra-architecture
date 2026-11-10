---
title: "server/flows.ts"
sidebar_position: 29
---
# server/flows.ts

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 28 nodes · cohesion 0.11

## Key Concepts

- **server/flows.ts** (52 connections) — `src/server/flows.ts`
- **listFlows()** (13 connections) — `src/server/flows.ts`
- **flows/route.ts** (12 connections) — `src/app/api/diagrams/[id]/flows/route.ts`
- **head/route.ts** (12 connections) — `src/app/api/diagrams/[id]/head/route.ts`
- **StoredFlow** (10 connections) — `src/server/flows.ts`
- **withOwnedFlow()** (10 connections) — `src/server/flows.ts`
- **byKey()** (8 connections) — `src/server/flows.ts`
- **removeFlowStep()** (6 connections) — `src/server/flows.ts`
- **renameFlow()** (6 connections) — `src/server/flows.ts`
- **BusyError** (5 connections) — `src/server/flows.ts`
- **confirmFlow()** (5 connections) — `src/server/flows.ts`
- **deleteFlow()** (5 connections) — `src/server/flows.ts`
- **getDiagramHead()** (4 connections) — `src/server/flows.ts`
- **GET()** (3 connections) — `src/app/api/diagrams/[id]/flows/route.ts`
- **GET()** (3 connections) — `src/app/api/diagrams/[id]/head/route.ts`
- **FlowSource** (3 connections) — `src/db/schema.ts`
- **FlowProblem** (3 connections) — `src/domain/flows.ts`
- **copyFlows()** (3 connections) — `src/server/flows.ts`
- **.refresh()** (2 connections) — `src/ui/flows/useFlows.ts`
- **Ctx** (1 connections) — `src/app/api/diagrams/[id]/flows/route.ts`
- **dynamic** (1 connections) — `src/app/api/diagrams/[id]/flows/route.ts`
- **runtime** (1 connections) — `src/app/api/diagrams/[id]/flows/route.ts`
- **Ctx** (1 connections) — `src/app/api/diagrams/[id]/head/route.ts`
- **dynamic** (1 connections) — `src/app/api/diagrams/[id]/head/route.ts`
- **runtime** (1 connections) — `src/app/api/diagrams/[id]/head/route.ts`
- *... and 3 more nodes in this community*

## Relationships

- [getOwnedDiagram](getOwnedDiagram.md) (15 shared connections)
- [schema.ts](schema.ts.md) (10 shared connections)
- [projects.ts](projects.ts.md) (9 shared connections)
- [useFlows](useFlows.md) (9 shared connections)
- [mcp/apply.ts](mcp-apply.ts.md) (7 shared connections)
- [(app)/actions.ts](app-actions.ts.md) (6 shared connections)
- [domain/flows.ts](domain-flows.ts.md) (5 shared connections)
- [read.ts](read.ts.md) (5 shared connections)
- [auth](auth.md) (4 shared connections)
- [ask/route.ts](ask-route.ts.md) (4 shared connections)
- [ref_react](ref_react.md) (4 shared connections)
- [pipeline.ts](pipeline.ts.md) (3 shared connections)

## Source Files

- `src/app/api/diagrams/[id]/flows/route.ts`
- `src/app/api/diagrams/[id]/head/route.ts`
- `src/db/schema.ts`
- `src/domain/flows.ts`
- `src/server/flows.ts`
- `src/ui/flows/useFlows.ts`

## Audit Trail

- EXTRACTED: 130 (99%)
- INFERRED: 1 (1%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*