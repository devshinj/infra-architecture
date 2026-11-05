---
title: "server/flows.ts"
sidebar_position: 28
---
# server/flows.ts

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 23 nodes · cohesion 0.19

## Key Concepts

- **server/flows.ts** (47 connections) — `src/server/flows.ts`
- **domain/flows.ts** (28 connections) — `src/domain/flows.ts`
- **boundary.ts** (13 connections) — `src/domain/boundary.ts`
- **checkFlow()** (12 connections) — `src/domain/flows.ts`
- **crossesBoundary()** (10 connections) — `src/domain/boundary.ts`
- **crossingNote()** (8 connections) — `src/domain/flows.ts`
- **applyFlowOps()** (8 connections) — `src/server/flows.ts`
- **Task 8: "흐름" 탭·지나는 흐름·연동** (7 connections) — `docs/superpowers/plans/2026-11-05-flows-and-network-boundaries.md`
- **FlowOp** (6 connections) — `src/domain/flows.ts`
- **shortLabel()** (6 connections) — `src/domain/flows.ts`
- **networkZoneOf()** (5 connections) — `src/domain/boundary.ts`
- **flowsThrough()** (5 connections) — `src/domain/flows.ts`
- **Task 3: 흐름 도메인(모양·검사·끊김)** (4 connections) — `docs/superpowers/plans/2026-11-05-flows-and-network-boundaries.md`
- **isDirectCrossing()** (4 connections) — `src/domain/boundary.ts`
- **stepEnd()** (4 connections) — `src/domain/flows.ts`
- **FLOW_LIMITS** (3 connections) — `src/domain/flows.ts`
- **FlowProblem** (3 connections) — `src/domain/flows.ts`
- **toSteps()** (3 connections) — `src/server/flows.ts`
- **BOUNDARY_NODE_KINDS** (2 connections) — `src/domain/boundary.ts`
- **FlowStep** (2 connections) — `src/domain/flows.ts`
- **FlowStepInput** (2 connections) — `src/domain/flows.ts`
- **problemReason()** (2 connections) — `src/server/flows.ts`
- **LAST_STEP_MESSAGE** (1 connections) — `src/server/flows.ts`

## Relationships

- [flowSuggest.ts](flowSuggest.ts.md) (13 shared connections)
- [useFlows](useFlows.md) (13 shared connections)
- [FlowPanel.tsx](FlowPanel.tsx.md) (6 shared connections)
- [prompt.ts](prompt.ts.md) (6 shared connections)
- [schema.ts](schema.ts.md) (6 shared connections)
- [getOwnedDiagram](getOwnedDiagram.md) (6 shared connections)
- [pipeline.ts](pipeline.ts.md) (5 shared connections)
- [Review Focus](Review_Focus.md) (4 shared connections)
- [DiagramWorkspace.tsx](DiagramWorkspace.tsx.md) (3 shared connections)
- [types.ts](types.ts.md) (3 shared connections)
- [missing.ts](missing.ts.md) (3 shared connections)
- [EdgeLayer.tsx](EdgeLayer.tsx.md) (3 shared connections)

## Source Files

- `docs/superpowers/plans/2026-11-05-flows-and-network-boundaries.md`
- `src/domain/boundary.ts`
- `src/domain/flows.ts`
- `src/server/flows.ts`

## Audit Trail

- EXTRACTED: 126 (91%)
- INFERRED: 12 (9%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*