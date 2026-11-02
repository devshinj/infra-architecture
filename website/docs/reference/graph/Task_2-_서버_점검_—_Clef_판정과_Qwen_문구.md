---
title: "Task 2: 서버 점검 — Clef 판정과 Qwen 문구"
sidebar_position: 43
---
# Task 2: 서버 점검 — Clef 판정과 Qwen 문구

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 11 nodes · cohesion 0.20

## Key Concepts

- **Task 2: 서버 점검 — Clef 판정과 Qwen 문구** (10 connections) — `docs/superpowers/plans/2026-10-30-infrasketch-phase3b-warnings.md`
- **파일 구조** (8 connections) — `docs/superpowers/plans/2026-10-30-infrasketch-phase3b-warnings.md`
- **ClefClient** (8 connections) — `src/server/llm/clef.ts`
- **QwenClient** (7 connections) — `src/server/llm/qwen.ts`
- **.streamCompletion()** (5 connections) — `src/server/llm/qwen.ts`
- **.decide()** (4 connections) — `src/server/llm/clef.ts`
- **Task 6: smoke 와 가짜 AI 서버** (3 connections) — `docs/superpowers/plans/2026-10-30-infrasketch-phase3b-warnings.md`
- **ExplainDeps** (3 connections) — `src/server/explain.ts`
- **Task 1: 경고 규칙과 구성 패턴(도메인)** (1 connections) — `docs/superpowers/plans/2026-10-30-infrasketch-phase3b-warnings.md`
- **Task 7: E2E — 경고 흐름** (1 connections) — `docs/superpowers/plans/2026-10-30-infrasketch-phase3b-warnings.md`
- **.classifyIntent()** (1 connections) — `src/server/llm/clef.ts`

## Relationships

- [chat/warnings.ts](chat-warnings.ts.md) (7 shared connections)
- [설명 생성과 품질 검사](설명_생성과_품질_검사.md) (5 shared connections)
- [domain/warnings.ts](domain-warnings.ts.md) (2 shared connections)
- [projects.ts](projects.ts.md) (2 shared connections)
- [ask/route.ts](ask-route.ts.md) (2 shared connections)
- [pipeline.ts](pipeline.ts.md) (2 shared connections)
- [types.ts](types.ts.md) (1 shared connections)
- [createThinkStripper](createThinkStripper.md) (1 shared connections)
- [useExplanations.ts](useExplanations.ts.md) (1 shared connections)
- [prompt.ts](prompt.ts.md) (1 shared connections)
- [명령 적용과 샘플](명령_적용과_샘플.md) (1 shared connections)
- [Flow](Flow.md) (1 shared connections)

## Source Files

- `docs/superpowers/plans/2026-10-30-infrasketch-phase3b-warnings.md`
- `src/server/explain.ts`
- `src/server/llm/clef.ts`
- `src/server/llm/qwen.ts`

## Audit Trail

- EXTRACTED: 24 (60%)
- INFERRED: 16 (40%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*