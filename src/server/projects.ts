import { and, asc, eq, sql } from "drizzle-orm";

import { db } from "@/db/client";
import { diagrams, projects } from "@/db/schema";
import { emptyState } from "@/domain/types";
import type { DiagramState } from "@/domain/types";
import { createVersion, getLatestState } from "@/server/versions";

export class NotFoundError extends Error {
  constructor() {
    super("찾을 수 없습니다");
    this.name = "NotFoundError";
  }
}

export type PinnedPositions = Record<string, { x: number; y: number }>;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function assertUuid(id: string): void {
  if (!UUID_RE.test(id)) throw new NotFoundError();
}

function cleanName(name: string): string {
  const n = name.trim();
  if (n.length < 1 || n.length > 60) throw new Error("이름은 1~60자로 입력해 주세요");
  return n;
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

export async function createProject(userId: string, name: string): Promise<{ id: string; name: string }> {
  const [row] = await db
    .insert(projects)
    .values({ ownerId: userId, name: cleanName(name) })
    .returning({ id: projects.id, name: projects.name });
  return row;
}

export async function renameProject(userId: string, projectId: string, name: string): Promise<void> {
  const clean = cleanName(name);
  await assertOwnedProject(userId, projectId);
  await db.update(projects).set({ name: clean, updatedAt: sql`now()` }).where(eq(projects.id, projectId));
}

export async function deleteProject(userId: string, projectId: string): Promise<void> {
  await assertOwnedProject(userId, projectId);
  await db.delete(projects).where(eq(projects.id, projectId));
}

export async function createDiagram(userId: string, projectId: string, name: string): Promise<{ id: string }> {
  const clean = cleanName(name);
  await assertOwnedProject(userId, projectId);
  const [row] = await db.insert(diagrams).values({ projectId, name: clean }).returning({ id: diagrams.id });
  await createVersion(row.id, emptyState(), { source: "import" });
  return { id: row.id };
}

export async function renameDiagram(userId: string, diagramId: string, name: string): Promise<void> {
  const clean = cleanName(name);
  await getOwnedDiagram(userId, diagramId);
  await db.update(diagrams).set({ name: clean, updatedAt: sql`now()` }).where(eq(diagrams.id, diagramId));
}

export async function deleteDiagram(userId: string, diagramId: string): Promise<void> {
  await getOwnedDiagram(userId, diagramId);
  await db.delete(diagrams).where(eq(diagrams.id, diagramId));
}

export async function duplicateDiagram(userId: string, diagramId: string): Promise<{ id: string }> {
  const src = await getOwnedDiagram(userId, diagramId);
  const latest = await getLatestState(diagramId);
  const state: DiagramState = latest?.state ?? emptyState();
  const [row] = await db
    .insert(diagrams)
    .values({ projectId: src.projectId, name: `${src.name} 사본` })
    .returning({ id: diagrams.id });
  await createVersion(row.id, state, { source: "import" });
  return { id: row.id };
}

export async function getDiagram(userId: string, diagramId: string) {
  const d = await getOwnedDiagram(userId, diagramId);
  const latest = (await getLatestState(diagramId)) ?? { number: 0, state: emptyState() };
  return { ...d, latest };
}

export async function savePinnedPositions(
  userId: string,
  diagramId: string,
  positions: PinnedPositions,
): Promise<void> {
  await getOwnedDiagram(userId, diagramId);
  await db.update(diagrams).set({ pinnedPositions: positions }).where(eq(diagrams.id, diagramId));
}

export async function clearPinnedPositions(userId: string, diagramId: string): Promise<void> {
  await savePinnedPositions(userId, diagramId, {});
}
