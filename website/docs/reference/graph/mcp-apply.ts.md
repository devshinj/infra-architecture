---
title: "mcp/apply.ts"
sidebar_position: 12
---
# mcp/apply.ts

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 50 nodes · cohesion 0.08

## Key Concepts

- **mcp/apply.ts** (85 connections) — `src/server/mcp/apply.ts`
- **server/flows.ts** (58 connections) — `src/server/flows.ts`
- **lockedApply()** (20 connections) — `src/server/mcp/apply.ts`
- **Task 5: MCP 고치기·되돌리기 서비스** (14 connections) — `docs/superpowers/plans/2026-11-09-mcp-server.md`
- **parseCommand()** (13 connections) — `src/domain/commands.ts`
- **checkFlow()** (13 connections) — `src/domain/flows.ts`
- **listFlows()** (13 connections) — `src/server/flows.ts`
- **flows/route.ts** (12 connections) — `src/app/api/diagrams/[id]/flows/route.ts`
- **rewriteFlows()** (11 connections) — `src/server/flows.ts`
- **withOwnedFlow()** (11 connections) — `src/server/flows.ts`
- **mcp/explain.ts** (11 connections) — `src/server/mcp/explain.ts`
- **Task 4: 흐름 저장소·조회·이름 바꾸기·삭제·확인** (9 connections) — `docs/superpowers/plans/2026-11-05-flows-and-network-boundaries.md`
- **applyFlowOps()** (9 connections) — `src/server/flows.ts`
- **byKey()** (9 connections) — `src/server/flows.ts`
- **checkCommands()** (9 connections) — `src/server/mcp/apply.ts`
- **removeFlowStep()** (7 connections) — `src/server/flows.ts`
- **renameFlow()** (7 connections) — `src/server/flows.ts`
- **planFlowOps()** (6 connections) — `src/domain/flows.ts`
- **confirmFlow()** (6 connections) — `src/server/flows.ts`
- **deleteFlow()** (6 connections) — `src/server/flows.ts`
- **saveInTx()** (6 connections) — `src/server/mcp/apply.ts`
- **FLOW_LIMITS** (5 connections) — `src/domain/flows.ts`
- **BusyError** (5 connections) — `src/server/flows.ts`
- **explainRejection()** (5 connections) — `src/server/mcp/explain.ts`
- **splitRewrite()** (4 connections) — `src/server/mcp/apply.ts`
- *... and 25 more nodes in this community*

## Relationships

- [getOwnedDiagram](getOwnedDiagram.md) (42 shared connections)
- [(app)/actions.ts](app-actions.ts.md) (22 shared connections)
- [applyCommand](applyCommand.md) (22 shared connections)
- [commands.ts](commands.ts.md) (18 shared connections)
- [read.ts](read.ts.md) (14 shared connections)
- [domain/flows.ts](domain-flows.ts.md) (12 shared connections)
- [start.ts](start.ts.md) (9 shared connections)
- [flowSuggest.ts](flowSuggest.ts.md) (8 shared connections)
- [turn.ts](turn.ts.md) (7 shared connections)
- [pipeline.ts](pipeline.ts.md) (6 shared connections)
- [reset.ts](reset.ts.md) (6 shared connections)
- [FlowPanel.tsx](FlowPanel.tsx.md) (4 shared connections)

## Source Files

- `docs/superpowers/plans/2026-11-05-flows-and-network-boundaries.md`
- `docs/superpowers/plans/2026-11-09-mcp-server.md`
- `src/app/api/diagrams/[id]/flows/route.ts`
- `src/db/schema.ts`
- `src/domain/commands.ts`
- `src/domain/flows.ts`
- `src/server/flows.ts`
- `src/server/mcp/apply.ts`
- `src/server/mcp/explain.ts`

## Audit Trail

- EXTRACTED: 269 (88%)
- INFERRED: 35 (12%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*