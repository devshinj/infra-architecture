import { eq } from "drizzle-orm";
import { expect, test } from "vitest";

import { db } from "@/db/client";
import { diagramVersions } from "@/db/schema";
import { emptyState, type DiagramState } from "@/domain/types";
import { BUSY_MESSAGE } from "@/server/chat/pipeline";
import { withDiagramLock } from "@/server/chat/lock";
import { saveFieldsFor } from "@/server/fields";
import { NotFoundError, ValidationError } from "@/server/projects";
import { createVersion, getLatestState } from "@/server/versions";

import { makeOwnedDiagram } from "./helpers";

async function setup() {
  const ids = await makeOwnedDiagram();
  const s: DiagramState = {
    ...emptyState(),
    nodes: {
      "was-1": { id: "was-1", kind: "was", label: "WAS", parent: null, attrs: {} },
      "db-1": { id: "db-1", kind: "db", label: "DB", parent: null, attrs: {} },
    },
    edges: { e1: { id: "e1", from: "was-1", to: "db-1", edgeKind: "request" } },
  };
  await createVersion(ids.diagramId, s, { source: "import" });
  return ids;
}
const count = async (id: string) =>
  (await db.select().from(diagramVersions).where(eq(diagramVersions.diagramId, id))).length;
const save = (
  ids: { userId: string; diagramId: string },
  input: Partial<Parameters<typeof saveFieldsFor>[2]> & { targetId: string },
) => saveFieldsFor(ids.userId, ids.diagramId, { targetKind: "node", values: {}, unknown: [], ...input });

test("saves node attrs as a form version", async () => {
  const ids = await setup();
  const r = await save(ids, { targetId: "was-1", values: { ram: " 32GB " } });
  expect(r.number).toBe(2);
  const latest = await getLatestState(ids.diagramId);
  expect(latest!.state.nodes["was-1"].attrs.ram).toBe("32GB");
  const [v2] = await db
    .select()
    .from(diagramVersions)
    .where(eq(diagramVersions.diagramId, ids.diagramId))
    .orderBy(diagramVersions.number)
    .offset(1);
  expect(v2!.source).toBe("form");
});

test("marks unknown and clears it when filled", async () => {
  const ids = await setup();
  await save(ids, { targetId: "was-1", unknown: ["ip"] });
  expect((await getLatestState(ids.diagramId))!.state.nodes["was-1"].unknown).toEqual(["ip"]);
  await save(ids, { targetId: "was-1", values: { ip: "10.0.0.1" }, unknown: ["ip"] });
  const n = (await getLatestState(ids.diagramId))!.state.nodes["was-1"];
  expect(n.attrs.ip).toBe("10.0.0.1");
  expect("unknown" in n).toBe(false);
});

test("edge label is saved", async () => {
  const ids = await setup();
  await save(ids, { targetKind: "edge", targetId: "e1", values: { label: "HTTPS 443" } });
  expect((await getLatestState(ids.diagramId))!.state.edges.e1.label).toBe("HTTPS 443");
});

test("whitespace-only values are ignored and no version is made when nothing changes", async () => {
  const ids = await setup();
  const before = await count(ids.diagramId);
  expect(await save(ids, { targetId: "was-1", values: { ram: "   " }, unknown: [] })).toEqual({ number: null });
  expect(await count(ids.diagramId)).toBe(before);
});

test("rejects keys that are not required for the target and over-long values", async () => {
  const ids = await setup();
  await expect(save(ids, { targetId: "was-1", values: { replicas: "3" } })).rejects.toThrow("입력할 수 없는 항목이에요");
  await expect(save(ids, { targetId: "was-1", unknown: ["replicas"] })).rejects.toBeInstanceOf(ValidationError);
  await expect(save(ids, { targetId: "was-1", values: { ram: "x".repeat(81) } })).rejects.toThrow(
    "값은 80자 이하로 입력해 주세요",
  );
});

test("save on a removed target is rejected", async () => {
  const ids = await setup();
  await expect(save(ids, { targetId: "gone" })).rejects.toThrow("대상을 찾을 수 없어요");
});

test("save while a chat turn holds the lock returns busy", async () => {
  const ids = await setup();
  let release!: () => void;
  const gate = new Promise<void>((r) => (release = r));
  const held = withDiagramLock(ids.diagramId, () => gate);
  await new Promise((r) => setTimeout(r, 200));
  await expect(save(ids, { targetId: "was-1", values: { ram: "8GB" } })).rejects.toThrow(BUSY_MESSAGE);
  release();
  await held;
  expect((await save(ids, { targetId: "was-1", values: { ram: "8GB" } })).number).toBe(2);
});

test("other user's diagram is not found", async () => {
  const ids = await setup();
  const other = await makeOwnedDiagram();
  await expect(
    saveFieldsFor(other.userId, ids.diagramId, { targetKind: "node", targetId: "was-1", values: {}, unknown: [] }),
  ).rejects.toBeInstanceOf(NotFoundError);
});
