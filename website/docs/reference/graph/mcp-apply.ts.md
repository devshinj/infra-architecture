---
title: "mcp/apply.ts"
sidebar_position: 4
---
# mcp/apply.ts

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 54 nodes · cohesion 0.06

## Key Concepts

- **mcp/apply.ts** (82 connections) — `src/server/mcp/apply.ts`
- **commands.ts** (42 connections) — `src/domain/commands.ts`
- **lockedApply()** (20 connections) — `src/server/mcp/apply.ts`
- **getNetworkKnowledge()** (20 connections) — `src/server/network.ts`
- **parseCommand()** (13 connections) — `src/domain/commands.ts`
- **rewriteFlows()** (11 connections) — `src/server/flows.ts`
- **mcp/explain.ts** (11 connections) — `src/server/mcp/explain.ts`
- **isFlowCommand()** (9 connections) — `src/domain/commands.ts`
- **checkCommands()** (9 connections) — `src/server/mcp/apply.ts`
- **isStructural()** (8 connections) — `src/domain/commands.ts`
- **FlowOp** (8 connections) — `src/domain/flows.ts`
- **toFlowOp()** (7 connections) — `src/domain/commands.ts`
- **pickFlows()** (7 connections) — `src/server/flowSuggest.ts`
- **Task 5: 대화 차례의 흐름 명령** (6 connections) — `docs/superpowers/plans/2026-11-05-flows-and-network-boundaries.md`
- **saveInTx()** (6 connections) — `src/server/mcp/apply.ts`
- **FLOW_LIMITS** (5 connections) — `src/domain/flows.ts`
- **explainRejection()** (5 connections) — `src/server/mcp/explain.ts`
- **splitRewrite()** (4 connections) — `src/server/mcp/apply.ts`
- **explainBody()** (4 connections) — `src/server/mcp/explain.ts`
- **COMMAND_OPS** (3 connections) — `src/domain/commands.ts`
- **Checked** (3 connections) — `src/server/mcp/apply.ts`
- **staleMessage()** (3 connections) — `src/server/mcp/apply.ts`
- **field()** (3 connections) — `src/server/mcp/explain.ts`
- **flowReason()** (3 connections) — `src/server/mcp/explain.ts`
- **FLOW_OPS** (2 connections) — `src/domain/commands.ts`
- *... and 29 more nodes in this community*

## Relationships

- [pipeline.ts](pipeline.ts.md) (20 shared connections)
- [domain/flows.ts](domain-flows.ts.md) (15 shared connections)
- [getOwnedDiagram](getOwnedDiagram.md) (15 shared connections)
- [read.ts](read.ts.md) (12 shared connections)
- [edgeCoalesce.ts](edgeCoalesce.ts.md) (10 shared connections)
- [domain/linkGuess.ts](domain-linkGuess.ts.md) (10 shared connections)
- [flowSuggest.ts](flowSuggest.ts.md) (9 shared connections)
- [chat/warnings.ts](chat-warnings.ts.md) (7 shared connections)
- [apply.ts](apply.ts.md) (6 shared connections)
- [missing.ts](missing.ts.md) (5 shared connections)
- [server/flows.ts](server-flows.ts.md) (5 shared connections)
- [ref_react](ref_react.md) (4 shared connections)

## Source Files

- `docs/superpowers/plans/2026-11-05-flows-and-network-boundaries.md`
- `src/domain/commands.ts`
- `src/domain/flows.ts`
- `src/server/flowSuggest.ts`
- `src/server/flows.ts`
- `src/server/mcp/apply.ts`
- `src/server/mcp/explain.ts`
- `src/server/network.ts`

## Audit Trail

- EXTRACTED: 224 (93%)
- INFERRED: 16 (7%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*