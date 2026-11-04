---
title: "chat/warnings.ts"
sidebar_position: 17
---
# chat/warnings.ts

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 25 nodes · cohesion 0.16

## Key Concepts

- **chat/warnings.ts** (25 connections) — `src/server/chat/warnings.ts`
- **createJsonlParser()** (12 connections) — `src/server/llm/jsonl.ts`
- **Warning** (11 connections) — `src/domain/types.ts`
- **Task 2: 서버 점검 — Clef 판정과 Qwen 문구** (10 connections) — `docs/superpowers/plans/2026-10-30-infrasketch-phase3b-warnings.md`
- **jsonl.ts** (10 connections) — `src/server/llm/jsonl.ts`
- **checkWarnings()** (9 connections) — `src/server/chat/warnings.ts`
- **파일 구조** (8 connections) — `docs/superpowers/plans/2026-10-30-infrasketch-phase3b-warnings.md`
- **judgeExposed()** (7 connections) — `src/server/chat/warnings.ts`
- **Task 3: 대화 차례에 점검 단계 넣기** (5 connections) — `docs/superpowers/plans/2026-10-30-infrasketch-phase3b-warnings.md`
- **writeTexts()** (5 connections) — `src/server/chat/warnings.ts`
- **noulProbability()** (5 connections) — `src/server/llm/clef.ts`
- **.streamCompletion()** (5 connections) — `src/server/llm/qwen.ts`
- **buildWarningMessages()** (4 connections) — `src/server/chat/prompt.ts`
- **complete()** (4 connections) — `src/server/explain.ts`
- **Task 6: smoke 와 가짜 AI 서버** (3 connections) — `docs/superpowers/plans/2026-10-30-infrasketch-phase3b-warnings.md`
- **carryExposed()** (3 connections) — `src/server/chat/warnings.ts`
- **describeTarget()** (3 connections) — `src/server/chat/warnings.ts`
- **scanLine()** (3 connections) — `src/server/llm/jsonl.ts`
- **step()** (3 connections) — `src/server/llm/jsonl.ts`
- **levelOf()** (2 connections) — `src/server/chat/warnings.ts`
- **isCommandLine()** (2 connections) — `src/server/llm/jsonl.ts`
- **stripWrap()** (2 connections) — `src/server/llm/jsonl.ts`
- **Task 1: 경고 규칙과 구성 패턴(도메인)** (1 connections) — `docs/superpowers/plans/2026-10-30-infrasketch-phase3b-warnings.md`
- **Task 7: E2E — 경고 흐름** (1 connections) — `docs/superpowers/plans/2026-10-30-infrasketch-phase3b-warnings.md`
- **Scan** (1 connections) — `src/server/llm/jsonl.ts`

## Relationships

- [domain/warnings.ts](domain-warnings.ts.md) (13 shared connections)
- [pipeline.ts](pipeline.ts.md) (10 shared connections)
- [prompt.ts](prompt.ts.md) (3 shared connections)
- [ask.ts](ask.ts.md) (3 shared connections)
- [3C-1 계획 작업 목록](3C-1_계획_작업_목록.md) (2 shared connections)
- [ask/route.ts](ask-route.ts.md) (2 shared connections)
- [(app)/actions.ts](app-actions.ts.md) (2 shared connections)
- [clef.ts](clef.ts.md) (2 shared connections)
- [설명 생성과 품질 검사](설명_생성과_품질_검사.md) (2 shared connections)
- [useExplanations.ts](useExplanations.ts.md) (1 shared connections)
- [InfraSketch 3B단계: 경고·구성 패턴 구현 계획](InfraSketch_3B단계-_경고·구성_패턴_구현_계획.md) (1 shared connections)
- [Flow](Flow.md) (1 shared connections)

## Source Files

- `docs/superpowers/plans/2026-10-30-infrasketch-phase3b-warnings.md`
- `src/domain/types.ts`
- `src/server/chat/prompt.ts`
- `src/server/chat/warnings.ts`
- `src/server/explain.ts`
- `src/server/llm/clef.ts`
- `src/server/llm/jsonl.ts`
- `src/server/llm/qwen.ts`

## Audit Trail

- EXTRACTED: 78 (80%)
- INFERRED: 19 (20%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*