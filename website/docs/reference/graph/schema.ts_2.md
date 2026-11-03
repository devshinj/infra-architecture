---
title: "schema.ts"
sidebar_position: 76
---
# schema.ts

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 56 nodes · cohesion 0.07

## Key Concepts

- **schema.ts** (36 connections) — `src/db/schema.ts`
- **sessions.ts** (32 connections) — `src/server/chat/sessions.ts`
- **glossary.ts** (27 connections) — `src/server/glossary.ts`
- **versions.ts** (27 connections) — `src/server/versions.ts`
- **sessions/route.ts** (18 connections) — `src/app/api/diagrams/[id]/sessions/route.ts`
- **signup.ts** (18 connections) — `src/server/auth/signup.ts`
- **messages.ts** (16 connections) — `src/server/chat/messages.ts`
- **client.ts** (14 connections) — `src/db/client.ts`
- **password.ts** (13 connections) — `src/server/auth/password.ts`
- **ref_drizzle_orm** (11 connections)
- **db** (10 connections) — `src/db/client.ts`
- **GET()** (8 connections) — `src/app/api/diagrams/[id]/sessions/route.ts`
- **asRow()** (6 connections) — `src/server/chat/sessions.ts`
- **listSessionPage()** (6 connections) — `src/server/chat/sessions.ts`
- **hashPassword()** (5 connections) — `src/server/auth/password.ts`
- **restoreVersion()** (5 connections) — `src/server/versions.ts`
- **restoreVersionWithMessage()** (5 connections) — `src/server/versions.ts`
- **users** (4 connections) — `src/db/schema.ts`
- **isDbTimestamp()** (4 connections) — `src/server/chat/sessions.ts`
- **parseCursor()** (4 connections) — `src/server/chat/sessions.ts`
- **diagramVersions** (3 connections) — `src/db/schema.ts`
- **MessageRole** (3 connections) — `src/db/schema.ts`
- **VersionSource** (3 connections) — `src/db/schema.ts`
- **VersionStatus** (3 connections) — `src/db/schema.ts`
- **glossary-seed.ts** (3 connections) — `src/domain/glossary-seed.ts`
- *... and 31 more nodes in this community*

## Relationships

- [(app)/actions.ts](app-actions.ts.md) (28 shared connections)
- [schema.ts](schema.ts.md) (25 shared connections)
- [ask.ts](ask.ts.md) (16 shared connections)
- [설명 생성과 품질 검사](설명_생성과_품질_검사.md) (10 shared connections)
- [auth](auth.md) (8 shared connections)
- [ask/route.ts](ask-route.ts.md) (8 shared connections)
- [\[sessionId\]/route.ts]([sessionId]-route.ts.md) (7 shared connections)
- [GlossaryPage.tsx](GlossaryPage.tsx.md) (5 shared connections)
- [pipeline.ts](pipeline.ts.md) (4 shared connections)
- [useExplanations.ts](useExplanations.ts.md) (4 shared connections)
- [Explanation.tsx](Explanation.tsx.md) (2 shared connections)
- [domain/warnings.ts](domain-warnings.ts.md) (2 shared connections)

## Source Files

- `src/app/api/diagrams/[id]/sessions/route.ts`
- `src/db/client.ts`
- `src/db/schema.ts`
- `src/domain/glossary-seed.ts`
- `src/server/auth/password.ts`
- `src/server/auth/signup.ts`
- `src/server/chat/messages.ts`
- `src/server/chat/sessions.ts`
- `src/server/glossary.ts`
- `src/server/versions.ts`

## Audit Trail

- EXTRACTED: 226 (99%)
- INFERRED: 2 (1%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*