---
title: "domain/flows.ts"
sidebar_position: 3
---
# domain/flows.ts

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 64 nodes · cohesion 0.06

## Key Concepts

- **domain/warnings.ts** (40 connections) — `src/domain/warnings.ts`
- **chat/warnings.ts** (37 connections) — `src/server/chat/warnings.ts`
- **networkRules.ts** (30 connections) — `src/domain/networkRules.ts`
- **checkWarnings()** (17 connections) — `src/server/chat/warnings.ts`
- **evaluateRules()** (15 connections) — `src/domain/warnings.ts`
- **createJsonlParser()** (15 connections) — `src/server/llm/jsonl.ts`
- **mergeWarnings()** (13 connections) — `src/domain/warnings.ts`
- **checkCodeWarnings()** (13 connections) — `src/server/chat/warnings.ts`
- **DNode** (12 connections) — `src/domain/types.ts`
- **jsonl.ts** (11 connections) — `src/server/llm/jsonl.ts`
- **Task 2: 서버 점검 — Clef 판정과 Qwen 문구** (10 connections) — `docs/superpowers/plans/2026-10-30-infrasketch-phase3b-warnings.md`
- **파일 구조** (8 connections) — `docs/superpowers/plans/2026-10-30-infrasketch-phase3b-warnings.md`
- **Edge** (8 connections) — `src/domain/types.ts`
- **Task 3: 판정 — 통신 길, 연결 방식 예상 경고, 빠진 정보** (7 connections) — `docs/superpowers/plans/2026-11-06-network-knowledge-link-guess.md`
- **categoryOf()** (7 connections) — `src/domain/catalog.ts`
- **evaluateNetworkRules()** (7 connections) — `src/domain/networkRules.ts`
- **judgeExposed()** (7 connections) — `src/server/chat/warnings.ts`
- **writeTexts()** (6 connections) — `src/server/chat/warnings.ts`
- **InfraSketch 3B단계: 경고·구성 패턴 구현 계획** (5 connections) — `docs/superpowers/plans/2026-10-30-infrasketch-phase3b-warnings.md`
- **noulProbability()** (5 connections) — `src/server/llm/clef.ts`
- **Task 1: 망 영역·망연계 노드·연결 전달물/방향** (4 connections) — `docs/superpowers/plans/2026-11-05-flows-and-network-boundaries.md`
- **isDirectCrossing()** (4 connections) — `src/domain/boundary.ts`
- **NodeKind** (4 connections) — `src/domain/catalog.ts`
- **linkWarningId()** (4 connections) — `src/domain/networkRules.ts`
- **WarningLevel** (4 connections) — `src/domain/types.ts`
- *... and 39 more nodes in this community*

## Relationships

- [pipeline.ts](pipeline.ts.md) (14 shared connections)
- [domain/flows.ts](domain-flows.ts.md) (13 shared connections)
- [getOwnedDiagram](getOwnedDiagram.md) (12 shared connections)
- [server/network.ts](server-network.ts.md) (8 shared connections)
- [Canvas.tsx](Canvas.tsx.md) (7 shared connections)
- [QwenClient](QwenClient.md) (6 shared connections)
- [ask/route.ts](ask-route.ts.md) (6 shared connections)
- [prompt.ts](prompt.ts.md) (6 shared connections)
- [NodeInfo.tsx](NodeInfo.tsx.md) (6 shared connections)
- [mcp/apply.ts](mcp-apply.ts.md) (5 shared connections)
- [InfoCard.tsx](InfoCard.tsx.md) (5 shared connections)
- [domain/linkGuess.ts](domain-linkGuess.ts.md) (5 shared connections)

## Source Files

- `docs/superpowers/plans/2026-10-30-infrasketch-phase3b-warnings.md`
- `docs/superpowers/plans/2026-11-05-flows-and-network-boundaries.md`
- `docs/superpowers/plans/2026-11-06-network-knowledge-link-guess.md`
- `src/domain/boundary.ts`
- `src/domain/catalog.ts`
- `src/domain/networkRules.ts`
- `src/domain/types.ts`
- `src/domain/warnings.ts`
- `src/server/chat/prompt.ts`
- `src/server/chat/warnings.ts`
- `src/server/llm/clef.ts`
- `src/server/llm/jsonl.ts`

## Audit Trail

- EXTRACTED: 223 (87%)
- INFERRED: 32 (13%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*