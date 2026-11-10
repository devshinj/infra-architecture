import { afterEach, describe, expect, test, vi } from "vitest";

import { GET } from "@/app/api/diagrams/[id]/head/route";
import type { FlowOp } from "@/domain/flows";
import { emptyState, type DiagramState } from "@/domain/types";
import { applyFlowOps } from "@/server/flows";
import { createVersion } from "@/server/versions";

import { makeOwnedDiagram } from "./helpers";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
import { auth } from "@/auth";

const authMock = vi.mocked(auth) as unknown as ReturnType<typeof vi.fn>;
afterEach(() => authMock.mockReset());

function sample(): DiagramState {
  const s = emptyState();
  s.nodes.web = { id: "web", kind: "web_server", label: "웹", parent: null, attrs: {} };
  s.nodes.was = { id: "was", kind: "was", label: "WAS", parent: null, attrs: {} };
  s.edges.e1 = { id: "e1", from: "web", to: "was", edgeKind: "request" };
  return s;
}

const addFlow = (id: string): FlowOp => ({
  op: "add_flow",
  id,
  name: id,
  origin: "user",
  steps: [{ edge: "e1", from: "web", short: "요청", text: "요청 설명" }],
});

type Head = { version: number; flows: { count: number; updatedAt: string | null } };
const get = (id: string) => GET(new Request(`http://localhost/api/diagrams/${id}/head`), { params: Promise.resolve({ id }) });

describe("GET /api/diagrams/:id/head", () => {
  test("version 0 and no flows for an empty diagram", async () => {
    const { userId, diagramId } = await makeOwnedDiagram();
    authMock.mockResolvedValue({ user: { id: userId } });
    const res = await get(diagramId);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ version: 0, flows: { count: 0, updatedAt: null } });
  });

  test("latest version, flow count and last change; a deleted flow lowers the count", async () => {
    const { userId, diagramId } = await makeOwnedDiagram();
    const state = sample();
    await createVersion(diagramId, state, { source: "import" });
    await createVersion(diagramId, state, { source: "mcp", via: "mcp" });
    await applyFlowOps(diagramId, state, [addFlow("a"), addFlow("b")], "ai");
    authMock.mockResolvedValue({ user: { id: userId } });

    const before = (await (await get(diagramId)).json()) as Head;
    expect(before.version).toBe(2);
    expect(before.flows.count).toBe(2);
    expect(typeof before.flows.updatedAt).toBe("string");
    expect(Number.isNaN(Date.parse(before.flows.updatedAt!))).toBe(false);

    await applyFlowOps(diagramId, state, [{ op: "remove_flow", id: "b" }], "ai");
    const after = (await (await get(diagramId)).json()) as Head;
    expect(after.version).toBe(2);
    expect(after.flows.count).toBe(1);
  });

  test("401 without login, 404 for someone else's diagram or a bad id", async () => {
    const { diagramId } = await makeOwnedDiagram();
    authMock.mockResolvedValue(null);
    expect((await get(diagramId)).status).toBe(401);

    const other = await makeOwnedDiagram();
    authMock.mockResolvedValue({ user: { id: other.userId } });
    expect((await get(diagramId)).status).toBe(404);
    expect((await get("not-a-uuid")).status).toBe(404);
  });
});
