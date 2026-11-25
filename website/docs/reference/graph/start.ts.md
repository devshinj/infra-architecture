---
title: "start.ts"
sidebar_position: 32
---
# start.ts

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 36 nodes · cohesion 0.08

## Key Concepts

- **start.ts** (68 connections) — `src/server/guide/start.ts`
- **schema.ts** (63 connections) — `src/db/schema.ts`
- **Tx** (11 connections) — `src/db/client.ts`
- **syncGuideRun()** (10 connections) — `src/server/guide/start.ts`
- **diagramVersions** (7 connections) — `src/db/schema.ts`
- **restoreGuideVersion()** (7 connections) — `src/server/guide/start.ts`
- **diagrams** (6 connections) — `src/db/schema.ts`
- **stepFlowIds()** (5 connections) — `src/domain/guides/apply.ts`
- **syncGuideAfterRestore()** (5 connections) — `src/server/guide/start.ts`
- **RestoreMessageOpts** (5 connections) — `src/server/versions.ts`
- **projects** (4 connections) — `src/db/schema.ts`
- **allScriptFlowIds()** (4 connections) — `src/server/guide/start.ts`
- **syncGuideLocked()** (4 connections) — `src/server/guide/start.ts`
- **CreateVersionOpts** (4 connections) — `src/server/versions.ts`
- **MessageRole** (3 connections) — `src/db/schema.ts`
- **VersionSource** (3 connections) — `src/db/schema.ts`
- **VersionStatus** (3 connections) — `src/db/schema.ts`
- **deleteGuideFlows()** (3 connections) — `src/server/flows.ts`
- **authAttempts** (2 connections) — `src/db/schema.ts`
- **ChatSessionKind** (2 connections) — `src/db/schema.ts`
- **chatSessions** (2 connections) — `src/db/schema.ts`
- **explanations** (2 connections) — `src/db/schema.ts`
- **glossaryTerms** (2 connections) — `src/db/schema.ts`
- **guideRuns** (2 connections) — `src/db/schema.ts`
- **messages** (2 connections) — `src/db/schema.ts`
- *... and 11 more nodes in this community*

## Relationships

- [getOwnedDiagram](getOwnedDiagram.md) (26 shared connections)
- [runs.ts](runs.ts.md) (22 shared connections)
- [reset.ts](reset.ts.md) (13 shared connections)
- [(app)/actions.ts](app-actions.ts.md) (11 shared connections)
- [projects.ts](projects.ts.md) (10 shared connections)
- [\[sessionId\]/route.ts]([sessionId]-route.ts.md) (9 shared connections)
- [mcp/apply.ts](mcp-apply.ts.md) (9 shared connections)
- [turn.ts](turn.ts.md) (8 shared connections)
- [domain/explain.ts](domain-explain.ts.md) (4 shared connections)
- [guides/types.ts](guides-types.ts.md) (4 shared connections)
- [설명 생성과 품질 검사](설명_생성과_품질_검사.md) (4 shared connections)
- [read.ts](read.ts.md) (3 shared connections)

## Source Files

- `src/db/client.ts`
- `src/db/schema.ts`
- `src/domain/guides/apply.ts`
- `src/server/flows.ts`
- `src/server/guide/start.ts`
- `src/server/versions.ts`

## Audit Trail

- EXTRACTED: 194 (98%)
- INFERRED: 3 (2%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*