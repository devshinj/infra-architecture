---
title: "pipeline.ts"
sidebar_position: 10
---
# pipeline.ts

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 36 nodes · cohesion 0.10

## Key Concepts

- **pipeline.ts** (107 connections) — `src/server/chat/pipeline.ts`
- **lockedTurn()** (40 connections) — `src/server/chat/pipeline.ts`
- **Task 6: 대화 차례 — 프롬프트, 종류 검사, 망연계 추정 기록, 흐름 나누기, 경고 점검** (11 connections) — `docs/superpowers/plans/2026-11-06-network-knowledge-link-guess.md`
- **buildMessages()** (9 connections) — `src/server/chat/prompt.ts`
- **parseCommand()** (8 connections) — `src/domain/commands.ts`
- **isFlowCommand()** (7 connections) — `src/domain/commands.ts`
- **pickFlows()** (7 connections) — `src/server/flowSuggest.ts`
- **Task 5: 대화 차례의 흐름 명령** (6 connections) — `docs/superpowers/plans/2026-11-05-flows-and-network-boundaries.md`
- **isStructural()** (6 connections) — `src/domain/commands.ts`
- **toFlowOp()** (5 connections) — `src/domain/commands.ts`
- **streamFailure()** (5 connections) — `src/server/chat/pipeline.ts`
- **summarizeState()** (5 connections) — `src/server/chat/prompt.ts`
- **skips.ts** (5 connections) — `src/server/chat/skips.ts`
- **SkipTally** (5 connections) — `src/server/chat/skips.ts`
- **splitFlowSteps()** (4 connections) — `src/domain/linkGuess.ts`
- **turnSignals()** (4 connections) — `src/server/chat/pipeline.ts`
- **parseMentions()** (4 connections) — `src/server/chat/prompt.ts`
- **asksStepText()** (3 connections) — `src/domain/flows.ts`
- **keepStepText()** (3 connections) — `src/domain/flows.ts`
- **clefOpenItems()** (3 connections) — `src/server/chat/intent.ts`
- **createSkipTally()** (3 connections) — `src/server/chat/skips.ts`
- **skipKey()** (3 connections) — `src/server/chat/skips.ts`
- **Task 2: 구성도 상태 — 망 종류 칸, `set_zone_type`, 망연계 추정 표시 명령** (2 connections) — `docs/superpowers/plans/2026-11-06-network-knowledge-link-guess.md`
- **abortError()** (2 connections) — `src/server/chat/pipeline.ts`
- **opName()** (2 connections) — `src/server/chat/pipeline.ts`
- *... and 11 more nodes in this community*

## Relationships

- [ask.ts](ask.ts.md) (24 shared connections)
- [apply.ts](apply.ts.md) (16 shared connections)
- [getOwnedDiagram](getOwnedDiagram.md) (12 shared connections)
- [runAskTurn](runAskTurn.md) (9 shared connections)
- [flowSuggest.ts](flowSuggest.ts.md) (8 shared connections)
- [commands.ts](commands.ts.md) (7 shared connections)
- [createJsonlParser](createJsonlParser.md) (7 shared connections)
- [ask/route.ts](ask-route.ts.md) (7 shared connections)
- [prompt.ts](prompt.ts.md) (7 shared connections)
- [domain/flows.ts](domain-flows.ts.md) (6 shared connections)
- [server/flows.ts](server-flows.ts.md) (6 shared connections)
- [domain/warnings.ts](domain-warnings.ts.md) (5 shared connections)

## Source Files

- `docs/superpowers/plans/2026-11-05-flows-and-network-boundaries.md`
- `docs/superpowers/plans/2026-11-06-network-knowledge-link-guess.md`
- `src/domain/commands.ts`
- `src/domain/flows.ts`
- `src/domain/linkGuess.ts`
- `src/server/chat/intent.ts`
- `src/server/chat/pipeline.ts`
- `src/server/chat/prompt.ts`
- `src/server/chat/skips.ts`
- `src/server/flowSuggest.ts`

## Audit Trail

- EXTRACTED: 191 (91%)
- INFERRED: 19 (9%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*