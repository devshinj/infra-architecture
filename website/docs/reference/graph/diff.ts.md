---
title: "diff.ts"
sidebar_position: 66
---
# diff.ts

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 18 nodes · cohesion 0.18

## Key Concepts

- **DiagramState** (70 connections) — `src/domain/types.ts`
- **diff.ts** (13 connections) — `src/domain/diff.ts`
- **backfill.ts** (11 connections) — `src/server/chat/backfill.ts`
- **diffStates()** (9 connections) — `src/domain/diff.ts`
- **versionSummary.ts** (9 connections) — `src/domain/versionSummary.ts`
- **흐름 보기와 망 경계 표시 Implementation Plan** (5 connections) — `docs/superpowers/plans/2026-11-05-flows-and-network-boundaries.md`
- **commandsBetween()** (5 connections) — `src/domain/diff.ts`
- **equal()** (5 connections) — `src/domain/diff.ts`
- **changeDelta()** (4 connections) — `src/domain/versionSummary.ts`
- **turnVersionSummary()** (4 connections) — `src/domain/versionSummary.ts`
- **planCommandBackfill()** (3 connections) — `src/server/chat/backfill.ts`
- **REPLAY_COMMANDS_MAX** (3 connections) — `src/server/chat/prompt.ts`
- **depth()** (2 connections) — `src/domain/diff.ts`
- **plusMinus()** (2 connections) — `src/domain/versionSummary.ts`
- **2026-11-05-flows-and-network-boundaries.md** (1 connections) — `docs/superpowers/plans/2026-11-05-flows-and-network-boundaries.md`
- **Global Constraints** (1 connections) — `docs/superpowers/plans/2026-11-05-flows-and-network-boundaries.md`
- **REQUEST_MAX** (1 connections) — `src/domain/versionSummary.ts`
- **NOT_COMMAND_PATH** (1 connections) — `src/server/chat/backfill.ts`

## Relationships

- [applyCommand](applyCommand.md) (8 shared connections)
- [getOwnedDiagram](getOwnedDiagram.md) (8 shared connections)
- [domain/types.ts](domain-types.ts.md) (6 shared connections)
- [pipeline.ts](pipeline.ts.md) (5 shared connections)
- [layout.ts](layout.ts.md) (4 shared connections)
- [commands.ts](commands.ts.md) (4 shared connections)
- [DiagramWorkspace.tsx](DiagramWorkspace.tsx.md) (4 shared connections)
- [FlowPanel.tsx](FlowPanel.tsx.md) (3 shared connections)
- [turn.ts](turn.ts.md) (3 shared connections)
- [domain/explain.ts](domain-explain.ts.md) (3 shared connections)
- [flowSuggest.ts](flowSuggest.ts.md) (3 shared connections)
- [domain/flows.ts](domain-flows.ts.md) (3 shared connections)

## Source Files

- `docs/superpowers/plans/2026-11-05-flows-and-network-boundaries.md`
- `src/domain/diff.ts`
- `src/domain/types.ts`
- `src/domain/versionSummary.ts`
- `src/server/chat/backfill.ts`
- `src/server/chat/prompt.ts`

## Audit Trail

- EXTRACTED: 118 (98%)
- INFERRED: 2 (2%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*