---
title: "Claude Code 연동(MCP 서버) — 설계"
sidebar_position: 52
---
# Claude Code 연동(MCP 서버) — 설계

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 20 nodes · cohesion 0.11

## Key Concepts

- **Claude Code 연동(MCP 서버) — 설계** (7 connections) — `docs/superpowers/specs/2026-11-06-mcp-server-design.md`
- **목표** (7 connections) — `docs/superpowers/specs/2026-11-06-mcp-server-design.md`
- **restoreVersionWithMessage()** (7 connections) — `src/server/versions.ts`
- **Global Constraints** (6 connections) — `docs/superpowers/plans/2026-11-09-mcp-server.md`
- **restoreVersion()** (6 connections) — `src/server/versions.ts`
- **Claude Code 연동(MCP 서버) Implementation Plan** (4 connections) — `docs/superpowers/plans/2026-11-09-mcp-server.md`
- **4. 도구** (3 connections) — `docs/superpowers/specs/2026-11-06-mcp-server-design.md`
- **제약** (3 connections) — `docs/superpowers/specs/2026-11-06-mcp-server-design.md`
- **1. 누가 그리나** (2 connections) — `docs/superpowers/specs/2026-11-06-mcp-server-design.md`
- **5. 기록과 동시 작업** (2 connections) — `docs/superpowers/specs/2026-11-06-mcp-server-design.md`
- **만드는 사람에게 맡기는 것** (2 connections) — `docs/superpowers/specs/2026-11-06-mcp-server-design.md`
- **2026-11-09-mcp-server.md** (1 connections) — `docs/superpowers/plans/2026-11-09-mcp-server.md`
- **Review Focus** (1 connections) — `docs/superpowers/plans/2026-11-09-mcp-server.md`
- **2026-11-06-mcp-server-design.md** (1 connections) — `docs/superpowers/specs/2026-11-06-mcp-server-design.md`
- **2. 어디서 띄우나** (1 connections) — `docs/superpowers/specs/2026-11-06-mcp-server-design.md`
- **3. 키 관리 (제 판단)** (1 connections) — `docs/superpowers/specs/2026-11-06-mcp-server-design.md`
- **6. 브라우저에서 보기 (사용자: "어렵지 않으면 시각 효과도")** (1 connections) — `docs/superpowers/specs/2026-11-06-mcp-server-design.md`
- **실패로 보는 것** (1 connections) — `docs/superpowers/specs/2026-11-06-mcp-server-design.md`
- **왜 하는가** (1 connections) — `docs/superpowers/specs/2026-11-06-mcp-server-design.md`
- **하지 않는 것** (1 connections) — `docs/superpowers/specs/2026-11-06-mcp-server-design.md`

## Relationships

- [mcp/apply.ts](mcp-apply.ts.md) (3 shared connections)
- [domain/apply.ts](domain-apply.ts.md) (3 shared connections)
- [(app)/actions.ts](app-actions.ts.md) (3 shared connections)
- [pipeline.ts](pipeline.ts.md) (2 shared connections)
- [getOwnedDiagram](getOwnedDiagram.md) (2 shared connections)
- [schema.ts](schema.ts.md) (2 shared connections)
- [DiagramState](DiagramState.md) (1 shared connections)
- [read.ts](read.ts.md) (1 shared connections)
- [InfraSketch 설계 문서](InfraSketch_설계_문서.md) (1 shared connections)

## Source Files

- `docs/superpowers/plans/2026-11-09-mcp-server.md`
- `docs/superpowers/specs/2026-11-06-mcp-server-design.md`
- `src/server/versions.ts`

## Audit Trail

- EXTRACTED: 26 (68%)
- INFERRED: 12 (32%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*