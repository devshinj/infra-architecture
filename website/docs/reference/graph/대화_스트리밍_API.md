---
title: "대화 스트리밍 API"
sidebar_position: 13
---
# 대화 스트리밍 API

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 15 nodes · cohesion 0.16

## Key Concepts

- **chat/route.ts** (24 connections) — `src/app/api/diagrams/[id]/chat/route.ts`
- **runChatTurn()** (8 connections) — `src/server/chat/pipeline.ts`
- **POST()** (6 connections) — `src/app/api/diagrams/[id]/chat/route.ts`
- **ChatEvent** (5 connections) — `src/server/chat/events.ts`
- **.emit()** (4 connections) — `src/server/chat/pipeline.ts`
- **line()** (2 connections) — `src/app/api/diagrams/[id]/chat/route.ts`
- **ChatTurnResult** (2 connections) — `src/server/chat/pipeline.ts`
- **GENERIC_ERROR_MESSAGE** (2 connections) — `src/server/chat/pipeline.ts`
- **TurnArgs** (2 connections) — `src/server/chat/pipeline.ts`
- **BodySchema** (1 connections) — `src/app/api/diagrams/[id]/chat/route.ts`
- **dynamic** (1 connections) — `src/app/api/diagrams/[id]/chat/route.ts`
- **encoder** (1 connections) — `src/app/api/diagrams/[id]/chat/route.ts`
- **Outcome** (1 connections) — `src/app/api/diagrams/[id]/chat/route.ts`
- **runtime** (1 connections) — `src/app/api/diagrams/[id]/chat/route.ts`
- **src_server_chat_pipeline_busy_message** (1 connections)

## Relationships

- [서버 액션과 작업 화면](서버_액션과_작업_화면.md) (8 shared connections)
- [대화 응답 문구와 스트림 정리](대화_응답_문구와_스트림_정리.md) (7 shared connections)
- [AI 서버 설정과 상태 점검](AI_서버_설정과_상태_점검.md) (3 shared connections)
- [인증과 외부 라이브러리](인증과_외부_라이브러리.md) (3 shared connections)
- [DB와 메시지 저장](DB와_메시지_저장.md) (3 shared connections)
- [건너뜀 집계](건너뜀_집계.md) (2 shared connections)
- [설계 문서와 계획](설계_문서와_계획.md) (1 shared connections)

## Source Files

- `src/app/api/diagrams/[id]/chat/route.ts`
- `src/server/chat/events.ts`
- `src/server/chat/pipeline.ts`

## Audit Trail

- EXTRACTED: 44 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*