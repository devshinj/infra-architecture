import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

const uid = () => Math.random().toString(36).slice(2, 8);

async function signup(page: Page) {
  const name = `mcp${uid()}`;
  await page.goto("/signup");
  await page.getByLabel("아이디").fill(name);
  await page.getByLabel("이메일").fill(`${name}@b.co`);
  await page.getByLabel("비밀번호").fill("password1");
  await page.getByRole("button", { name: "가입하기" }).click();
}

async function newProject(page: Page, name: string) {
  await page.getByRole("button", { name: "새 프로젝트" }).click();
  await page.getByRole("dialog").getByLabel("이름").fill(name);
  await page.getByRole("dialog").getByRole("button", { name: "만들기" }).click();
  await page.waitForURL(/\/p\/[^/]+\/d\/[^/]+/);
}

const nodes = (page: Page) => page.locator(".react-flow__node-infra");

/** 키 화면 링크는 펼친 사이드바에 바로 있거나, 레일이면 "계정" 팝오버 안에 있다. */
async function openKeyScreen(page: Page) {
  const link = page.getByRole("link", { name: "Claude Code 연결" });
  const rail = page.getByRole("button", { name: "계정" });
  // 펼친 사이드바의 링크나 레일의 계정 버튼 중 먼저 나타나는 쪽을 기다린다.
  await link.or(rail).first().waitFor();
  if (await rail.isVisible()) await rail.click();
  await link.click();
  await page.waitForURL(/\/claude-code$/);
}

const WRONG_KEY = "키가 맞지 않거나 지워졌어요. Claude Code 연결 화면에서 새 키를 만들어 다시 등록해 주세요.";

const MCP_HEADERS = (key: string) => ({
  authorization: `Bearer ${key}`,
  "content-type": "application/json",
  accept: "application/json, text/event-stream",
});

let rpcId = 0;
async function rpc(request: APIRequestContext, key: string, method: string, params: unknown) {
  return request.post("/api/mcp", { headers: MCP_HEADERS(key), data: { jsonrpc: "2.0", id: ++rpcId, method, params } });
}

/** 도구 결과 글에서 머리말 줄을 빼고 JSON 을 읽는다. */
async function callTool<T>(request: APIRequestContext, key: string, name: string, args: Record<string, unknown>): Promise<T> {
  const res = await rpc(request, key, "tools/call", { name, arguments: args });
  expect(res.status()).toBe(200);
  const body = (await res.json()) as { result: { isError?: boolean; content: { text: string }[] } };
  expect(body.result.isError).toBeFalsy();
  const text = body.result.content[0].text;
  return JSON.parse(text.slice(text.indexOf("\n") + 1)) as T;
}

test("Claude Code 연동: 키 만들기, 열어 둔 구성도에 변경이 뜨고 이력에 남는다, 키를 지우면 403", async ({ page, request }) => {
  await signup(page);
  await newProject(page, "연동 시험");
  const diagramUrl = page.url();
  const diagramId = diagramUrl.match(/\/d\/([^/?#]+)/)![1];

  // 키 만들기: 원문은 화면에 한 번 나온다.
  await openKeyScreen(page);
  await expect(page.getByRole("heading", { name: "Claude Code 연결" })).toBeVisible();
  await page.getByLabel("키 이름").fill("시험 키");
  await page.getByRole("button", { name: "키 만들기" }).click();
  const fresh = page.getByRole("region", { name: /키를 만들었어요/ });
  await expect(fresh).toBeVisible();
  const key = ((await fresh.locator("code").first().textContent()) ?? "").trim();
  expect(key).toMatch(/^isk_[A-Za-z0-9_-]{43}$/);
  await expect(fresh.locator("code").nth(1)).toContainText("claude mcp add --transport http infrasketch");
  await expect(page.getByRole("table", { name: "키 목록" })).toContainText(key.slice(0, 8));

  // 구성도를 다시 열어 둔다.
  const firstHead = page.waitForResponse((r) => /\/api\/diagrams\/[^/]+\/head/.test(r.url()) && r.ok());
  await page.goto(diagramUrl);
  const canvas = page.getByRole("region", { name: "새 구성도" });
  await expect(canvas).toBeVisible();
  await expect(nodes(page)).toHaveCount(0);
  // 화면이 다 뜨고 첫 확인(head)까지 끝난 뒤에 바꿔야, 바뀐 것이 처음 불러올 때 딸려 오지 않고 확인으로 알아챈 것이 된다.
  await firstHead;

  // 키가 없으면 401, 틀린 키는 403 과 새 키 안내.
  const noKey = await request.post("/api/mcp", {
    headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
    data: { jsonrpc: "2.0", id: ++rpcId, method: "tools/list", params: {} },
  });
  expect(noKey.status()).toBe(401);
  const wrong = await rpc(request, "isk_wrong", "tools/list", {});
  expect(wrong.status()).toBe(403);
  expect(await wrong.json()).toEqual({ error: WRONG_KEY });

  // Claude Code 가 하는 대로: initialize, 도구 목록, 읽기, 쓰기.
  const init = await rpc(request, key, "initialize", {
    protocolVersion: "2025-06-18",
    capabilities: {},
    clientInfo: { name: "e2e", version: "0" },
  });
  expect(init.status()).toBe(200);
  const list = (await (await rpc(request, key, "tools/list", {})).json()) as { result: { tools: { name: string }[] } };
  expect(list.result.tools.map((t) => t.name)).toContain("apply_commands");

  const read = await callTool<{ version: number }>(request, key, "get_diagram", { diagram_id: diagramId });
  const applied = await callTool<{ version: number }>(request, key, "apply_commands", {
    diagram_id: diagramId,
    base_version: read.version,
    commands: [{ op: "add_node", id: "was-mcp", kind: "was", label: "MCP WAS", parent: null }],
    summary: "WAS 하나 추가",
  });
  expect(applied.version).toBeGreaterThan(read.version);

  // 열어 둔 화면이 몇 초 안에 새 노드를 보여 준다(다시 불러오지 않는다).
  await expect(nodes(page)).toHaveCount(1, { timeout: 10_000 });
  await expect(canvas.getByTitle("MCP WAS", { exact: true })).toBeVisible();

  // 이력에 Claude Code 에서 만든 버전이 보인다.
  await page.getByRole("tab", { name: "이력" }).click();
  await expect(page.getByRole("tabpanel").getByText("Claude Code에서", { exact: true })).toBeVisible();

  // 키를 지우면 같은 호출이 403.
  await openKeyScreen(page);
  // 다시 들어온 키 화면에는 한 번 보여 준 원문이 남아 있지 않다.
  await expect(page.getByRole("heading", { name: "내 키" })).toBeVisible();
  await expect(page.getByText("키를 만들었어요")).toHaveCount(0);
  await expect(page.getByText(key, { exact: false })).toHaveCount(0);
  await page.getByRole("button", { name: "시험 키 지우기" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "삭제", exact: true }).click();
  await expect(page.getByText("만든 키가 없어요.")).toBeVisible();
  const after = await rpc(request, key, "tools/call", { name: "get_diagram", arguments: { diagram_id: diagramId } });
  expect(after.status()).toBe(403);
  expect(await after.json()).toEqual({ error: WRONG_KEY });
});
