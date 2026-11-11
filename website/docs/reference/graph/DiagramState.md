---
title: "DiagramState"
sidebar_position: 23
sidebar_label: "핵심 노드: DiagramState"
---
# DiagramState

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 30 nodes · cohesion 0.11

## Key Concepts

- **DiagramState** (61 connections) — `src/domain/types.ts`
- **flowSuggest.ts** (53 connections) — `src/server/flowSuggest.ts`
- **server/flows.ts** (52 connections) — `src/server/flows.ts`
- **db** (16 connections) — `src/db/client.ts`
- **checkFlow()** (13 connections) — `src/domain/flows.ts`
- **withOwnedFlow()** (10 connections) — `src/server/flows.ts`
- **Task 4: 흐름 저장소·조회·이름 바꾸기·삭제·확인** (9 connections) — `docs/superpowers/plans/2026-11-05-flows-and-network-boundaries.md`
- **FlowOp** (8 connections) — `src/domain/flows.ts`
- **byKey()** (8 connections) — `src/server/flows.ts`
- **pickFlows()** (7 connections) — `src/server/flowSuggest.ts`
- **removeFlowStep()** (6 connections) — `src/server/flows.ts`
- **renameFlow()** (6 connections) — `src/server/flows.ts`
- **BusyError** (5 connections) — `src/server/flows.ts`
- **confirmFlow()** (5 connections) — `src/server/flows.ts`
- **deleteFlow()** (5 connections) — `src/server/flows.ts`
- **.applyFlowOps()** (5 connections) — `src/server/flowSuggest.ts`
- **diagrams** (4 connections) — `src/db/schema.ts`
- **flows** (4 connections) — `src/db/schema.ts`
- **copyFlows()** (3 connections) — `src/server/flows.ts`
- **FLOW_BUSY_MESSAGE** (3 connections) — `src/server/flows.ts`
- **Checked** (3 connections) — `src/server/mcp/apply.ts`
- **.constructor()** (1 connections) — `src/server/flows.ts`
- **DiagramHead** (1 connections) — `src/server/flows.ts`
- **LAST_STEP_MESSAGE** (1 connections) — `src/server/flows.ts`
- **AddFlowOp** (1 connections) — `src/server/flowSuggest.ts`
- *... and 5 more nodes in this community*

## Relationships

- [getOwnedDiagram](getOwnedDiagram.md) (28 shared connections)
- [domain/flows.ts](domain-flows.ts.md) (16 shared connections)
- [mcp/apply.ts](mcp-apply.ts.md) (15 shared connections)
- [server/network.ts](server-network.ts.md) (12 shared connections)
- [ref_react](ref_react.md) (12 shared connections)
- [useFlows](useFlows.md) (11 shared connections)
- [flowSuggest.ts](flowSuggest.ts.md) (11 shared connections)
- [pipeline.ts](pipeline.ts.md) (10 shared connections)
- [(app)/actions.ts](app-actions.ts.md) (8 shared connections)
- [versions.ts](versions.ts.md) (7 shared connections)
- [projects.ts](projects.ts.md) (6 shared connections)
- [samples.ts](samples.ts.md) (5 shared connections)

## Source Files

- `docs/superpowers/plans/2026-11-05-flows-and-network-boundaries.md`
- `src/db/client.ts`
- `src/db/schema.ts`
- `src/domain/flows.ts`
- `src/domain/types.ts`
- `src/server/flowSuggest.ts`
- `src/server/flows.ts`
- `src/server/mcp/apply.ts`

## Audit Trail

- EXTRACTED: 229 (93%)
- INFERRED: 16 (7%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*