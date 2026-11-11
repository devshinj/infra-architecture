---
title: "mcp/apply.ts"
sidebar_position: 3
---
# mcp/apply.ts

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 60 nodes · cohesion 0.06

## Key Concepts

- **mcp/apply.ts** (82 connections) — `src/server/mcp/apply.ts`
- **commands.ts** (44 connections) — `src/domain/commands.ts`
- **lockedTurn()** (40 connections) — `src/server/chat/pipeline.ts`
- **lockedApply()** (20 connections) — `src/server/mcp/apply.ts`
- **getNetworkKnowledge()** (20 connections) — `src/server/network.ts`
- **parseCommand()** (13 connections) — `src/domain/commands.ts`
- **linkVerdicts()** (12 connections) — `src/domain/networkRules.ts`
- **Task 6: 대화 차례 — 프롬프트, 종류 검사, 망연계 추정 기록, 흐름 나누기, 경고 점검** (11 connections) — `docs/superpowers/plans/2026-11-06-network-knowledge-link-guess.md`
- **rewriteFlows()** (11 connections) — `src/server/flows.ts`
- **mcp/explain.ts** (11 connections) — `src/server/mcp/explain.ts`
- **isFlowCommand()** (9 connections) — `src/domain/commands.ts`
- **applyFlowOps()** (9 connections) — `src/server/flows.ts`
- **checkCommands()** (9 connections) — `src/server/mcp/apply.ts`
- **isStructural()** (8 connections) — `src/domain/commands.ts`
- **toFlowOp()** (7 connections) — `src/domain/commands.ts`
- **pickFlows()** (7 connections) — `src/server/flowSuggest.ts`
- **Task 5: 대화 차례의 흐름 명령** (6 connections) — `docs/superpowers/plans/2026-11-05-flows-and-network-boundaries.md`
- **FlowCommand** (6 connections) — `src/domain/commands.ts`
- **splitFlowSteps()** (6 connections) — `src/domain/linkGuess.ts`
- **saveInTx()** (6 connections) — `src/server/mcp/apply.ts`
- **FLOW_LIMITS** (5 connections) — `src/domain/flows.ts`
- **explainRejection()** (5 connections) — `src/server/mcp/explain.ts`
- **Task 6: AI 흐름 제안(처음 그린 뒤 자동 + 버튼)** (4 connections) — `docs/superpowers/plans/2026-11-05-flows-and-network-boundaries.md`
- **splitRewrite()** (4 connections) — `src/server/mcp/apply.ts`
- **explainBody()** (4 connections) — `src/server/mcp/explain.ts`
- *... and 35 more nodes in this community*

## Relationships

- [types.ts](types.ts.md) (27 shared connections)
- [getOwnedDiagram](getOwnedDiagram.md) (26 shared connections)
- [pipeline.ts](pipeline.ts.md) (21 shared connections)
- [samples.ts](samples.ts.md) (17 shared connections)
- [Task 5: MCP 고치기·되돌리기 서비스](Task_5-_MCP_고치기·되돌리기_서비스.md) (13 shared connections)
- [DiagramState](DiagramState.md) (11 shared connections)
- [versions.ts](versions.ts.md) (10 shared connections)
- [domain/flows.ts](domain-flows.ts.md) (8 shared connections)
- [File Structure](File_Structure.md) (5 shared connections)
- [ask.ts](ask.ts.md) (5 shared connections)
- [prompt.ts](prompt.ts.md) (4 shared connections)
- [createJsonlParser](createJsonlParser.md) (4 shared connections)

## Source Files

- `docs/superpowers/plans/2026-11-05-flows-and-network-boundaries.md`
- `docs/superpowers/plans/2026-11-06-network-knowledge-link-guess.md`
- `src/domain/commands.ts`
- `src/domain/flows.ts`
- `src/domain/linkGuess.ts`
- `src/domain/networkRules.ts`
- `src/server/chat/pipeline.ts`
- `src/server/flowSuggest.ts`
- `src/server/flows.ts`
- `src/server/mcp/apply.ts`
- `src/server/mcp/explain.ts`
- `src/server/network.ts`

## Audit Trail

- EXTRACTED: 274 (90%)
- INFERRED: 29 (10%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*