---
title: "auth"
sidebar_position: 51
sidebar_label: "핵심 노드: auth"
---
# auth

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 8 nodes · cohesion 0.39

## Key Concepts

- **auth** (22 connections) — `src/auth.ts`
- **health.ts** (7 connections) — `src/server/llm/health.ts`
- **health/route.ts** (6 connections) — `src/app/api/llm/health/route.ts`
- **checkLlmHealth()** (5 connections) — `src/server/llm/health.ts`
- **GET()** (3 connections) — `src/app/api/llm/health/route.ts`
- **probe()** (2 connections) — `src/server/llm/health.ts`
- **LlmHealth** (1 connections) — `src/server/llm/health.ts`
- **resetHealthCacheForTest()** (1 connections) — `src/server/llm/health.ts`

## Relationships

- [ref_react](ref_react.md) (7 shared connections)
- [ask/route.ts](ask-route.ts.md) (4 shared connections)
- [\[sessionId\]/route.ts]([sessionId]-route.ts.md) (4 shared connections)
- [(app)/actions.ts](app-actions.ts.md) (4 shared connections)
- [explain/route.ts](explain-route.ts.md) (3 shared connections)
- [deps.ts](deps.ts.md) (3 shared connections)

## Source Files

- `src/app/api/llm/health/route.ts`
- `src/auth.ts`
- `src/server/llm/health.ts`

## Audit Trail

- EXTRACTED: 36 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*