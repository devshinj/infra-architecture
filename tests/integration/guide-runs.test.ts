import { eq } from "drizzle-orm";
import { describe, expect, test } from "vitest";

import { db } from "@/db/client";
import { diagrams } from "@/db/schema";
import {
  assertNotLearning,
  createGuideRun,
  getGuideRun,
  getLiveGuideRun,
  isLearning,
  listGuideRuns,
  saveGuideRun,
} from "@/server/guide/runs";
import { ValidationError } from "@/server/projects";

import { makeOwnedDiagram } from "./helpers";

describe("guide_runs", () => {
  test("create then get round-trips", async () => {
    const { diagramId } = await makeOwnedDiagram();
    expect(await getGuideRun(diagramId)).toBeNull();
    const created = await createGuideRun({ diagramId, guideId: "shop", env: "onprem" });
    expect(created).toEqual({ diagramId, guideId: "shop", env: "onprem", step: 0, stepVersions: [], envVersion: null, marks: [], status: "active" });
    await saveGuideRun({ ...created, step: 2, stepVersions: [3, 4], envVersion: 4 });
    expect(await getGuideRun(diagramId)).toEqual({ ...created, step: 2, stepVersions: [3, 4], envVersion: 4 });
  });

  test("deleting the diagram deletes the run", async () => {
    const { diagramId } = await makeOwnedDiagram();
    await createGuideRun({ diagramId, guideId: "shop", env: null });
    await db.delete(diagrams).where(eq(diagrams.id, diagramId));
    expect(await getGuideRun(diagramId)).toBeNull();
  });

  test("assertNotLearning throws only while active", async () => {
    const { diagramId } = await makeOwnedDiagram();
    await expect(assertNotLearning(diagramId)).resolves.toBeUndefined();
    const run = await createGuideRun({ diagramId, guideId: "shop", env: "cloud" });
    expect(await isLearning(diagramId)).toBe(true);
    await expect(assertNotLearning(diagramId)).rejects.toBeInstanceOf(ValidationError);
    await saveGuideRun({ ...run, status: "done" });
    expect(await isLearning(diagramId)).toBe(false);
    await expect(assertNotLearning(diagramId)).resolves.toBeUndefined();
    await saveGuideRun({ ...run, status: "quit" });
    await expect(assertNotLearning(diagramId)).resolves.toBeUndefined();
  });

  test("getLiveGuideRun quits a run whose guide is gone", async () => {
    const { diagramId } = await makeOwnedDiagram();
    await createGuideRun({ diagramId, guideId: "nope", env: null });
    const live = await getLiveGuideRun(diagramId);
    expect(live?.status).toBe("quit");
    expect((await getGuideRun(diagramId))?.status).toBe("quit");
  });

  test("getLiveGuideRun quits a run whose step is out of range", async () => {
    const { diagramId } = await makeOwnedDiagram();
    const run = await createGuideRun({ diagramId, guideId: "shop", env: "onprem" });
    expect((await getLiveGuideRun(diagramId))?.status).toBe("active");
    await saveGuideRun({ ...run, step: 99 });
    expect((await getLiveGuideRun(diagramId))?.status).toBe("quit");
    const other = (await makeOwnedDiagram()).diagramId;
    const noEnv = await createGuideRun({ diagramId: other, guideId: "shop", env: null });
    await saveGuideRun({ ...noEnv, step: 1 });
    expect((await getLiveGuideRun(other))?.status).toBe("quit");
    expect(await getLiveGuideRun((await makeOwnedDiagram()).diagramId)).toBeNull();
  });

  test("listGuideRuns returns only the owner's runs", async () => {
    const a = await makeOwnedDiagram();
    const b = await makeOwnedDiagram();
    await createGuideRun({ diagramId: a.diagramId, guideId: "shop", env: "cloud" });
    await createGuideRun({ diagramId: b.diagramId, guideId: "shop", env: "cloud" });
    const list = await listGuideRuns(a.userId);
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ diagramId: a.diagramId, diagramName: "d", guideId: "shop" });
    expect(typeof list[0].projectId).toBe("string");
  });
});
