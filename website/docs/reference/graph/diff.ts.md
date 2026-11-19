---
title: "diff.ts"
sidebar_position: 52
---
# diff.ts

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 22 nodes · cohesion 0.14

## Key Concepts

- **DiagramState** (67 connections) — `src/domain/types.ts`
- **diff.ts** (13 connections) — `src/domain/diff.ts`
- **backfill.ts** (11 connections) — `src/server/chat/backfill.ts`
- **diffStates()** (9 connections) — `src/domain/diff.ts`
- **versionSummary.ts** (9 connections) — `src/domain/versionSummary.ts`
- **흐름 보기와 망 경계 표시 Implementation Plan** (5 connections) — `docs/superpowers/plans/2026-11-05-flows-and-network-boundaries.md`
- **commandsBetween()** (5 connections) — `src/domain/diff.ts`
- **equal()** (5 connections) — `src/domain/diff.ts`
- **EdgeCoalescer** (5 connections) — `src/domain/edgeCoalesce.ts`
- **.flush()** (4 connections) — `src/domain/edgeCoalesce.ts`
- **.push()** (4 connections) — `src/domain/edgeCoalesce.ts`
- **changeDelta()** (4 connections) — `src/domain/versionSummary.ts`
- **turnVersionSummary()** (4 connections) — `src/domain/versionSummary.ts`
- **planCommandBackfill()** (3 connections) — `src/server/chat/backfill.ts`
- **REPLAY_COMMANDS_MAX** (3 connections) — `src/server/chat/prompt.ts`
- **depth()** (2 connections) — `src/domain/diff.ts`
- **.mapFlow()** (2 connections) — `src/domain/edgeCoalesce.ts`
- **plusMinus()** (2 connections) — `src/domain/versionSummary.ts`
- **2026-11-05-flows-and-network-boundaries.md** (1 connections) — `docs/superpowers/plans/2026-11-05-flows-and-network-boundaries.md`
- **Global Constraints** (1 connections) — `docs/superpowers/plans/2026-11-05-flows-and-network-boundaries.md`
- **REQUEST_MAX** (1 connections) — `src/domain/versionSummary.ts`
- **NOT_COMMAND_PATH** (1 connections) — `src/server/chat/backfill.ts`

## Relationships

- [pipeline.ts](pipeline.ts.md) (8 shared connections)
- [getOwnedDiagram](getOwnedDiagram.md) (7 shared connections)
- [domain/apply.ts](domain-apply.ts.md) (6 shared connections)
- [useDiagramView.ts](useDiagramView.ts.md) (5 shared connections)
- [domain/flows.ts](domain-flows.ts.md) (4 shared connections)
- [index.ts](index.ts.md) (4 shared connections)
- [types.ts](types.ts.md) (4 shared connections)
- [DiagramWorkspace.tsx](DiagramWorkspace.tsx.md) (4 shared connections)
- [read.ts](read.ts.md) (4 shared connections)
- [flowSuggest.ts](flowSuggest.ts.md) (4 shared connections)
- [MissingChecklist.tsx](MissingChecklist.tsx.md) (4 shared connections)
- [useChatTurn.ts](useChatTurn.ts.md) (3 shared connections)

## Source Files

- `docs/superpowers/plans/2026-11-05-flows-and-network-boundaries.md`
- `src/domain/diff.ts`
- `src/domain/edgeCoalesce.ts`
- `src/domain/types.ts`
- `src/domain/versionSummary.ts`
- `src/server/chat/backfill.ts`
- `src/server/chat/prompt.ts`

## Audit Trail

- EXTRACTED: 122 (96%)
- INFERRED: 5 (4%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*