---
title: "getOwnedDiagram"
sidebar_position: 24
---
# getOwnedDiagram

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 29 nodes · cohesion 0.25

## Key Concepts

- **getOwnedDiagram()** (53 connections) — `src/server/projects.ts`
- **withDiagramLock()** (31 connections) — `src/server/chat/lock.ts`
- **createVersion()** (31 connections) — `src/server/versions.ts`
- **getLatestState()** (30 connections) — `src/server/versions.ts`
- **server/linkGuess.ts** (29 connections) — `src/server/linkGuess.ts`
- **emptyState()** (27 connections) — `src/domain/types.ts`
- **fields.ts** (23 connections) — `src/server/fields.ts`
- **zoneType.ts** (17 connections) — `src/server/zoneType.ts`
- **rejectLinkGuessFor()** (16 connections) — `src/server/linkGuess.ts`
- **ignore.ts** (15 connections) — `src/server/ignore.ts`
- **saveFieldsFor()** (13 connections) — `src/server/fields.ts`
- **server/assumptions.ts** (12 connections) — `src/server/assumptions.ts`
- **lock.ts** (12 connections) — `src/server/chat/lock.ts`
- **BUSY_MESSAGE** (10 connections) — `src/server/chat/busy.ts`
- **setWarningIgnoredFor()** (10 connections) — `src/server/ignore.ts`
- **removeNoLinkFor()** (10 connections) — `src/server/linkGuess.ts`
- **setZoneTypeFor()** (10 connections) — `src/server/zoneType.ts`
- **confirmAssumptionFor()** (9 connections) — `src/server/assumptions.ts`
- **confirmLinkGuessFor()** (9 connections) — `src/server/linkGuess.ts`
- **duplicateDiagram()** (9 connections) — `src/server/projects.ts`
- **noLinkKey()** (8 connections) — `src/domain/assumptions.ts`
- **Task 7: 서버 액션 — 망 종류 확인·바꾸기, 망연계 맞아요·아니에요** (7 connections) — `docs/superpowers/plans/2026-11-06-network-knowledge-link-guess.md`
- **confirmAssumption()** (6 connections) — `src/domain/assumptions.ts`
- **busy.ts** (6 connections) — `src/server/chat/busy.ts`
- **getDiagram()** (6 connections) — `src/server/projects.ts`
- *... and 4 more nodes in this community*

## Relationships

- [(app)/actions.ts](app-actions.ts.md) (31 shared connections)
- [projects.ts](projects.ts.md) (18 shared connections)
- [mcp/apply.ts](mcp-apply.ts.md) (15 shared connections)
- [types.ts](types.ts.md) (15 shared connections)
- [read.ts](read.ts.md) (14 shared connections)
- [server/flows.ts](server-flows.ts.md) (13 shared connections)
- [server/network.ts](server-network.ts.md) (13 shared connections)
- [ask.ts](ask.ts.md) (13 shared connections)
- [pipeline.ts](pipeline.ts.md) (11 shared connections)
- [versions.ts](versions.ts.md) (10 shared connections)
- [domain/linkGuess.ts](domain-linkGuess.ts.md) (6 shared connections)
- [\[sessionId\]/route.ts]([sessionId]-route.ts.md) (6 shared connections)

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
- `src/server/ignore.ts`
- `src/server/linkGuess.ts`
- `src/server/projects.ts`
- `src/server/versions.ts`
- `src/server/zoneType.ts`

## Audit Trail

- EXTRACTED: 299 (94%)
- INFERRED: 20 (6%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*