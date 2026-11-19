---
title: "server/flows.ts"
sidebar_position: 46
---
# server/flows.ts

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 24 nodes · cohesion 0.10

## Key Concepts

- **server/flows.ts** (52 connections) — `src/server/flows.ts`
- **useFlows** (17 connections) — `src/ui/flows/useFlows.ts`
- **head/route.ts** (12 connections) — `src/app/api/diagrams/[id]/head/route.ts`
- **StoredFlow** (10 connections) — `src/server/flows.ts`
- **diagramVersions** (6 connections) — `src/db/schema.ts`
- **getDiagramHead()** (4 connections) — `src/server/flows.ts`
- **GET()** (3 connections) — `src/app/api/diagrams/[id]/head/route.ts`
- **FlowSource** (3 connections) — `src/db/schema.ts`
- **FlowProblem** (3 connections) — `src/domain/flows.ts`
- **copyFlows()** (3 connections) — `src/server/flows.ts`
- **message()** (2 connections) — `src/ui/flows/useFlows.ts`
- **.refresh()** (2 connections) — `src/ui/flows/useFlows.ts`
- **Ctx** (1 connections) — `src/app/api/diagrams/[id]/head/route.ts`
- **dynamic** (1 connections) — `src/app/api/diagrams/[id]/head/route.ts`
- **runtime** (1 connections) — `src/app/api/diagrams/[id]/head/route.ts`
- **DiagramHead** (1 connections) — `src/server/flows.ts`
- **LAST_STEP_MESSAGE** (1 connections) — `src/server/flows.ts`
- **.afterTurn()** (1 connections) — `src/ui/flows/useFlows.ts`
- **.confirm()** (1 connections) — `src/ui/flows/useFlows.ts`
- **.remove()** (1 connections) — `src/ui/flows/useFlows.ts`
- **.removeStep()** (1 connections) — `src/ui/flows/useFlows.ts`
- **.rename()** (1 connections) — `src/ui/flows/useFlows.ts`
- **.setActive()** (1 connections) — `src/ui/flows/useFlows.ts`
- **.suggest()** (1 connections) — `src/ui/flows/useFlows.ts`

## Relationships

- [(app)/actions.ts](app-actions.ts.md) (16 shared connections)
- [getOwnedDiagram](getOwnedDiagram.md) (13 shared connections)
- [schema.ts](schema.ts.md) (6 shared connections)
- [projects.ts](projects.ts.md) (4 shared connections)
- [versions.ts](versions.ts.md) (4 shared connections)
- [domain/flows.ts](domain-flows.ts.md) (4 shared connections)
- [NotFoundError](NotFoundError.md) (3 shared connections)
- [server/network.ts](server-network.ts.md) (3 shared connections)
- [read.ts](read.ts.md) (3 shared connections)
- [flowSuggest.ts](flowSuggest.ts.md) (3 shared connections)
- [FlowPanel.tsx](FlowPanel.tsx.md) (3 shared connections)
- [ask/route.ts](ask-route.ts.md) (2 shared connections)

## Source Files

- `src/app/api/diagrams/[id]/head/route.ts`
- `src/db/schema.ts`
- `src/domain/flows.ts`
- `src/server/flows.ts`
- `src/ui/flows/useFlows.ts`

## Audit Trail

- EXTRACTED: 101 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*