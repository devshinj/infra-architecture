---
title: "pipeline.ts"
sidebar_position: 17
---
# pipeline.ts

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 21 nodes · cohesion 0.18

## Key Concepts

- **pipeline.ts** (63 connections) — `src/server/chat/pipeline.ts`
- **lockedTurn()** (24 connections) — `src/server/chat/pipeline.ts`
- **createJsonlParser()** (8 connections) — `src/server/llm/jsonl.ts`
- **createThinkStripper()** (6 connections) — `src/server/llm/think.ts`
- **createMessage()** (5 connections) — `src/server/chat/messages.ts`
- **skips.ts** (5 connections) — `src/server/chat/skips.ts`
- **jsonl.ts** (5 connections) — `src/server/llm/jsonl.ts`
- **parseMentions()** (4 connections) — `src/server/chat/prompt.ts`
- **think.ts** (4 connections) — `src/server/llm/think.ts`
- **parseCommand()** (3 connections) — `src/domain/commands.ts`
- **createSkipTally()** (3 connections) — `src/server/chat/skips.ts`
- **skipKey()** (3 connections) — `src/server/chat/skips.ts`
- **opName()** (2 connections) — `src/server/chat/pipeline.ts`
- **prunedOrder()** (2 connections) — `src/server/chat/pipeline.ts`
- **partialTagLen()** (2 connections) — `src/server/llm/think.ts`
- **AI_UNAVAILABLE_MESSAGE** (1 connections) — `src/server/chat/pipeline.ts`
- **HISTORY_REPLY** (1 connections) — `src/server/chat/pipeline.ts`
- **KNOWN_OPS** (1 connections) — `src/server/chat/pipeline.ts`
- **LAYOUT_REPLY** (1 connections) — `src/server/chat/pipeline.ts`
- **TIMEOUT_MESSAGE** (1 connections) — `src/server/chat/pipeline.ts`
- **SkipKind** (1 connections) — `src/server/chat/skips.ts`

## Relationships

- [서버 액션과 작업 화면](서버_액션과_작업_화면.md) (17 shared connections)
- [chat/route.ts](chat-route.ts.md) (8 shared connections)
- [경고 규칙과 점검](경고_규칙과_점검.md) (8 shared connections)
- [useChatTurn.ts](useChatTurn.ts.md) (6 shared connections)
- [Clef 질문과 응답 타입](Clef_질문과_응답_타입.md) (5 shared connections)
- [명령 적용과 샘플](명령_적용과_샘플.md) (5 shared connections)
- [deps.ts](deps.ts.md) (5 shared connections)
- [프롬프트와 구성 패턴](프롬프트와_구성_패턴.md) (4 shared connections)
- [MissingChecklist.tsx](MissingChecklist.tsx.md) (3 shared connections)
- [normalize.ts](normalize.ts.md) (3 shared connections)
- [DB 스키마와 인증](DB_스키마와_인증.md) (2 shared connections)
- [SkipTally](SkipTally.md) (2 shared connections)

## Source Files

- `src/domain/commands.ts`
- `src/server/chat/messages.ts`
- `src/server/chat/pipeline.ts`
- `src/server/chat/prompt.ts`
- `src/server/chat/skips.ts`
- `src/server/llm/jsonl.ts`
- `src/server/llm/think.ts`

## Audit Trail

- EXTRACTED: 107 (99%)
- INFERRED: 1 (1%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*