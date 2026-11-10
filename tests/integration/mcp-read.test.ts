import { describe, expect, test } from "vitest";

import { emptyState, type DiagramState } from "@/domain/types";
import { applyFlowOps } from "@/server/flows";
import {
  createDiagramForMcp,
  createProjectForMcp,
  getDiagramForMcp,
  listDiagramsForMcp,
  listProjectsForMcp,
  listVersionsForMcp,
} from "@/server/mcp/read";
import { diagramUrl } from "@/server/mcp/url";
import { NotFoundError } from "@/server/projects";
import { createVersion } from "@/server/versions";

import { adminCase } from "../fixtures/network";

import { makeOwnedDiagram } from "./helpers";

const UUID0 = "00000000-0000-4000-8000-000000000000";

describe("MCP 읽기 서비스", () => {
  test("프로젝트 목록에 구성도별 최신 버전 번호가 붙는다", async () => {
    const { userId, diagramId } = await makeOwnedDiagram();
    expect((await listProjectsForMcp(userId))[0]!.diagrams).toEqual([{ id: diagramId, name: "d", version: 0 }]);
    await createVersion(diagramId, emptyState(), { source: "import" });
    await createVersion(diagramId, emptyState(), { source: "mcp", via: "mcp", summary: "x" });
    const list = await listProjectsForMcp(userId);
    expect(list).toEqual([{ id: expect.any(String), name: "p", diagrams: [{ id: diagramId, name: "d", version: 2 }] }]);
    expect(await listDiagramsForMcp(userId, list[0]!.id)).toEqual([{ id: diagramId, name: "d", version: 2 }]);
  });

  test("createProjectForMcp 는 첫 구성도 하나를 만든다", async () => {
    const { userId } = await makeOwnedDiagram();
    const r = await createProjectForMcp(userId, "새 프로젝트");
    expect(r).toEqual({ projectId: expect.any(String), diagramId: expect.any(String) });
    const found = (await listProjectsForMcp(userId)).find((p) => p.id === r.projectId)!;
    expect(found.diagrams).toEqual([{ id: r.diagramId, name: "새 구성도", version: 1 }]);
  });

  test("createDiagramForMcp 는 v1 구성도를 만든다", async () => {
    const { userId } = await makeOwnedDiagram();
    const { projectId } = await createProjectForMcp(userId, "또 하나");
    const r = await createDiagramForMcp(userId, projectId, "둘째");
    expect(r).toEqual({ diagramId: expect.any(String), version: 1 });
    expect((await listDiagramsForMcp(userId, projectId)).map((x) => x.name)).toEqual(["새 구성도", "둘째"]);
  });

  test("getDiagramForMcp 는 망 영역 종류·출처, 끊긴 흐름, 빠진 정보를 준다", async () => {
    const { userId, diagramId } = await makeOwnedDiagram();
    const state: DiagramState = adminCase();
    // 지식에 없는 종류 key 는 type null 로 알린다
    state.groups["admin-net"]!.netType = { key: "no-such-type", source: "ai", confirmed: false };
    state.nodes.was!.unknown = ["hostname"];
    state.nodes.link = { id: "link", kind: "network_link", label: "망연계", parent: null, attrs: {}, guess: { replaced: [] } };
    await createVersion(diagramId, state, { source: "import" });
    const step = { edge: "e1", from: "pc", short: "요청", text: "보낸다" };
    const saved = await applyFlowOps(diagramId, state, [{ op: "add_flow", id: "f1", name: "접속", origin: "user", steps: [step] }], "ai");
    expect(saved.saved).toBe(1);
    // 연결을 지워 흐름을 끊는다
    await createVersion(diagramId, { ...state, edges: { e2: state.edges.e2! } }, { source: "import" });

    const r = await getDiagramForMcp(userId, diagramId);
    const projectId = (await listProjectsForMcp(userId))[0]!.id;
    expect(r.version).toBe(2);
    expect(r.state.nodes.pc).toBeDefined();
    expect(r.zones).toEqual([
      { id: "admin-net", name: "행정망", type: null, typeName: null, typeSource: null },
      { id: "gcloud-internet", name: "GCloud 인터넷망", type: "gcloud-internet", typeName: "공공 클라우드 인터넷 영역", typeSource: "user" },
    ]);
    expect(r.guessedLinks).toEqual(["link"]);
    expect(r.flows.map((f) => f.id)).toEqual(["f1"]);
    expect(r.brokenFlows).toEqual([{ id: "f1", name: "접속", problems: expect.any(Array) }]);
    expect(r.brokenFlows[0]!.problems.length).toBeGreaterThan(0);
    // 모른다고 표시한 칸은 빠진 정보에서 뺀다
    expect(r.missing.some((m) => m.targetId === "was" && m.key === "hostname")).toBe(false);
    expect(r.missing.some((m) => m.targetId === "was" && m.key !== "hostname")).toBe(true);
    expect(r.missing.every((m) => !m.unknown)).toBe(true);
    expect(r.missing.some((m) => m.key === "net_type" && m.targetId === "admin-net")).toBe(true);
    expect(Array.isArray(r.warnings)).toBe(true);
    expect(r.url).toBe(diagramUrl(projectId, diagramId));
  });

  test("버전 목록은 최근 50개, 최신부터", async () => {
    const { userId, diagramId } = await makeOwnedDiagram();
    for (let i = 0; i < 52; i++) {
      await createVersion(diagramId, emptyState(), i === 51 ? { source: "mcp", via: "mcp", summary: "마지막" } : { source: "import" });
    }
    const v = await listVersionsForMcp(userId, diagramId);
    expect(v).toHaveLength(50);
    expect(v[0]).toEqual({ number: 52, createdAt: expect.stringMatching(/^\d{4}-\d\d-\d\dT/), source: "mcp", via: "mcp", summary: "마지막" });
    expect(v[49]!.number).toBe(3);
    expect(v[1]).toMatchObject({ source: "import", via: null, summary: null });
  });

  test("foreign ids are not found", async () => {
    const mine = await makeOwnedDiagram();
    const other = await makeOwnedDiagram();
    const otherProject = (await listProjectsForMcp(other.userId))[0]!.id;
    await expect(getDiagramForMcp(mine.userId, other.diagramId)).rejects.toBeInstanceOf(NotFoundError);
    await expect(listVersionsForMcp(mine.userId, other.diagramId)).rejects.toBeInstanceOf(NotFoundError);
    await expect(listDiagramsForMcp(mine.userId, otherProject)).rejects.toBeInstanceOf(NotFoundError);
    await expect(createDiagramForMcp(mine.userId, otherProject, "침입")).rejects.toBeInstanceOf(NotFoundError);
    await expect(getDiagramForMcp(mine.userId, UUID0)).rejects.toBeInstanceOf(NotFoundError);
    await expect(listDiagramsForMcp(mine.userId, "not-a-uuid")).rejects.toBeInstanceOf(NotFoundError);
  });
});
