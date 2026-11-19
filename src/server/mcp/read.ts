import { desc, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { diagramVersions } from "@/db/schema";
import { CLARIFY_AUTO, CLARIFY_KEYS, CLARIFY_MAX, clarifyGuideLines } from "@/domain/clarify";
import { computeMissing, type MissingItem } from "@/domain/missing";
import type { NetworkKnowledge } from "@/domain/network";
import { emptyState, type DiagramState, type Warning } from "@/domain/types";
import { mergeWarnings } from "@/domain/warnings";
import { baseRuleBlock, COMMAND_EXAMPLES, DRAW_RULES, gradeRuleLines, KIND_BLOCK, networkTypeLines, patternBlock, userRuleLines } from "@/server/drawing/rules";
import { GRADE_LABELS } from "@/domain/network";
import { listFlows, type StoredFlow } from "@/server/flows";
import type { MatchedTerm } from "@/domain/glossaryMatch";
import { matchUserTerms } from "@/server/glossary";
import { getNetworkKnowledge } from "@/server/network";
import {
  createDiagram,
  createProjectWithDiagram,
  getOwnedDiagram,
  listDiagramsWithVersions,
  listProjectsWithVersions,
} from "@/server/projects";
import { getLatestState } from "@/server/versions";

import { diagramUrl } from "./url";

const FIRST_DIAGRAM_NAME = "새 구성도";
const VERSION_LIST_LIMIT = 50;
const GUIDE_MAX = 24000;

const INTRO = `# InfraSketch 그리기 안내서

InfraSketch 는 인프라 구성도를 그리고 고치는 웹 도구예요. 이 연결(MCP)로 보내는 명령이 사용자의 구성도를 바꾸고, 사용자는 브라우저에서 같은 구성도를 바로 봐요.
구성도는 영역(그룹)·노드(서버 등)·연결(edge)·가정(assumption)과, 요청 하나가 연결을 차례로 지나는 길인 흐름(flow)으로 이뤄져요.`;

const HOW_TO_USE = `## 쓰는 순서

1. list_projects 로 프로젝트와 구성도를 찾아요. 없으면 create_project 나 create_diagram 으로 만들어요. create_project 는 첫 구성도를 함께 만드니 그 이름은 diagram_name 으로 정하고, 같은 프로젝트에 create_diagram 을 또 부르지 않아요(빈 구성도가 남아요).
2. 그리기 전에 요청마다 사용자 요청 글로 lookup_terms 를 불러요. 나온 말은 그 뜻대로 그려요(예: 사내에서 정한 장비·망 이름). 요청이 '그리기 전에 물을 것'의 갈림길에 걸리면 그리기 전에 먼저 물어요.
3. get_diagram 으로 구성도를 읽어요. 이때 받은 version 이 base_version 이에요.
4. apply_commands 로 바꿀 부분만 보내요. base_version 에는 get_diagram 의 version 을 그대로 써요.
5. 먼저 dry_run 으로 확인할 수 있어요. dry_run 은 검사만 하고 저장하지 않아요.
6. 구성도가 바뀌었으면 get_diagram 으로 다시 읽고 고쳐요. 그사이 사용자가 브라우저에서 고쳤을 수 있어서, 구성을 바꾸는 명령은 버전이 다르면 저장되지 않아요.

## 명령 보내는 방식

commands 는 명령 하나하나를 **배열의 원소**로 담은 목록이에요. 아래 예처럼 한 줄에 하나씩 쓴 글을 통째로 문자열로 보내지 말고, 각 명령을 JSON 객체로 만들어 배열에 넣어요.
명령 가운데 하나라도 틀리면 아무것도 저장되지 않고, 어느 명령이 왜 틀렸는지 알려 줘요. 고쳐서 전부 다시 보내요.
말하기 명령이나 서버 전용 명령은 없어요. 사용자에게 할 말은 대화에서 직접 해요.

## 지켜야 할 것

- 모르는 값은 비워 둬요. IP·hostname·스펙·소프트웨어(sw)·버전·포트·OS 처럼 사용자가 알려 주지 않은 값은 지어내지 않고 null 로 두거나 쓰지 않아요. "웹 서버", "WAS" 처럼 종류만 들었으면 sw 를 제품명으로 채우지 않아요. 기존 노드를 복제할 때만 그 노드의 값을 그대로 써요.
- 사용자가 제품을 말했으면(예: "DB 는 오라클", "웹 서버는 Nginx") 그 노드의 attrs.sw 에 써요. sub 에도 적을 수 있지만 sub 에만 적으면 빠진 정보에 소프트웨어가 비어 있다고 남아요.
- "~가 뭐야? 필요하면(쓸 만하면) 추가해 줘"처럼 질문과 요청이 함께 있으면 추가해 달라는 요청이에요. 짧게 설명하고 요청한 것을 그려요. 이 구성에 맞지 않아 보이면 그린 뒤에 그 이유를 알려요.
- 요청한 것만 바꿔요. 요청에 없는 이중화·로드밸런서·DNS·모니터링 같은 노드와 영역은 만들지 않고, 요청과 관계없는 기존 연결은 지우거나 다시 잇지 않아요. '자주 쓰는 구성 패턴'은 빈 구성도에 새로 그릴 때의 기준이에요. 더 넣으면 좋겠다고 판단한 것은 그리지 말고 사용자에게 제안해요.
- get_diagram 의 warnings 와 apply_commands 결과의 새 경고는 사용자에게 알릴 참고 정보예요. 사용자가 경고를 말하거나 고쳐 달라고 하지 않았으면 경고를 없애려고 구성을 바꾸지 않아요.
- 흐름은 버전과 따로 저장돼요. 흐름만 바꿀 때는 base_version 검사를 받지 않아요(지금 구성으로 검사해요). 구성도 버전을 되돌려도 흐름은 그대로이고, 연결이 사라지면 흐름이 끊겨요. 흐름을 고치기 전에 get_diagram 으로 최신 흐름(flows)을 읽고, 남기는 단계의 글은 그대로 써요.
- 구성도를 바꿔 흐름이 끊겨도 흐름을 일부러 고치지 않아요. 결과의 끊긴 흐름 목록을 사용자에게 알려요.
- 이 연결은 지우기·망 지식 고치기·계정 설정은 못 해요.
- 빈 구성도에 처음 그릴 때는 흐름 3~5개도 add_flow 로 함께 보내요. 사용자가 시작하는 흐름(origin user)과 시스템 흐름(origin system)을 섞어요. 앱 대화는 처음 그린 뒤 흐름을 자동으로 제안하지만 MCP 로 그리면 그렇지 않아서예요. 그리기 규칙의 "요청에 흐름 이야기가 없으면 흐름 명령을 쓰지 않는다"는 이미 그린 구성도를 고칠 때 이야기예요.`;

const CLARIFY = `## 그리기 전에 물을 것

앱 대화는 아래 갈림길이 요청에 걸리면 그리기 전에 사용자에게 물어요. MCP 로 그릴 때도 같은 때에 사용자에게 물어요. 한 번에 ${CLARIFY_MAX}개까지 묻고, 고르기 어려우면 "${CLARIFY_AUTO}"를 고를 수 있게 해요.
- 사용자가 고르면 그 값을 set_assumption(key, 고른 값)으로 먼저 보내고 그 값대로 그려요.
- 사용자가 맡기면 알맞게 정하고, 정한 값을 set_assumption 으로 밝혀요.
- 그 key 의 가정이 이미 있으면 묻지 않아요.

${clarifyGuideLines().join("\n")}`;

const GLOSSARY = `## 용어 풀이

아래 규칙 글에 나오는 말이 이 연결에서는 이렇게 읽혀요.

- "채워야 할 정보": get_diagram 결과의 missing 목록이에요. 사용자가 값을 알려 주면 update_node(attrs)나 update_edge 로 그 값만 반영해요. 목록의 unknown 이 표시된(사용자가 모른다고 한) 칸은 목록에서 빠져 있어요.
- "흐름:" 목록: get_diagram 결과의 flows 예요. 흐름을 고치거나 지울 때 여기 있는 id 와 단계의 short·text 를 그대로 써요.
- "(확정)": get_diagram 결과에서 가정(assumptions)의 confirmed 가 true 인 것, 그리고 zones 의 typeSource 가 "user" 인 망 종류예요. 이런 가정과 망 종류는 바꾸지 않아요. typeSource 가 "ai" 인 것은 이전에 추정한 값이라 근거가 있으면 고칠 수 있어요.
- "요약": get_diagram 결과의 state(assumptions·zones 포함)예요. 이미 있는 구성은 여기서 읽어요.
- "망 짝 규칙": 아래 '망 지식' 절의 등급 규칙과 기관 규칙이에요. 두 망 종류를 잇는 방법(방화벽·망연계·잇지 않음)을 정하며, 기관 규칙이 있으면 그것이 먼저예요.
- "망 종류:" 목록: 아래 '망 지식' 절의 망 종류예요. set_zone_type 의 type 에는 이 목록의 key 만 써요. zones 의 type 이 null 이면 종류가 없거나 지식에 없는 종류예요.
- guess 가 붙은 망연계 노드: get_diagram 결과의 guessedLinks 에 노드 id 가 나와요. 도구가 규칙으로 넣은 추정이라 사용자가 확인하기 전까지는 바뀔 수 있어요.

## 명령 예의 자리표시

- <KIND>, <GROUP_KIND>, <EDGE_KIND>: 아래 'KIND 허용값' 목록에서 하나를 골라 그 글자 그대로 써요.
- "영문-소문자-id": 영문 소문자·숫자·하이픈으로 직접 정하는 id 예요(예: was-1). 노드·그룹·연결 id 는 서로 겹치면 안 돼요.
- e-<from>-<to>: 연결 id 를 정하는 습관 예일 뿐이에요. 양 끝 id 로 e-web-1-was-1 처럼 지어요.
- "environment|scale|redundancy|deploy|replication|external": 이 가운데 하나를 key 로 써요. '그리기 전에 물을 것'의 key(${CLARIFY_KEYS.filter((k) => k !== "environment").join("·")})와 망연계 거절 no_link:<망 id>--<망 id> 도 key 로 써요.
- "상위 그룹 id 또는 null"·"그룹 id 또는 null": 이미 있는 그룹 id 를 쓰거나, 최상위면 null 이에요.
- "망 종류 key 또는 null": 망 지식의 key 를 쓰거나, 종류를 지우려면 null 이에요.
- ... 와 "..." 같은 말줄임과 예시 값(Tomcat 10 등)은 실제 값으로 바꿔 써요.`;

const networkSection = (types: string[], rules: string[], base: string[]) =>
  [
    `망 종류:\n${types.join("\n")}`,
    `등급 규칙(기관 규칙·기본 짝 규칙이 없을 때):\n${gradeRuleLines().join("\n")}`,
    ...base,
    `기관 규칙:\n${rules.length ? rules.join("\n") : "없음"}`,
  ].join("\n\n");

/** 별명을 뺀 망 종류 줄. */
const plainTypeLines = (k: NetworkKnowledge): string[] =>
  Object.values(k.types)
    .sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0))
    .map((t) => `${t.key} ${JSON.stringify(t.name)} 등급=${GRADE_LABELS[t.grade]}${t.separated ? " 망분리 대상" : ""}`);

/**
 * 망 지식 절. 안내서가 한도를 넘을 것 같으면 안내서에서만 줄인다(망 지식 화면은 그대로):
 * 먼저 다른 이름을 빼고, 그래도 넘으면 뒤쪽 기관 규칙 → 뒤쪽 망 종류 순으로 자른다. 기본 등급 규칙은 늘 남긴다.
 */
function networkGuideSection(k: NetworkKnowledge, restLength: number): string {
  let types = networkTypeLines(k);
  let rules = userRuleLines(k);
  const base = baseRuleBlock(k);
  const fits = (t: string[], r: string[], note: string) => restLength + networkSection(t, r, base).length + note.length <= GUIDE_MAX;
  if (fits(types, rules, "")) return networkSection(types, rules, base);
  const totalTypes = types.length;
  const totalRules = rules.length;
  types = plainTypeLines(k);
  const note = `\n\n망 종류 ${totalTypes}개·기관 규칙 ${totalRules}개는 길어서 줄였어요. 구성도의 망 영역 종류는 get_diagram 의 zones 에서 확인하세요.`;
  while (!fits(types, rules, note) && rules.length > 0) rules = rules.slice(0, -1);
  while (!fits(types, rules, note) && types.length > 0) types = types.slice(0, -1);
  return networkSection(types, rules, base) + note;
}

/**
 * get_guide 가 돌려주는 그리기 안내서(2만4천 자 이하). 규칙 글은 Qwen 프롬프트와 공용 모듈(drawing/rules)을 쓰고,
 * 거기 쓰인 Qwen 쪽 이름은 용어 풀이 절에서 MCP 말로 바꿔 준다. 망 지식은 사용자 것을 담되 길면 줄인다.
 */
export function buildGuide(k: NetworkKnowledge): string {
  const head = [
    INTRO,
    HOW_TO_USE,
    CLARIFY,
    GLOSSARY,
    `## 명령 예\n\n각 줄이 commands 배열의 원소 하나예요.\n\n${COMMAND_EXAMPLES}`,
    `## 허용값\n\n${KIND_BLOCK}`,
    `## 그리기 규칙\n\n${DRAW_RULES}`,
    `## 자주 쓰는 구성 패턴\n\n${patternBlock()}`,
  ].join("\n\n");
  const title = "\n\n## 망 지식\n\n";
  return head + title + networkGuideSection(k, head.length + title.length);
}

export type McpProject = { id: string; name: string; diagrams: { id: string; name: string; version: number }[] };

export async function listProjectsForMcp(userId: string): Promise<McpProject[]> {
  return listProjectsWithVersions(userId);
}

export async function createProjectForMcp(
  userId: string,
  name: string,
  diagramName?: string,
): Promise<{ projectId: string; diagramId: string }> {
  const r = await createProjectWithDiagram(userId, name, diagramName?.trim() ? diagramName : FIRST_DIAGRAM_NAME);
  return { projectId: r.id, diagramId: r.diagramId };
}

export async function listDiagramsForMcp(userId: string, projectId: string): Promise<{ id: string; name: string; version: number }[]> {
  return listDiagramsWithVersions(userId, projectId);
}

export async function createDiagramForMcp(userId: string, projectId: string, name: string): Promise<{ diagramId: string; version: 1 }> {
  const r = await createDiagram(userId, projectId, name);
  return { diagramId: r.id, version: 1 };
}

export type McpZone = { id: string; name: string; type: string | null; typeName: string | null; typeSource: "ai" | "user" | null };

export type McpDiagram = {
  version: number;
  state: Pick<DiagramState, "groups" | "nodes" | "edges" | "assumptions">;
  zones: McpZone[];
  guessedLinks: string[];
  flows: StoredFlow[];
  brokenFlows: { id: string; name: string; problems: StoredFlow["problems"] }[];
  warnings: Warning[];
  missing: MissingItem[];
  url: string;
};

/** 구성도 최신 상태와 Claude Code 가 판단에 쓸 것들(망 영역 종류, 끊긴 흐름, 경고, 빠진 정보). 남의 구성도면 NotFoundError. */
export async function getDiagramForMcp(userId: string, diagramId: string): Promise<McpDiagram> {
  const diagram = await getOwnedDiagram(userId, diagramId);
  const latest = (await getLatestState(diagramId)) ?? { number: 0, state: emptyState() };
  const { state } = latest;
  const [knowledge, flows] = await Promise.all([getNetworkKnowledge(userId), listFlows(userId, diagramId)]);

  const zones: McpZone[] = Object.values(state.groups)
    .filter((g) => g.groupKind === "network_zone")
    .map((g) => {
      // 지식에 없는(숨기거나 지운) 종류는 종류가 없는 것으로 알린다. 빠진 정보 계산과 같은 판단이다.
      const t = g.netType ? knowledge.types[g.netType.key] : undefined;
      return t && g.netType
        ? { id: g.id, name: g.label, type: t.key, typeName: t.name, typeSource: g.netType.source }
        : { id: g.id, name: g.label, type: null, typeName: null, typeSource: null };
    });

  return {
    version: latest.number,
    state: { groups: state.groups, nodes: state.nodes, edges: state.edges, assumptions: state.assumptions },
    zones,
    guessedLinks: Object.values(state.nodes).filter((n) => n.guess).map((n) => n.id),
    flows,
    brokenFlows: flows.filter((f) => f.problems.length > 0).map((f) => ({ id: f.id, name: f.name, problems: f.problems })),
    warnings: mergeWarnings(state, knowledge).active,
    // 사용자가 모른다고 표시한 칸은 적용 결과와 같이 뺀다.
    missing: computeMissing(state, knowledge).items.filter((m) => !m.unknown),
    url: diagramUrl(diagram.projectId, diagram.id),
  };
}

export type McpVersionRow = { number: number; createdAt: string; source: string; via: "mcp" | null; summary: string | null };

/** 최근 버전 50개(최신부터). 남의 구성도면 NotFoundError. */
export async function listVersionsForMcp(userId: string, diagramId: string): Promise<McpVersionRow[]> {
  await getOwnedDiagram(userId, diagramId);
  const rows = await db
    .select({
      number: diagramVersions.number,
      createdAt: diagramVersions.createdAt,
      source: diagramVersions.source,
      via: diagramVersions.via,
      summary: diagramVersions.summary,
    })
    .from(diagramVersions)
    .where(eq(diagramVersions.diagramId, diagramId))
    .orderBy(desc(diagramVersions.number))
    .limit(VERSION_LIST_LIMIT);
  return rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }));
}

/** 요청 글에 나온 말을 이 계정의 용어 사전에서 찾는다(앱 대화와 같은 매칭, 6개까지). */
export function lookupTermsForMcp(userId: string, text: string): Promise<MatchedTerm[]> {
  return matchUserTerms(userId, text);
}
