import { and, asc, desc, eq, ne, sql } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db/client";
import { diagramVersions, diagrams, projects } from "@/db/schema";
import { emptyState } from "@/domain/types";
import type { DiagramState } from "@/domain/types";
import { createVersion, getLatestState } from "@/server/versions";

export class NotFoundError extends Error {
  constructor() {
    super("찾을 수 없습니다");
    this.name = "NotFoundError";
  }
}

/** 사용자에게 그대로 보여줄 수 있는 입력 검증 실패. */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export type PinnedPositions = Record<string, { x: number; y: number }>;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function assertUuid(id: string): void {
  if (!UUID_RE.test(id)) throw new NotFoundError();
}

const NAME_MAX = 60;

function cleanName(name: string): string {
  const n = name.trim();
  if (n.length < 1 || n.length > NAME_MAX) throw new ValidationError("이름은 1~60자로 입력해 주세요");
  return n;
}

// 목록에서 서로 구별되도록 같은 사용자의 프로젝트, 같은 프로젝트의 구성도끼리는 이름이 겹치지 않게 한다(대소문자 무시).
const sameName = (col: typeof projects.name | typeof diagrams.name, name: string) => sql`lower(${col}) = lower(${name})`;

async function assertUniqueProjectName(userId: string, name: string, exceptId?: string): Promise<void> {
  const [row] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.ownerId, userId), sameName(projects.name, name), exceptId ? ne(projects.id, exceptId) : undefined))
    .limit(1);
  if (row) throw new ValidationError("같은 이름의 프로젝트가 이미 있어요. 다른 이름을 써 주세요");
}

async function assertUniqueDiagramName(projectId: string, name: string, exceptId?: string): Promise<void> {
  const [row] = await db
    .select({ id: diagrams.id })
    .from(diagrams)
    .where(and(eq(diagrams.projectId, projectId), sameName(diagrams.name, name), exceptId ? ne(diagrams.id, exceptId) : undefined))
    .limit(1);
  if (row) throw new ValidationError("이 프로젝트에 같은 이름의 구성도가 이미 있어요. 다른 이름을 써 주세요");
}

/** ‘이름 사본’, ‘이름 사본 2’ … 중 프로젝트 안에서 비어 있는 첫 이름. 60자를 넘으면 원래 이름 쪽을 줄인다. */
export function copyName(base: string, taken: readonly string[]): string {
  const used = new Set(taken.map((t) => t.toLowerCase()));
  for (let i = 1; ; i++) {
    const suffix = i === 1 ? " 사본" : ` 사본 ${i}`;
    const name = `${base.slice(0, NAME_MAX - suffix.length).trimEnd()}${suffix}`;
    if (!used.has(name.toLowerCase())) return name;
  }
}

async function assertOwnedProject(userId: string, projectId: string): Promise<void> {
  assertUuid(projectId);
  const [row] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.ownerId, userId)));
  if (!row) throw new NotFoundError();
}

/** 소유자 검사를 거쳐 구성도 행을 돌려준다. 남의 것·없는 것·잘못된 id 모두 NotFoundError. */
export async function getOwnedDiagram(userId: string, diagramId: string) {
  assertUuid(diagramId);
  const [row] = await db
    .select({
      id: diagrams.id,
      name: diagrams.name,
      projectId: diagrams.projectId,
      pinnedPositions: diagrams.pinnedPositions,
    })
    .from(diagrams)
    .innerJoin(projects, eq(projects.id, diagrams.projectId))
    .where(and(eq(diagrams.id, diagramId), eq(projects.ownerId, userId)));
  if (!row) throw new NotFoundError();
  return row;
}

export async function listProjects(userId: string) {
  const ps = await db
    .select({ id: projects.id, name: projects.name })
    .from(projects)
    .where(eq(projects.ownerId, userId))
    .orderBy(asc(projects.createdAt), asc(projects.id));
  if (ps.length === 0) return [];
  const ds = await db
    .select({ id: diagrams.id, name: diagrams.name, projectId: diagrams.projectId })
    .from(diagrams)
    .innerJoin(projects, eq(projects.id, diagrams.projectId))
    .where(eq(projects.ownerId, userId))
    .orderBy(asc(diagrams.createdAt), asc(diagrams.id));
  return ps.map((p) => ({
    id: p.id,
    name: p.name,
    diagrams: ds.filter((d) => d.projectId === p.id).map((d) => ({ id: d.id, name: d.name })),
  }));
}

/**
 * 가장 최근에 손댄 구성도(마지막 버전 또는 이름 바꾼 시각 기준). 홈에서 이어서 작업할 곳으로 보낸다.
 * 구성도가 하나도 없으면 null.
 */
export async function lastActiveDiagram(userId: string): Promise<{ id: string; projectId: string } | null> {
  const touched = sql`greatest(${diagrams.updatedAt}, (select max(${diagramVersions.createdAt}) from ${diagramVersions} where ${diagramVersions.diagramId} = ${diagrams.id}))`;
  const [row] = await db
    .select({ id: diagrams.id, projectId: diagrams.projectId })
    .from(diagrams)
    .innerJoin(projects, eq(projects.id, diagrams.projectId))
    .where(eq(projects.ownerId, userId))
    .orderBy(desc(touched), desc(diagrams.createdAt), desc(diagrams.id))
    .limit(1);
  return row ?? null;
}

export async function createProject(userId: string, name: string): Promise<{ id: string; name: string }> {
  const clean = cleanName(name);
  await assertUniqueProjectName(userId, clean);
  const [row] = await db
    .insert(projects)
    .values({ ownerId: userId, name: clean })
    .returning({ id: projects.id, name: projects.name });
  return row;
}

/**
 * 프로젝트와 첫 구성도를 함께 만든다. 구성도를 못 만들면 방금 만든 프로젝트를 지워
 * 빈 프로젝트가 남거나, 다시 시도할 때 같은 이름에 막히지 않게 한다.
 */
export async function createProjectWithDiagram(
  userId: string,
  name: string,
  diagramName: string,
): Promise<{ id: string; diagramId: string }> {
  const p = await createProject(userId, name);
  try {
    const d = await createDiagram(userId, p.id, diagramName);
    return { id: p.id, diagramId: d.id };
  } catch (e) {
    await db.delete(projects).where(eq(projects.id, p.id));
    throw e;
  }
}

export async function renameProject(userId: string, projectId: string, name: string): Promise<void> {
  const clean = cleanName(name);
  await assertOwnedProject(userId, projectId);
  await assertUniqueProjectName(userId, clean, projectId);
  await db.update(projects).set({ name: clean, updatedAt: sql`now()` }).where(eq(projects.id, projectId));
}

export async function deleteProject(userId: string, projectId: string): Promise<void> {
  await assertOwnedProject(userId, projectId);
  await db.delete(projects).where(eq(projects.id, projectId));
}

export async function createDiagram(userId: string, projectId: string, name: string): Promise<{ id: string }> {
  const clean = cleanName(name);
  await assertOwnedProject(userId, projectId);
  await assertUniqueDiagramName(projectId, clean);
  const [row] = await db.insert(diagrams).values({ projectId, name: clean }).returning({ id: diagrams.id });
  await createVersion(row.id, emptyState(), { source: "import" });
  return { id: row.id };
}

export async function renameDiagram(userId: string, diagramId: string, name: string): Promise<void> {
  const clean = cleanName(name);
  const d = await getOwnedDiagram(userId, diagramId);
  await assertUniqueDiagramName(d.projectId, clean, diagramId);
  await db.update(diagrams).set({ name: clean, updatedAt: sql`now()` }).where(eq(diagrams.id, diagramId));
}

export async function deleteDiagram(userId: string, diagramId: string): Promise<void> {
  await getOwnedDiagram(userId, diagramId);
  await db.delete(diagrams).where(eq(diagrams.id, diagramId));
}

export async function duplicateDiagram(userId: string, diagramId: string): Promise<{ id: string; name: string }> {
  const src = await getOwnedDiagram(userId, diagramId);
  const latest = await getLatestState(diagramId);
  const state: DiagramState = latest?.state ?? emptyState();
  const siblings = await db.select({ name: diagrams.name }).from(diagrams).where(eq(diagrams.projectId, src.projectId));
  const [row] = await db
    .insert(diagrams)
    .values({ projectId: src.projectId, name: copyName(src.name, siblings.map((x) => x.name)) })
    .returning({ id: diagrams.id, name: diagrams.name });
  await createVersion(row.id, state, { source: "import" });
  return row;
}

export async function getDiagram(userId: string, diagramId: string) {
  const d = await getOwnedDiagram(userId, diagramId);
  const latest = (await getLatestState(diagramId)) ?? { number: 0, state: emptyState() };
  return { ...d, latest };
}

const PIN_KEY_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;
const coord = z.number().refine((v) => Number.isFinite(v) && Math.abs(v) <= 1_000_000);
const pinnedSchema = z
  .record(z.string().regex(PIN_KEY_RE), z.object({ x: coord, y: coord }).strict())
  .refine((o) => Object.keys(o).length <= 2000);

function parsePinned(positions: unknown): PinnedPositions {
  const fail = () => new ValidationError("위치 정보가 올바르지 않습니다");
  if (typeof positions !== "object" || positions === null || Array.isArray(positions)) throw fail();
  const proto = Object.getPrototypeOf(positions);
  if (proto !== Object.prototype && proto !== null) throw fail();
  // zod 는 __proto__ 키를 프로토타입에 대입해 조용히 버리므로, 원본 키를 먼저 직접 검사한다.
  if (!Object.keys(positions).every((k) => PIN_KEY_RE.test(k))) throw fail();
  const r = pinnedSchema.safeParse(positions);
  if (!r.success) throw fail();
  return r.data;
}

export async function savePinnedPositions(
  userId: string,
  diagramId: string,
  positions: PinnedPositions,
): Promise<void> {
  await getOwnedDiagram(userId, diagramId);
  const clean = parsePinned(positions);
  await db.update(diagrams).set({ pinnedPositions: clean }).where(eq(diagrams.id, diagramId));
}

export async function clearPinnedPositions(userId: string, diagramId: string): Promise<void> {
  await savePinnedPositions(userId, diagramId, {});
}
