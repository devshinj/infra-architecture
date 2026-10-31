---
title: "DB 스키마와 인증"
sidebar_position: 10
---
# DB 스키마와 인증

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 31 nodes · cohesion 0.13

## Key Concepts

- **types.ts** (45 connections) — `src/domain/types.ts`
- **DiagramState** (36 connections) — `src/domain/types.ts`
- **schema.ts** (33 connections) — `src/db/schema.ts`
- **versions.ts** (26 connections) — `src/server/versions.ts`
- **messages.ts** (14 connections) — `src/server/chat/messages.ts`
- **client.ts** (13 connections) — `src/db/client.ts`
- **password.ts** (11 connections) — `src/server/auth/password.ts`
- **signup.ts** (11 connections) — `src/server/auth/signup.ts`
- **ref_drizzle_orm** (10 connections)
- **db** (9 connections) — `src/db/client.ts`
- **createMessage()** (5 connections) — `src/server/chat/messages.ts`
- **restoreVersion()** (5 connections) — `src/server/versions.ts`
- **restoreVersionWithMessage()** (5 connections) — `src/server/versions.ts`
- **users** (4 connections) — `src/db/schema.ts`
- **MessageRole** (3 connections) — `src/db/schema.ts`
- **VersionSource** (3 connections) — `src/db/schema.ts`
- **VersionStatus** (3 connections) — `src/db/schema.ts`
- **CreateVersionOpts** (3 connections) — `src/server/versions.ts`
- **ref_postgres** (2 connections)
- **diagrams** (2 connections) — `src/db/schema.ts`
- **diagramVersions** (2 connections) — `src/db/schema.ts`
- **messages** (2 connections) — `src/db/schema.ts`
- **projects** (2 connections) — `src/db/schema.ts`
- **ref_bcryptjs** (1 connections)
- **makeDb()** (1 connections) — `src/db/client.ts`
- *... and 6 more nodes in this community*

## Relationships

- [getOwnedDiagram](getOwnedDiagram.md) (13 shared connections)
- [MissingChecklist.tsx](MissingChecklist.tsx.md) (12 shared connections)
- [ref_react](ref_react.md) (11 shared connections)
- [useChatTurn.ts](useChatTurn.ts.md) (11 shared connections)
- [설명 생성과 품질 검사](설명_생성과_품질_검사.md) (10 shared connections)
- [projects.ts](projects.ts.md) (9 shared connections)
- [경고 규칙과 점검](경고_규칙과_점검.md) (9 shared connections)
- [(app)/actions.ts](app-actions.ts.md) (9 shared connections)
- [표시 그래프와 버전 비교](표시_그래프와_버전_비교.md) (7 shared connections)
- [pipeline.ts](pipeline.ts.md) (6 shared connections)
- [glossary.ts](glossary.ts.md) (5 shared connections)
- [useExplanations.ts](useExplanations.ts.md) (5 shared connections)

## Source Files

- `src/db/client.ts`
- `src/db/schema.ts`
- `src/domain/types.ts`
- `src/server/auth/password.ts`
- `src/server/auth/signup.ts`
- `src/server/chat/messages.ts`
- `src/server/versions.ts`

## Audit Trail

- EXTRACTED: 197 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*