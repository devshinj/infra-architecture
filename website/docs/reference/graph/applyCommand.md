---
title: "applyCommand"
sidebar_position: 4
---
# applyCommand

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 71 nodes · cohesion 0.05

## Key Concepts

- **applyCommand()** (30 connections) — `src/domain/apply.ts`
- **domain/apply.ts** (28 connections) — `src/domain/apply.ts`
- **domain/linkGuess.ts** (25 connections) — `src/domain/linkGuess.ts`
- **Command** (24 connections) — `src/domain/commands.ts`
- **edgeCoalesce.ts** (15 connections) — `src/domain/edgeCoalesce.ts`
- **settle.ts** (15 connections) — `src/server/chat/settle.ts`
- **settleTurn()** (12 connections) — `src/server/chat/settle.ts`
- **Review Focus** (11 connections) — `docs/superpowers/plans/2026-11-06-network-knowledge-link-guess.md`
- **Task 6: 대화 차례 — 프롬프트, 종류 검사, 망연계 추정 기록, 흐름 나누기, 경고 점검** (11 connections) — `docs/superpowers/plans/2026-11-06-network-knowledge-link-guess.md`
- **createEdgeCoalescer()** (10 connections) — `src/domain/edgeCoalesce.ts`
- **Task 4: 차례 끝 정리 공용화와 코드 경고 점검** (9 connections) — `docs/superpowers/plans/2026-11-09-mcp-server.md`
- **recordReplaced()** (9 connections) — `src/domain/linkGuess.ts`
- **revertLinkGuess()** (9 connections) — `src/domain/linkGuess.ts`
- **Task 8: 구성도 화면 — 지식 전달, 안내 카드, 빠진 정보 줄, 망연계 노드 표시** (8 connections) — `docs/superpowers/plans/2026-11-06-network-knowledge-link-guess.md`
- **Task 4: 되돌리기 도메인 — 대신한 연결 기록, 되돌리기, 흐름 단계 나누기·합치기** (7 connections) — `docs/superpowers/plans/2026-11-06-network-knowledge-link-guess.md`
- **Claude Code 연동(MCP 서버) — 설계** (7 connections) — `docs/superpowers/specs/2026-11-06-mcp-server-design.md`
- **목표** (7 connections) — `docs/superpowers/specs/2026-11-06-mcp-server-design.md`
- **applyCommands()** (7 connections) — `src/domain/apply.ts`
- **freeEdgeId()** (7 connections) — `src/domain/apply.ts`
- **has()** (7 connections) — `src/domain/apply.ts`
- **pruneEmptyGroups()** (7 connections) — `src/domain/apply.ts`
- **splitsFor()** (7 connections) — `src/domain/linkGuess.ts`
- **Global Constraints** (6 connections) — `docs/superpowers/plans/2026-11-09-mcp-server.md`
- **has()** (6 connections) — `src/domain/linkGuess.ts`
- **splitFlowSteps()** (6 connections) — `src/domain/linkGuess.ts`
- *... and 46 more nodes in this community*

## Relationships

- [mcp/apply.ts](mcp-apply.ts.md) (22 shared connections)
- [commands.ts](commands.ts.md) (18 shared connections)
- [getOwnedDiagram](getOwnedDiagram.md) (15 shared connections)
- [pipeline.ts](pipeline.ts.md) (11 shared connections)
- [domain/types.ts](domain-types.ts.md) (10 shared connections)
- [diff.ts](diff.ts.md) (8 shared connections)
- [index.ts](index.ts.md) (6 shared connections)
- [read.ts](read.ts.md) (5 shared connections)
- [DiagramWorkspace.tsx](DiagramWorkspace.tsx.md) (5 shared connections)
- [chat/warnings.ts](chat-warnings.ts.md) (4 shared connections)
- [prompt.ts](prompt.ts.md) (3 shared connections)
- [turn.ts](turn.ts.md) (3 shared connections)

## Source Files

- `docs/superpowers/plans/2026-10-29-infrasketch-phase1-foundation-canvas.md`
- `docs/superpowers/plans/2026-11-06-network-knowledge-link-guess.md`
- `docs/superpowers/plans/2026-11-09-mcp-server.md`
- `docs/superpowers/specs/2026-11-06-mcp-server-design.md`
- `src/domain/apply.ts`
- `src/domain/commands.ts`
- `src/domain/edgeCoalesce.ts`
- `src/domain/flows.ts`
- `src/domain/linkGuess.ts`
- `src/domain/types.ts`
- `src/server/chat/settle.ts`

## Audit Trail

- EXTRACTED: 213 (78%)
- INFERRED: 59 (22%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*