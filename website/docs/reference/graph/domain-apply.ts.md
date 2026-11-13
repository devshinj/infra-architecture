---
title: "domain/apply.ts"
sidebar_position: 3
---
# domain/apply.ts

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 58 nodes · cohesion 0.07

## Key Concepts

- **domain/apply.ts** (27 connections) — `src/domain/apply.ts`
- **applyCommand()** (26 connections) — `src/domain/apply.ts`
- **domain/linkGuess.ts** (25 connections) — `src/domain/linkGuess.ts`
- **settle.ts** (15 connections) — `src/server/chat/settle.ts`
- **settleTurn()** (12 connections) — `src/server/chat/settle.ts`
- **Review Focus** (11 connections) — `docs/superpowers/plans/2026-11-06-network-knowledge-link-guess.md`
- **Task 6: 대화 차례 — 프롬프트, 종류 검사, 망연계 추정 기록, 흐름 나누기, 경고 점검** (11 connections) — `docs/superpowers/plans/2026-11-06-network-knowledge-link-guess.md`
- **Task 4: 차례 끝 정리 공용화와 코드 경고 점검** (9 connections) — `docs/superpowers/plans/2026-11-09-mcp-server.md`
- **recordReplaced()** (9 connections) — `src/domain/linkGuess.ts`
- **revertLinkGuess()** (9 connections) — `src/domain/linkGuess.ts`
- **Task 4: 되돌리기 도메인 — 대신한 연결 기록, 되돌리기, 흐름 단계 나누기·합치기** (7 connections) — `docs/superpowers/plans/2026-11-06-network-knowledge-link-guess.md`
- **Claude Code 연동(MCP 서버) — 설계** (7 connections) — `docs/superpowers/specs/2026-11-06-mcp-server-design.md`
- **목표** (7 connections) — `docs/superpowers/specs/2026-11-06-mcp-server-design.md`
- **applyCommands()** (7 connections) — `src/domain/apply.ts`
- **freeEdgeId()** (7 connections) — `src/domain/apply.ts`
- **has()** (7 connections) — `src/domain/apply.ts`
- **pruneEmptyGroups()** (7 connections) — `src/domain/apply.ts`
- **splitsFor()** (7 connections) — `src/domain/linkGuess.ts`
- **has()** (6 connections) — `src/domain/linkGuess.ts`
- **splitFlowSteps()** (6 connections) — `src/domain/linkGuess.ts`
- **흐름 보기와 망 경계 표시 Implementation Plan** (5 connections) — `docs/superpowers/plans/2026-11-05-flows-and-network-boundaries.md`
- **Global Constraints** (5 connections) — `docs/superpowers/plans/2026-11-06-network-knowledge-link-guess.md`
- **망 종류 지식과 망연계 예상 Implementation Plan** (5 connections) — `docs/superpowers/plans/2026-11-06-network-knowledge-link-guess.md`
- **incident()** (5 connections) — `src/domain/linkGuess.ts`
- **구조 변경은 applyCommand 로만** (4 connections) — `docs/superpowers/plans/2026-10-29-infrasketch-phase1-foundation-canvas.md`
- *... and 33 more nodes in this community*

## Relationships

- [commands.ts](commands.ts.md) (14 shared connections)
- [getOwnedDiagram](getOwnedDiagram.md) (13 shared connections)
- [pipeline.ts](pipeline.ts.md) (11 shared connections)
- [mcp/apply.ts](mcp-apply.ts.md) (10 shared connections)
- [types.ts](types.ts.md) (8 shared connections)
- [chat/warnings.ts](chat-warnings.ts.md) (4 shared connections)
- [samples.ts](samples.ts.md) (4 shared connections)
- [DiagramWorkspace.tsx](DiagramWorkspace.tsx.md) (4 shared connections)
- [domain/flows.ts](domain-flows.ts.md) (3 shared connections)
- [server/network.ts](server-network.ts.md) (3 shared connections)
- [index.ts](index.ts.md) (3 shared connections)
- [prompt.ts](prompt.ts.md) (2 shared connections)

## Source Files

- `docs/superpowers/plans/2026-10-29-infrasketch-phase1-foundation-canvas.md`
- `docs/superpowers/plans/2026-11-05-flows-and-network-boundaries.md`
- `docs/superpowers/plans/2026-11-06-network-knowledge-link-guess.md`
- `docs/superpowers/plans/2026-11-09-mcp-server.md`
- `docs/superpowers/specs/2026-11-06-mcp-server-design.md`
- `src/domain/apply.ts`
- `src/domain/flows.ts`
- `src/domain/linkGuess.ts`
- `src/domain/types.ts`
- `src/server/chat/settle.ts`

## Audit Trail

- EXTRACTED: 158 (78%)
- INFERRED: 45 (22%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*