---
title: "mcp/apply.ts"
sidebar_position: 5
---
# mcp/apply.ts

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 76 nodes · cohesion 0.05

## Key Concepts

- **mcp/apply.ts** (82 connections) — `src/server/mcp/apply.ts`
- **commands.ts** (44 connections) — `src/domain/commands.ts`
- **lockedApply()** (20 connections) — `src/server/mcp/apply.ts`
- **Task 5: MCP 고치기·되돌리기 서비스** (15 connections) — `docs/superpowers/plans/2026-11-09-mcp-server.md`
- **edgeCoalesce.ts** (15 connections) — `src/domain/edgeCoalesce.ts`
- **settle.ts** (15 connections) — `src/server/chat/settle.ts`
- **Command** (13 connections) — `src/domain/commands.ts`
- **parseCommand()** (13 connections) — `src/domain/commands.ts`
- **settleTurn()** (12 connections) — `src/server/chat/settle.ts`
- **Task 6: 대화 차례 — 프롬프트, 종류 검사, 망연계 추정 기록, 흐름 나누기, 경고 점검** (11 connections) — `docs/superpowers/plans/2026-11-06-network-knowledge-link-guess.md`
- **rewriteFlows()** (11 connections) — `src/server/flows.ts`
- **mcp/explain.ts** (11 connections) — `src/server/mcp/explain.ts`
- **createEdgeCoalescer()** (10 connections) — `src/domain/edgeCoalesce.ts`
- **isFlowCommand()** (9 connections) — `src/domain/commands.ts`
- **applyFlowOps()** (9 connections) — `src/server/flows.ts`
- **checkCommands()** (9 connections) — `src/server/mcp/apply.ts`
- **isStructural()** (8 connections) — `src/domain/commands.ts`
- **toFlowOp()** (7 connections) — `src/domain/commands.ts`
- **pickFlows()** (7 connections) — `src/server/flowSuggest.ts`
- **Task 5: 대화 차례의 흐름 명령** (6 connections) — `docs/superpowers/plans/2026-11-05-flows-and-network-boundaries.md`
- **FlowCommand** (6 connections) — `src/domain/commands.ts`
- **planFlowOps()** (6 connections) — `src/domain/flows.ts`
- **splitFlowSteps()** (6 connections) — `src/domain/linkGuess.ts`
- **saveInTx()** (6 connections) — `src/server/mcp/apply.ts`
- **Global Constraints** (5 connections) — `docs/superpowers/plans/2026-11-06-network-knowledge-link-guess.md`
- *... and 51 more nodes in this community*

## Relationships

- [pipeline.ts](pipeline.ts.md) (35 shared connections)
- [schema.ts](schema.ts.md) (26 shared connections)
- [getOwnedDiagram](getOwnedDiagram.md) (21 shared connections)
- [domain/apply.ts](domain-apply.ts.md) (15 shared connections)
- [domain/flows.ts](domain-flows.ts.md) (14 shared connections)
- [domain/linkGuess.ts](domain-linkGuess.ts.md) (12 shared connections)
- [read.ts](read.ts.md) (8 shared connections)
- [chat/warnings.ts](chat-warnings.ts.md) (7 shared connections)
- [prompt.ts](prompt.ts.md) (4 shared connections)
- [\[sessionId\]/route.ts]([sessionId]-route.ts.md) (4 shared connections)
- [types.ts](types.ts.md) (4 shared connections)
- [Review Focus](Review_Focus.md) (3 shared connections)

## Source Files

- `docs/superpowers/plans/2026-11-05-flows-and-network-boundaries.md`
- `docs/superpowers/plans/2026-11-06-network-knowledge-link-guess.md`
- `docs/superpowers/plans/2026-11-09-mcp-server.md`
- `src/domain/commands.ts`
- `src/domain/edgeCoalesce.ts`
- `src/domain/flows.ts`
- `src/domain/linkGuess.ts`
- `src/server/chat/settle.ts`
- `src/server/flowSuggest.ts`
- `src/server/flows.ts`
- `src/server/mcp/apply.ts`
- `src/server/mcp/explain.ts`

## Audit Trail

- EXTRACTED: 278 (85%)
- INFERRED: 48 (15%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*