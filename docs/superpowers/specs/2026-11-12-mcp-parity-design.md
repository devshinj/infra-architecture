# MCP 그리기를 앱 대화와 맞추기 — 설계

날짜: 2026-11-12 · 브랜치: feat/mcp-parity (fix/followups-1112 7da35e8 에서 땀)

## 배경

Claude Code 로 InfraSketch MCP(`/api/mcp`)를 써서 VMS 구성도를 그려 본 뒤 앱 대화(Qwen 파이프라인)와 비교했다.
명령 검사·적용·차례 끝 정리·코드 규칙 경고·빠진 정보는 같은 코드를 쓴다. 다른 것은 앱 대화가 덧붙이는 보조(되묻기, 첫 그리기 뒤 흐름 자동 제안, 용어 사전 주입)와, 가이드·규칙 글의 빈틈이다.

## 사용자가 정한 것 (바꾸지 않는다)

| 항목 | 결정 |
|---|---|
| A 되묻기 | get_guide 에 「그리기 전에 물을 것」 절을 싣는다. 질문·선택지·가정 key 는 `src/domain/clarify.ts`·`assumptions.ts` 에서 만들어 싣는다(손으로 복사하지 않는다). 판단은 Claude Code 가 한다. 새 도구는 만들지 않는다. 가정 key 안내도 실제 스키마(아무 key 가능)에 맞춘다. |
| B 흐름 | MCP 가이드에만 「빈 구성도에 처음 그릴 때는 흐름 3~5개도 add_flow 로 함께」 규칙을 넣는다. 앱 Qwen 규칙(DRAW_RULES)은 바꾸지 않는다. 서버 자동 제안·새 도구는 만들지 않는다. |
| C-1 영상 전달물 | medium 이 video·media 인 연결은 망을 넘어도 payload 를 요구하지 않는다(direction 만). 규칙 글·빠진 정보 계산을 함께 고친다. 데이터 모델(payload enum)은 그대로. |
| C-2 WebRTC 방향 | 용도로 나눈다: 보기만 하는 원격 시청은 영상이 흐르는 방향(media_server → 단말, 망을 넘으면 direction one_way), 서로 주고받는 통화·회의는 단말 → media_server(망을 넘으면 direction two_way). |
| C-3 관제 화면 | (C 묶음에 포함) 스트리밍 분배 서버(media_server)를 두는 대규모 구성이면 관제 화면은 그 분배 서버에서 영상을 받는다. |
| D 영상관제 패턴 | `src/domain/patterns.ts` 에 패턴 하나 추가 → Qwen 프롬프트와 MCP 가이드 둘 다 반영. VMS 핵심(녹화·VMS 관리·저장)은 **영상망**, 관제 화면·요원은 통합관제망(방화벽), 원격 시청은 DMZ 미디어 서버, 업무망은 망연계. |
| D 후속 (같은 날) | 패턴을 둘로 나눈다: 「영상관제(지자체 통합관제)」(위 배치)와 「영상관제(일반 시설)」(통합관제망·망연계 없이 영상망 하나, 사무망은 방화벽, 밖은 VPN·DMZ 미디어 서버). 관제 화면은 녹화서버(대규모면 스트리밍 분배 서버)에서 영상을 받고, 관제 요원은 VMS 에 접속한다고 나눠 쓴다. VMS 는 작은 구성이면 video_recorder 가 겸하고, 녹화서버가 여러 대인 대규모면 VMS 관리서버를 app_server 로 따로 둔다(카탈로그 그대로). |
| E 이름 | `create_project` 에 선택 인자 `diagram_name`(없으면 "새 구성도"). 이름 검사(깨진 글자 U+FFFD·제어 문자 거절)는 서버 공용(`src/server/projects.ts` cleanName) — 앱 화면과 MCP 모두. |
| F 용어 사전 | 새 MCP 도구 `lookup_terms(text)` — 앱 대화와 같은 `matchUserTerms` 결과. 가이드에 「그리기 전에 요청 글로 한 번 부른다」를 적는다. |
| 가이드 길이 | `GUIDE_MAX` 를 20000 → 24000 으로 올린다. 기본(seed) 망 지식은 줄이지 않는다. |

## 범위 밖

- 경고 점검의 Clef db_exposed 판정·Qwen 문구를 MCP 에 붙이는 것.
- 같은 망 안 client → 서버 연결의 `no_firewall` 경고(앱과 공통 규칙 품질 문제).
- 문서 사이트(feat/docs-site) 동기화 — main 에 합친 뒤 별도로.
