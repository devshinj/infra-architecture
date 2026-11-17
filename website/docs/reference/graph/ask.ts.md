---
title: "ask.ts"
sidebar_position: 40
---
# ask.ts

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 27 nodes · cohesion 0.13

## Key Concepts

- **ask.ts** (60 connections) — `src/server/chat/ask.ts`
- **NotFoundError** (36 connections) — `src/server/projects.ts`
- **askInSession()** (14 connections) — `src/server/chat/ask.ts`
- **runAskTurn()** (14 connections) — `src/server/chat/ask.ts`
- **lockedAsk()** (11 connections) — `src/server/chat/ask.ts`
- **Task 2: 질문 차례(서버)** (9 connections) — `docs/superpowers/plans/2026-11-01-infrasketch-phase3c2-ask-node.md`
- **ChatEvent** (9 connections) — `src/server/chat/events.ts`
- **createSession()** (8 connections) — `src/server/chat/sessions.ts`
- **createMessage()** (7 connections) — `src/server/chat/messages.ts`
- **buildAskMessages()** (7 connections) — `src/server/chat/prompt.ts`
- **cachedNodeExplanation()** (7 connections) — `src/server/explain.ts`
- **Review Focus** (6 connections) — `docs/superpowers/plans/2026-11-01-infrasketch-phase3c2-ask-node.md`
- **touchSession()** (6 connections) — `src/server/chat/sessions.ts`
- **InfraSketch 3C-2단계 — 노드에 대해 물어보기 Implementation Plan** (5 connections) — `docs/superpowers/plans/2026-11-01-infrasketch-phase3c2-ask-node.md`
- **.emit()** (5 connections) — `src/server/chat/ask.ts`
- **guardEmit()** (5 connections) — `src/server/chat/pipeline.ts`
- **turnSignals()** (4 connections) — `src/server/chat/pipeline.ts`
- **hasNode()** (3 connections) — `src/server/chat/ask.ts`
- **Task 1: 세션 저장** (2 connections) — `docs/superpowers/plans/2026-11-01-infrasketch-phase3c2-ask-node.md`
- **AskArgs** (2 connections) — `src/server/chat/ask.ts`
- **labelOf()** (2 connections) — `src/server/chat/ask.ts`
- **2026-11-01-infrasketch-phase3c2-ask-node.md** (1 connections) — `docs/superpowers/plans/2026-11-01-infrasketch-phase3c2-ask-node.md`
- **Global Constraints** (1 connections) — `docs/superpowers/plans/2026-11-01-infrasketch-phase3c2-ask-node.md`
- **Task 5: E2E — 노드 질문 흐름** (1 connections) — `docs/superpowers/plans/2026-11-01-infrasketch-phase3c2-ask-node.md`
- **실행 순서** (1 connections) — `docs/superpowers/plans/2026-11-01-infrasketch-phase3c2-ask-node.md`
- *... and 2 more nodes in this community*

## Relationships

- [pipeline.ts](pipeline.ts.md) (21 shared connections)
- [ask/route.ts](ask-route.ts.md) (18 shared connections)
- [auth](auth.md) (13 shared connections)
- [getOwnedDiagram](getOwnedDiagram.md) (12 shared connections)
- [\[sessionId\]/route.ts]([sessionId]-route.ts.md) (7 shared connections)
- [server/network.ts](server-network.ts.md) (7 shared connections)
- [prompt.ts](prompt.ts.md) (6 shared connections)
- [createJsonlParser](createJsonlParser.md) (4 shared connections)
- [missing.ts](missing.ts.md) (4 shared connections)
- [read.ts](read.ts.md) (4 shared connections)
- [설명 생성과 품질 검사](설명_생성과_품질_검사.md) (4 shared connections)
- [projects.ts](projects.ts.md) (4 shared connections)

## Source Files

- `docs/superpowers/plans/2026-11-01-infrasketch-phase3c2-ask-node.md`
- `src/server/chat/ask.ts`
- `src/server/chat/events.ts`
- `src/server/chat/messages.ts`
- `src/server/chat/pipeline.ts`
- `src/server/chat/prompt.ts`
- `src/server/chat/sessions.ts`
- `src/server/explain.ts`
- `src/server/projects.ts`

## Audit Trail

- EXTRACTED: 165 (91%)
- INFERRED: 16 (9%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*