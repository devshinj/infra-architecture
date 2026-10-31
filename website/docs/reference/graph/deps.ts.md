---
title: "deps.ts"
sidebar_position: 22
---
# deps.ts

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 17 nodes · cohesion 0.18

## Key Concepts

- **deps.ts** (12 connections) — `src/server/chat/deps.ts`
- **qwen.ts** (12 connections) — `src/server/llm/qwen.ts`
- **defaultChatDeps()** (9 connections) — `src/server/chat/deps.ts`
- **ClefClient** (8 connections) — `src/server/llm/clef.ts`
- **QwenClient** (7 connections) — `src/server/llm/qwen.ts`
- **createQwenClient()** (6 connections) — `src/server/llm/qwen.ts`
- **Task 5: 설명 API** (4 connections) — `docs/superpowers/plans/2026-10-30-infrasketch-phase3c1-explanations-glossary.md`
- **ChatDeps** (4 connections) — `src/server/chat/pipeline.ts`
- **ExplainDeps** (3 connections) — `src/server/explain.ts`
- **abortError()** (3 connections) — `src/server/llm/qwen.ts`
- **ChatMessage** (3 connections) — `src/server/llm/qwen.ts`
- **attempt()** (3 connections) — `src/server/llm/qwen.ts`
- **setChatDepsForTest()** (2 connections) — `src/server/chat/deps.ts`
- **isRetryable()** (2 connections) — `src/server/llm/qwen.ts`
- **ref_openai** (1 connections)
- **.classifyIntent()** (1 connections) — `src/server/llm/clef.ts`
- **RETRY_DELAYS** (1 connections) — `src/server/llm/qwen.ts`

## Relationships

- [설명 생성과 품질 검사](설명_생성과_품질_검사.md) (8 shared connections)
- [pipeline.ts](pipeline.ts.md) (5 shared connections)
- [경고 규칙과 점검](경고_규칙과_점검.md) (4 shared connections)
- [환경 변수와 AI 상태 점검](환경_변수와_AI_상태_점검.md) (3 shared connections)
- [chat/route.ts](chat-route.ts.md) (3 shared connections)
- [Clef 호출과 동시성](Clef_호출과_동시성.md) (2 shared connections)
- [Clef 질문과 응답 타입](Clef_질문과_응답_타입.md) (2 shared connections)
- [프롬프트와 구성 패턴](프롬프트와_구성_패턴.md) (2 shared connections)
- [3C-1 계획 작업 목록](3C-1_계획_작업_목록.md) (1 shared connections)
- [서버 액션과 작업 화면](서버_액션과_작업_화면.md) (1 shared connections)
- [easeScore](easeScore.md) (1 shared connections)
- [설계 문서와 계획](설계_문서와_계획.md) (1 shared connections)

## Source Files

- `docs/superpowers/plans/2026-10-30-infrasketch-phase3c1-explanations-glossary.md`
- `src/server/chat/deps.ts`
- `src/server/chat/pipeline.ts`
- `src/server/explain.ts`
- `src/server/llm/clef.ts`
- `src/server/llm/qwen.ts`

## Audit Trail

- EXTRACTED: 54 (95%)
- INFERRED: 3 (5%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*