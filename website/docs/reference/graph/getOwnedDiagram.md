---
title: "getOwnedDiagram"
sidebar_position: 16
---
# getOwnedDiagram

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 30 nodes · cohesion 0.23

## Key Concepts

- **getOwnedDiagram()** (46 connections) — `src/server/projects.ts`
- **server/linkGuess.ts** (29 connections) — `src/server/linkGuess.ts`
- **withDiagramLock()** (27 connections) — `src/server/chat/lock.ts`
- **getLatestState()** (25 connections) — `src/server/versions.ts`
- **createVersion()** (24 connections) — `src/server/versions.ts`
- **emptyState()** (23 connections) — `src/domain/types.ts`
- **domain/assumptions.ts** (18 connections) — `src/domain/assumptions.ts`
- **zoneType.ts** (17 connections) — `src/server/zoneType.ts`
- **rejectLinkGuessFor()** (16 connections) — `src/server/linkGuess.ts`
- **ignore.ts** (15 connections) — `src/server/ignore.ts`
- **saveFieldsFor()** (13 connections) — `src/server/fields.ts`
- **server/assumptions.ts** (12 connections) — `src/server/assumptions.ts`
- **lock.ts** (11 connections) — `src/server/chat/lock.ts`
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
- **parseNoLinkKey()** (6 connections) — `src/domain/assumptions.ts`
- **busy.ts** (6 connections) — `src/server/chat/busy.ts`
- *... and 5 more nodes in this community*

## Relationships

- [projects.ts](projects.ts.md) (27 shared connections)
- [(app)/actions.ts](app-actions.ts.md) (27 shared connections)
- [types.ts](types.ts.md) (21 shared connections)
- [server/flows.ts](server-flows.ts.md) (12 shared connections)
- [ask.ts](ask.ts.md) (12 shared connections)
- [pipeline.ts](pipeline.ts.md) (12 shared connections)
- [flowSuggest.ts](flowSuggest.ts.md) (8 shared connections)
- [\[sessionId\]/route.ts]([sessionId]-route.ts.md) (8 shared connections)
- [runAskTurn](runAskTurn.md) (7 shared connections)
- [networkRules.ts](networkRules.ts.md) (6 shared connections)
- [domain/flows.ts](domain-flows.ts.md) (6 shared connections)
- [samples.ts](samples.ts.md) (6 shared connections)

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

- EXTRACTED: 276 (94%)
- INFERRED: 18 (6%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*