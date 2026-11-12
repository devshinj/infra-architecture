---
title: "pipeline.ts"
sidebar_position: 4
---
# pipeline.ts

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 46 nodes · cohesion 0.10

## Key Concepts

- **pipeline.ts** (125 connections) — `src/server/chat/pipeline.ts`
- **ask.ts** (59 connections) — `src/server/chat/ask.ts`
- **lockedTurn()** (45 connections) — `src/server/chat/pipeline.ts`
- **computeMissing()** (26 connections) — `src/domain/missing.ts`
- **askInSession()** (14 connections) — `src/server/chat/ask.ts`
- **intent.ts** (13 connections) — `src/server/chat/intent.ts`
- **Task 2: 질문 차례(서버)** (9 connections) — `docs/superpowers/plans/2026-11-01-infrasketch-phase3c2-ask-node.md`
- **createThinkStripper()** (9 connections) — `src/server/llm/think.ts`
- **createMessage()** (7 connections) — `src/server/chat/messages.ts`
- **buildAskMessages()** (7 connections) — `src/server/chat/prompt.ts`
- **matchUserTerms()** (7 connections) — `src/server/glossary.ts`
- **splitFlowSteps()** (6 connections) — `src/domain/linkGuess.ts`
- **resolveIntent()** (6 connections) — `src/server/chat/intent.ts`
- **touchSession()** (6 connections) — `src/server/chat/sessions.ts`
- **detectForks()** (5 connections) — `src/domain/clarify.ts`
- **streamFailure()** (5 connections) — `src/server/chat/pipeline.ts`
- **skips.ts** (5 connections) — `src/server/chat/skips.ts`
- **Intent** (5 connections) — `src/server/llm/clef.ts`
- **think.ts** (5 connections) — `src/server/llm/think.ts`
- **validChoices()** (4 connections) — `src/domain/clarify.ts`
- **keepStepText()** (4 connections) — `src/domain/flows.ts`
- **warningDelta()** (4 connections) — `src/domain/warnings.ts`
- **turnSignals()** (4 connections) — `src/server/chat/pipeline.ts`
- **parseMentions()** (4 connections) — `src/server/chat/prompt.ts`
- **isAssumptionChangeMessage()** (3 connections) — `src/domain/assumptions.ts`
- *... and 21 more nodes in this community*

## Relationships

- [ask/route.ts](ask-route.ts.md) (36 shared connections)
- [\[sessionId\]/route.ts]([sessionId]-route.ts.md) (23 shared connections)
- [getOwnedDiagram](getOwnedDiagram.md) (20 shared connections)
- [mcp/apply.ts](mcp-apply.ts.md) (15 shared connections)
- [prompt.ts](prompt.ts.md) (14 shared connections)
- [clarify.ts](clarify.ts.md) (10 shared connections)
- [chat/warnings.ts](chat-warnings.ts.md) (10 shared connections)
- [flowSuggest.ts](flowSuggest.ts.md) (9 shared connections)
- [domain/apply.ts](domain-apply.ts.md) (9 shared connections)
- [useChatTurn.ts](useChatTurn.ts.md) (7 shared connections)
- [DiagramState](DiagramState.md) (6 shared connections)
- [missing.ts](missing.ts.md) (6 shared connections)

## Source Files

- `docs/superpowers/plans/2026-11-01-infrasketch-phase3c2-ask-node.md`
- `src/domain/assumptions.ts`
- `src/domain/clarify.ts`
- `src/domain/commands.ts`
- `src/domain/flows.ts`
- `src/domain/linkGuess.ts`
- `src/domain/missing.ts`
- `src/domain/warnings.ts`
- `src/server/chat/ask.ts`
- `src/server/chat/intent.ts`
- `src/server/chat/lock.ts`
- `src/server/chat/messages.ts`
- `src/server/chat/pipeline.ts`
- `src/server/chat/prompt.ts`
- `src/server/chat/sessions.ts`
- `src/server/chat/skips.ts`
- `src/server/glossary.ts`
- `src/server/llm/clef.ts`
- `src/server/llm/think.ts`

## Audit Trail

- EXTRACTED: 315 (95%)
- INFERRED: 16 (5%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*