---
title: "AI 서버 설정과 상태 점검"
sidebar_position: 11
---
# AI 서버 설정과 상태 점검

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 33 nodes · cohesion 0.10

## Key Concepts

- **deps.ts** (11 connections) — `src/server/chat/deps.ts`
- **createClefClient()** (11 connections) — `src/server/llm/clef.ts`
- **qwen.ts** (10 connections) — `src/server/llm/qwen.ts`
- **run()** (7 connections) — `src/server/llm/clef.ts`
- **config.ts** (7 connections) — `src/server/llm/config.ts`
- **llmConfig** (7 connections) — `src/server/llm/config.ts`
- **health.ts** (7 connections) — `src/server/llm/health.ts`
- **health/route.ts** (6 connections) — `src/app/api/llm/health/route.ts`
- **defaultChatDeps()** (6 connections) — `src/server/chat/deps.ts`
- **createQwenClient()** (6 connections) — `src/server/llm/qwen.ts`
- **checkLlmHealth()** (5 connections) — `src/server/llm/health.ts`
- **abortError()** (4 connections) — `src/server/llm/clef.ts`
- **GET()** (3 connections) — `src/app/api/llm/health/route.ts`
- **parseEnv()** (3 connections) — `src/env.ts`
- **ClefHttpError** (3 connections) — `src/server/llm/clef.ts`
- **acquire()** (3 connections) — `src/server/llm/clef.ts`
- **classifyIntent()** (3 connections) — `src/server/llm/clef.ts`
- **post()** (3 connections) — `src/server/llm/clef.ts`
- **normalizeQwenBaseUrl()** (3 connections) — `src/server/llm/config.ts`
- **abortError()** (3 connections) — `src/server/llm/qwen.ts`
- **attempt()** (3 connections) — `src/server/llm/qwen.ts`
- **Qwen URL 정규화** (2 connections) — `docs/superpowers/specs/2026-10-29-infra-architecture-visualizer-design.md`
- **decide()** (2 connections) — `src/server/llm/clef.ts`
- **release()** (2 connections) — `src/server/llm/clef.ts`
- **probe()** (2 connections) — `src/server/llm/health.ts`
- *... and 8 more nodes in this community*

## Relationships

- [인증과 외부 라이브러리](인증과_외부_라이브러리.md) (5 shared connections)
- [설계 문서와 계획](설계_문서와_계획.md) (4 shared connections)
- [Clef 의도 분류](Clef_의도_분류.md) (4 shared connections)
- [대화 스트리밍 API](대화_스트리밍_API.md) (3 shared connections)
- [서버 액션과 작업 화면](서버_액션과_작업_화면.md) (2 shared connections)
- [대화 의존성 인터페이스](대화_의존성_인터페이스.md) (2 shared connections)
- [대화 응답 문구와 스트림 정리](대화_응답_문구와_스트림_정리.md) (2 shared connections)
- [프롬프트와 노드 참조](프롬프트와_노드_참조.md) (2 shared connections)

## Source Files

- `docs/superpowers/specs/2026-10-29-infra-architecture-visualizer-design.md`
- `src/app/api/llm/health/route.ts`
- `src/env.ts`
- `src/server/chat/deps.ts`
- `src/server/llm/clef.ts`
- `src/server/llm/config.ts`
- `src/server/llm/health.ts`
- `src/server/llm/qwen.ts`

## Audit Trail

- EXTRACTED: 76 (97%)
- INFERRED: 2 (3%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*