---
sidebar_position: 3
title: 아키텍처
---

# 아키텍처

InfraSketch 는 Next.js 15 (App Router) 하나로 화면과 서버를 함께 띄웁니다. 데이터는 PostgreSQL 에 Drizzle ORM 으로 저장합니다.

## 폴더 구성

| 폴더 | 역할 |
| --- | --- |
| `src/app` | 라우트. `(app)` 은 로그인 후 화면, `(auth)` 는 로그인·가입·비밀번호 재설정, `api` 는 대화·인증·AI 상태 API |
| `src/ui` | 작업 화면 컴포넌트. 사이드바, 오른쪽 패널(대화·설명·이력), 대화 입력과 체크리스트 |
| `src/canvas` | React Flow(`@xyflow/react`) 캔버스. 노드·영역·연결선 그리기, ELK.js 자동 배치(`layout.ts`), 애니메이션 |
| `src/domain` | 구성도 규칙. 변경 명령 스키마(`commands.ts`), 명령 적용(`apply.ts`), 노드 종류 목록(`catalog.ts`), 빠진 정보 계산(`missing.ts`) |
| `src/server` | 서버 로직. 대화 파이프라인(`chat/`), AI 연동(`llm/`), 프로젝트·버전 저장, 인증 |
| `src/db` | Drizzle 스키마와 마이그레이션 |

`domain` 은 서버와 브라우저가 함께 쓰는 순수 로직이라 DB 나 네트워크에 의존하지 않습니다.

## 대화 한 차례의 흐름

사용자가 대화를 보내면 `POST /api/diagrams/[id]/chat` 이 받고, `server/chat/pipeline.ts` 의 `runChatTurn` 이 한 차례를 처리합니다. 응답은 **한 줄에 이벤트 하나(JSON Lines)** 로 스트리밍됩니다.

```text
브라우저 (ui/chat/useChatTurn.ts)
  │ POST /api/diagrams/{id}/chat  { text }
  ▼
route.ts ── 로그인·본문·소유권 확인 (401 / 400 / 404)
  │
  ▼
runChatTurn ── 구성도별 잠금 (이미 진행 중이면 409)
  1. 최신 버전 상태와 최근 대화 기록을 읽는다
  2. @멘션을 노드 ID 로 풀고, 사용자 메시지를 저장한다
  3. Clef 로 의도를 분류한다 (구조 변경 / 질문 / 빠진 정보 답변 / 이력 / 기타)
  4. 의도에 맞는 프롬프트로 Qwen 을 스트리밍 호출한다
       ├ 구조 변경 경로: JSON Lines 를 줄 단위로 파싱
       │    → parseCommand(스키마 검증) → applyCommand(상태 적용)
       │    → 성공하면 cmd 이벤트, 실패하면 skip 이벤트
       └ 답변 경로: <think> 를 지운 글을 answer 이벤트로 흘림
  5. 적용된 명령이 있으면 새 버전을 만든다
  6. 빠진 정보 수를 다시 계산하고 응답 메시지를 저장한 뒤 done 이벤트
```

이벤트 종류는 `server/chat/events.ts` 의 `ChatEvent` 에 정의돼 있습니다.

| 이벤트 | 의미 |
| --- | --- |
| `start` | 차례 시작, 분류된 의도 |
| `status` | 진행 단계 (`thinking` → `drawing` 또는 `answering`) |
| `say` | AI 가 남기는 한 줄 안내 |
| `cmd` | 서버에서 적용에 성공한 변경 명령. 브라우저는 이걸 받아 캔버스에 바로 그립니다 |
| `skip` | 깨진 줄이나 거부된 명령 |
| `answer` | 질문에 대한 답변 글 조각 |
| `open_history` | 이력 탭 열기 요청 |
| `error` | 사용자에게 보여 줄 오류 문구 (AI 미설정, 시간 초과, 진행 중인 차례 등) |
| `done` | 차례 끝. 새 버전 번호, 적용·건너뜀·빠진 정보 수 |

## 변경 명령

AI 는 구성도를 직접 그리지 않고 **작은 변경 명령**을 연달아 내보냅니다. 명령은 `domain/commands.ts` 의 zod 스키마로 검증합니다.

| 명령 | 하는 일 |
| --- | --- |
| `add_group` | 영역(VPC, 서브넷, 외부 서비스 묶음 등) 추가 |
| `add_node` / `update_node` / `remove_node` | 노드 추가·수정·삭제 |
| `add_edge` / `update_edge` / `remove_edge` | 연결 추가·수정·삭제 |
| `set_assumption` | 구조를 정한 가정(환경, 규모, 이중화 등) 기록 |

명령이 스키마에 맞지 않거나 없는 노드를 가리키면 버리고 `skip` 이벤트로 알립니다. 차례 전체가 멈추지는 않습니다.

## AI 연동과 장애 대응

- **Qwen** (`server/llm/qwen.ts`): 대화 응답과 변경 명령처럼 글을 만드는 일을 모두 맡습니다. OpenAI 호환 API 를 씁니다.
- **Clef** (`server/llm/clef.ts`): 글을 만들지 않고 선택지 확률만 돌려주는 판정 모델입니다. 의도 분류에 씁니다.

Qwen 설정이 없으면 차례는 "AI 서버에 연결할 수 없어요" 오류로 바로 끝납니다. Clef 가 없거나 확신도가 낮으면 의도 없이 일반 경로로 넘어가서 기능이 멈추지 않습니다. 한 차례에는 시간 제한이 있고, 넘으면 중단 상태로 저장합니다.

## 데이터 모델

`src/db/schema.ts` 의 주요 테이블입니다.

| 테이블 | 내용 |
| --- | --- |
| `users`, `accounts`, `password_reset_tokens` | 회원과 인증 |
| `projects` | 사용자별 프로젝트 |
| `diagrams` | 프로젝트 안의 구성도 |
| `messages` | 구성도별 대화 기록 (메타에 의도·적용 수·버전 등) |
| `diagram_versions` | 구성도 상태 스냅샷. AI 변경 한 차례마다 버전 하나가 생기고, 이력 탭에서 비교하고 되돌립니다 |

## 더 보기

모듈끼리 실제로 어떻게 연결되는지는 상단 메뉴의 **코드 그래프**에서 볼 수 있습니다. 코드에서 자동으로 만든 문서입니다.
