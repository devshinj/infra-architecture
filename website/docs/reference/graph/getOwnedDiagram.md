---
title: "getOwnedDiagram"
sidebar_position: 6
---
# getOwnedDiagram

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 52 nodes · cohesion 0.12

## Key Concepts

- **mcp/apply.ts** (82 connections) — `src/server/mcp/apply.ts`
- **getOwnedDiagram()** (53 connections) — `src/server/projects.ts`
- **emptyState()** (33 connections) — `src/domain/types.ts`
- **withDiagramLock()** (31 connections) — `src/server/chat/lock.ts`
- **createVersion()** (31 connections) — `src/server/versions.ts`
- **getLatestState()** (31 connections) — `src/server/versions.ts`
- **server/linkGuess.ts** (29 connections) — `src/server/linkGuess.ts`
- **fields.ts** (23 connections) — `src/server/fields.ts`
- **lockedApply()** (20 connections) — `src/server/mcp/apply.ts`
- **zoneType.ts** (17 connections) — `src/server/zoneType.ts`
- **rejectLinkGuessFor()** (16 connections) — `src/server/linkGuess.ts`
- **ignore.ts** (15 connections) — `src/server/ignore.ts`
- **lock.ts** (13 connections) — `src/server/chat/lock.ts`
- **saveFieldsFor()** (13 connections) — `src/server/fields.ts`
- **listFlows()** (13 connections) — `src/server/flows.ts`
- **server/assumptions.ts** (12 connections) — `src/server/assumptions.ts`
- **restoreMcpVersion()** (12 connections) — `src/server/mcp/apply.ts`
- **rewriteFlows()** (11 connections) — `src/server/flows.ts`
- **BUSY_MESSAGE** (10 connections) — `src/server/chat/busy.ts`
- **setWarningIgnoredFor()** (10 connections) — `src/server/ignore.ts`
- **removeNoLinkFor()** (10 connections) — `src/server/linkGuess.ts`
- **setZoneTypeFor()** (10 connections) — `src/server/zoneType.ts`
- **confirmAssumptionFor()** (9 connections) — `src/server/assumptions.ts`
- **applyFlowOps()** (9 connections) — `src/server/flows.ts`
- **confirmLinkGuessFor()** (9 connections) — `src/server/linkGuess.ts`
- *... and 27 more nodes in this community*

## Relationships

- [(app)/actions.ts](app-actions.ts.md) (39 shared connections)
- [pipeline.ts](pipeline.ts.md) (32 shared connections)
- [read.ts](read.ts.md) (31 shared connections)
- [domain/apply.ts](domain-apply.ts.md) (18 shared connections)
- [versions.ts](versions.ts.md) (18 shared connections)
- [domain/flows.ts](domain-flows.ts.md) (17 shared connections)
- [projects.ts](projects.ts.md) (15 shared connections)
- [server/network.ts](server-network.ts.md) (15 shared connections)
- [server/flows.ts](server-flows.ts.md) (13 shared connections)
- [commands.ts](commands.ts.md) (12 shared connections)
- [types.ts](types.ts.md) (11 shared connections)
- [flowSuggest.ts](flowSuggest.ts.md) (8 shared connections)

## Source Files

- `docs/superpowers/plans/2026-10-30-infrasketch-phase3b-warnings.md`
- `docs/superpowers/plans/2026-11-05-flows-and-network-boundaries.md`
- `docs/superpowers/plans/2026-11-06-network-knowledge-link-guess.md`
- `src/app/(app)/actions.ts`
- `src/db/schema.ts`
- `src/domain/assumptions.ts`
- `src/domain/commands.ts`
- `src/domain/linkGuess.ts`
- `src/domain/types.ts`
- `src/server/assumptions.ts`
- `src/server/chat/busy.ts`
- `src/server/chat/lock.ts`
- `src/server/fields.ts`
- `src/server/flows.ts`
- `src/server/ignore.ts`
- `src/server/linkGuess.ts`
- `src/server/mcp/apply.ts`
- `src/server/mcp/explain.ts`
- `src/server/projects.ts`
- `src/server/samples.ts`

## Audit Trail

- EXTRACTED: 444 (95%)
- INFERRED: 25 (5%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*