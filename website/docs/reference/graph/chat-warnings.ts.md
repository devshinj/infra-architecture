---
title: "chat/warnings.ts"
sidebar_position: 13
---
# chat/warnings.ts

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 24 nodes · cohesion 0.15

## Key Concepts

- **chat/warnings.ts** (25 connections) — `src/server/chat/warnings.ts`
- **Task 2: 서버 점검 — Clef 판정과 Qwen 문구** (10 connections) — `docs/superpowers/plans/2026-10-30-infrasketch-phase3b-warnings.md`
- **checkWarnings()** (9 connections) — `src/server/chat/warnings.ts`
- **파일 구조** (8 connections) — `docs/superpowers/plans/2026-10-30-infrasketch-phase3b-warnings.md`
- **ClefClient** (8 connections) — `src/server/llm/clef.ts`
- **judgeExposed()** (7 connections) — `src/server/chat/warnings.ts`
- **QwenClient** (7 connections) — `src/server/llm/qwen.ts`
- **Task 3: 대화 차례에 점검 단계 넣기** (5 connections) — `docs/superpowers/plans/2026-10-30-infrasketch-phase3b-warnings.md`
- **ChatDeps** (5 connections) — `src/server/chat/pipeline.ts`
- **writeTexts()** (5 connections) — `src/server/chat/warnings.ts`
- **noulProbability()** (5 connections) — `src/server/llm/clef.ts`
- **.streamCompletion()** (5 connections) — `src/server/llm/qwen.ts`
- **buildWarningMessages()** (4 connections) — `src/server/chat/prompt.ts`
- **complete()** (4 connections) — `src/server/explain.ts`
- **.decide()** (4 connections) — `src/server/llm/clef.ts`
- **Task 4: "의도된 구성" 저장** (3 connections) — `docs/superpowers/plans/2026-10-30-infrasketch-phase3b-warnings.md`
- **Task 6: smoke 와 가짜 AI 서버** (3 connections) — `docs/superpowers/plans/2026-10-30-infrasketch-phase3b-warnings.md`
- **carryExposed()** (3 connections) — `src/server/chat/warnings.ts`
- **describeTarget()** (3 connections) — `src/server/chat/warnings.ts`
- **ExplainDeps** (3 connections) — `src/server/explain.ts`
- **levelOf()** (2 connections) — `src/server/chat/warnings.ts`
- **Task 1: 경고 규칙과 구성 패턴(도메인)** (1 connections) — `docs/superpowers/plans/2026-10-30-infrasketch-phase3b-warnings.md`
- **Task 7: E2E — 경고 흐름** (1 connections) — `docs/superpowers/plans/2026-10-30-infrasketch-phase3b-warnings.md`
- **.classifyIntent()** (1 connections) — `src/server/llm/clef.ts`

## Relationships

- [domain/warnings.ts](domain-warnings.ts.md) (9 shared connections)
- [pipeline.ts](pipeline.ts.md) (6 shared connections)
- [설명 생성과 품질 검사](설명_생성과_품질_검사.md) (6 shared connections)
- [createThinkStripper](createThinkStripper.md) (4 shared connections)
- [(app)/actions.ts](app-actions.ts.md) (4 shared connections)
- [prompt.ts](prompt.ts.md) (3 shared connections)
- [ask.ts](ask.ts.md) (3 shared connections)
- [qwen.ts](qwen.ts.md) (3 shared connections)
- [clef.ts](clef.ts.md) (3 shared connections)
- [useSessions.ts](useSessions.ts.md) (2 shared connections)
- [useExplanations.ts](useExplanations.ts.md) (1 shared connections)
- [명령 적용과 샘플](명령_적용과_샘플.md) (1 shared connections)

## Source Files

- `docs/superpowers/plans/2026-10-30-infrasketch-phase3b-warnings.md`
- `src/server/chat/pipeline.ts`
- `src/server/chat/prompt.ts`
- `src/server/chat/warnings.ts`
- `src/server/explain.ts`
- `src/server/llm/clef.ts`
- `src/server/llm/qwen.ts`

## Audit Trail

- EXTRACTED: 67 (75%)
- INFERRED: 22 (25%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*