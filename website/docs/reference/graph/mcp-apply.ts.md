---
title: "mcp/apply.ts"
sidebar_position: 3
---
# mcp/apply.ts

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 59 nodes · cohesion 0.06

## Key Concepts

- **mcp/apply.ts** (82 connections) — `src/server/mcp/apply.ts`
- **commands.ts** (49 connections) — `src/domain/commands.ts`
- **lockedApply()** (20 connections) — `src/server/mcp/apply.ts`
- **parseCommand()** (13 connections) — `src/domain/commands.ts`
- **isFlowCommand()** (11 connections) — `src/domain/commands.ts`
- **rewriteFlows()** (11 connections) — `src/server/flows.ts`
- **mcp/explain.ts** (11 connections) — `src/server/mcp/explain.ts`
- **applyFlowOps()** (9 connections) — `src/server/flows.ts`
- **checkCommands()** (9 connections) — `src/server/mcp/apply.ts`
- **isStructural()** (8 connections) — `src/domain/commands.ts`
- **FlowOp** (8 connections) — `src/domain/flows.ts`
- **applyMcpCommands()** (8 connections) — `src/server/mcp/apply.ts`
- **FlowCommand** (7 connections) — `src/domain/commands.ts`
- **toFlowOp()** (7 connections) — `src/domain/commands.ts`
- **pickFlows()** (7 connections) — `src/server/flowSuggest.ts`
- **Task 5: 대화 차례의 흐름 명령** (6 connections) — `docs/superpowers/plans/2026-11-05-flows-and-network-boundaries.md`
- **saveInTx()** (6 connections) — `src/server/mcp/apply.ts`
- **FLOW_LIMITS** (5 connections) — `src/domain/flows.ts`
- **explainRejection()** (5 connections) — `src/server/mcp/explain.ts`
- **Task 6: AI 흐름 제안(처음 그린 뒤 자동 + 버튼)** (4 connections) — `docs/superpowers/plans/2026-11-05-flows-and-network-boundaries.md`
- **splitRewrite()** (4 connections) — `src/server/mcp/apply.ts`
- **explainBody()** (4 connections) — `src/server/mcp/explain.ts`
- **COMMAND_OPS** (3 connections) — `src/domain/commands.ts`
- **SERVER_ONLY_OPS** (3 connections) — `src/domain/commands.ts`
- **EDGE_MEDIA** (3 connections) — `src/domain/types.ts`
- *... and 34 more nodes in this community*

## Relationships

- [pipeline.ts](pipeline.ts.md) (23 shared connections)
- [getOwnedDiagram](getOwnedDiagram.md) (19 shared connections)
- [schema.ts](schema.ts.md) (15 shared connections)
- [domain/flows.ts](domain-flows.ts.md) (13 shared connections)
- [DiagramState](DiagramState.md) (12 shared connections)
- [domain/apply.ts](domain-apply.ts.md) (11 shared connections)
- [missing.ts](missing.ts.md) (9 shared connections)
- [flowSuggest.ts](flowSuggest.ts.md) (9 shared connections)
- [read.ts](read.ts.md) (7 shared connections)
- [chat/warnings.ts](chat-warnings.ts.md) (5 shared connections)
- [types.ts](types.ts.md) (5 shared connections)
- [index.ts](index.ts.md) (3 shared connections)

## Source Files

- `docs/superpowers/plans/2026-11-05-flows-and-network-boundaries.md`
- `src/domain/commands.ts`
- `src/domain/flows.ts`
- `src/domain/types.ts`
- `src/server/flowSuggest.ts`
- `src/server/flows.ts`
- `src/server/mcp/apply.ts`
- `src/server/mcp/explain.ts`

## Audit Trail

- EXTRACTED: 235 (93%)
- INFERRED: 18 (7%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*