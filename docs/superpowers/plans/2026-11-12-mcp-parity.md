# MCP 그리기를 앱 대화와 맞추기 — 구현 계획

Spec: `docs/superpowers/specs/2026-11-12-mcp-parity-design.md`
작업 폴더: `C:\Users\devsh\Desktop\new-study\infra-mcp-parity` (브랜치 feat/mcp-parity)

## Global Constraints

- 모든 사람에게 보이는 글(규칙·가이드·오류 문구·주석)은 한국어, 이 저장소의 말투(쉬운 말, "~해요"는 MCP 안내서, "~한다"는 규칙 글)를 따른다. 제품명만 원어.
- 아래 Task 의 **따옴표 안 글은 글자 그대로** 쓴다.
- 규칙 글은 `src/server/drawing/rules.ts` 한 곳에만 쓴다(Qwen SYSTEM_PROMPT 와 MCP get_guide 가 함께 쓴다). MCP 전용 글은 `src/server/mcp/read.ts` 에만.
- `tests/unit/__snapshots__/prompt.test.ts.snap` 은 규칙·패턴 글을 바꾼 Task 에서 `npx vitest run -u tests/unit/prompt.test.ts` 로 갱신하고, 바뀐 줄이 그 Task 의 글 변경뿐인지 diff 로 확인한다.
- 단위 테스트: `npm test`. 통합 테스트(로컬 test DB, 이미 동작함): `npx vitest run --project integration <파일>`. 각 Task 끝에 `npm test` 전체와 바꾼 영역의 통합 테스트를 돌린다. `npm run lint` 도 통과해야 한다.
- 커밋 메시지는 이 저장소 형식(`feat(mcp): …`, `fix(rules): …` 처럼 한국어 요약). 끝에 `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- 다른 폴더(원래 저장소 `infra-architecture`)는 건드리지 않는다. `git stash` 금지.

---

### Task 1: 영상·미디어 연결 규칙과 가이드 길이 상한

**Files:** `src/domain/missing.ts`, `src/server/drawing/rules.ts`, `src/server/mcp/read.ts`, `tests/unit/missing.test.ts`, `tests/unit/drawing-rules.test.ts`, `tests/unit/mcp-guide.test.ts`, `tests/unit/__snapshots__/prompt.test.ts.snap`

1. `src/domain/missing.ts` 의 `requiredKeysForEdge`: 망 경계를 넘는 연결(`crossesBoundary`)이라도 `edge.medium` 이 `"video"` 또는 `"media"` 이면 `"payload"` 는 요구하지 않고 `"direction"` 만 더한다. 그 밖은 지금처럼 `"payload", "direction"`. 함수 위 주석에 "영상·음성 스트림은 api·file 이 아니라 전달물을 묻지 않는다(방향만)." 를 덧붙인다.
2. `src/server/drawing/rules.ts` 의 `DRAW_RULE_GROUPS` 에서 아래 네 줄을 글자 그대로 바꾼다(다른 줄은 그대로).
   - "서로 다른 망을 잇는 통신은…" 줄 →
     `- 서로 다른 망을 잇는 통신은 방화벽(firewall)·망연계 솔루션(network_link)·VPN 노드를 거치게 그리고, 망을 넘는 연결에는 payload(api 또는 file)와 direction(one_way 또는 two_way)을 쓴다. 단, medium 이 video·media 인 영상·음성 연결에는 payload 를 쓰지 않고 direction 만 쓴다. 같은 망 안의 연결에는 사용자가 말하지 않은 payload·direction 을 쓰지 않는다.`
   - "medium(통신 수단)은 보통의 IP 통신이 아닐 때만…" 줄의 끝 문장 `video·media 연결은 영상·음성이 흐르는 방향으로 그린다.` →
     `video 연결은 영상이 흐르는 방향으로 그리고, media 연결의 방향은 아래 WebRTC 규칙을 따른다.`
   - "카메라(camera)는 video_recorder…" 줄 →
     `- 카메라(camera)는 video_recorder(NVR·VMS)에 video 로 잇고, 관제 화면(control_display)은 video_recorder 에서 영상을 받는다. 녹화서버 여러 대의 영상을 스트리밍 분배 서버(media_server)로 모아 나눠 주는 대규모 구성이면 관제 화면은 그 분배 서버에서 받는다. 카메라를 관제 화면이나 인터넷에 바로 잇지 않는다. 밖에서 볼 때는 경계 구역의 media_server 를 거친다.`
   - "WebRTC 는 연결 두 개로 그린다…" 줄 →
     `- WebRTC 는 연결 두 개로 그린다: 단말 → signaling_server(request, 예: "WSS 443")와 media 연결 하나. 서로 주고받는 통화·회의는 단말 → media_server(medium media, 망을 넘으면 direction two_way)로, 보기만 하는 원격 시청은 영상이 흐르는 방향인 media_server → 단말(medium media, 망을 넘으면 direction one_way)로 그린다. media 연결은 L7 로드밸런서·WAF·API 게이트웨이·CDN 을 거치지 않는다. 단말끼리 직접 잇는 media 는 1:1 통화일 때만 그린다.`
3. `src/server/mcp/read.ts` 의 `GUIDE_MAX` 를 `24000` 으로. `tests/unit/mcp-guide.test.ts` 의 20000·"2만 자" 기대값과 테스트 이름을 24000·"2만4천 자" 로 맞춘다(아주 큰 지식 테스트의 줄임 동작 기대는 그대로).
4. 테스트:
   - `tests/unit/missing.test.ts`: 망을 넘는 `medium: "video"` request 연결은 빠진 정보에 `direction` 은 있고 `payload` 는 없다. `medium: "media"` 도 같다. 망을 넘는 보통 연결은 지금처럼 둘 다 있다(기존 테스트가 있으면 그대로 통과).
   - `tests/unit/drawing-rules.test.ts`: `DRAW_RULES` 에 "direction 만 쓴다", "보기만 하는 원격 시청은", "스트리밍 분배 서버(media_server)" 가 들어 있다.
   - 스냅숏 갱신(Global Constraints).

### Task 2: 영상관제(VMS) 구성 패턴

**Files:** `src/domain/patterns.ts`, `tests/unit/patterns.test.ts`, `tests/unit/__snapshots__/prompt.test.ts.snap`

1. `PATTERNS` 배열 끝(`external` 다음)에 하나 추가:
   - `id: "video-surveillance"`
   - `name: "영상관제(VMS)"`
   - `summary: "카메라·녹화서버(NVR)·VMS 관리서버·영상 저장소는 영상망에 두고, 카메라는 녹화서버로 RTSP 영상을 보낸다. 관제 화면과 관제 요원은 통합관제망에 두고 방화벽을 거쳐 VMS 와 영상에 닿는다. 밖에서 보는 원격 시청은 DMZ 의 미디어 서버가 방화벽을 거쳐 영상망의 영상을 받아 내보내고, 업무망 연계는 망연계 솔루션을 거친다."`
2. `tests/unit/patterns.test.ts` 에 기존 테스트 형식대로: `patternPromptBlock()` 이 `"- 영상관제(VMS): "` 줄을 담고, id 가 겹치지 않는다(기존에 그런 테스트가 있으면 그대로 통과만 확인).
3. 스냅숏 갱신. `tests/unit/mcp-guide.test.ts` 의 길이 테스트(24000)가 통과하는지 확인.

### Task 3: 이름 검사와 create_project 의 첫 구성도 이름

**Files:** `src/server/projects.ts`, `src/server/mcp/read.ts`, `src/server/mcp/server.ts`, `tests/integration/projects.test.ts`, `tests/integration/mcp-route.test.ts` (또는 MCP create 를 다루는 기존 통합 테스트 파일), `tests/unit/mcp-guide.test.ts`

1. `src/server/projects.ts` 의 `cleanName`: trim 한 뒤 길이 검사 전에, 이름에 U+FFFD(`\uFFFD`)·제어 문자(`\p{Cc}`)·줄/문단 구분자(`\u2028`, `\u2029`)가 있으면 `ValidationError("이름에 쓸 수 없는 글자(깨진 글자·제어 문자)가 있어요")` 를 던진다. 정규식은 `/[\uFFFD\p{Cc}\u2028\u2029]/u`. cleanName 을 쓰는 프로젝트·구성도 만들기·이름 바꾸기 모두에 적용된다.
2. `src/server/mcp/read.ts` 의 `createProjectForMcp(userId, name, diagramName?)`: `diagramName` 이 주어지면 그 이름으로, 없으면 지금처럼 `FIRST_DIAGRAM_NAME`("새 구성도")으로 첫 구성도를 만든다.
3. `src/server/mcp/server.ts` 의 `create_project` inputSchema 에 `diagram_name: z.string().optional().describe("첫 구성도 이름(1~60자, 비우면 \"새 구성도\")")` 를 더하고 넘긴다. 도구 설명(describe 의 앞 글)은 `"새 프로젝트를 만들어요. 첫 구성도(버전 1)가 함께 생기고, 그 이름은 diagram_name 으로 정해요."` 로 바꾼다.
4. `src/server/mcp/read.ts` `HOW_TO_USE` 의 1번 줄을 글자 그대로 바꾼다:
   `1. list_projects 로 프로젝트와 구성도를 찾아요. 없으면 create_project 나 create_diagram 으로 만들어요. create_project 는 첫 구성도를 함께 만드니 그 이름은 diagram_name 으로 정하고, 같은 프로젝트에 create_diagram 을 또 부르지 않아요(빈 구성도가 남아요).`
5. 테스트:
   - 통합 `projects.test.ts`: 프로젝트 만들기와 구성도 이름 바꾸기에서 `"영\uFFFD상"`, `"a\u0007b"` 는 위 문구로 거절, 보통 한글 이름은 그대로 된다.
   - 통합(MCP): `create_project` 에 `diagram_name: "VMS 구성도"` 를 주면 첫 구성도 이름이 그것이고, 안 주면 "새 구성도". 깨진 이름은 isError 결과로 위 문구.
   - `mcp-guide.test.ts`: 가이드에 "diagram_name" 이 들어 있다.

### Task 4: lookup_terms 도구

**Files:** `src/server/mcp/read.ts`, `src/server/mcp/server.ts`, `tests/integration/mcp-route.test.ts`, `tests/unit/mcp-guide.test.ts`

1. `src/server/mcp/read.ts` 에 `lookupTermsForMcp(userId: string, text: string): Promise<MatchedTerm[]>` — `matchUserTerms`(`src/server/glossary.ts`) 를 그대로 부른다(앱 대화와 같은 매칭·상한 6개).
2. `src/server/mcp/server.ts` 에 도구 등록(`readOnlyHint: true`):
   - 이름 `lookup_terms`
   - 설명 `describe("요청 글에 나온 말을 이 계정의 용어 사전에서 찾아 뜻을 돌려줘요(앱 대화와 같은 방식, 6개까지).")`
   - 입력 `{ text: z.string().min(1).max(2000).describe("사용자 요청 글") }`
   - 결과: 찾으면 `ok(\`용어 ${n}개를 찾았어요. 그릴 때 이 뜻을 따라요.\`, terms)`, 없으면 `ok("용어 사전에 맞는 말이 없어요.", [])`. 오류는 다른 읽기 도구처럼 `guarded(..., READ_FAILED, ...)`.
3. `HOW_TO_USE` 의 1번 줄 다음에 새 줄을 넣고 뒤 번호를 하나씩 민다:
   `2. 그리기 전에 사용자 요청 글로 lookup_terms 를 한 번 불러요. 나온 말은 그 뜻대로 그려요(예: 사내에서 정한 장비·망 이름).`
4. 테스트:
   - 통합 `mcp-route.test.ts`: 도구 목록 테스트를 10개(`lookup_terms` 추가)로, 테스트 이름도 "도구 10개" 로. 기본 제공 용어(`src/domain/glossary-seed*.ts` 에 있는 용어 하나)를 넣은 요청 글로 부르면 그 용어와 정의가 돌아오고, 맞는 말이 없으면 빈 배열과 위 문구.
   - `mcp-guide.test.ts`: 가이드에 "lookup_terms" 가 들어 있다.

### Task 5: 그리기 전에 물을 것·첫 그리기 흐름·가정 key 안내

**Files:** `src/domain/clarify.ts`, `src/server/mcp/read.ts`, `tests/unit/clarify.test.ts`, `tests/unit/mcp-guide.test.ts`

1. `src/domain/clarify.ts` 의 `Fork` 에 `when: string`(사람이 읽는 "묻는 때") 을 더하고 6개에 글자 그대로 채운다:
   - environment: `빈 구성도에 서비스·시스템 전체를 처음 그리는데, 요청에 클라우드·IDC·온프레미스·하이브리드처럼 올릴 곳이 없을 때`
   - call_mode: `화상·영상 통화·회의·라이브 방송을 그리는데, 1:1·다자간·방송형 가운데 무엇인지 말하지 않았을 때`
   - llm_serving: `LLM·챗봇·RAG·AI 에이전트를 그리는데, 외부 API 인지 사내 서빙인지 말하지 않았을 때`
   - video_site: `CCTV·영상 관제·VMS·NVR 을 그리는데, 지자체 통합관제인지 일반 시설인지 말하지 않았을 때`
   - iot_link: `IoT·센서·웨어러블 기기를 그리는데, 기기가 무엇을 거쳐 서버에 닿는지(BLE·게이트웨이·직접) 말하지 않았을 때`
   - net_separation: `아직 망을 그리지 않았고 요청에 업무망·내부망과 인터넷·클라우드·DMZ 가 함께 나오는데, 망분리 대상 기관인지 말하지 않았을 때`
2. 같은 파일에 export:
   - `CLARIFY_KEYS: readonly string[]` — FORKS 의 key 를 순서대로.
   - `clarifyGuideLines(): string[]` — 갈림길마다 한 줄:
     `` `- ${question} 가정 key=${key}. 선택지: ${choices.join(" / ")}. 묻는 때: ${when}.` `` 에, settledBy 가 있으면 끝에 `` ` 구성도에 ${settledBy.join("·")} 노드가 있으면 이미 정해진 것이라 묻지 않아요.` `` 를 붙인다. 선택지는 `choicesOf(key)`(= ASSUMPTION_CHOICES) 를 쓴다.
3. `src/server/mcp/read.ts`:
   - `HOW_TO_USE` 뒤에 새 절 `CLARIFY` 를 넣는다(`buildGuide` 의 head 순서: INTRO, HOW_TO_USE, CLARIFY, GLOSSARY, …). 글:
     ```
     ## 그리기 전에 물을 것

     앱 대화는 아래 갈림길이 요청에 걸리면 그리기 전에 사용자에게 물어요. MCP 로 그릴 때도 같은 때에 사용자에게 물어요. 한 번에 ${CLARIFY_MAX}개까지 묻고, 고르기 어려우면 "${CLARIFY_AUTO}"를 고를 수 있게 해요.
     - 사용자가 고르면 그 값을 set_assumption(key, 고른 값)으로 먼저 보내고 그 값대로 그려요.
     - 사용자가 맡기면 알맞게 정하고, 정한 값을 set_assumption 으로 밝혀요.
     - 그 key 의 가정이 이미 있으면 묻지 않아요.

     ${clarifyGuideLines().join("\n")}
     ```
   - `HOW_TO_USE` 의 「지켜야 할 것」 목록 끝에 한 줄:
     `- 빈 구성도에 처음 그릴 때는 흐름 3~5개도 add_flow 로 함께 보내요. 사용자가 시작하는 흐름(origin user)과 시스템 흐름(origin system)을 섞어요. 앱 대화는 처음 그린 뒤 흐름을 자동으로 제안하지만 MCP 로 그리면 그렇지 않아서예요. 그리기 규칙의 "요청에 흐름 이야기가 없으면 흐름 명령을 쓰지 않는다"는 이미 그린 구성도를 고칠 때 이야기예요.`
   - `GLOSSARY` 의 가정 key 줄(`- "environment|scale|redundancy|deploy|replication|external": 이 가운데 하나를 key 로 써요.`)을 바꾼다:
     `` `- "environment|scale|redundancy|deploy|replication|external": 이 가운데 하나를 key 로 써요. '그리기 전에 물을 것'의 key(${CLARIFY_KEYS.filter((k) => k !== "environment").join("·")})와 망연계 거절 no_link:<망 id>--<망 id> 도 key 로 써요.` ``
4. 테스트:
   - `tests/unit/clarify.test.ts`: `clarifyGuideLines()` 가 6줄이고 각 줄이 그 key 와 모든 선택지를 담는다. video_site 줄에 "지자체 통합관제센터" 와 "camera·video_recorder" 가 들어 있다. `CLARIFY_KEYS` 가 6개다. 기존 detectForks 테스트는 그대로 통과.
   - `tests/unit/mcp-guide.test.ts`: 가이드에 "## 그리기 전에 물을 것", "가정 key=video_site", "흐름 3~5개", "no_link:" 가 들어 있고, seed 지식으로 24000자 이하·줄임 안내 없음 테스트가 그대로 통과한다.
