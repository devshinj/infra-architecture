import { desc, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { diagramVersions } from "@/db/schema";
import { computeMissing, type MissingItem } from "@/domain/missing";
import type { NetworkKnowledge } from "@/domain/network";
import { emptyState, type DiagramState, type Warning } from "@/domain/types";
import { mergeWarnings } from "@/domain/warnings";
import { COMMAND_EXAMPLES, DRAW_RULES, KIND_BLOCK, networkGuideText, patternBlock } from "@/server/drawing/rules";
import { listFlows, type StoredFlow } from "@/server/flows";
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

const INTRO = `# InfraSketch 그리기 안내서

InfraSketch 는 인프라 구성도를 그리고 고치는 웹 도구예요. 이 연결(MCP)로 보내는 명령이 사용자의 구성도를 바꾸고, 사용자는 브라우저에서 같은 구성도를 바로 봐요.
구성도는 영역(그룹)·노드(서버 등)·연결(edge)·가정(assumption)과, 요청 하나가 연결을 차례로 지나는 길인 흐름(flow)으로 이뤄져요.`;

const HOW_TO_USE = `## 쓰는 순서

1. list_projects 로 프로젝트와 구성도를 찾아요. 없으면 create_project 나 create_diagram 으로 만들어요.
2. get_diagram 으로 구성도를 읽어요. 이때 받은 version 이 base_version 이에요.
3. apply_commands 로 바꿀 부분만 보내요. base_version 에는 get_diagram 의 version 을 그대로 써요.
4. 먼저 dry_run 으로 확인할 수 있어요. dry_run 은 검사만 하고 저장하지 않아요.
5. 구성도가 바뀌었으면 get_diagram 으로 다시 읽고 고쳐요. 그사이 사용자가 브라우저에서 고쳤을 수 있어서, 버전이 다르면 저장되지 않아요.

## 명령 보내는 방식

commands 는 명령 하나하나를 **배열의 원소**로 담은 목록이에요. 아래 예처럼 한 줄에 하나씩 쓴 글을 통째로 문자열로 보내지 말고, 각 명령을 JSON 객체로 만들어 배열에 넣어요.
명령 가운데 하나라도 틀리면 아무것도 저장되지 않고, 어느 명령이 왜 틀렸는지 알려 줘요. 고쳐서 전부 다시 보내요.
말하기 명령이나 서버 전용 명령은 없어요. 사용자에게 할 말은 대화에서 직접 해요.

## 지켜야 할 것

- 모르는 값은 비워 둬요. IP·hostname·스펙처럼 사용자가 알려 주지 않은 값은 지어내지 않고 null 로 두거나 쓰지 않아요.
- 흐름은 버전과 따로 저장돼요. 구성도 버전을 되돌려도 흐름은 그대로이고, 연결이 사라지면 흐름이 끊겨요. 흐름을 고치기 전에 get_diagram 으로 최신 흐름(flows)을 읽고, 남기는 단계의 글은 그대로 써요.
- 구성도를 바꿔 흐름이 끊겨도 흐름을 일부러 고치지 않아요. 결과의 끊긴 흐름 목록을 사용자에게 알려요.
- 이 연결은 지우기·망 지식 고치기·계정 설정은 못 해요.`;

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
- "environment|scale|redundancy|deploy|replication|external": 이 가운데 하나를 key 로 써요.
- "상위 그룹 id 또는 null"·"그룹 id 또는 null": 이미 있는 그룹 id 를 쓰거나, 최상위면 null 이에요.
- "망 종류 key 또는 null": 망 지식의 key 를 쓰거나, 종류를 지우려면 null 이에요.
- ... 와 "..." 같은 말줄임과 예시 값(Tomcat 10 등)은 실제 값으로 바꿔 써요.`;

/**
 * get_guide 가 돌려주는 그리기 안내서. 규칙 글은 Qwen 프롬프트와 공용 모듈(drawing/rules)을 쓰고,
 * 거기 쓰인 Qwen 쪽 이름은 용어 풀이 절에서 MCP 말로 바꿔 준다. 망 지식은 사용자 것을 그대로 담는다.
 */
export function buildGuide(k: NetworkKnowledge): string {
  return [
    INTRO,
    HOW_TO_USE,
    GLOSSARY,
    `## 명령 예\n\n각 줄이 commands 배열의 원소 하나예요.\n\n${COMMAND_EXAMPLES}`,
    `## 허용값\n\n${KIND_BLOCK}`,
    `## 그리기 규칙\n\n${DRAW_RULES}`,
    `## 자주 쓰는 구성 패턴\n\n${patternBlock()}`,
    `## 망 지식\n\n${networkGuideText(k)}`,
  ].join("\n\n");
}

export type McpProject = { id: string; name: string; diagrams: { id: string; name: string; version: number }[] };

export async function listProjectsForMcp(userId: string): Promise<McpProject[]> {
  return listProjectsWithVersions(userId);
}

export async function createProjectForMcp(userId: string, name: string): Promise<{ projectId: string; diagramId: string }> {
  const r = await createProjectWithDiagram(userId, name, FIRST_DIAGRAM_NAME);
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
