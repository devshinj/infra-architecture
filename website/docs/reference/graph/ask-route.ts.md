---
title: "ask/route.ts"
sidebar_position: 2
---
# ask/route.ts

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 69 nodes · cohesion 0.05

## Key Concepts

- **ask/route.ts** (28 connections) — `src/app/api/diagrams/[id]/ask/route.ts`
- **auth** (22 connections) — `src/auth.ts`
- **chat/route.ts** (21 connections) — `src/app/api/diagrams/[id]/chat/route.ts`
- **explain/route.ts** (18 connections) — `src/app/api/diagrams/[id]/explain/route.ts`
- **[sessionId]/route.ts** (17 connections) — `src/app/api/diagrams/[id]/sessions/[sessionId]/route.ts`
- **deps.ts** (13 connections) — `src/server/chat/deps.ts`
- **qwen.ts** (12 connections) — `src/server/llm/qwen.ts`
- **defaultChatDeps()** (11 connections) — `src/server/chat/deps.ts`
- **POST()** (8 connections) — `src/app/api/diagrams/[id]/ask/route.ts`
- **stream.ts** (8 connections) — `src/server/chat/stream.ts`
- **ref_zod** (7 connections)
- **env.ts** (7 connections) — `src/env.ts`
- **getSession()** (7 connections) — `src/server/chat/sessions.ts`
- **config.ts** (7 connections) — `src/server/llm/config.ts`
- **llmConfig** (7 connections) — `src/server/llm/config.ts`
- **health.ts** (7 connections) — `src/server/llm/health.ts`
- **POST()** (6 connections) — `src/app/api/diagrams/[id]/chat/route.ts`
- **health/route.ts** (6 connections) — `src/app/api/llm/health/route.ts`
- **streamTurn()** (6 connections) — `src/server/chat/stream.ts`
- **listSignatures()** (6 connections) — `src/server/explain.ts`
- **createQwenClient()** (6 connections) — `src/server/llm/qwen.ts`
- **GET()** (5 connections) — `src/app/api/diagrams/[id]/sessions/[sessionId]/route.ts`
- **mailer.ts** (5 connections) — `src/server/auth/mailer.ts`
- **checkLlmHealth()** (5 connections) — `src/server/llm/health.ts`
- **Task 5: 설명 API** (4 connections) — `docs/superpowers/plans/2026-10-30-infrasketch-phase3c1-explanations-glossary.md`
- *... and 44 more nodes in this community*

## Relationships

- [projects.ts](projects.ts.md) (20 shared connections)
- [ask.ts](ask.ts.md) (10 shared connections)
- [설명 생성과 품질 검사](설명_생성과_품질_검사.md) (10 shared connections)
- [pipeline.ts](pipeline.ts.md) (9 shared connections)
- [auth/actions.ts](auth-actions.ts.md) (6 shared connections)
- [(app)/actions.ts](app-actions.ts.md) (6 shared connections)
- [ref_next](ref_next.md) (5 shared connections)
- [설계 문서와 계획](설계_문서와_계획.md) (4 shared connections)
- [schema.ts](schema.ts.md) (4 shared connections)
- [Shell.tsx](Shell.tsx.md) (4 shared connections)
- [reset.ts](reset.ts.md) (4 shared connections)
- [types.ts](types.ts.md) (3 shared connections)

## Source Files

- `docs/superpowers/plans/2026-10-30-infrasketch-phase3c1-explanations-glossary.md`
- `docs/superpowers/specs/2026-10-29-infra-architecture-visualizer-design.md`
- `src/app/api/diagrams/[id]/ask/route.ts`
- `src/app/api/diagrams/[id]/chat/route.ts`
- `src/app/api/diagrams/[id]/explain/route.ts`
- `src/app/api/diagrams/[id]/sessions/[sessionId]/route.ts`
- `src/app/api/llm/health/route.ts`
- `src/auth.ts`
- `src/env.ts`
- `src/server/auth/mailer.ts`
- `src/server/chat/ask.ts`
- `src/server/chat/deps.ts`
- `src/server/chat/events.ts`
- `src/server/chat/pipeline.ts`
- `src/server/chat/sessions.ts`
- `src/server/chat/stream.ts`
- `src/server/explain.ts`
- `src/server/llm/config.ts`
- `src/server/llm/health.ts`
- `src/server/llm/qwen.ts`

## Audit Trail

- EXTRACTED: 211 (99%)
- INFERRED: 3 (1%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*