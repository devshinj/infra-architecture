---
title: "pipeline.ts"
sidebar_position: 21
---
# pipeline.ts

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 36 nodes · cohesion 0.10

## Key Concepts

- **pipeline.ts** (127 connections) — `src/server/chat/pipeline.ts`
- **lockedTurn()** (46 connections) — `src/server/chat/pipeline.ts`
- **computeMissing()** (28 connections) — `src/domain/missing.ts`
- **askInSession()** (14 connections) — `src/server/chat/ask.ts`
- **matchUserTerms()** (11 connections) — `src/server/glossary.ts`
- **toFlowOp()** (7 connections) — `src/domain/commands.ts`
- **createMessage()** (7 connections) — `src/server/chat/messages.ts`
- **detectForks()** (5 connections) — `src/domain/clarify.ts`
- **streamFailure()** (5 connections) — `src/server/chat/pipeline.ts`
- **skips.ts** (5 connections) — `src/server/chat/skips.ts`
- **SkipTally** (5 connections) — `src/server/chat/skips.ts`
- **choicesOf()** (4 connections) — `src/domain/clarify.ts`
- **validChoices()** (4 connections) — `src/domain/clarify.ts`
- **keepStepText()** (4 connections) — `src/domain/flows.ts`
- **warningDelta()** (4 connections) — `src/domain/warnings.ts`
- **turnSignals()** (4 connections) — `src/server/chat/pipeline.ts`
- **parseMentions()** (4 connections) — `src/server/chat/prompt.ts`
- **choicesNote()** (3 connections) — `src/domain/clarify.ts`
- **choiceValue()** (3 connections) — `src/domain/clarify.ts`
- **createFlowRetarget()** (3 connections) — `src/domain/commands.ts`
- **asksStepText()** (3 connections) — `src/domain/flows.ts`
- **clefOpenItems()** (3 connections) — `src/server/chat/intent.ts`
- **createSkipTally()** (3 connections) — `src/server/chat/skips.ts`
- **skipKey()** (3 connections) — `src/server/chat/skips.ts`
- **abortError()** (2 connections) — `src/server/chat/pipeline.ts`
- *... and 11 more nodes in this community*

## Relationships

- [ask.ts](ask.ts.md) (24 shared connections)
- [commands.ts](commands.ts.md) (18 shared connections)
- [getOwnedDiagram](getOwnedDiagram.md) (15 shared connections)
- [clarify.ts](clarify.ts.md) (11 shared connections)
- [domain/apply.ts](domain-apply.ts.md) (11 shared connections)
- [mcp/apply.ts](mcp-apply.ts.md) (9 shared connections)
- [prompt.ts](prompt.ts.md) (9 shared connections)
- [clef.ts](clef.ts.md) (9 shared connections)
- [server/network.ts](server-network.ts.md) (8 shared connections)
- [\[sessionId\]/route.ts]([sessionId]-route.ts.md) (8 shared connections)
- [createJsonlParser](createJsonlParser.md) (8 shared connections)
- [schema.ts](schema.ts.md) (6 shared connections)

## Source Files

- `src/domain/clarify.ts`
- `src/domain/commands.ts`
- `src/domain/flows.ts`
- `src/domain/missing.ts`
- `src/domain/warnings.ts`
- `src/server/chat/ask.ts`
- `src/server/chat/intent.ts`
- `src/server/chat/messages.ts`
- `src/server/chat/pipeline.ts`
- `src/server/chat/prompt.ts`
- `src/server/chat/skips.ts`
- `src/server/glossary.ts`

## Audit Trail

- EXTRACTED: 248 (96%)
- INFERRED: 9 (4%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*