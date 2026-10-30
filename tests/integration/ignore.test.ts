import { eq } from "drizzle-orm";
import { expect, test } from "vitest";

import { db } from "@/db/client";
import { diagramVersions } from "@/db/schema";
import { emptyState } from "@/domain/types";
import { BUSY_MESSAGE } from "@/server/chat/busy";
import { withDiagramLock } from "@/server/chat/lock";
import { setWarningIgnoredFor } from "@/server/ignore";
import { NotFoundError, ValidationError } from "@/server/projects";
import { createVersion, getLatestState } from "@/server/versions";

import { makeOwnedDiagram } from "./helpers";

const WID = "single_point:was-1";

async function setup() {
  const ids = await makeOwnedDiagram();
  await createVersion(ids.diagramId, emptyState(), { source: "import" });
  return ids;
}
const count = async (id: string) =>
  (await db.select().from(diagramVersions).where(eq(diagramVersions.diagramId, id))).length;

test("ignore adds the id as a form version", async () => {
  const ids = await setup();
  const r = await setWarningIgnoredFor(ids.userId, ids.diagramId, WID, true);
  expect(r.number).toBe(2);
  expect((await getLatestState(ids.diagramId))!.state.ignoredWarnings).toEqual([WID]);
  const [v2] = await db
    .select()
    .from(diagramVersions)
    .where(eq(diagramVersions.diagramId, ids.diagramId))
    .orderBy(diagramVersions.number)
    .offset(1);
  expect(v2!.source).toBe("form");
});

test("unignore removes it and drops the empty field", async () => {
  const ids = await setup();
  await setWarningIgnoredFor(ids.userId, ids.diagramId, WID, true);
  const r = await setWarningIgnoredFor(ids.userId, ids.diagramId, WID, false);
  expect(r.number).toBe(3);
  const state = (await getLatestState(ids.diagramId))!.state;
  expect("ignoredWarnings" in state).toBe(false);
});

test("ignoring twice makes no new version", async () => {
  const ids = await setup();
  await setWarningIgnoredFor(ids.userId, ids.diagramId, WID, true);
  const before = await count(ids.diagramId);
  expect(await setWarningIgnoredFor(ids.userId, ids.diagramId, WID, true)).toEqual({ number: null });
  expect(await count(ids.diagramId)).toBe(before);
});

test("bad id is rejected", async () => {
  const ids = await setup();
  for (const bad of ["", "nocolon", "Single:was-1", "a:-x", "a:b c"]) {
    await expect(setWarningIgnoredFor(ids.userId, ids.diagramId, bad, true)).rejects.toThrow("경고를 찾을 수 없어요");
  }
  await expect(setWarningIgnoredFor(ids.userId, ids.diagramId, "x", true)).rejects.toBeInstanceOf(ValidationError);
});

test("non-boolean ignored is rejected without saving a version", async () => {
  const ids = await setup();
  await setWarningIgnoredFor(ids.userId, ids.diagramId, WID, true);
  const before = await count(ids.diagramId);
  for (const bad of ["x", 1, null, undefined]) {
    await expect(setWarningIgnoredFor(ids.userId, ids.diagramId, WID, bad as unknown as boolean)).rejects.toBeInstanceOf(ValidationError);
  }
  expect(await count(ids.diagramId)).toBe(before);
});

test("busy while the chat lock is held", async () => {
  const ids = await setup();
  let release!: () => void;
  const gate = new Promise<void>((r) => (release = r));
  const held = withDiagramLock(ids.diagramId, () => gate);
  try {
    await new Promise((r) => setTimeout(r, 200));
    await expect(setWarningIgnoredFor(ids.userId, ids.diagramId, WID, true)).rejects.toThrow(BUSY_MESSAGE);
  } finally {
    release();
    await held;
  }
  expect((await setWarningIgnoredFor(ids.userId, ids.diagramId, WID, true)).number).toBe(2);
});

test("other user's diagram is not found", async () => {
  const ids = await setup();
  const other = await makeOwnedDiagram();
  await expect(setWarningIgnoredFor(other.userId, ids.diagramId, WID, true)).rejects.toBeInstanceOf(NotFoundError);
});
