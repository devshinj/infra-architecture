---
title: "ask.ts"
sidebar_position: 48
---
# ask.ts

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 25 nodes · cohesion 0.12

## Key Concepts

- **runAskTurn()** (14 connections) — `src/server/chat/ask.ts`
- **getSession()** (14 connections) — `src/server/chat/sessions.ts`
- **runChatTurn()** (12 connections) — `src/server/chat/pipeline.ts`
- **lockedAsk()** (11 connections) — `src/server/chat/ask.ts`
- **Task 2: 질문 차례(서버)** (9 connections) — `docs/superpowers/plans/2026-11-01-infrasketch-phase3c2-ask-node.md`
- **ChatEvent** (9 connections) — `src/server/chat/events.ts`
- **POST()** (8 connections) — `src/app/api/diagrams/[id]/ask/route.ts`
- **sessionTurn()** (8 connections) — `src/server/chat/pipeline.ts`
- **.emit()** (7 connections) — `src/server/chat/pipeline.ts`
- **buildAskMessages()** (7 connections) — `src/server/chat/prompt.ts`
- **Review Focus** (6 connections) — `docs/superpowers/plans/2026-11-01-infrasketch-phase3c2-ask-node.md`
- **touchSession()** (6 connections) — `src/server/chat/sessions.ts`
- **InfraSketch 3C-2단계 — 노드에 대해 물어보기 Implementation Plan** (5 connections) — `docs/superpowers/plans/2026-11-01-infrasketch-phase3c2-ask-node.md`
- **.emit()** (5 connections) — `src/server/chat/ask.ts`
- **guardEmit()** (5 connections) — `src/server/chat/pipeline.ts`
- **Task 4: 질문 시작하기(설명 패널·우클릭 메뉴)** (4 connections) — `docs/superpowers/plans/2026-11-01-infrasketch-phase3c2-ask-node.md`
- **hasNode()** (3 connections) — `src/server/chat/ask.ts`
- **Task 1: 세션 저장** (2 connections) — `docs/superpowers/plans/2026-11-01-infrasketch-phase3c2-ask-node.md`
- **AskArgs** (2 connections) — `src/server/chat/ask.ts`
- **labelOf()** (2 connections) — `src/server/chat/ask.ts`
- **TurnArgs** (2 connections) — `src/server/chat/pipeline.ts`
- **2026-11-01-infrasketch-phase3c2-ask-node.md** (1 connections) — `docs/superpowers/plans/2026-11-01-infrasketch-phase3c2-ask-node.md`
- **Global Constraints** (1 connections) — `docs/superpowers/plans/2026-11-01-infrasketch-phase3c2-ask-node.md`
- **Task 5: E2E — 노드 질문 흐름** (1 connections) — `docs/superpowers/plans/2026-11-01-infrasketch-phase3c2-ask-node.md`
- **실행 순서** (1 connections) — `docs/superpowers/plans/2026-11-01-infrasketch-phase3c2-ask-node.md`

## Relationships

- [pipeline.ts](pipeline.ts.md) (24 shared connections)
- [ask/route.ts](ask-route.ts.md) (10 shared connections)
- [\[sessionId\]/route.ts]([sessionId]-route.ts.md) (8 shared connections)
- [getOwnedDiagram](getOwnedDiagram.md) (8 shared connections)
- [prompt.ts](prompt.ts.md) (5 shared connections)
- [useChatTurn.ts](useChatTurn.ts.md) (4 shared connections)
- [auth](auth.md) (3 shared connections)
- [NotFoundError](NotFoundError.md) (2 shared connections)
- [server/network.ts](server-network.ts.md) (2 shared connections)
- [ChatPanel.tsx](ChatPanel.tsx.md) (1 shared connections)
- [NodeInfo.tsx](NodeInfo.tsx.md) (1 shared connections)
- [(app)/actions.ts](app-actions.ts.md) (1 shared connections)

## Source Files

- `docs/superpowers/plans/2026-11-01-infrasketch-phase3c2-ask-node.md`
- `src/app/api/diagrams/[id]/ask/route.ts`
- `src/server/chat/ask.ts`
- `src/server/chat/events.ts`
- `src/server/chat/pipeline.ts`
- `src/server/chat/prompt.ts`
- `src/server/chat/sessions.ts`

## Audit Trail

- EXTRACTED: 95 (87%)
- INFERRED: 14 (13%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*