import { randomUUID } from "node:crypto";

import { describe, expect, test } from "vitest";

import { db } from "@/db/client";
import { users } from "@/db/schema";
import {
  NotFoundError,
  ValidationError,
  clearPinnedPositions,
  createDiagram,
  createProject,
  createProjectWithDiagram,
  deleteDiagram,
  deleteProject,
  duplicateDiagram,
  getDiagram,
  lastActiveDiagram,
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

  test("invalid pinned positions are rejected and leave stored value unchanged", async () => {
    const a = await user("a"); const p = await createProject(a, "x"); const d = await createDiagram(a, p.id, "y");
    const good = { "was-1": { x: 1, y: 2 } };
    await savePinnedPositions(a, d.id, good);
    const many: Record<string, { x: number; y: number }> = {};
    for (let i = 0; i < 2001; i++) many[`n-${i}`] = { x: 0, y: 0 };
    const bad: unknown[] = [
      { "was-1": { x: Number.NaN, y: 0 } },
      { "was-1": "10,20" },
      [{ x: 1, y: 2 }],
      many,
      { "Bad Key": { x: 1, y: 2 } },
      { "was-1": { x: 1, y: 2, z: 3 } },
      { "was-1": { x: 2_000_000, y: 0 } },
      JSON.parse('{"__proto__":{"x":1,"y":2}}'),
    ];
    for (const b of bad) {
      await expect(savePinnedPositions(a, d.id, b as never)).rejects.toThrow("위치 정보가 올바르지 않습니다");
    }
    expect((await getDiagram(a, d.id)).pinnedPositions).toEqual(good);
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

  test("project names are unique per user (case-insensitive), diagram names per project", async () => {
    const a = await user("a"), b = await user("b");
    const p = await createProject(a, "쇼핑몰");
    await expect(createProject(a, " 쇼핑몰 ")).rejects.toBeInstanceOf(ValidationError);
    await expect(createProject(a, "쇼핑몰")).rejects.toThrow("같은 이름의 프로젝트가 이미 있어요");
    await createProject(b, "쇼핑몰"); // 다른 사용자는 같은 이름을 써도 된다
    const q = await createProject(a, "Shop");
    await expect(createProject(a, "shop")).rejects.toBeInstanceOf(ValidationError);
    await expect(renameProject(a, q.id, "쇼핑몰")).rejects.toBeInstanceOf(ValidationError);
    await renameProject(a, q.id, "SHOP"); // 자기 자신과는 겹쳐도 된다(대소문자만 바꾸기)

    const d = await createDiagram(a, p.id, "운영");
    await expect(createDiagram(a, p.id, "운영")).rejects.toThrow("같은 이름의 구성도가 이미 있어요");
    await createDiagram(a, q.id, "운영"); // 다른 프로젝트는 괜찮다
    const e = await createDiagram(a, p.id, "개발");
    await expect(renameDiagram(a, e.id, "운영")).rejects.toBeInstanceOf(ValidationError);
    await renameDiagram(a, d.id, "운영");
  });

  test("duplicate picks the next free copy name within 60 chars", async () => {
    const a = await user("a"); const p = await createProject(a, "x");
    const d = await createDiagram(a, p.id, "운영");
    expect((await duplicateDiagram(a, d.id)).name).toBe("운영 사본");
    expect((await duplicateDiagram(a, d.id)).name).toBe("운영 사본 2");
    const long = await createDiagram(a, p.id, "가".repeat(60));
    const copy = await duplicateDiagram(a, long.id);
    expect(copy.name).toHaveLength(60);
    expect((await getDiagram(a, copy.id)).name).toBe(copy.name);
  });

  test("createProjectWithDiagram makes both, and leaves nothing behind when the diagram fails", async () => {
    const a = await user("a");
    const r = await createProjectWithDiagram(a, "쇼핑몰", "새 구성도");
    expect(await listProjects(a)).toEqual([{ id: r.id, name: "쇼핑몰", diagrams: [{ id: r.diagramId, name: "새 구성도" }] }]);
    expect((await getDiagram(a, r.diagramId)).latest.number).toBe(1);
    await expect(createProjectWithDiagram(a, "예약", "   ")).rejects.toBeInstanceOf(ValidationError);
    expect((await listProjects(a)).map((p) => p.name)).toEqual(["쇼핑몰"]);
    // 실패 뒤 같은 이름으로 다시 만들 수 있다.
    await createProjectWithDiagram(a, "예약", "새 구성도");
  });

  test("lastActiveDiagram is the most recently changed diagram, or null", async () => {
    const a = await user("a");
    expect(await lastActiveDiagram(a)).toBeNull();
    const p = await createProject(a, "x");
    expect(await lastActiveDiagram(a)).toBeNull();
    const d1 = await createDiagram(a, p.id, "하나");
    const q = await createProject(a, "y");
    const d2 = await createDiagram(a, q.id, "둘");
    expect(await lastActiveDiagram(a)).toEqual({ id: d2.id, projectId: q.id });
    await importSample(a, d1.id, "s1"); // 새 버전 = 최근 작업
    expect(await lastActiveDiagram(a)).toEqual({ id: d1.id, projectId: p.id });
    expect(await lastActiveDiagram(await user("b"))).toBeNull();
  });
});
