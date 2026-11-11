---
title: "DiagramState"
sidebar_position: 36
sidebar_label: "핵심 노드: DiagramState"
---
# DiagramState

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 23 nodes · cohesion 0.14

## Key Concepts

- **DiagramState** (61 connections) — `src/domain/types.ts`
- **flowSuggest.ts** (53 connections) — `src/server/flowSuggest.ts`
- **suggestFlows()** (14 connections) — `src/server/flowSuggest.ts`
- **FlowOp** (8 connections) — `src/domain/flows.ts`
- **FlowSuggestRepo** (8 connections) — `src/server/flowSuggest.ts`
- **흐름 보기와 망 경계 표시 Implementation Plan** (5 connections) — `docs/superpowers/plans/2026-11-05-flows-and-network-boundaries.md`
- **.applyFlowOps()** (5 connections) — `src/server/flowSuggest.ts`
- **diagrams** (4 connections) — `src/db/schema.ts`
- **.getLatestState()** (4 connections) — `src/server/flowSuggest.ts`
- **.getOwnedDiagram()** (3 connections) — `src/server/flowSuggest.ts`
- **.listFlows()** (3 connections) — `src/server/flowSuggest.ts`
- **Checked** (3 connections) — `src/server/mcp/apply.ts`
- **.claimSuggest()** (2 connections) — `src/server/flowSuggest.ts`
- **.releaseSuggest()** (2 connections) — `src/server/flowSuggest.ts`
- **.withLock()** (2 connections) — `src/server/flowSuggest.ts`
- **2026-11-05-flows-and-network-boundaries.md** (1 connections) — `docs/superpowers/plans/2026-11-05-flows-and-network-boundaries.md`
- **Global Constraints** (1 connections) — `docs/superpowers/plans/2026-11-05-flows-and-network-boundaries.md`
- **AddFlowOp** (1 connections) — `src/server/flowSuggest.ts`
- **dbRepo** (1 connections) — `src/server/flowSuggest.ts`
- **DepsInput** (1 connections) — `src/server/flowSuggest.ts`
- **FLOW_SUGGEST_FAIL_MESSAGE** (1 connections) — `src/server/flowSuggest.ts`
- **FLOW_SUGGEST_LIMIT_MESSAGE** (1 connections) — `src/server/flowSuggest.ts`
- **SuggestResult** (1 connections) — `src/server/flowSuggest.ts`

## Relationships

- [mcp/apply.ts](mcp-apply.ts.md) (11 shared connections)
- [types.ts](types.ts.md) (10 shared connections)
- [versions.ts](versions.ts.md) (9 shared connections)
- [getOwnedDiagram](getOwnedDiagram.md) (9 shared connections)
- [deps.ts](deps.ts.md) (6 shared connections)
- [samples.ts](samples.ts.md) (5 shared connections)
- [auth](auth.md) (5 shared connections)
- [prompt.ts](prompt.ts.md) (4 shared connections)
- [projects.ts](projects.ts.md) (3 shared connections)
- [schema.ts](schema.ts.md) (3 shared connections)
- [pipeline.ts](pipeline.ts.md) (3 shared connections)
- [domain/flows.ts](domain-flows.ts.md) (3 shared connections)

## Source Files

- `docs/superpowers/plans/2026-11-05-flows-and-network-boundaries.md`
- `src/db/schema.ts`
- `src/domain/flows.ts`
- `src/domain/types.ts`
- `src/server/flowSuggest.ts`
- `src/server/mcp/apply.ts`

## Audit Trail

- EXTRACTED: 143 (96%)
- INFERRED: 6 (4%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*