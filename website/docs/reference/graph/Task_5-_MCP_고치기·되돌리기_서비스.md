---
title: "Task 5: MCP 고치기·되돌리기 서비스"
sidebar_position: 75
---
# Task 5: MCP 고치기·되돌리기 서비스

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 12 nodes · cohesion 0.29

## Key Concepts

- **Task 5: MCP 고치기·되돌리기 서비스** (15 connections) — `docs/superpowers/plans/2026-11-09-mcp-server.md`
- **edgeCoalesce.ts** (15 connections) — `src/domain/edgeCoalesce.ts`
- **Command** (13 connections) — `src/domain/commands.ts`
- **createEdgeCoalescer()** (10 connections) — `src/domain/edgeCoalesce.ts`
- **EdgeCoalescer** (5 connections) — `src/domain/edgeCoalesce.ts`
- **.flush()** (4 connections) — `src/domain/edgeCoalesce.ts`
- **.push()** (4 connections) — `src/domain/edgeCoalesce.ts`
- **has()** (3 connections) — `src/domain/edgeCoalesce.ts`
- **idTaken()** (3 connections) — `src/domain/edgeCoalesce.ts`
- **.mapFlow()** (2 connections) — `src/domain/edgeCoalesce.ts`
- **AddEdge** (1 connections) — `src/domain/edgeCoalesce.ts`
- **UpdateEdge** (1 connections) — `src/domain/edgeCoalesce.ts`

## Relationships

- [domain/flows.ts](domain-flows.ts.md) (4 shared connections)
- [domain/apply.ts](domain-apply.ts.md) (4 shared connections)
- [Command](Command.md) (4 shared connections)
- [pipeline.ts](pipeline.ts.md) (4 shared connections)
- [getOwnedDiagram](getOwnedDiagram.md) (3 shared connections)
- [parseCommand](parseCommand.md) (3 shared connections)
- [mcp/apply.ts](mcp-apply.ts.md) (3 shared connections)
- [commands.ts](commands.ts.md) (3 shared connections)
- [domain/linkGuess.ts](domain-linkGuess.ts.md) (2 shared connections)
- [useChatTurn.ts](useChatTurn.ts.md) (2 shared connections)
- [read.ts](read.ts.md) (1 shared connections)
- [MissingChecklist.tsx](MissingChecklist.tsx.md) (1 shared connections)

## Source Files

- `docs/superpowers/plans/2026-11-09-mcp-server.md`
- `src/domain/commands.ts`
- `src/domain/edgeCoalesce.ts`

## Audit Trail

- EXTRACTED: 42 (74%)
- INFERRED: 15 (26%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*