import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

import { getNetworkKnowledge } from "@/server/network";
import { NotFoundError, ValidationError } from "@/server/projects";

import { applyMcpCommands, NOT_ARRAY_MESSAGE, restoreMcpVersion } from "./apply";
import {
  buildGuide,
  createDiagramForMcp,
  createProjectForMcp,
  getDiagramForMcp,
  listDiagramsForMcp,
  listProjectsForMcp,
  listVersionsForMcp,
} from "./read";

export const GUIDE_LINE = "InfraSketch에 처음 그리기 전에 get_guide를 먼저 읽으세요.";
const COMMANDS_MAX = 500;
const SUMMARY_MAX = 80;

const NO_DIAGRAM = "구성도를 찾을 수 없어요. list_projects 로 diagram_id 를 확인해 주세요.";
const NO_PROJECT = "프로젝트를 찾을 수 없어요. list_projects 로 project_id 를 확인해 주세요.";
const GENERIC = "저장하지 못했어요. 잠시 뒤 다시 시도해 주세요.";
const READ_FAILED = "읽지 못했어요. 잠시 뒤 다시 시도해 주세요.";

/** 모든 도구 설명은 get_guide 안내로 끝난다. */
const describe = (text: string) => `${text} ${GUIDE_LINE}`;

/** 짧은 머리말 한 줄과 JSON. */
const ok = (head: string, data: unknown): CallToolResult => ({ content: [{ type: "text", text: `${head}\n${JSON.stringify(data)}` }] });
const fail = (text: string): CallToolResult => ({ isError: true, content: [{ type: "text", text }] });
/** 성공 결과에서 ok 표시를 뺀 몸통. */
const body = <T extends { ok: true }>(r: T): Omit<T, "ok"> => {
  const data: Partial<T> = { ...r };
  delete data.ok;
  return data as Omit<T, "ok">;
};

/** 서비스 오류를 쉬운 문장으로 바꾼다. 예상하지 못한 오류는 남기고 일반 문장만 돌려준다(키는 여기 오지 않는다). */
async function guarded(name: string, notFound: string, fallback: string, run: () => Promise<CallToolResult>): Promise<CallToolResult> {
  try {
    return await run();
  } catch (err) {
    if (err instanceof NotFoundError) return fail(notFound);
    if (err instanceof ValidationError) return fail(err.message);
    console.error(`mcp tool ${name} failed`, err);
    return fail(fallback);
  }
}

const diagramId = z.string().describe("구성도 id(list_projects·list_diagrams 에서 얻은 값)");
const projectId = z.string().describe("프로젝트 id(list_projects 에서 얻은 값)");
const baseVersion = z.number().int().min(0).describe("get_diagram 으로 읽은 version 을 그대로 써요");

/** 이 계정(userId) 하나만 보는 MCP 서버. 요청마다 새로 만든다. */
export function createMcpServer(userId: string): McpServer {
  const server = new McpServer({ name: "infrasketch", version: "1.0.0" });

  server.registerTool(
    "get_guide",
    {
      description: describe("InfraSketch 그리는 법: 명령 형식, 종류 목록, 그리기 규칙, 표준 구성 패턴, 이 계정의 망 지식."),
      annotations: { readOnlyHint: true },
    },
    // 안내서는 마크다운 글이라 JSON 으로 감싸지 않고 그대로 준다.
    () => guarded("get_guide", NO_DIAGRAM, READ_FAILED, async () => ({ content: [{ type: "text", text: buildGuide(await getNetworkKnowledge(userId)) }] })),
  );

  server.registerTool(
    "list_projects",
    {
      description: describe("내 프로젝트와 그 안 구성도 목록(id, 이름, 최신 버전 번호)."),
      annotations: { readOnlyHint: true },
    },
    () => guarded("list_projects", NO_PROJECT, READ_FAILED, async () => ok("프로젝트 목록이에요.", await listProjectsForMcp(userId))),
  );

  server.registerTool(
    "create_project",
    {
      description: describe("새 프로젝트를 만들어요. 첫 구성도(버전 1)가 함께 생겨요."),
      inputSchema: { name: z.string().describe("프로젝트 이름(1~60자, 내 프로젝트끼리 겹치지 않게)") },
    },
    ({ name }) =>
      guarded("create_project", NO_PROJECT, GENERIC, async () => ok("프로젝트를 만들었어요. 첫 구성도는 버전 1이에요.", await createProjectForMcp(userId, name))),
  );

  server.registerTool(
    "list_diagrams",
    {
      description: describe("프로젝트 안 구성도 목록(id, 이름, 최신 버전 번호)."),
      inputSchema: { project_id: projectId },
      annotations: { readOnlyHint: true },
    },
    ({ project_id }) =>
      guarded("list_diagrams", NO_PROJECT, READ_FAILED, async () => ok("구성도 목록이에요.", await listDiagramsForMcp(userId, project_id))),
  );

  server.registerTool(
    "create_diagram",
    {
      description: describe("프로젝트 안에 새 구성도를 만들어요(버전 1)."),
      inputSchema: { project_id: projectId, name: z.string().describe("구성도 이름(1~60자, 프로젝트 안에서 겹치지 않게)") },
    },
    ({ project_id, name }) =>
      guarded("create_diagram", NO_PROJECT, GENERIC, async () => ok("구성도를 만들었어요.", await createDiagramForMcp(userId, project_id, name))),
  );

  server.registerTool(
    "get_diagram",
    {
      description: describe(
        "구성도 최신 모습을 한 번에 읽어요: 버전 번호, 영역·노드·연결·가정, 망 영역 종류와 출처, 망연계 추정, 흐름과 끊긴 흐름, 경고, 빠진 정보, 브라우저 주소.",
      ),
      inputSchema: { diagram_id: diagramId },
      annotations: { readOnlyHint: true },
    },
    ({ diagram_id }) =>
      guarded("get_diagram", NO_DIAGRAM, READ_FAILED, async () => {
        const d = await getDiagramForMcp(userId, diagram_id);
        return ok(`구성도 버전 ${d.version}이에요. 고칠 때 base_version 에 ${d.version} 을 써요.`, d);
      }),
  );

  server.registerTool(
    "list_versions",
    {
      description: describe("구성도 변경 이력(최근 50개, 최신부터): 번호, 시각, 출처, 요약 한 줄."),
      inputSchema: { diagram_id: diagramId },
      annotations: { readOnlyHint: true },
    },
    ({ diagram_id }) =>
      guarded("list_versions", NO_DIAGRAM, READ_FAILED, async () => ok("변경 이력이에요(최신부터).", await listVersionsForMcp(userId, diagram_id))),
  );

  server.registerTool(
    "apply_commands",
    {
      description: describe(
        "구성도에 명령을 적용해요. 전부 적용하거나 하나도 적용하지 않아요. 구성을 바꿀 때 base_version 이 최신이 아니면 저장하지 않아요(흐름만 바꿀 때는 보지 않아요). dry_run 이면 검사만 하고 저장하지 않아요.",
      ),
      inputSchema: {
        diagram_id: diagramId,
        base_version: baseVersion,
        commands: z
          .array(z.record(z.string(), z.unknown()), { error: NOT_ARRAY_MESSAGE })
          .min(1)
          .max(COMMANDS_MAX)
          .describe(`명령 객체 목록(1~${COMMANDS_MAX}개). 명령 하나가 배열 원소 하나예요.`),
        summary: z.string().max(SUMMARY_MAX).optional().describe(`이력에 남길 한 줄(${SUMMARY_MAX}자까지). 비우면 "Claude Code에서 N곳 바꿈"`),
        dry_run: z.boolean().optional().describe("true 면 검사만 하고 저장하지 않아요"),
      },
    },
    ({ diagram_id, base_version, commands, summary, dry_run }) =>
      guarded("apply_commands", NO_DIAGRAM, GENERIC, async () => {
        const r = await applyMcpCommands({ userId, diagramId: diagram_id, baseVersion: base_version, commands, summary, dryRun: dry_run });
        if (!r.ok) return fail(r.errors?.length ? `${r.message}\n${r.errors.join("\n")}` : r.message);
        const head = r.dryRun
          ? "검사만 했어요. 저장하지 않았어요."
          : r.version !== null
            ? `저장했어요. 새 버전은 ${r.version}이에요.`
            : r.flowsChanged > 0
              ? `흐름 ${r.flowsChanged}개를 저장했어요. 구성도 버전은 그대로예요.`
              : "바뀐 것이 없어 저장하지 않았어요.";
        return ok(head, body(r));
      }),
  );

  server.registerTool(
    "restore_version",
    {
      description: describe("예전 버전으로 되돌려요. 새 버전이 하나 생기고, 흐름은 되돌아가지 않아요. base_version 이 최신이 아니면 되돌리지 않아요."),
      inputSchema: {
        diagram_id: diagramId,
        base_version: baseVersion,
        number: z.number().int().describe("되돌릴 버전 번호(list_versions 에서 확인)"),
      },
    },
    ({ diagram_id, base_version, number }) =>
      guarded("restore_version", NO_DIAGRAM, GENERIC, async () => {
        const r = await restoreMcpVersion({ userId, diagramId: diagram_id, baseVersion: base_version, number });
        if (!r.ok) return fail(r.message);
        return ok(`버전 ${number}로 되돌렸어요. 새 버전은 ${r.version}이에요.`, body(r));
      }),
  );

  return server;
}
