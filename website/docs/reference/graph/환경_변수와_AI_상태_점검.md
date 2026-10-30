---
title: "환경 변수와 AI 상태 점검"
sidebar_position: 17
---
# 환경 변수와 AI 상태 점검

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 16 nodes · cohesion 0.20

## Key Concepts

- **deps.ts** (12 connections) — `src/server/chat/deps.ts`
- **env.ts** (7 connections) — `src/env.ts`
- **config.ts** (7 connections) — `src/server/llm/config.ts`
- **llmConfig** (7 connections) — `src/server/llm/config.ts`
- **health.ts** (7 connections) — `src/server/llm/health.ts`
- **mailer.ts** (5 connections) — `src/server/auth/mailer.ts`
- **checkLlmHealth()** (5 connections) — `src/server/llm/health.ts`
- **env** (4 connections) — `src/env.ts`
- **parseEnv()** (3 connections) — `src/env.ts`
- **normalizeQwenBaseUrl()** (3 connections) — `src/server/llm/config.ts`
- **Qwen URL 정규화** (2 connections) — `docs/superpowers/specs/2026-10-29-infra-architecture-visualizer-design.md`
- **probe()** (2 connections) — `src/server/llm/health.ts`
- **ref_nodemailer** (1 connections)
- **envSchema** (1 connections) — `src/env.ts`
- **LlmHealth** (1 connections) — `src/server/llm/health.ts`
- **resetHealthCacheForTest()** (1 connections) — `src/server/llm/health.ts`

## Relationships

- [대화 파이프라인과 저장](대화_파이프라인과_저장.md) (5 shared connections)
- [DB 스키마와 인증](DB_스키마와_인증.md) (4 shared connections)
- [서버 액션과 작업 화면](서버_액션과_작업_화면.md) (3 shared connections)
- [Qwen 클라이언트](Qwen_클라이언트.md) (2 shared connections)
- [설계 문서와 계획](설계_문서와_계획.md) (1 shared connections)
- [설명 API](설명_API.md) (1 shared connections)
- [Clef 호출과 동시성](Clef_호출과_동시성.md) (1 shared connections)
- [경고 규칙과 점검](경고_규칙과_점검.md) (1 shared connections)
- [Clef 질문과 응답 타입](Clef_질문과_응답_타입.md) (1 shared connections)
- [설명 생성과 품질 검사](설명_생성과_품질_검사.md) (1 shared connections)

## Source Files

- `docs/superpowers/specs/2026-10-29-infra-architecture-visualizer-design.md`
- `src/env.ts`
- `src/server/auth/mailer.ts`
- `src/server/chat/deps.ts`
- `src/server/llm/config.ts`
- `src/server/llm/health.ts`

## Audit Trail

- EXTRACTED: 44 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*