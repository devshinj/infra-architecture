---
title: "prompt.ts"
sidebar_position: 3
---
# prompt.ts

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 54 nodes · cohesion 0.05

## Key Concepts

- **prompt.ts** (38 connections) — `src/server/chat/prompt.ts`
- **clef.ts** (22 connections) — `src/server/llm/clef.ts`
- **qwen.ts** (12 connections) — `src/server/llm/qwen.ts`
- **createClefClient()** (11 connections) — `src/server/llm/clef.ts`
- **intent.ts** (7 connections) — `src/server/chat/intent.ts`
- **run()** (7 connections) — `src/server/llm/clef.ts`
- **createQwenClient()** (6 connections) — `src/server/llm/qwen.ts`
- **buildMessages()** (5 connections) — `src/server/chat/prompt.ts`
- **patterns.ts** (4 connections) — `src/domain/patterns.ts`
- **resolveIntent()** (4 connections) — `src/server/chat/intent.ts`
- **buildExplainMessages()** (4 connections) — `src/server/chat/prompt.ts`
- **explainContext()** (4 connections) — `src/server/chat/prompt.ts`
- **abortError()** (4 connections) — `src/server/llm/clef.ts`
- **Intent** (4 connections) — `src/server/llm/clef.ts`
- **isAssumptionChangeMessage()** (3 connections) — `src/domain/assumptions.ts`
- **patternPromptBlock()** (3 connections) — `src/domain/patterns.ts`
- **describeEndpoint()** (3 connections) — `src/server/chat/prompt.ts`
- **ClefHttpError** (3 connections) — `src/server/llm/clef.ts`
- **acquire()** (3 connections) — `src/server/llm/clef.ts`
- **classifyIntent()** (3 connections) — `src/server/llm/clef.ts`
- **post()** (3 connections) — `src/server/llm/clef.ts`
- **abortError()** (3 connections) — `src/server/llm/qwen.ts`
- **ChatMessage** (3 connections) — `src/server/llm/qwen.ts`
- **attempt()** (3 connections) — `src/server/llm/qwen.ts`
- **ancestorsOf()** (2 connections) — `src/server/chat/prompt.ts`
- *... and 29 more nodes in this community*

## Relationships

- [pipeline.ts](pipeline.ts.md) (9 shared connections)
- [경고 규칙과 점검](경고_규칙과_점검.md) (8 shared connections)
- [설명 생성과 품질 검사](설명_생성과_품질_검사.md) (8 shared connections)
- [MissingChecklist.tsx](MissingChecklist.tsx.md) (5 shared connections)
- [설계 문서와 계획](설계_문서와_계획.md) (4 shared connections)
- [ref_react](ref_react.md) (4 shared connections)
- [catalog.ts](catalog.ts.md) (3 shared connections)
- [설명 모양·길이·서명](설명_모양·길이·서명.md) (2 shared connections)
- [DB 스키마와 인증](DB_스키마와_인증.md) (2 shared connections)
- [chat/route.ts](chat-route.ts.md) (2 shared connections)
- [MentionInput](MentionInput.md) (1 shared connections)

## Source Files

- `src/domain/assumptions.ts`
- `src/domain/patterns.ts`
- `src/server/chat/intent.ts`
- `src/server/chat/prompt.ts`
- `src/server/llm/clef.ts`
- `src/server/llm/qwen.ts`

## Audit Trail

- EXTRACTED: 121 (98%)
- INFERRED: 3 (2%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*