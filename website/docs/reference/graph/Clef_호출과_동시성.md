---
title: "Clef 호출과 동시성"
sidebar_position: 33
---
# Clef 호출과 동시성

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 8 nodes · cohesion 0.50

## Key Concepts

- **createClefClient()** (11 connections) — `src/server/llm/clef.ts`
- **run()** (7 connections) — `src/server/llm/clef.ts`
- **abortError()** (4 connections) — `src/server/llm/clef.ts`
- **acquire()** (3 connections) — `src/server/llm/clef.ts`
- **classifyIntent()** (3 connections) — `src/server/llm/clef.ts`
- **post()** (3 connections) — `src/server/llm/clef.ts`
- **decide()** (2 connections) — `src/server/llm/clef.ts`
- **release()** (2 connections) — `src/server/llm/clef.ts`

## Relationships

- [Clef 질문과 응답 타입](Clef_질문과_응답_타입.md) (3 shared connections)
- [설계 문서와 계획](설계_문서와_계획.md) (2 shared connections)
- [대화 파이프라인과 저장](대화_파이프라인과_저장.md) (1 shared connections)
- [환경 변수와 AI 상태 점검](환경_변수와_AI_상태_점검.md) (1 shared connections)

## Source Files

- `src/server/llm/clef.ts`

## Audit Trail

- EXTRACTED: 19 (90%)
- INFERRED: 2 (10%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*