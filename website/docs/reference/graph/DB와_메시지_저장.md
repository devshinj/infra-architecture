---
title: "DB와 메시지 저장"
sidebar_position: 7
---
# DB와 메시지 저장

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 42 nodes · cohesion 0.09

## Key Concepts

- **schema.ts** (24 connections) — `src/db/schema.ts`
- **useChatTurn.ts** (22 connections) — `src/ui/chat/useChatTurn.ts`
- **messages.ts** (14 connections) — `src/server/chat/messages.ts`
- **useChatTurn()** (14 connections) — `src/ui/chat/useChatTurn.ts`
- **client.ts** (11 connections) — `src/db/client.ts`
- **password.ts** (11 connections) — `src/server/auth/password.ts`
- **signup.ts** (11 connections) — `src/server/auth/signup.ts`
- **lines.ts** (11 connections) — `src/ui/chat/lines.ts`
- **events.ts** (10 connections) — `src/server/chat/events.ts`
- **ref_drizzle_orm** (8 connections)
- **db** (7 connections) — `src/db/client.ts`
- **MessageMeta** (7 connections) — `src/server/chat/events.ts`
- **ChatLine** (7 connections) — `src/ui/chat/useChatTurn.ts`
- **Command** (6 connections) — `src/domain/commands.ts`
- **missingReminder()** (6 connections) — `src/domain/missing.ts`
- **UseChatTurnArgs** (6 connections) — `src/ui/chat/useChatTurn.ts`
- **users** (4 connections) — `src/db/schema.ts`
- **MessageRole** (3 connections) — `src/db/schema.ts`
- **VersionSource** (3 connections) — `src/db/schema.ts`
- **VersionStatus** (3 connections) — `src/db/schema.ts`
- **CreateVersionOpts** (3 connections) — `src/server/versions.ts`
- **.getState()** (3 connections) — `src/ui/chat/useChatTurn.ts`
- **.onCommand()** (3 connections) — `src/ui/chat/useChatTurn.ts`
- **ref_postgres** (2 connections)
- **diagrams** (2 connections) — `src/db/schema.ts`
- *... and 17 more nodes in this community*

## Relationships

- [서버 액션과 작업 화면](서버_액션과_작업_화면.md) (27 shared connections)
- [인증과 외부 라이브러리](인증과_외부_라이브러리.md) (14 shared connections)
- [빠진 정보 계산과 표시](빠진_정보_계산과_표시.md) (9 shared connections)
- [가정과 대화 패널 UI](가정과_대화_패널_UI.md) (6 shared connections)
- [명령 스키마](명령_스키마.md) (3 shared connections)
- [대화 스트리밍 API](대화_스트리밍_API.md) (3 shared connections)
- [대화 응답 문구와 스트림 정리](대화_응답_문구와_스트림_정리.md) (3 shared connections)
- [명령 적용과 샘플](명령_적용과_샘플.md) (2 shared connections)
- [설계 문서와 계획](설계_문서와_계획.md) (2 shared connections)

## Source Files

- `src/db/client.ts`
- `src/db/schema.ts`
- `src/domain/commands.ts`
- `src/domain/missing.ts`
- `src/server/auth/password.ts`
- `src/server/auth/signup.ts`
- `src/server/chat/events.ts`
- `src/server/chat/messages.ts`
- `src/server/versions.ts`
- `src/ui/chat/lines.ts`
- `src/ui/chat/useChatTurn.ts`

## Audit Trail

- EXTRACTED: 148 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*