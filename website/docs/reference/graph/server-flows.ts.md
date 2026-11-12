---
title: "server/flows.ts"
sidebar_position: 39
---
# server/flows.ts

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 25 nodes · cohesion 0.13

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
- **confirmFlow()** (5 connections) — `src/server/flows.ts`
- **deleteFlow()** (5 connections) — `src/server/flows.ts`
- **getDiagramHead()** (4 connections) — `src/server/flows.ts`
- **GET()** (3 connections) — `src/app/api/diagrams/[id]/flows/route.ts`
- **GET()** (3 connections) — `src/app/api/diagrams/[id]/head/route.ts`
- **FlowSource** (3 connections) — `src/db/schema.ts`
- **FlowProblem** (3 connections) — `src/domain/flows.ts`
- **copyFlows()** (3 connections) — `src/server/flows.ts`
- **Ctx** (1 connections) — `src/app/api/diagrams/[id]/flows/route.ts`
- **dynamic** (1 connections) — `src/app/api/diagrams/[id]/flows/route.ts`
- **runtime** (1 connections) — `src/app/api/diagrams/[id]/flows/route.ts`
- **Ctx** (1 connections) — `src/app/api/diagrams/[id]/head/route.ts`
- **dynamic** (1 connections) — `src/app/api/diagrams/[id]/head/route.ts`
- **runtime** (1 connections) — `src/app/api/diagrams/[id]/head/route.ts`
- **DiagramHead** (1 connections) — `src/server/flows.ts`
- **LAST_STEP_MESSAGE** (1 connections) — `src/server/flows.ts`

## Relationships

- [getOwnedDiagram](getOwnedDiagram.md) (18 shared connections)
- [flowSuggest.ts](flowSuggest.ts.md) (11 shared connections)
- [schema.ts](schema.ts.md) (10 shared connections)
- [useFlows](useFlows.md) (10 shared connections)
- [mcp/apply.ts](mcp-apply.ts.md) (6 shared connections)
- [(app)/actions.ts](app-actions.ts.md) (5 shared connections)
- [read.ts](read.ts.md) (5 shared connections)
- [NetworkKnowledgePage.tsx](NetworkKnowledgePage.tsx.md) (4 shared connections)
- [ask/route.ts](ask-route.ts.md) (4 shared connections)
- [projects.ts](projects.ts.md) (4 shared connections)
- [pipeline.ts](pipeline.ts.md) (3 shared connections)
- [FlowPanel.tsx](FlowPanel.tsx.md) (3 shared connections)

## Source Files

- `src/app/api/diagrams/[id]/flows/route.ts`
- `src/app/api/diagrams/[id]/head/route.ts`
- `src/db/schema.ts`
- `src/domain/flows.ts`
- `src/server/flows.ts`

## Audit Trail

- EXTRACTED: 127 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*