import { randomUUID } from "node:crypto";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import type { OAuthClientProvider } from "@modelcontextprotocol/sdk/client/auth.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { afterEach, describe, expect, test } from "vitest";

import { DELETE, GET, POST } from "@/app/api/mcp/route";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { createMcpKey } from "@/server/mcpKeys";

import { makeOwnedDiagram } from "./helpers";

const URL_MCP = "http://localhost/api/mcp";
const GUIDE_LINE = "InfraSketch에 처음 그리기 전에 get_guide를 먼저 읽으세요.";
const WRONG_KEY = "키가 맞지 않거나 지워졌어요. Claude Code 연결 화면에서 새 키를 만들어 다시 등록해 주세요.";

async function makeUserKey(): Promise<{ userId: string; key: string }> {
  const tag = randomUUID().slice(0, 8);
  const [user] = await db
    .insert(users)
    .values({ username: `m-${tag}`, email: `${tag}@example.com`, passwordHash: "x" })
    .returning({ id: users.id });
  const { key } = await createMcpKey(user.id, "테스트");
  return { userId: user.id, key };
}

/** 서버를 띄우지 않고 라우트 함수를 바로 부르는 fetch. */
const routeFetch = async (url: string | URL, init?: RequestInit): Promise<Response> => {
  const req = new Request(url, init);
  if (req.method === "GET") return GET();
  if (req.method === "DELETE") return DELETE();
  return POST(req);
};

const clients: Client[] = [];
afterEach(async () => {
  await Promise.all(clients.splice(0).map((c) => c.close()));
});

async function connect(key: string): Promise<Client> {
  const transport = new StreamableHTTPClientTransport(new URL(URL_MCP), {
    fetch: routeFetch,
    requestInit: { headers: { Authorization: `Bearer ${key}` } },
  });
  const client = new Client({ name: "test", version: "0.0.0" });
  await client.connect(transport);
  clients.push(client);
  return client;
}

async function call(client: Client, name: string, args: Record<string, unknown> = {}): Promise<CallToolResult> {
  return (await client.callTool({ name, arguments: args })) as CallToolResult;
}

const textOf = (r: CallToolResult) => (r.content[0] as { type: "text"; text: string }).text;
/** 머리말 다음 줄부터의 JSON. */
const dataOf = <T>(r: CallToolResult): T => JSON.parse(textOf(r).slice(textOf(r).indexOf("\n") + 1)) as T;

const initBody = JSON.stringify({
  jsonrpc: "2.0",
  id: 1,
  method: "initialize",
  params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "t", version: "0" } },
});
const post = (headers: Record<string, string>) =>
  POST(
    new Request(URL_MCP, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json, text/event-stream", ...headers },
      body: initBody,
    }),
  );

describe("/api/mcp", () => {
  test("키가 없으면 401", async () => {
    const cases: Record<string, string>[] = [{}, { authorization: "Basic abc" }, { authorization: "Bearer" }];
    for (const headers of cases) {
      const res = await post(headers);
      expect(res.status).toBe(401);
      expect(await res.json()).toEqual({ error: "키가 맞지 않아요." });
    }
  });

  test("키가 있는데 틀렸거나 지워졌으면 403 과 새 키 안내", async () => {
    const cases: Record<string, string>[] = [{ authorization: "Bearer isk_wrong" }, { authorization: `Bearer isk_${"a".repeat(43)}` }];
    for (const headers of cases) {
      const res = await post(headers);
      expect(res.status).toBe(403);
      expect(await res.json()).toEqual({ error: WRONG_KEY });
    }
  });

  test("틀린 키로 붙으면 OAuth 로 넘어가지 않고 SDK 오류에 안내 문구가 그대로 실린다", async () => {
    // Claude Code 처럼 authProvider 를 붙인다. 401 이면 SDK 가 OAuth 를 시작하지만 403 이면 시작하지 않는다.
    const oauthCalls: string[] = [];
    const record = (name: string) => () => {
      oauthCalls.push(name);
      throw new Error(`OAuth 시작: ${name}`);
    };
    const authProvider = {
      get redirectUrl() { return "http://localhost/callback"; },
      get clientMetadata() { return { redirect_uris: ["http://localhost/callback"] }; },
      clientInformation: record("clientInformation"),
      tokens: () => undefined,
      saveTokens: record("saveTokens"),
      redirectToAuthorization: record("redirectToAuthorization"),
      saveCodeVerifier: record("saveCodeVerifier"),
      codeVerifier: record("codeVerifier"),
    } as unknown as OAuthClientProvider;
    const transport = new StreamableHTTPClientTransport(new URL(URL_MCP), {
      fetch: routeFetch,
      authProvider,
      requestInit: { headers: { Authorization: `Bearer isk_${"b".repeat(43)}` } },
    });
    const client = new Client({ name: "test", version: "0.0.0" });
    await expect(client.connect(transport)).rejects.toThrow(WRONG_KEY);
    expect(oauthCalls).toEqual([]);
  });

  test("GET·DELETE 는 405", async () => {
    expect((await GET()).status).toBe(405);
    expect((await DELETE()).status).toBe(405);
  });

  test("도구 9개, 설명은 모두 get_guide 안내로 끝난다", async () => {
    const { key } = await makeUserKey();
    const client = await connect(key);
    const { tools } = await client.listTools();
    expect(tools.map((t) => t.name).sort()).toEqual(
      [
        "apply_commands",
        "create_diagram",
        "create_project",
        "get_diagram",
        "get_guide",
        "list_diagrams",
        "list_projects",
        "list_versions",
        "restore_version",
      ].sort(),
    );
    for (const t of tools) expect(t.description?.endsWith(GUIDE_LINE)).toBe(true);
  });

  test("안내서를 읽는다", async () => {
    const { key } = await makeUserKey();
    const client = await connect(key);
    const r = await call(client, "get_guide");
    expect(r.isError).toBeFalsy();
    expect(textOf(r)).toContain("# InfraSketch 그리기 안내서");
    expect(textOf(r).length).toBeLessThanOrEqual(20000);
  });

  test("프로젝트 만들기 → 읽기 → 검사 → 적용 → 이력 → 되돌리기", async () => {
    const { key } = await makeUserKey();
    const client = await connect(key);

    const created = await call(client, "create_project", { name: "MCP 프로젝트" });
    expect(created.isError).toBeFalsy();
    const { projectId, diagramId } = dataOf<{ projectId: string; diagramId: string }>(created);

    const listed = dataOf<{ id: string; diagrams: { id: string }[] }[]>(await call(client, "list_projects"));
    expect(listed.find((p) => p.id === projectId)?.diagrams.map((d) => d.id)).toEqual([diagramId]);
    expect(dataOf<{ id: string }[]>(await call(client, "list_diagrams", { project_id: projectId })).map((d) => d.id)).toEqual([diagramId]);

    const read = dataOf<{ version: number; url: string }>(await call(client, "get_diagram", { diagram_id: diagramId }));
    expect(read.version).toBe(1);
    expect(read.url).toContain(`/p/${projectId}/d/${diagramId}`);

    const commands = [{ op: "add_node", id: "web-1", kind: "web_server", label: "WEB#1", parent: null }];
    const dry = await call(client, "apply_commands", { diagram_id: diagramId, base_version: 1, commands, dry_run: true });
    expect(dry.isError).toBeFalsy();
    expect(dataOf<{ dryRun: boolean; version: number | null }>(dry)).toMatchObject({ dryRun: true, version: null });
    expect(dataOf<{ version: number }>(await call(client, "get_diagram", { diagram_id: diagramId })).version).toBe(1);

    const applied = await call(client, "apply_commands", { diagram_id: diagramId, base_version: 1, commands, summary: "웹 서버 추가" });
    expect(applied.isError).toBeFalsy();
    expect(dataOf<{ version: number; changed: number }>(applied)).toMatchObject({ version: 2, changed: 1 });

    const versions = dataOf<{ number: number; source: string; via: string | null; summary: string | null }[]>(
      await call(client, "list_versions", { diagram_id: diagramId }),
    );
    expect(versions[0]).toMatchObject({ number: 2, source: "mcp", via: "mcp", summary: "웹 서버 추가" });

    const restored = await call(client, "restore_version", { diagram_id: diagramId, base_version: 2, number: 1 });
    expect(restored.isError).toBeFalsy();
    expect(dataOf<{ version: number }>(restored).version).toBe(3);

    const second = await call(client, "create_diagram", { project_id: projectId, name: "둘째" });
    expect(dataOf<{ version: number }>(second).version).toBe(1);
    const dup = await call(client, "create_diagram", { project_id: projectId, name: "둘째" });
    expect(dup.isError).toBe(true);
  });

  test("틀린 명령은 몇 번째가 왜 틀렸는지 알려 주고 저장하지 않는다", async () => {
    const { key } = await makeUserKey();
    const client = await connect(key);
    const { diagramId } = dataOf<{ diagramId: string }>(await call(client, "create_project", { name: "p" }));
    const r = await call(client, "apply_commands", {
      diagram_id: diagramId,
      base_version: 1,
      commands: [{ op: "say", text: "안녕" }],
    });
    expect(r.isError).toBe(true);
    expect(textOf(r)).toContain("아무것도 저장하지 않았어요");
    expect(dataOf<{ version: number }>(await call(client, "get_diagram", { diagram_id: diagramId })).version).toBe(1);
  });

  test("commands 가 배열이 아니면 배열로 보내라고 알린다", async () => {
    const { key } = await makeUserKey();
    const client = await connect(key);
    const { diagramId } = dataOf<{ diagramId: string }>(await call(client, "create_project", { name: "p" }));
    const r = await call(client, "apply_commands", { diagram_id: diagramId, base_version: 1, commands: '{"op":"add_node"}' });
    expect(r.isError).toBe(true);
    expect(textOf(r)).toContain("commands 는 명령 목록(배열)이어야 해요");
  });

  test("버전이 바뀌었으면 isError 로 다시 읽으라고 한다", async () => {
    const { key } = await makeUserKey();
    const client = await connect(key);
    const { diagramId } = dataOf<{ diagramId: string }>(await call(client, "create_project", { name: "p" }));
    const commands = [{ op: "add_node", id: "web-1", kind: "web_server", label: "WEB#1", parent: null }];
    const r = await call(client, "apply_commands", { diagram_id: diagramId, base_version: 0, commands });
    expect(r.isError).toBe(true);
    expect(textOf(r)).toContain("get_diagram 으로 다시 읽어 주세요");
    const back = await call(client, "restore_version", { diagram_id: diagramId, base_version: 0, number: 1 });
    expect(back.isError).toBe(true);
    expect(textOf(back)).toContain("get_diagram 으로 다시 읽어 주세요");
  });

  test("다른 계정의 구성도·프로젝트는 찾을 수 없다", async () => {
    const other = await makeOwnedDiagram();
    const { key } = await makeUserKey();
    const client = await connect(key);
    const commands = [{ op: "add_node", id: "web-1", kind: "web_server", label: "WEB#1", parent: null }];
    const calls: [string, Record<string, unknown>][] = [
      ["get_diagram", { diagram_id: other.diagramId }],
      ["list_versions", { diagram_id: other.diagramId }],
      ["apply_commands", { diagram_id: other.diagramId, base_version: 0, commands }],
      ["restore_version", { diagram_id: other.diagramId, base_version: 0, number: 1 }],
      ["get_diagram", { diagram_id: "not-a-uuid" }],
      ["list_diagrams", { project_id: randomUUID() }],
      ["create_diagram", { project_id: randomUUID(), name: "x" }],
    ];
    for (const [name, args] of calls) {
      const r = await call(client, name, args);
      expect(r.isError, name).toBe(true);
      expect(textOf(r), name).toContain("찾을 수 없어요");
    }
  });
});
