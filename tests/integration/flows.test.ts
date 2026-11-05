import { eq } from "drizzle-orm";
import { afterEach, describe, expect, test, vi } from "vitest";

import { GET } from "@/app/api/diagrams/[id]/flows/route";
import { POST as SUGGEST } from "@/app/api/diagrams/[id]/flows/suggest/route";
import { db } from "@/db/client";
import { diagrams, flows } from "@/db/schema";
import type { FlowOp, FlowStepInput } from "@/domain/flows";
import { emptyState, type DiagramState } from "@/domain/types";
import { setChatDepsForTest } from "@/server/chat/deps";
import { withDiagramLock } from "@/server/chat/lock";
import { FLOW_SUGGEST_BUSY_MESSAGE, suggestFlows } from "@/server/flowSuggest";
import { applyFlowOps, BusyError, confirmFlow, deleteFlow, FLOW_BUSY_MESSAGE, listFlows, renameFlow } from "@/server/flows";
import type { QwenClient } from "@/server/llm/qwen";
import { deleteDiagram, duplicateDiagram, NotFoundError } from "@/server/projects";
import { createVersion, restoreVersion } from "@/server/versions";

import { makeOwnedDiagram } from "./helpers";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
import { auth } from "@/auth";

const authMock = vi.mocked(auth) as unknown as ReturnType<typeof vi.fn>;
afterEach(() => authMock.mockReset());

function sample(): DiagramState {
  const s = emptyState();
  s.nodes.web = { id: "web", kind: "web_server", label: "웹", parent: null, attrs: {} };
  s.nodes.was = { id: "was", kind: "was", label: "WAS", parent: null, attrs: {} };
  s.nodes.db = { id: "db", kind: "db_rdb", label: "DB", parent: null, attrs: {} };
  s.edges.e1 = { id: "e1", from: "web", to: "was", edgeKind: "request" };
  s.edges.e2 = { id: "e2", from: "was", to: "db", edgeKind: "request" };
  return s;
}

const step = (edge: string, from: string, short = "요청"): FlowStepInput => ({ edge, from, short, text: `${short} 설명` });

const addLogin = (id = "login"): FlowOp => ({
  op: "add_flow",
  id,
  name: "로그인",
  origin: "user",
  result: "로그인 완료",
  steps: [step("e1", "web"), step("e2", "was")],
});

async function setup() {
  const ids = await makeOwnedDiagram();
  const state = sample();
  await createVersion(ids.diagramId, state, { source: "import" });
  return { ...ids, state };
}

describe("flows repo", () => {
  test("applyFlowOps saves valid add_flow as ai/unreviewed", async () => {
    const { userId, diagramId, state } = await setup();
    const r = await applyFlowOps(diagramId, state, [addLogin()], "ai");
    expect(r).toEqual({ saved: 1, rejected: [] });
    const list = await listFlows(userId, diagramId);
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ id: "login", name: "로그인", source: "ai", reviewed: false, problems: [] });
    expect(list[0].steps.map((s) => s.edge)).toEqual(["e1", "e2"]);
  });

  test("short longer than 12 is truncated, not rejected", async () => {
    const { userId, diagramId, state } = await setup();
    const op: FlowOp = { ...(addLogin() as Extract<FlowOp, { op: "add_flow" }>), steps: [step("e1", "web", "아주아주아주아주긴짧은설명")] };
    expect((await applyFlowOps(diagramId, state, [op], "ai")).saved).toBe(1);
    const [f] = await listFlows(userId, diagramId);
    expect(f.steps[0].short).toBe("아주아주아주아주긴짧은…");
  });

  test("rejects flow with missing edge", async () => {
    const { userId, diagramId, state } = await setup();
    const op: FlowOp = { ...(addLogin() as Extract<FlowOp, { op: "add_flow" }>), steps: [step("nope", "web")] };
    const r = await applyFlowOps(diagramId, state, [op], "ai");
    expect(r.saved).toBe(0);
    expect(r.rejected).toEqual([{ id: "login", reason: "missing_edge" }]);
    expect(await listFlows(userId, diagramId)).toEqual([]);
  });

  test("add rejects existing key; update/remove reject missing key", async () => {
    const { diagramId, state } = await setup();
    await applyFlowOps(diagramId, state, [addLogin()], "ai");
    const r = await applyFlowOps(
      diagramId,
      state,
      [addLogin(), { op: "update_flow", id: "ghost", name: "x" }, { op: "remove_flow", id: "ghost" }],
      "ai",
    );
    expect(r.saved).toBe(0);
    expect(r.rejected.map((x) => x.id)).toEqual(["login", "ghost", "ghost"]);
  });

  test("update replaces steps", async () => {
    const { userId, diagramId, state } = await setup();
    await applyFlowOps(diagramId, state, [addLogin()], "ai");
    const r = await applyFlowOps(diagramId, state, [{ op: "update_flow", id: "login", steps: [step("e1", "web", "접속")] }], "ai");
    expect(r).toEqual({ saved: 1, rejected: [] });
    const [f] = await listFlows(userId, diagramId);
    expect(f.name).toBe("로그인");
    expect(f.result).toBe("로그인 완료");
    expect(f.steps).toEqual([{ edge: "e1", from: "web", short: "접속", text: "접속 설명" }]);
  });

  test("update that breaks the flow is rejected", async () => {
    const { userId, diagramId, state } = await setup();
    await applyFlowOps(diagramId, state, [addLogin()], "ai");
    const r = await applyFlowOps(diagramId, state, [{ op: "update_flow", id: "login", steps: [step("e2", "web")] }], "ai");
    expect(r.rejected).toEqual([{ id: "login", reason: "bad_start" }]);
    const [f] = await listFlows(userId, diagramId);
    expect(f.steps).toHaveLength(2);
  });

  test("remove deletes", async () => {
    const { userId, diagramId, state } = await setup();
    await applyFlowOps(diagramId, state, [addLogin()], "ai");
    const r = await applyFlowOps(diagramId, state, [{ op: "remove_flow", id: "login" }], "ai");
    expect(r).toEqual({ saved: 1, rejected: [] });
    expect(await listFlows(userId, diagramId)).toEqual([]);
  });

  test("listFlows recomputes problems after the edge is removed in a new version and clears them after restore", async () => {
    const { userId, diagramId, state } = await setup();
    await applyFlowOps(diagramId, state, [addLogin()], "ai");
    const next = structuredClone(state);
    delete next.edges.e2;
    await createVersion(diagramId, next, { source: "ai" });
    const [broken] = await listFlows(userId, diagramId);
    expect(broken.problems).toEqual([{ kind: "missing_edge", step: 1 }]);
    await restoreVersion(diagramId, 1);
    const [fixed] = await listFlows(userId, diagramId);
    expect(fixed.problems).toEqual([]);
  });

  test("rename/delete/confirm require owner", async () => {
    const { diagramId, state } = await setup();
    const other = await makeOwnedDiagram();
    await applyFlowOps(diagramId, state, [addLogin()], "ai");
    await expect(renameFlow(other.userId, diagramId, "login", "남의 것")).rejects.toBeInstanceOf(NotFoundError);
    await expect(deleteFlow(other.userId, diagramId, "login")).rejects.toBeInstanceOf(NotFoundError);
    await expect(confirmFlow(other.userId, diagramId, "login")).rejects.toBeInstanceOf(NotFoundError);
    await expect(listFlows(other.userId, diagramId)).rejects.toBeInstanceOf(NotFoundError);
  });

  test("rename changes the name; delete removes; unknown key is NotFound", async () => {
    const { userId, diagramId, state } = await setup();
    await applyFlowOps(diagramId, state, [addLogin()], "ai");
    await renameFlow(userId, diagramId, "login", "  회원 로그인 ");
    expect((await listFlows(userId, diagramId))[0].name).toBe("회원 로그인");
    await expect(renameFlow(userId, diagramId, "ghost", "x")).rejects.toBeInstanceOf(NotFoundError);
    await deleteFlow(userId, diagramId, "login");
    expect(await listFlows(userId, diagramId)).toEqual([]);
  });

  test("confirm sets reviewed", async () => {
    const { userId, diagramId, state } = await setup();
    await applyFlowOps(diagramId, state, [addLogin()], "ai");
    await confirmFlow(userId, diagramId, "login");
    const [f] = await listFlows(userId, diagramId);
    expect(f).toMatchObject({ source: "ai", reviewed: true });
  });

  test("rename while a chat turn holds the lock is BusyError", async () => {
    const { userId, diagramId, state } = await setup();
    await applyFlowOps(diagramId, state, [addLogin()], "ai");
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    const held = withDiagramLock(diagramId, () => gate);
    await new Promise((r) => setTimeout(r, 200));
    await expect(renameFlow(userId, diagramId, "login", "x")).rejects.toBeInstanceOf(BusyError);
    await expect(confirmFlow(userId, diagramId, "login")).rejects.toThrow(FLOW_BUSY_MESSAGE);
    release();
    await held;
    await renameFlow(userId, diagramId, "login", "x");
  });

  test("diagram delete cascades flows", async () => {
    const { userId, diagramId, state } = await setup();
    await applyFlowOps(diagramId, state, [addLogin()], "ai");
    await deleteDiagram(userId, diagramId);
    expect(await db.select().from(flows).where(eq(flows.diagramId, diagramId))).toEqual([]);
  });

  test("duplicate copies flows", async () => {
    const { userId, diagramId, state } = await setup();
    await applyFlowOps(diagramId, state, [addLogin()], "ai");
    await confirmFlow(userId, diagramId, "login");
    const copy = await duplicateDiagram(userId, diagramId);
    const list = await listFlows(userId, copy.id);
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ id: "login", source: "ai", reviewed: true, problems: [] });
  });

  test("more than 20 flows rejected", async () => {
    const { userId, diagramId, state } = await setup();
    const ops = Array.from({ length: 21 }, (_, i) => addLogin(`f-${i}`));
    const r = await applyFlowOps(diagramId, state, ops, "ai");
    expect(r.saved).toBe(20);
    expect(r.rejected).toEqual([{ id: "f-20", reason: "too_many_flows" }]);
    expect(await listFlows(userId, diagramId)).toHaveLength(20);
  });

  test("more than 20 steps rejected", async () => {
    const { diagramId, state } = await setup();
    const steps = Array.from({ length: 21 }, () => step("e1", "web"));
    const op: FlowOp = { ...(addLogin() as Extract<FlowOp, { op: "add_flow" }>), steps };
    const r = await applyFlowOps(diagramId, state, [op], "ai");
    expect(r.rejected).toEqual([{ id: "login", reason: "too_many_steps" }]);
  });
});

describe("GET /api/diagrams/:id/flows", () => {
  const get = (id: string) => GET(new Request(`http://localhost/api/diagrams/${id}/flows`), { params: Promise.resolve({ id }) });

  test("401 without login, 404 for others, flows for owner", async () => {
    const { userId, diagramId, state } = await setup();
    await applyFlowOps(diagramId, state, [addLogin()], "ai");
    authMock.mockResolvedValue(null);
    expect((await get(diagramId)).status).toBe(401);

    const other = await makeOwnedDiagram();
    authMock.mockResolvedValue({ user: { id: other.userId } });
    expect((await get(diagramId)).status).toBe(404);
    expect((await get("not-a-uuid")).status).toBe(404);

    authMock.mockResolvedValue({ user: { id: userId } });
    const res = await get(diagramId);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { flows: { id: string; problems: unknown[] }[] };
    expect(body.flows.map((f) => f.id)).toEqual(["login"]);
    expect(body.flows[0].problems).toEqual([]);
  });
});

/** 흐름 제안 3줄(sample 의 연결 e1·e2 위)을 돌려주는 가짜 Qwen. */
const suggestLines = [
  { op: "add_flow", id: "s-login", name: "로그인", origin: "user", result: "로그인 결과", steps: [step("e1", "web"), step("e2", "was")] },
  { op: "add_flow", id: "s-page", name: "화면 보기", origin: "user", steps: [step("e1", "web")] },
  { op: "add_flow", id: "s-batch", name: "정산 배치", origin: "system", steps: [step("e2", "was")] },
].map((l) => JSON.stringify(l)).join("\n");
const suggestQwen: QwenClient = {
  async streamCompletion(_m, { onDelta }) {
    onDelta(suggestLines);
    return { text: suggestLines, finishReason: "stop" };
  },
};

describe("flow suggest", () => {
  test("suggest saves 3 flows as ai/unreviewed and stamps flowsSuggestedAt", async () => {
    const { userId, diagramId } = await setup();
    const r = await suggestFlows(userId, diagramId, { auto: true }, { qwen: suggestQwen });
    expect(r).toEqual({ ok: true, saved: 3 });
    const list = await listFlows(userId, diagramId);
    expect(list.map((f) => f.id)).toEqual(["s-login", "s-page", "s-batch"]);
    for (const f of list) expect(f).toMatchObject({ source: "ai", reviewed: false, problems: [] });
    const [row] = await db.select({ at: diagrams.flowsSuggestedAt }).from(diagrams).where(eq(diagrams.id, diagramId));
    expect(row.at).toBeInstanceOf(Date);
    // 자동은 한 번만.
    expect(await suggestFlows(userId, diagramId, { auto: true }, { qwen: suggestQwen })).toEqual({ ok: true, saved: 0 });
  });

  test("concurrent auto calls stamp once (one model call)", async () => {
    const { userId, diagramId } = await setup();
    let calls = 0;
    const qwen: QwenClient = {
      async streamCompletion(m, o) {
        calls++;
        return suggestQwen.streamCompletion(m, o);
      },
    };
    const results = await Promise.all([1, 2, 3].map(() => suggestFlows(userId, diagramId, { auto: true }, { qwen })));
    expect(calls).toBe(1);
    expect(results.filter((r) => r.ok && r.saved === 3)).toHaveLength(1);
    expect(await listFlows(userId, diagramId)).toHaveLength(3);
  });

  test("a chat turn can take the lock while the model is running", async () => {
    const { userId, diagramId } = await setup();
    let lockedDuringCall: boolean | null = null;
    const qwen: QwenClient = {
      async streamCompletion(m, o) {
        lockedDuringCall = (await withDiagramLock(diagramId, async () => true)).ok;
        return suggestQwen.streamCompletion(m, o);
      },
    };
    expect(await suggestFlows(userId, diagramId, { auto: false }, { qwen })).toEqual({ ok: true, saved: 3 });
    expect(lockedDuringCall).toBe(true);
  });

  test("edges removed between model call and save → those flows rejected", async () => {
    const { userId, diagramId, state } = await setup();
    const qwen: QwenClient = {
      async streamCompletion(m, o) {
        // 모델이 도는 사이 대화 차례가 e2 를 지웠다.
        const next = structuredClone(state);
        delete next.edges.e2;
        await createVersion(diagramId, next, { source: "ai" });
        return suggestQwen.streamCompletion(m, o);
      },
    };
    expect(await suggestFlows(userId, diagramId, { auto: false }, { qwen })).toEqual({ ok: true, saved: 1 });
    expect((await listFlows(userId, diagramId)).map((f) => f.id)).toEqual(["s-page"]);
  });

  describe("POST /api/diagrams/:id/flows/suggest", () => {
    const post = (id: string, body: unknown = {}) =>
      SUGGEST(
        new Request(`http://localhost/api/diagrams/${id}/flows/suggest`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }),
        { params: Promise.resolve({ id }) },
      );
    afterEach(() => setChatDepsForTest(null));

    test("401/404/400, 409 while locked, saved for owner", async () => {
      setChatDepsForTest({ qwen: suggestQwen, clef: { decide: vi.fn(), classifyIntent: vi.fn() } as never });
      const { userId, diagramId } = await setup();
      authMock.mockResolvedValue(null);
      expect((await post(diagramId)).status).toBe(401);

      const other = await makeOwnedDiagram();
      authMock.mockResolvedValue({ user: { id: other.userId } });
      expect((await post(diagramId)).status).toBe(404);

      authMock.mockResolvedValue({ user: { id: userId } });
      expect((await post(diagramId, { auto: "yes" })).status).toBe(400);

      let release!: () => void;
      const gate = new Promise<void>((r) => (release = r));
      const held = withDiagramLock(diagramId, () => gate);
      await new Promise((r) => setTimeout(r, 200));
      const busy = await post(diagramId);
      expect(busy.status).toBe(409);
      expect(await busy.json()).toEqual({ error: FLOW_SUGGEST_BUSY_MESSAGE });
      release();
      await held;

      const ok = await post(diagramId);
      expect(ok.status).toBe(200);
      expect(await ok.json()).toEqual({ saved: 3 });
    }, 20_000); // 잠금이 계속 차 있으면 저장 전 1초씩 4번 기다린다.
  });
});
