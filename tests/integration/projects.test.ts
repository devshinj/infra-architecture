import { randomUUID } from "node:crypto";

import { describe, expect, test } from "vitest";

import { db } from "@/db/client";
import { users } from "@/db/schema";
import {
  NotFoundError,
  clearPinnedPositions,
  createDiagram,
  createProject,
  deleteDiagram,
  deleteProject,
  duplicateDiagram,
  getDiagram,
  listProjects,
  renameDiagram,
  renameProject,
  savePinnedPositions,
} from "@/server/projects";
import { SAMPLES, importSample } from "@/server/samples";

async function user(name: string): Promise<string> {
  const tag = `${name}-${randomUUID().slice(0, 8)}`;
  const [row] = await db
    .insert(users)
    .values({ username: tag, email: `${tag}@example.com`, passwordHash: "x" })
    .returning({ id: users.id });
  return row.id;
}

describe("projects", () => {
  test("other user's project returns not found", async () => {
    const a = await user("a"), b = await user("b");
    const p = await createProject(a, "쇼핑몰");
    await expect(renameProject(b, p.id, "x")).rejects.toBeInstanceOf(NotFoundError);
    await expect(deleteProject(b, p.id)).rejects.toBeInstanceOf(NotFoundError);
    await expect(createDiagram(b, p.id, "z")).rejects.toBeInstanceOf(NotFoundError);
    const d = await createDiagram(a, p.id, "운영");
    await expect(getDiagram(b, d.id)).rejects.toBeInstanceOf(NotFoundError);
    await expect(renameDiagram(b, d.id, "x")).rejects.toBeInstanceOf(NotFoundError);
    await expect(deleteDiagram(b, d.id)).rejects.toBeInstanceOf(NotFoundError);
    await expect(duplicateDiagram(b, d.id)).rejects.toBeInstanceOf(NotFoundError);
    await expect(savePinnedPositions(b, d.id, {})).rejects.toBeInstanceOf(NotFoundError);
    await expect(importSample(b, d.id, "s1")).rejects.toBeInstanceOf(NotFoundError);
    expect(await listProjects(b)).toEqual([]);
    expect((await getDiagram(a, d.id)).name).toBe("운영");
  });

  test("nonexistent and malformed ids are also not found", async () => {
    const a = await user("a");
    await expect(getDiagram(a, randomUUID())).rejects.toBeInstanceOf(NotFoundError);
    await expect(getDiagram(a, "not-a-uuid")).rejects.toBeInstanceOf(NotFoundError);
    await expect(deleteProject(a, "not-a-uuid")).rejects.toBeInstanceOf(NotFoundError);
  });

  test("import sample adds a version, duplicate copies latest", async () => {
    const a = await user("a"); const p = await createProject(a, "쇼핑몰");
    const d = await createDiagram(a, p.id, "운영");
    await importSample(a, d.id, "s2");
    const g = await getDiagram(a, d.id);
    expect(g.latest.number).toBe(2);
    expect(Object.keys(g.latest.state.nodes).length).toBeGreaterThan(0);
    const copy = await duplicateDiagram(a, d.id);
    const c = await getDiagram(a, copy.id);
    expect(c.name).toBe("운영 사본");
    expect(c.latest.number).toBe(1);
    expect(c.latest.state).toEqual(g.latest.state);
  });

  test("SAMPLES lists titles and unknown sample is rejected", async () => {
    expect(SAMPLES.length).toBeGreaterThan(0);
    expect(SAMPLES[0].title.length).toBeGreaterThan(0);
    const a = await user("a"); const p = await createProject(a, "x"); const d = await createDiagram(a, p.id, "y");
    await expect(importSample(a, d.id, "nope")).rejects.toThrow();
  });

  test("pinned positions do not create versions", async () => {
    const a = await user("a"); const p = await createProject(a, "x"); const d = await createDiagram(a, p.id, "y");
    await savePinnedPositions(a, d.id, { "was-1": { x: 10, y: 20 } });
    const g = await getDiagram(a, d.id);
    expect(g.latest.number).toBe(1); expect(g.pinnedPositions["was-1"]).toEqual({ x: 10, y: 20 });
    await clearPinnedPositions(a, d.id);
    expect((await getDiagram(a, d.id)).pinnedPositions).toEqual({});
  });

  test("names are trimmed and length-checked", async () => {
    const a = await user("a");
    await expect(createProject(a, "   ")).rejects.toThrow("이름은 1~60자로 입력해 주세요");
    await expect(createProject(a, "x".repeat(61))).rejects.toThrow();
    expect((await createProject(a, "  운영  ")).name).toBe("운영");
  });

  test("list, rename and delete cascade", async () => {
    const a = await user("a"); const p = await createProject(a, "x");
    const d = await createDiagram(a, p.id, "y");
    await renameProject(a, p.id, "새 이름");
    await renameDiagram(a, d.id, "새 구성도");
    expect(await listProjects(a)).toEqual([{ id: p.id, name: "새 이름", diagrams: [{ id: d.id, name: "새 구성도" }] }]);
    await deleteProject(a, p.id);
    expect(await listProjects(a)).toEqual([]);
    await expect(getDiagram(a, d.id)).rejects.toBeInstanceOf(NotFoundError);
  });
});
