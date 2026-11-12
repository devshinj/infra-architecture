import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";

import { TransactionRollbackError, sql } from "drizzle-orm";
import postgres from "postgres";
import { describe, expect, test } from "vitest";

import { db } from "@/db/client";
import { diagrams, projects, users } from "@/db/schema";
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
  firstDiagramId,
  getDiagram,
  lastActiveDiagram,
  listProjects,
  renameDiagram,
  renameProject,
  savePinnedPositions,
} from "@/server/projects";
import { listFlows } from "@/server/flows";
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
    await expect(importSample(b, d.id, "aws-shop")).rejects.toBeInstanceOf(NotFoundError);
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
    await importSample(a, d.id, "idc-3tier");
    const g = await getDiagram(a, d.id);
    expect(g.latest.number).toBe(2);
    expect(Object.keys(g.latest.state.nodes).length).toBeGreaterThan(0);
    // 샘플 흐름은 사람이 확인한 흐름으로 함께 들어온다. 다시 불러와도 같은 흐름이 겹치지 않는다.
    const flowsOf = async () => (await listFlows(a, d.id)).map((f) => [f.id, f.source, f.reviewed, f.problems.length]);
    expect(await flowsOf()).toEqual([["login", "user", true, 0]]);
    await importSample(a, d.id, "idc-3tier");
    expect(await flowsOf()).toEqual([["login", "user", true, 0]]);
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

  test("firstDiagramId returns the first diagram in list order, or null", async () => {
    const a = await user("a"); const p = await createProject(a, "x");
    expect(await firstDiagramId(a, p.id)).toBeNull();
    const d1 = await createDiagram(a, p.id, "하나");
    await createDiagram(a, p.id, "둘");
    expect(await firstDiagramId(a, p.id)).toBe(d1.id);
    await expect(firstDiagramId(await user("b"), p.id)).rejects.toBeInstanceOf(NotFoundError);
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
    await importSample(a, d1.id, "aws-shop"); // 새 버전 = 최근 작업
    expect(await lastActiveDiagram(a)).toEqual({ id: d1.id, projectId: p.id });
    await savePinnedPositions(a, d2.id, { "was-1": { x: 1, y: 2 } }); // 노드를 옮긴 것도 최근 작업
    expect(await lastActiveDiagram(a)).toEqual({ id: d2.id, projectId: q.id });
    expect(await lastActiveDiagram(await user("b"))).toBeNull();
  });
});

const PROJECT_TAKEN = "같은 이름의 프로젝트가 이미 있어요. 다른 이름을 써 주세요";
const DIAGRAM_TAKEN = "이 프로젝트에 같은 이름의 구성도가 이미 있어요. 다른 이름을 써 주세요";

/**
 * 다른 연결이 아직 커밋하지 않은 행을 넣어 둔 채 action 을 시작하고, action 이 그 행의 잠금을 기다리기 시작하면 커밋한다.
 * 미리 검사(커밋 안 된 행은 안 보인다)는 통과하고 DB 유니크 인덱스에서 걸리는 경쟁을 매번 같은 순서로 만든다.
 *
 * 기다리는 잠금은 이 DB 에서 바로 그 연결(pid)에 막힌 것만 센다. 막힌 문장이 insert/update 인지도 확인해,
 * 미리 검사(select 는 행 잠금을 기다리지 않는다)에서 끝나 버린 채 통과하는 일이 없게 한다.
 */
async function racedBy<T>(
  insert: (tx: postgres.TransactionSql) => Promise<unknown>,
  action: () => Promise<T>,
  table: "projects" | "diagrams",
): Promise<PromiseSettledResult<T>> {
  const other = postgres(process.env.DATABASE_URL!, { max: 1 });
  try {
    let pending: Promise<PromiseSettledResult<T>> | undefined;
    let blocked = "";
    await other.begin(async (tx) => {
      const [{ pid }] = await tx<{ pid: number }[]>`select pg_backend_pid() as pid`;
      await insert(tx);
      pending = action().then(
        (value) => ({ status: "fulfilled" as const, value }),
        (reason: unknown) => ({ status: "rejected" as const, reason }),
      );
      for (let i = 0; ; i++) {
        const rows = await db.execute<{ query: string }>(sql`
          select a.query
          from pg_locks l
          join pg_stat_activity a on a.pid = l.pid
          where not l.granted
            and a.datname = current_database()
            and ${pid}::int = any(pg_blocking_pids(l.pid))`);
        if (rows.length > 0) {
          blocked = rows[0].query;
          break;
        }
        if (i > 300) throw new Error("action 이 그 연결의 잠금을 기다리지 않았다");
        await new Promise((r) => setTimeout(r, 10));
      }
    });
    // 미리 검사를 지나 쓰기 문장이 인덱스에서 그 행을 기다렸다 = 유니크 위반 경로를 탔다.
    expect(blocked).toMatch(new RegExp(`^\\s*(insert into|update) "${table}"`, "i"));
    return await pending!;
  } finally {
    await other.end();
  }
}

function expectTaken(r: PromiseSettledResult<unknown>, message: string): void {
  expect(r.status).toBe("rejected");
  const reason = (r as PromiseRejectedResult).reason;
  expect(reason).toBeInstanceOf(ValidationError);
  expect((reason as Error).message).toBe(message);
}

describe("unique names under concurrency (DB unique index)", () => {
  test("concurrent creates with the same name: exactly one wins, the rest get the friendly error", async () => {
    const a = await user("a");
    const rs = await Promise.allSettled(["동시", "동시", " 동시 ", "동시", "동시"].map((n) => createProject(a, n)));
    expect(rs.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    for (const r of rs.filter((x) => x.status === "rejected")) expectTaken(r, PROJECT_TAKEN);
    const [p] = await listProjects(a);
    expect(p.name).toBe("동시");

    const ds = await Promise.allSettled(["운영", "운영", "운영"].map((n) => createDiagram(a, p.id, n)));
    expect(ds.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    for (const r of ds.filter((x) => x.status === "rejected")) expectTaken(r, DIAGRAM_TAKEN);
  });

  test("a create that passed the pre-check but loses to a concurrent insert gets the friendly error (case-insensitive)", async () => {
    const a = await user("a");
    const r = await racedBy((tx) => tx`insert into projects (owner_id, name) values (${a}, ${"Race"})`, () => createProject(a, "race"), "projects");
    expectTaken(r, PROJECT_TAKEN);
    const ps = await listProjects(a);
    expect(ps.map((p) => p.name)).toEqual(["Race"]);

    const d = await racedBy(
      (tx) => tx`insert into diagrams (project_id, name) values (${ps[0].id}, ${"운영"})`,
      () => createDiagram(a, ps[0].id, "운영"),
      "diagrams",
    );
    expectTaken(d, DIAGRAM_TAKEN);
  });

  test("createProjectWithDiagram that loses the race leaves nothing extra behind", async () => {
    const a = await user("a");
    const r = await racedBy(
      (tx) => tx`insert into projects (owner_id, name) values (${a}, ${"쇼핑몰"})`,
      () => createProjectWithDiagram(a, "쇼핑몰", "새 구성도"),
      "projects",
    );
    expectTaken(r, PROJECT_TAKEN);
    expect(await listProjects(a)).toEqual([{ id: expect.any(String), name: "쇼핑몰", diagrams: [] }]);
  });

  test("a rename collision race gets the friendly error and keeps the old name", async () => {
    const a = await user("a");
    const q = await createProject(a, "원래");
    const r = await racedBy(
      (tx) => tx`insert into projects (owner_id, name) values (${a}, ${"목표"})`,
      () => renameProject(a, q.id, "목표"),
      "projects",
    );
    expectTaken(r, PROJECT_TAKEN);
    expect((await listProjects(a)).find((p) => p.id === q.id)?.name).toBe("원래");

    const d = await createDiagram(a, q.id, "하나");
    const rd = await racedBy(
      (tx) => tx`insert into diagrams (project_id, name) values (${q.id}, ${"둘"})`,
      () => renameDiagram(a, d.id, "둘"),
      "diagrams",
    );
    expectTaken(rd, DIAGRAM_TAKEN);
    expect((await getDiagram(a, d.id)).name).toBe("하나");
  });

  test("a duplicate that loses the race for its copy name retries with the next number", async () => {
    const a = await user("a"); const p = await createProject(a, "x");
    const d = await createDiagram(a, p.id, "운영");
    const r = await racedBy(
      (tx) => tx`insert into diagrams (project_id, name) values (${p.id}, ${"운영 사본"})`,
      () => duplicateDiagram(a, d.id),
      "diagrams",
    );
    expect(r.status).toBe("fulfilled");
    const copy = (r as PromiseFulfilledResult<{ id: string; name: string }>).value;
    expect(copy.name).toBe("운영 사본 2");
    expect((await getDiagram(a, copy.id)).latest.number).toBe(1);

    const many = await Promise.all([duplicateDiagram(a, d.id), duplicateDiagram(a, d.id), duplicateDiagram(a, d.id)]);
    expect(new Set(many.map((m) => m.name.toLowerCase())).size).toBe(3);
  });

  test("the DB itself rejects a case-insensitive duplicate without the app pre-check", async () => {
    const a = await user("a");
    const [p] = await db.insert(projects).values({ ownerId: a, name: "Shop" }).returning({ id: projects.id });
    await expect(db.insert(projects).values({ ownerId: a, name: "SHOP" })).rejects.toMatchObject({
      cause: { code: "23505", constraint_name: "projects_owner_name_uidx" },
    });
    await db.insert(diagrams).values({ projectId: p.id, name: "운영" });
    await expect(db.insert(diagrams).values({ projectId: p.id, name: "운영" })).rejects.toMatchObject({
      cause: { code: "23505", constraint_name: "diagrams_project_name_uidx" },
    });
  });
});

describe("0004 migration renames existing duplicates", () => {
  const statements = readFileSync(path.resolve(process.cwd(), "src/db/migrations/0004_unique_names.sql"), "utf8")
    .split("--> statement-breakpoint")
    .map((x) => x.trim())
    .filter(Boolean);
  const kind = (x: string) =>
    x.includes("DO $$") ? "rename" : x.startsWith("CREATE UNIQUE INDEX") ? "index" : /^(--[^\n]*\n)*LOCK TABLE/.test(x) ? "lock" : "other";

  test("locks both tables, renames, then creates the unique indexes", () => {
    expect(statements.map(kind)).toEqual(["lock", "rename", "rename", "index", "index"]);
  });

  test("keeps the oldest, numbers the rest with free names within 60 UTF-16 units, then the indexes build", async () => {
    type Seen = { a: string[]; b: string[]; tie: (string | undefined)[]; p: string[]; q: string[] };
    let seen: Seen | undefined;
    // 인덱스를 잠깐 내리고 겹치는 행을 넣은 뒤 마이그레이션 문장을 그대로 돌리고, 끝나면 되돌린다(DDL 도 트랜잭션 안).
    await db
      .transaction(async (tx) => {
        await tx.execute(sql`drop index projects_owner_name_uidx`);
        await tx.execute(sql`drop index diagrams_project_name_uidx`);
        const [a] = await tx.insert(users).values({ username: "mig-a", email: "mig-a@example.com", passwordHash: "x" }).returning({ id: users.id });
        const [b] = await tx.insert(users).values({ username: "mig-b", email: "mig-b@example.com", passwordHash: "x" }).returning({ id: users.id });
        const at = (sec: number) => new Date(Date.UTC(2026, 0, 1, 0, 0, sec));
        const tie = (n: number) => `00000000-0000-4000-8000-00000000000${n}`;
        const longKo = "가".repeat(60);
        const emoji = "😀".repeat(30); // UTF-16 으로 60
        await tx.insert(projects).values([
          { ownerId: a.id, name: "Shop 2", createdAt: at(0) },
          { ownerId: a.id, name: "Shop", createdAt: at(1) },
          { ownerId: a.id, name: "shop", createdAt: at(2) },
          { ownerId: a.id, name: "SHOP", createdAt: at(3) },
          { id: tie(2), ownerId: a.id, name: "같은 시각", createdAt: at(5) },
          { id: tie(1), ownerId: a.id, name: "같은 시각", createdAt: at(5) },
          { ownerId: a.id, name: longKo, createdAt: at(6) },
          { ownerId: a.id, name: longKo, createdAt: at(7) },
          { ownerId: a.id, name: emoji, createdAt: at(8) },
          { ownerId: a.id, name: emoji, createdAt: at(9) },
          { ownerId: b.id, name: "shop", createdAt: at(4) }, // 다른 사용자는 그대로
        ]);
        const [p] = await tx.insert(projects).values({ ownerId: b.id, name: "p", createdAt: at(10) }).returning({ id: projects.id });
        const [q] = await tx.insert(projects).values({ ownerId: b.id, name: "q", createdAt: at(11) }).returning({ id: projects.id });
        await tx.insert(diagrams).values([
          { projectId: p.id, name: "운영", createdAt: at(3) },
          { projectId: p.id, name: "운영", createdAt: at(1) },
          { projectId: p.id, name: "운영 2", createdAt: at(2) },
          { projectId: p.id, name: "운영", createdAt: at(4) },
          { projectId: q.id, name: "운영", createdAt: at(5) }, // 다른 프로젝트는 그대로
        ]);

        // 잠금 → 이름 정리 → 인덱스, 파일 순서 그대로(마이그레이터처럼 한 트랜잭션 안).
        for (const stmt of statements) await tx.execute(sql.raw(stmt));

        const ps = await tx.execute<{ owner_id: string; id: string; name: string }>(
          sql`select owner_id, id, name from projects order by created_at, id`,
        );
        const ds = await tx.execute<{ project_id: string; name: string }>(
          sql`select project_id, name from diagrams order by created_at, id`,
        );
        seen = {
          a: ps.filter((r) => r.owner_id === a.id).map((r) => r.name),
          b: ps.filter((r) => r.owner_id === b.id).map((r) => r.name),
          tie: [tie(1), tie(2)].map((id) => ps.find((r) => r.id === id)?.name),
          p: ds.filter((r) => r.project_id === p.id).map((r) => r.name),
          q: ds.filter((r) => r.project_id === q.id).map((r) => r.name),
        };
        tx.rollback();
      })
      .catch((e: unknown) => {
        if (!(e instanceof TransactionRollbackError)) throw e;
      });

    expect(seen).toEqual({
      a: [
        "Shop 2",
        "Shop",
        "shop 3", // "shop 2" 는 "Shop 2" 와 겹친다
        "SHOP 4", // "SHOP 2", "SHOP 3"(= "shop 3") 도 겹친다
        "같은 시각", // 같은 시각이면 id 가 작은 쪽이 먼저
        "같은 시각 2",
        "가".repeat(60),
        `${"가".repeat(58)} 2`,
        "😀".repeat(30),
        `${"😀".repeat(29)} 2`, // 서로게이트 쌍을 반으로 자르지 않고 UTF-16 60 안에 맞춘다
      ],
      b: ["shop", "p", "q"],
      tie: ["같은 시각", "같은 시각 2"],
      p: ["운영", "운영 2", "운영 3", "운영 4"],
      q: ["운영"],
    });
    // 되돌린 뒤에는 인덱스와 데이터가 원래대로다.
    const idx = await db.execute(sql`select indexname from pg_indexes where indexname in ('projects_owner_name_uidx', 'diagrams_project_name_uidx')`);
    expect(idx).toHaveLength(2);
    expect(await db.execute(sql`select 1 from users where username like 'mig-%'`)).toHaveLength(0);
  });
});
