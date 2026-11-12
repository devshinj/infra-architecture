---
title: "schema.ts"
sidebar_position: 21
---
# schema.ts

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 32 nodes · cohesion 0.10

## Key Concepts

- **schema.ts** (54 connections) — `src/db/schema.ts`
- **versions.ts** (36 connections) — `src/server/versions.ts`
- **client.ts** (22 connections) — `src/db/client.ts`
- **ref_drizzle_orm** (18 connections)
- **mcpKeys.ts** (18 connections) — `src/server/mcpKeys.ts`
- **db** (17 connections) — `src/db/client.ts`
- **Tx** (7 connections) — `src/db/client.ts`
- **getVersion()** (7 connections) — `src/server/versions.ts`
- **restoreVersionWithMessage()** (7 connections) — `src/server/versions.ts`
- **diagramVersions** (6 connections) — `src/db/schema.ts`
- **restoreVersion()** (6 connections) — `src/server/versions.ts`
- **flows** (5 connections) — `src/db/schema.ts`
- **verifyMcpKey()** (5 connections) — `src/server/mcpKeys.ts`
- **diagrams** (4 connections) — `src/db/schema.ts`
- **CreateVersionOpts** (4 connections) — `src/server/versions.ts`
- **StaleVersionError** (4 connections) — `src/server/versions.ts`
- **4. 도구** (3 connections) — `docs/superpowers/specs/2026-11-06-mcp-server-design.md`
- **projects** (3 connections) — `src/db/schema.ts`
- **VersionSource** (3 connections) — `src/db/schema.ts`
- **VersionStatus** (3 connections) — `src/db/schema.ts`
- **hashKey()** (3 connections) — `src/server/mcpKeys.ts`
- **lockLatestNumber()** (3 connections) — `src/server/versions.ts`
- **Task 7: MCP 라우트와 도구** (2 connections) — `docs/superpowers/plans/2026-11-09-mcp-server.md`
- **ref_postgres** (2 connections)
- **mcpKeys** (2 connections) — `src/db/schema.ts`
- *... and 7 more nodes in this community*

## Relationships

- [\[sessionId\]/route.ts]([sessionId]-route.ts.md) (13 shared connections)
- [server/network.ts](server-network.ts.md) (12 shared connections)
- [read.ts](read.ts.md) (11 shared connections)
- [flowSuggest.ts](flowSuggest.ts.md) (11 shared connections)
- [getOwnedDiagram](getOwnedDiagram.md) (11 shared connections)
- [(app)/actions.ts](app-actions.ts.md) (11 shared connections)
- [server/flows.ts](server-flows.ts.md) (10 shared connections)
- [auth/actions.ts](auth-actions.ts.md) (9 shared connections)
- [mcp/apply.ts](mcp-apply.ts.md) (9 shared connections)
- [projects.ts](projects.ts.md) (9 shared connections)
- [설명 생성과 품질 검사](설명_생성과_품질_검사.md) (7 shared connections)
- [samples.ts](samples.ts.md) (6 shared connections)

## Source Files

- `docs/superpowers/plans/2026-11-09-mcp-server.md`
- `docs/superpowers/specs/2026-11-06-mcp-server-design.md`
- `src/db/client.ts`
- `src/db/schema.ts`
- `src/server/flows.ts`
- `src/server/mcpKeys.ts`
- `src/server/versions.ts`

## Audit Trail

- EXTRACTED: 196 (98%)
- INFERRED: 5 (2%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*