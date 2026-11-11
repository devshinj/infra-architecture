---
title: "domain/flows.ts"
sidebar_position: 9
---
# domain/flows.ts

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 41 nodes · cohesion 0.10

## Key Concepts

- **domain/warnings.ts** (40 connections) — `src/domain/warnings.ts`
- **chat/warnings.ts** (37 connections) — `src/server/chat/warnings.ts`
- **checkWarnings()** (17 connections) — `src/server/chat/warnings.ts`
- **evaluateRules()** (15 connections) — `src/domain/warnings.ts`
- **Warning** (14 connections) — `src/domain/types.ts`
- **mergeWarnings()** (13 connections) — `src/domain/warnings.ts`
- **checkCodeWarnings()** (13 connections) — `src/server/chat/warnings.ts`
- **Task 2: 서버 점검 — Clef 판정과 Qwen 문구** (10 connections) — `docs/superpowers/plans/2026-10-30-infrasketch-phase3b-warnings.md`
- **파일 구조** (8 connections) — `docs/superpowers/plans/2026-10-30-infrasketch-phase3b-warnings.md`
- **categoryOf()** (7 connections) — `src/domain/catalog.ts`
- **judgeExposed()** (7 connections) — `src/server/chat/warnings.ts`
- **writeTexts()** (6 connections) — `src/server/chat/warnings.ts`
- **noulProbability()** (5 connections) — `src/server/llm/clef.ts`
- **Task 3: 대화 차례에 점검 단계 넣기** (4 connections) — `docs/superpowers/plans/2026-10-30-infrasketch-phase3b-warnings.md`
- **isDirectCrossing()** (4 connections) — `src/domain/boundary.ts`
- **WarningLevel** (4 connections) — `src/domain/types.ts`
- **warningDelta()** (4 connections) — `src/domain/warnings.ts`
- **buildWarningMessages()** (4 connections) — `src/server/chat/prompt.ts`
- **carryExposed()** (4 connections) — `src/server/chat/warnings.ts`
- **mergeWarnings()** (4 connections) — `src/server/chat/warnings.ts`
- **.decide()** (4 connections) — `src/server/llm/clef.ts`
- **Task 6: smoke 와 가짜 AI 서버** (3 connections) — `docs/superpowers/plans/2026-10-30-infrasketch-phase3b-warnings.md`
- **LINK_RULES** (3 connections) — `src/domain/networkRules.ts`
- **Rule** (3 connections) — `src/domain/warnings.ts`
- **describeTarget()** (3 connections) — `src/server/chat/warnings.ts`
- *... and 16 more nodes in this community*

## Relationships

- [types.ts](types.ts.md) (19 shared connections)
- [pipeline.ts](pipeline.ts.md) (9 shared connections)
- [mcp/apply.ts](mcp-apply.ts.md) (8 shared connections)
- [Canvas.tsx](Canvas.tsx.md) (7 shared connections)
- [NodeInfo.tsx](NodeInfo.tsx.md) (6 shared connections)
- [prompt.ts](prompt.ts.md) (5 shared connections)
- [deps.ts](deps.ts.md) (4 shared connections)
- [createJsonlParser](createJsonlParser.md) (4 shared connections)
- [\[diagramId\]/page.tsx]([diagramId]-page.tsx.md) (4 shared connections)
- [InfoCard.tsx](InfoCard.tsx.md) (4 shared connections)
- [File Structure](File_Structure.md) (3 shared connections)
- [samples.ts](samples.ts.md) (3 shared connections)

## Source Files

- `docs/superpowers/plans/2026-10-30-infrasketch-phase3b-warnings.md`
- `src/domain/boundary.ts`
- `src/domain/catalog.ts`
- `src/domain/networkRules.ts`
- `src/domain/types.ts`
- `src/domain/warnings.ts`
- `src/server/chat/prompt.ts`
- `src/server/chat/warnings.ts`
- `src/server/llm/clef.ts`

## Audit Trail

- EXTRACTED: 157 (86%)
- INFERRED: 25 (14%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*