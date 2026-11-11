---
title: "getOwnedDiagram"
sidebar_position: 13
---
# getOwnedDiagram

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 39 nodes · cohesion 0.19

## Key Concepts

- **types.ts** (71 connections) — `src/domain/types.ts`
- **ValidationError** (56 connections) — `src/server/projects.ts`
- **getOwnedDiagram()** (53 connections) — `src/server/projects.ts`
- **withDiagramLock()** (31 connections) — `src/server/chat/lock.ts`
- **createVersion()** (31 connections) — `src/server/versions.ts`
- **getLatestState()** (30 connections) — `src/server/versions.ts`
- **emptyState()** (29 connections) — `src/domain/types.ts`
- **server/linkGuess.ts** (29 connections) — `src/server/linkGuess.ts`
- **fields.ts** (23 connections) — `src/server/fields.ts`
- **zoneType.ts** (17 connections) — `src/server/zoneType.ts`
- **rejectLinkGuessFor()** (16 connections) — `src/server/linkGuess.ts`
- **ignore.ts** (15 connections) — `src/server/ignore.ts`
- **saveFieldsFor()** (13 connections) — `src/server/fields.ts`
- **listFlows()** (13 connections) — `src/server/flows.ts`
- **linkVerdicts()** (12 connections) — `src/domain/networkRules.ts`
- **server/assumptions.ts** (12 connections) — `src/server/assumptions.ts`
- **lock.ts** (12 connections) — `src/server/chat/lock.ts`
- **restoreMcpVersion()** (12 connections) — `src/server/mcp/apply.ts`
- **rewriteFlows()** (11 connections) — `src/server/flows.ts`
- **BUSY_MESSAGE** (10 connections) — `src/server/chat/busy.ts`
- **setWarningIgnoredFor()** (10 connections) — `src/server/ignore.ts`
- **removeNoLinkFor()** (10 connections) — `src/server/linkGuess.ts`
- **setZoneTypeFor()** (10 connections) — `src/server/zoneType.ts`
- **confirmAssumptionFor()** (9 connections) — `src/server/assumptions.ts`
- **confirmLinkGuessFor()** (9 connections) — `src/server/linkGuess.ts`
- *... and 14 more nodes in this community*

## Relationships

- [pipeline.ts](pipeline.ts.md) (40 shared connections)
- [(app)/actions.ts](app-actions.ts.md) (33 shared connections)
- [DiagramState](DiagramState.md) (28 shared connections)
- [projects.ts](projects.ts.md) (25 shared connections)
- [mcp/apply.ts](mcp-apply.ts.md) (20 shared connections)
- [domain/flows.ts](domain-flows.ts.md) (19 shared connections)
- [read.ts](read.ts.md) (18 shared connections)
- [samples.ts](samples.ts.md) (15 shared connections)
- [server/network.ts](server-network.ts.md) (15 shared connections)
- [versions.ts](versions.ts.md) (11 shared connections)
- [missing.ts](missing.ts.md) (9 shared connections)
- [ask/route.ts](ask-route.ts.md) (8 shared connections)

## Source Files

- `docs/superpowers/plans/2026-10-30-infrasketch-phase3b-warnings.md`
- `docs/superpowers/plans/2026-11-06-network-knowledge-link-guess.md`
- `src/domain/assumptions.ts`
- `src/domain/linkGuess.ts`
- `src/domain/networkRules.ts`
- `src/domain/types.ts`
- `src/server/assumptions.ts`
- `src/server/chat/busy.ts`
- `src/server/chat/lock.ts`
- `src/server/fields.ts`
- `src/server/flows.ts`
- `src/server/ignore.ts`
- `src/server/linkGuess.ts`
- `src/server/mcp/apply.ts`
- `src/server/projects.ts`
- `src/server/versions.ts`
- `src/server/zoneType.ts`

## Audit Trail

- EXTRACTED: 439 (94%)
- INFERRED: 26 (6%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*