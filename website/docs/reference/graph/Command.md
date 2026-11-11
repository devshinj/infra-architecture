---
title: "Command"
sidebar_position: 61
---
# Command

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 14 nodes · cohesion 0.21

## Key Concepts

- **Command** (13 connections) — `src/domain/commands.ts`
- **diff.ts** (12 connections) — `src/domain/diff.ts`
- **backfill.ts** (11 connections) — `src/server/chat/backfill.ts`
- **diffStates()** (7 connections) — `src/domain/diff.ts`
- **commandsBetween()** (5 connections) — `src/domain/diff.ts`
- **equal()** (5 connections) — `src/domain/diff.ts`
- **EdgeCoalescer** (5 connections) — `src/domain/edgeCoalesce.ts`
- **.flush()** (4 connections) — `src/domain/edgeCoalesce.ts`
- **.push()** (4 connections) — `src/domain/edgeCoalesce.ts`
- **planCommandBackfill()** (3 connections) — `src/server/chat/backfill.ts`
- **REPLAY_COMMANDS_MAX** (3 connections) — `src/server/chat/prompt.ts`
- **depth()** (2 connections) — `src/domain/diff.ts`
- **.mapFlow()** (2 connections) — `src/domain/edgeCoalesce.ts`
- **NOT_COMMAND_PATH** (1 connections) — `src/server/chat/backfill.ts`

## Relationships

- [getOwnedDiagram](getOwnedDiagram.md) (7 shared connections)
- [commands.ts](commands.ts.md) (4 shared connections)
- [useChatTurn.ts](useChatTurn.ts.md) (4 shared connections)
- [flowSuggest.ts](flowSuggest.ts.md) (4 shared connections)
- [pipeline.ts](pipeline.ts.md) (2 shared connections)
- [useDiagramView.ts](useDiagramView.ts.md) (2 shared connections)
- [DiagramWorkspace.tsx](DiagramWorkspace.tsx.md) (2 shared connections)
- [prompt.ts](prompt.ts.md) (2 shared connections)
- [domain/apply.ts](domain-apply.ts.md) (1 shared connections)
- [settle.ts](settle.ts.md) (1 shared connections)
- [mcp/apply.ts](mcp-apply.ts.md) (1 shared connections)
- [samples.ts](samples.ts.md) (1 shared connections)

## Source Files

- `src/domain/commands.ts`
- `src/domain/diff.ts`
- `src/domain/edgeCoalesce.ts`
- `src/server/chat/backfill.ts`
- `src/server/chat/prompt.ts`

## Audit Trail

- EXTRACTED: 54 (95%)
- INFERRED: 3 (5%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*