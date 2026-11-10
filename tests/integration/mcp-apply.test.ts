import { eq } from "drizzle-orm";
import { afterEach, describe, expect, test, vi } from "vitest";

import { db } from "@/db/client";
import { diagramVersions, flows, messages } from "@/db/schema";
import type { FlowStepInput } from "@/domain/flows";
import { emptyState, type DiagramState } from "@/domain/types";
import { withDiagramLock } from "@/server/chat/lock";
import { applyFlowOps, listFlows } from "@/server/flows";
import { applyMcpCommands, diagramUrl, MCP_BUSY_MESSAGE, restoreMcpVersion } from "@/server/mcp/apply";
import { getOwnedDiagram, NotFoundError } from "@/server/projects";
import { createVersion, getLatestState, listVersions } from "@/server/versions";

import { adminCase } from "../fixtures/network";

import { makeOwnedDiagram } from "./helpers";

// 검사와 저장 사이에 다른 쓰기를 끼워 넣으려는 시험용 고리. 비어 있으면 원래 함수 그대로다.
const hooks: { knowledge: (() => Promise<void>) | null; getVersion: (() => Promise<void>) | null } = { knowledge: null, getVersion: null };
vi.mock("@/server/network", async (importOriginal) => {
  const orig = await importOriginal<typeof import("@/server/network")>();
  return {
    ...orig,
    getNetworkKnowledge: async (userId: string) => {
      await hooks.knowledge?.();
      return orig.getNetworkKnowledge(userId);
    },
  };
});
vi.mock("@/server/versions", async (importOriginal) => {
  const orig = await importOriginal<typeof import("@/server/versions")>();
  return {
    ...orig,
    getVersion: async (diagramId: string, number: number) => {
      await hooks.getVersion?.();
      return orig.getVersion(diagramId, number);
    },
  };
});
afterEach(() => {
  hooks.knowledge = null;
  hooks.getVersion = null;
});

function sample(): DiagramState {
  const s = emptyState();
  s.nodes.web = { id: "web", kind: "web_server", label: "웹", parent: null, attrs: {} };
  s.nodes.was = { id: "was", kind: "was", label: "WAS", parent: null, attrs: {} };
  s.edges.e1 = { id: "e1", from: "web", to: "was", edgeKind: "request", label: "HTTP 8080" };
  return s;
}

const step = (edge: string, from: string, short = "요청"): FlowStepInput => ({ edge, from, short, text: `${short} 설명` });

async function setup(state = sample()) {
  const ids = await makeOwnedDiagram();
  await createVersion(ids.diagramId, state, { source: "import" });
  return ids;
}

const versionCount = async (d: string) => (await db.select().from(diagramVersions).where(eq(diagramVersions.diagramId, d))).length;
const flowRows = async (d: string) => db.select().from(flows).where(eq(flows.diagramId, d));
const messageCount = async (d: string) => (await db.select().from(messages).where(eq(messages.diagramId, d))).length;
const latest = async (d: string) => (await getLatestState(d))!.state;

const addDb = { op: "add_node", id: "db", kind: "db_rdb", label: "DB", parent: null };
const addEdge = { op: "add_edge", id: "e2", from: "was", to: "db", edge_kind: "request", label: "TCP 5432" };
const relabel = { op: "update_node", id: "web", label: "웹 서버" };
const relabelPc = { op: "update_node", id: "pc", label: "업무 PC" };

describe("applyMcpCommands", () => {
  test("맞는 명령 3개 → 새 버전, 출처 mcp, 기본 요약, 대화 메시지 없음", async () => {
    const ids = await setup();
    const r = await applyMcpCommands({ ...ids, baseVersion: 1, commands: [addDb, addEdge, relabel] });
    const { projectId } = await getOwnedDiagram(ids.userId, ids.diagramId);
    expect(r).toMatchObject({ ok: true, dryRun: false, version: 2, changed: 3, flowsChanged: 0, url: diagramUrl(projectId, ids.diagramId) });
    expect(diagramUrl(projectId, ids.diagramId)).toMatch(new RegExp(`/p/${projectId}/d/${ids.diagramId}$`));
    const [v] = await listVersions(ids.diagramId);
    expect(v).toMatchObject({ number: 2, source: "mcp", via: "mcp", summary: "Claude Code에서 3곳 바꿈" });
    const s = await latest(ids.diagramId);
    expect(s.nodes.db).toBeDefined();
    expect(s.edges.e2).toBeDefined();
    expect(s.nodes.web.label).toBe("웹 서버");
    expect(await messageCount(ids.diagramId)).toBe(0);
  });

  test("요약은 앞뒤 공백을 지우고 80자로 자른다", async () => {
    const ids = await setup();
    await applyMcpCommands({ ...ids, baseVersion: 1, commands: [addDb], summary: `  ${"가".repeat(100)}  ` });
    const [v] = await listVersions(ids.diagramId);
    expect(v.summary).toBe("가".repeat(80));
    await applyMcpCommands({ ...ids, baseVersion: 2, commands: [relabel], summary: "   " });
    expect((await listVersions(ids.diagramId))[0].summary).toBe("Claude Code에서 1곳 바꿈");
  });

  test("기본 요약의 N 은 가정 명령도 센다(0곳이 되지 않는다)", async () => {
    const ids = await setup();
    const r = await applyMcpCommands({ ...ids, baseVersion: 1, commands: [{ op: "set_assumption", key: "ha", value: "이중화 없음" }] });
    expect(r).toMatchObject({ ok: true, version: 2, changed: 0 });
    expect((await listVersions(ids.diagramId))[0].summary).toBe("Claude Code에서 1곳 바꿈");
  });

  test("commands 가 배열이 아니면 거절", async () => {
    const ids = await setup();
    const r = await applyMcpCommands({ ...ids, baseVersion: 1, commands: "add_node" as unknown as unknown[] });
    expect(r).toEqual({ ok: false, kind: "rejected", message: "commands 는 명령 목록(배열)이어야 해요. 아무것도 저장하지 않았어요." });
    expect(await versionCount(ids.diagramId)).toBe(1);
  });

  test("검사 뒤 저장 전에 잠금 없는 쓰기가 버전을 만들면 stale, 버전·흐름 그대로", async () => {
    const ids = await setup();
    hooks.knowledge = async () => {
      await createVersion(ids.diagramId, sample(), { source: "form" });
    };
    const r = await applyMcpCommands({
      ...ids,
      baseVersion: 1,
      commands: [addDb, addEdge, { op: "add_flow", id: "f1", name: "주문", origin: "user", steps: [step("e1", "web"), step("e2", "was")] }],
    });
    expect(r).toEqual({ ok: false, kind: "stale", message: "구성도가 바뀌었어요(지금 버전 2). get_diagram 으로 다시 읽어 주세요.", latestVersion: 2 });
    expect(await versionCount(ids.diagramId)).toBe(2);
    expect((await listVersions(ids.diagramId))[0].source).toBe("form");
    expect(await flowRows(ids.diagramId)).toHaveLength(0);
  });

  test("흐름만 바꾼 호출도 저장 순간에 버전이 바뀌었으면 stale, 흐름 그대로", async () => {
    const ids = await setup();
    hooks.knowledge = async () => {
      await createVersion(ids.diagramId, sample(), { source: "form" });
    };
    const r = await applyMcpCommands({
      ...ids,
      baseVersion: 1,
      commands: [{ op: "add_flow", id: "f1", name: "접속", origin: "user", steps: [step("e1", "web")] }],
    });
    expect(r).toMatchObject({ ok: false, kind: "stale", latestVersion: 2 });
    expect(await flowRows(ids.diagramId)).toHaveLength(0);
  });

  test("망 지식을 못 읽으면 set_zone_type 은 서버 문제라고 알린다", async () => {
    const ids = await setup(adminCase(null));
    hooks.knowledge = async () => {
      throw new Error("db down");
    };
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    const r = await applyMcpCommands({ ...ids, baseVersion: 1, commands: [{ op: "set_zone_type", id: "admin-net", type: null }] });
    err.mockRestore();
    expect(r).toMatchObject({
      ok: false,
      kind: "rejected",
      errors: ["1번: 지금 망 지식을 읽지 못해 망 종류를 붙일 수 없어요. 잠시 뒤 다시 시도해 주세요."],
    });
  });

  test("새 경고·빠진 정보·망연계 예상을 돌려준다", async () => {
    const ids = await setup();
    const r = await applyMcpCommands({ ...ids, baseVersion: 1, commands: [addDb, addEdge] });
    if (!r.ok) throw new Error(r.message);
    expect(r.missing.length).toBeGreaterThan(0);
    expect(r.missing.every((m) => !m.unknown)).toBe(true);
    expect(r.linkExpected).toEqual([]);
    // 저장된 버전에는 점검한 경고가 들어간다.
    expect((await latest(ids.diagramId)).warnings).toEqual(expect.any(Array));
  });

  test("a rejected flow op saves nothing", async () => {
    const ids = await setup();
    const r = await applyMcpCommands({
      ...ids,
      baseVersion: 1,
      commands: [addDb, addEdge, { op: "add_flow", id: "f1", name: "주문", origin: "user", steps: [step("ghost", "web")] }],
    });
    expect(r).toMatchObject({ ok: false, kind: "rejected", errors: ["3번: 흐름 f1 — 단계가 없는 연결을 가리켜요"] });
    expect(await versionCount(ids.diagramId)).toBe(1);
    expect(await flowRows(ids.diagramId)).toHaveLength(0);
  });

  test("2번째·4번째가 틀리면 오류 두 개, 저장 없음", async () => {
    const ids = await setup();
    const r = await applyMcpCommands({
      ...ids,
      baseVersion: 1,
      commands: [addDb, { op: "add_node", id: "x", kind: "cache", label: "x", parent: "vpc-1" }, addEdge, { op: "remove_edge", id: "nope" }],
    });
    expect(r).toMatchObject({ ok: false, kind: "rejected", errors: ["2번: parent 영역 vpc-1 이 없어요", "4번: 연결 nope 이(가) 없어요"] });
    expect(await versionCount(ids.diagramId)).toBe(1);
  });

  test("형식이 틀린 명령과 모르는 명령도 번호와 함께 거절", async () => {
    const ids = await setup();
    const r = await applyMcpCommands({ ...ids, baseVersion: 1, commands: [{ op: "add_node", id: "Bad Id" }, { op: "add_server" }] });
    if (r.ok) throw new Error("should reject");
    expect(r.errors![0]).toMatch(/^1번: add_node 명령의 형식이 맞지 않아요\(/);
    expect(r.errors![1]).toBe("2번: 모르는 명령 add_server 이에요. get_guide 의 명령 목록을 봐 주세요");
  });

  test("stale: base 1 인데 최신 2", async () => {
    const ids = await setup();
    await createVersion(ids.diagramId, sample(), { source: "form" });
    const r = await applyMcpCommands({ ...ids, baseVersion: 1, commands: [addDb] });
    expect(r).toMatchObject({ ok: false, kind: "stale", latestVersion: 2 });
    if (r.ok) return;
    expect(r.message).toBe("구성도가 바뀌었어요(지금 버전 2). get_diagram 으로 다시 읽어 주세요.");
    expect(await versionCount(ids.diagramId)).toBe(2);
  });

  test("busy: 잠금을 잡은 채 부르면 바쁨", async () => {
    const ids = await setup();
    const held = await withDiagramLock(ids.diagramId, () => applyMcpCommands({ ...ids, baseVersion: 1, commands: [addDb] }));
    expect(held).toEqual({ ok: true, value: { ok: false, kind: "busy", message: MCP_BUSY_MESSAGE } });
    expect(MCP_BUSY_MESSAGE).toBe("지금 다른 변경이 진행 중이에요. 잠시 뒤 다시 시도해 주세요.");
    expect(await versionCount(ids.diagramId)).toBe(1);
  });

  test("남의 구성도는 NotFoundError", async () => {
    const ids = await setup();
    const other = await makeOwnedDiagram();
    await expect(applyMcpCommands({ userId: other.userId, diagramId: ids.diagramId, baseVersion: 1, commands: [] })).rejects.toThrow(NotFoundError);
  });

  test("dry_run writes nothing", async () => {
    const ids = await setup();
    const r = await applyMcpCommands({
      ...ids,
      baseVersion: 1,
      dryRun: true,
      commands: [addDb, addEdge, { op: "add_flow", id: "f1", name: "주문", origin: "user", steps: [step("e1", "web"), step("e2", "was")] }],
    });
    expect(r).toMatchObject({ ok: true, dryRun: true, version: null, changed: 2, flowsChanged: 1 });
    if (!r.ok) return;
    expect(Array.isArray(r.freshWarnings)).toBe(true);
    expect(r.missing.length).toBeGreaterThan(0);
    expect(await versionCount(ids.diagramId)).toBe(1);
    expect(await flowRows(ids.diagramId)).toHaveLength(0);
  });

  test("dry_run 도 틀린 명령은 거절", async () => {
    const ids = await setup();
    const r = await applyMcpCommands({ ...ids, baseVersion: 1, dryRun: true, commands: [{ op: "remove_node", id: "ghost" }] });
    expect(r).toMatchObject({ ok: false, kind: "rejected", errors: ["1번: 노드 ghost 이(가) 없어요"] });
  });

  test("흐름만 바꾼 호출 → 버전 없음, flowsChanged 1", async () => {
    const ids = await setup();
    const r = await applyMcpCommands({
      ...ids,
      baseVersion: 1,
      commands: [{ op: "add_flow", id: "f1", name: "접속", origin: "user", steps: [step("e1", "web")] }],
    });
    expect(r).toMatchObject({ ok: true, version: null, changed: 0, flowsChanged: 1 });
    expect(await versionCount(ids.diagramId)).toBe(1);
    const rows = await flowRows(ids.diagramId);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ key: "f1", source: "ai", reviewed: false });
  });

  test("구성과 흐름을 함께 바꾸면 같은 차례 연결을 가리키는 흐름도 저장", async () => {
    const ids = await setup();
    const r = await applyMcpCommands({
      ...ids,
      baseVersion: 1,
      commands: [{ op: "add_flow", id: "f1", name: "주문", origin: "user", steps: [step("e1", "web"), step("e2", "was")] }, addDb, addEdge],
    });
    expect(r).toMatchObject({ ok: true, version: 2, changed: 2, flowsChanged: 1 });
    expect((await listFlows(ids.userId, ids.diagramId))[0]).toMatchObject({ id: "f1", problems: [] });
  });

  test("지웠다 다시 만든 연결 짝 → 원래 연결 id 유지, 흐름 단계도 원래 id", async () => {
    const ids = await setup();
    const r = await applyMcpCommands({
      ...ids,
      baseVersion: 1,
      commands: [
        { op: "remove_edge", id: "e1" },
        { op: "add_edge", from: "web", to: "was", edge_kind: "request", label: "HTTPS 443" },
        { op: "add_flow", id: "f1", name: "접속", origin: "user", steps: [step("e-web-was", "web")] },
      ],
    });
    expect(r).toMatchObject({ ok: true, version: 2, changed: 1, flowsChanged: 1 });
    const s = await latest(ids.diagramId);
    expect(Object.keys(s.edges)).toEqual(["e1"]);
    expect(s.edges.e1.label).toBe("HTTPS 443");
    expect((await flowRows(ids.diagramId))[0].data.steps[0].edge).toBe("e1");
  });

  test("set_link_guess·say → rejected", async () => {
    const ids = await setup();
    const r = await applyMcpCommands({
      ...ids,
      baseVersion: 1,
      commands: [{ op: "say", text: "안녕" }, { op: "set_link_guess", id: "web", guess: null }],
    });
    expect(r).toMatchObject({
      ok: false,
      kind: "rejected",
      errors: [
        "1번: say 는 받지 않아요. 바꾼 내용은 summary 에 적어 주세요",
        "2번: set_link_guess 는 서버만 쓰는 명령이에요. 망연계를 추정으로 넣으려면 add_node 에 guess: true 를 주세요",
      ],
    });
    expect(await versionCount(ids.diagramId)).toBe(1);
  });

  test("알 수 없는 망 종류는 거절, 아는 종류는 AI 추정으로 붙는다", async () => {
    const ids = await setup(adminCase(null));
    const bad = await applyMcpCommands({ ...ids, baseVersion: 1, commands: [{ op: "set_zone_type", id: "admin-net", type: "no-such-net" }] });
    expect(bad).toMatchObject({ ok: false, errors: ["1번: 알 수 없는 망 종류 no-such-net 이에요. get_guide 의 망 종류 key 를 써 주세요"] });
    const ok = await applyMcpCommands({ ...ids, baseVersion: 1, commands: [{ op: "set_zone_type", id: "admin-net", type: "admin-net" }] });
    expect(ok).toMatchObject({ ok: true, version: 2 });
    expect((await latest(ids.diagramId)).groups["admin-net"].netType).toEqual({ key: "admin-net", source: "ai", confirmed: false });
  });

  test("망연계 예상: 행정망 ↔ GCloud 를 망연계 없이 이으면 linkExpected 에 나온다", async () => {
    const ids = await setup(adminCase());
    const r = await applyMcpCommands({ ...ids, baseVersion: 1, dryRun: true, commands: [relabelPc] });
    if (!r.ok) throw new Error(r.message);
    expect(r.linkExpected.map((v) => v.rule)).toContain("link_expected");
  });

  test("망연계 추정(guess)을 넣으면 set_link_guess 가 기록되고 흐름 단계가 나뉜다", async () => {
    const ids = await setup(adminCase());
    await applyFlowOps(ids.diagramId, adminCase(), [{ op: "add_flow", id: "work", name: "업무", origin: "user", steps: [step("e1", "pc"), step("e2", "fw")] }], "ai");
    const r = await applyMcpCommands({
      ...ids,
      baseVersion: 1,
      commands: [
        { op: "add_node", id: "link-1", kind: "network_link", label: "망연계", parent: null, guess: true },
        { op: "add_edge", id: "e-fw-link", from: "fw", to: "link-1", edge_kind: "request" },
        { op: "add_edge", id: "e-link-was", from: "link-1", to: "was", edge_kind: "request" },
        { op: "remove_edge", id: "e2" },
      ],
    });
    expect(r).toMatchObject({ ok: true, version: 2, changed: 4 });
    if (!r.ok) return;
    expect(r.linkExpected).toEqual([]);
    const s = await latest(ids.diagramId);
    expect(s.nodes["link-1"].guess).toEqual({ replaced: [{ id: "e2", from: "fw", to: "was", edgeKind: "request" }] });
    const [flow] = await listFlows(ids.userId, ids.diagramId);
    expect(flow.problems).toEqual([]);
    expect(flow.steps.map((x) => [x.edge, x.from])).toEqual([
      ["e1", "pc"],
      ["e-fw-link", "fw"],
      ["e-link-was", "link-1"],
    ]);
  });

  test("망연계로 갈라진 흐름을 같은 호출에서 이름만 고쳐도 통과", async () => {
    const ids = await setup(adminCase());
    await applyFlowOps(ids.diagramId, adminCase(), [{ op: "add_flow", id: "work", name: "업무", origin: "user", steps: [step("e1", "pc"), step("e2", "fw")] }], "ai");
    const r = await applyMcpCommands({
      ...ids,
      baseVersion: 1,
      commands: [
        { op: "add_node", id: "link-1", kind: "network_link", label: "망연계", parent: null, guess: true },
        { op: "add_edge", id: "e-fw-link", from: "fw", to: "link-1", edge_kind: "request" },
        { op: "add_edge", id: "e-link-was", from: "link-1", to: "was", edge_kind: "request" },
        { op: "remove_edge", id: "e2" },
        { op: "update_flow", id: "work", name: "업무 요청" },
      ],
    });
    expect(r).toMatchObject({ ok: true, version: 2, flowsChanged: 1 });
    const [flow] = await listFlows(ids.userId, ids.diagramId);
    expect(flow).toMatchObject({ name: "업무 요청", problems: [] });
    expect(flow.steps).toHaveLength(3);
  });
});

describe("restoreMcpVersion", () => {
  test("v1 으로 되돌리면 restore·via mcp·restoredFrom 1, 메시지 없음, 끊긴 흐름 이름", async () => {
    const ids = await setup();
    await applyMcpCommands({ ...ids, baseVersion: 1, commands: [addDb, addEdge] });
    await applyMcpCommands({
      ...ids,
      baseVersion: 2,
      commands: [{ op: "add_flow", id: "f1", name: "주문", origin: "user", steps: [step("e1", "web"), step("e2", "was")] }],
    });
    const r = await restoreMcpVersion({ ...ids, baseVersion: 2, number: 1 });
    const { projectId } = await getOwnedDiagram(ids.userId, ids.diagramId);
    expect(r).toEqual({ ok: true, version: 3, brokenFlows: [{ id: "f1", name: "주문" }], url: diagramUrl(projectId, ids.diagramId) });
    const [v] = await listVersions(ids.diagramId);
    expect(v).toMatchObject({ number: 3, source: "restore", via: "mcp", restoredFrom: 1 });
    expect(await latest(ids.diagramId)).toEqual(sample());
    expect(await messageCount(ids.diagramId)).toBe(0);
  });

  test("stale·busy·없는 버전", async () => {
    const ids = await setup();
    await createVersion(ids.diagramId, sample(), { source: "form" });
    expect(await restoreMcpVersion({ ...ids, baseVersion: 1, number: 1 })).toEqual({
      ok: false,
      kind: "stale",
      message: "구성도가 바뀌었어요(지금 버전 2). get_diagram 으로 다시 읽어 주세요.",
      latestVersion: 2,
    });
    const held = await withDiagramLock(ids.diagramId, () => restoreMcpVersion({ ...ids, baseVersion: 2, number: 1 }));
    expect(held).toEqual({ ok: true, value: { ok: false, kind: "busy", message: MCP_BUSY_MESSAGE } });
    expect(await restoreMcpVersion({ ...ids, baseVersion: 2, number: 9 })).toEqual({ ok: false, kind: "not_found", message: "버전 9 이(가) 없어요. list_versions 로 번호를 확인해 주세요." });
    expect(await versionCount(ids.diagramId)).toBe(2);
  });

  test("확인 뒤 저장 전에 잠금 없는 쓰기가 버전을 만들면 stale, 되돌리지 않는다", async () => {
    const ids = await setup();
    hooks.getVersion = async () => {
      await createVersion(ids.diagramId, sample(), { source: "form" });
    };
    const r = await restoreMcpVersion({ ...ids, baseVersion: 1, number: 1 });
    expect(r).toEqual({ ok: false, kind: "stale", message: "구성도가 바뀌었어요(지금 버전 2). get_diagram 으로 다시 읽어 주세요.", latestVersion: 2 });
    expect(await versionCount(ids.diagramId)).toBe(2);
    expect((await listVersions(ids.diagramId))[0].source).toBe("form");
  });
});
