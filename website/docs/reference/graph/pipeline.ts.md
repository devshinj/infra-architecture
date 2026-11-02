---
title: "pipeline.ts"
sidebar_position: 13
---
# pipeline.ts

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 29 nodes · cohesion 0.13

## Key Concepts

- **pipeline.ts** (70 connections) — `src/server/chat/pipeline.ts`
- **lockedTurn()** (26 connections) — `src/server/chat/pipeline.ts`
- **runChatTurn()** (9 connections) — `src/server/chat/pipeline.ts`
- **createThinkStripper()** (9 connections) — `src/server/llm/think.ts`
- **createJsonlParser()** (8 connections) — `src/server/llm/jsonl.ts`
- **.emit()** (6 connections) — `src/server/chat/pipeline.ts`
- **guardEmit()** (5 connections) — `src/server/chat/pipeline.ts`
- **streamFailure()** (5 connections) — `src/server/chat/pipeline.ts`
- **skips.ts** (5 connections) — `src/server/chat/skips.ts`
- **SkipTally** (5 connections) — `src/server/chat/skips.ts`
- **jsonl.ts** (5 connections) — `src/server/llm/jsonl.ts`
- **think.ts** (5 connections) — `src/server/llm/think.ts`
- **parseMentions()** (4 connections) — `src/server/chat/prompt.ts`
- **노드 참조 (@WAS#1 칩)** (3 connections) — `docs/superpowers/specs/2026-10-29-infra-architecture-visualizer-design.md`
- **createSkipTally()** (3 connections) — `src/server/chat/skips.ts`
- **skipKey()** (3 connections) — `src/server/chat/skips.ts`
- **opName()** (2 connections) — `src/server/chat/pipeline.ts`
- **prunedOrder()** (2 connections) — `src/server/chat/pipeline.ts`
- **TurnArgs** (2 connections) — `src/server/chat/pipeline.ts`
- **.counts()** (2 connections) — `src/server/chat/skips.ts`
- **partialTagLen()** (2 connections) — `src/server/llm/think.ts`
- **HISTORY_REPLY** (1 connections) — `src/server/chat/pipeline.ts`
- **KNOWN_OPS** (1 connections) — `src/server/chat/pipeline.ts`
- **LAYOUT_REPLY** (1 connections) — `src/server/chat/pipeline.ts`
- **TIMEOUT_MESSAGE** (1 connections) — `src/server/chat/pipeline.ts`
- *... and 4 more nodes in this community*

## Relationships

- [ask.ts](ask.ts.md) (21 shared connections)
- [(app)/actions.ts](app-actions.ts.md) (15 shared connections)
- [명령 적용과 샘플](명령_적용과_샘플.md) (9 shared connections)
- [경고 규칙과 점검](경고_규칙과_점검.md) (8 shared connections)
- [clef.ts](clef.ts.md) (6 shared connections)
- [ask/route.ts](ask-route.ts.md) (6 shared connections)
- [schema.ts](schema.ts.md) (4 shared connections)
- [prompt.ts](prompt.ts.md) (4 shared connections)
- [설계 문서와 계획](설계_문서와_계획.md) (3 shared connections)
- [MissingChecklist.tsx](MissingChecklist.tsx.md) (3 shared connections)
- [\[sessionId\]/route.ts]([sessionId]-route.ts.md) (3 shared connections)
- [normalize.ts](normalize.ts.md) (3 shared connections)

## Source Files

- `docs/superpowers/specs/2026-10-29-infra-architecture-visualizer-design.md`
- `src/server/chat/pipeline.ts`
- `src/server/chat/prompt.ts`
- `src/server/chat/skips.ts`
- `src/server/llm/jsonl.ts`
- `src/server/llm/think.ts`

## Audit Trail

- EXTRACTED: 136 (99%)
- INFERRED: 2 (1%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*