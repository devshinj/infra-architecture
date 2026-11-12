---
title: "mcp/apply.ts"
sidebar_position: 4
---
# mcp/apply.ts

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 54 nodes · cohesion 0.06

## Key Concepts

- **mcp/apply.ts** (82 connections) — `src/server/mcp/apply.ts`
- **commands.ts** (47 connections) — `src/domain/commands.ts`
- **lockedApply()** (20 connections) — `src/server/mcp/apply.ts`
- **parseCommand()** (13 connections) — `src/domain/commands.ts`
- **mcp/explain.ts** (11 connections) — `src/server/mcp/explain.ts`
- **isFlowCommand()** (9 connections) — `src/domain/commands.ts`
- **applyFlowOps()** (9 connections) — `src/server/flows.ts`
- **checkCommands()** (9 connections) — `src/server/mcp/apply.ts`
- **isStructural()** (8 connections) — `src/domain/commands.ts`
- **FlowOp** (8 connections) — `src/domain/flows.ts`
- **Task 5: 대화 차례의 흐름 명령** (6 connections) — `docs/superpowers/plans/2026-11-05-flows-and-network-boundaries.md`
- **splitFlowSteps()** (6 connections) — `src/domain/linkGuess.ts`
- **saveInTx()** (6 connections) — `src/server/mcp/apply.ts`
- **FLOW_LIMITS** (5 connections) — `src/domain/flows.ts`
- **explainRejection()** (5 connections) — `src/server/mcp/explain.ts`
- **splitRewrite()** (4 connections) — `src/server/mcp/apply.ts`
- **explainBody()** (4 connections) — `src/server/mcp/explain.ts`
- **COMMAND_OPS** (3 connections) — `src/domain/commands.ts`
- **SERVER_ONLY_OPS** (3 connections) — `src/domain/commands.ts`
- **Checked** (3 connections) — `src/server/mcp/apply.ts`
- **staleMessage()** (3 connections) — `src/server/mcp/apply.ts`
- **field()** (3 connections) — `src/server/mcp/explain.ts`
- **flowReason()** (3 connections) — `src/server/mcp/explain.ts`
- **FLOW_OPS** (2 connections) — `src/domain/commands.ts`
- **isFlowOnly()** (2 connections) — `src/server/mcp/apply.ts`
- *... and 29 more nodes in this community*

## Relationships

- [pipeline.ts](pipeline.ts.md) (22 shared connections)
- [getOwnedDiagram](getOwnedDiagram.md) (18 shared connections)
- [domain/flows.ts](domain-flows.ts.md) (14 shared connections)
- [domain/apply.ts](domain-apply.ts.md) (13 shared connections)
- [DiagramState](DiagramState.md) (10 shared connections)
- [flowSuggest.ts](flowSuggest.ts.md) (9 shared connections)
- [read.ts](read.ts.md) (5 shared connections)
- [useFlows](useFlows.md) (4 shared connections)
- [chat/warnings.ts](chat-warnings.ts.md) (4 shared connections)
- [missing.ts](missing.ts.md) (4 shared connections)
- [schema.ts](schema.ts.md) (4 shared connections)
- [catalog.ts](catalog.ts.md) (3 shared connections)

## Source Files

- `docs/superpowers/plans/2026-11-05-flows-and-network-boundaries.md`
- `src/domain/commands.ts`
- `src/domain/flows.ts`
- `src/domain/linkGuess.ts`
- `src/server/flows.ts`
- `src/server/mcp/apply.ts`
- `src/server/mcp/explain.ts`

## Audit Trail

- EXTRACTED: 209 (95%)
- INFERRED: 12 (5%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*