"use server";

import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";

import { auth, signOut } from "@/auth";
import type { DiagramState } from "@/domain/types";
import {
  clearPinnedPositions,
  createDiagram,
  createProject,
  deleteDiagram,
  deleteProject,
  duplicateDiagram,
  getOwnedDiagram,
  NotFoundError,
  ValidationError,
  renameDiagram,
  renameProject,
  savePinnedPositions,
  type PinnedPositions,
} from "@/server/projects";
import { confirmAssumptionFor } from "@/server/assumptions";
import { saveFieldsFor, type SaveFieldsInput } from "@/server/fields";
import { importSample, SAMPLES } from "@/server/samples";
import { listMessages } from "@/server/chat/messages";
import { getVersion, listVersions, restoreVersionWithMessage } from "@/server/versions";

const DIAGRAM_ROUTE = "/p/[projectId]/d/[diagramId]";

async function userId(): Promise<string> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) redirect("/login");
  return id;
}

/** Every action runs as the signed-in owner; a missing/foreign resource becomes a 404. */
async function run<T>(fn: (uid: string) => Promise<T>): Promise<T> {
  const uid = await userId();
  try {
    return await fn(uid);
  } catch (e) {
    if (e instanceof NotFoundError) notFound();
    throw e;
  }
}

/** Expected validation failures come back as data: Next hides thrown messages in production. */
export type ActionResult<T extends object = object> = ({ ok: true } & T) | { ok: false; error: string };

async function runResult<T extends object>(fn: (uid: string) => Promise<T>): Promise<ActionResult<T>> {
  return run(async (uid) => {
    try {
      return { ok: true as const, ...(await fn(uid)) };
    } catch (e) {
      if (e instanceof ValidationError) return { ok: false as const, error: e.message };
      throw e;
    }
  });
}

const validVersion = (n: number) => {
  if (!Number.isInteger(n) || n < 1) notFound();
};

const refreshAll = () => revalidatePath("/", "layout");
const refreshDiagram = () => revalidatePath(DIAGRAM_ROUTE, "page");

export async function createProjectAction(name: string): Promise<ActionResult<{ id: string }>> {
  return runResult(async (uid) => {
    const p = await createProject(uid, name);
    refreshAll();
    return { id: p.id };
  });
}

export async function renameProjectAction(projectId: string, name: string): Promise<ActionResult> {
  return runResult(async (uid) => {
    await renameProject(uid, projectId, name);
    refreshAll();
    return {};
  });
}

export async function deleteProjectAction(projectId: string): Promise<void> {
  return run(async (uid) => {
    await deleteProject(uid, projectId);
    refreshAll();
  });
}

export async function createDiagramAction(projectId: string, name: string): Promise<ActionResult<{ id: string }>> {
  return runResult(async (uid) => {
    const d = await createDiagram(uid, projectId, name);
    refreshAll();
    return d;
  });
}

export async function renameDiagramAction(diagramId: string, name: string): Promise<ActionResult> {
  return runResult(async (uid) => {
    await renameDiagram(uid, diagramId, name);
    refreshAll();
    return {};
  });
}

export async function deleteDiagramAction(diagramId: string): Promise<void> {
  return run(async (uid) => {
    await deleteDiagram(uid, diagramId);
    refreshAll();
  });
}

export async function duplicateDiagramAction(diagramId: string): Promise<{ id: string; projectId: string }> {
  return run(async (uid) => {
    const src = await getOwnedDiagram(uid, diagramId);
    const d = await duplicateDiagram(uid, diagramId);
    refreshAll();
    return { id: d.id, projectId: src.projectId };
  });
}

export async function importSampleAction(diagramId: string, sampleId: string): Promise<{ number: number }> {
  if (!SAMPLES.some((x) => x.id === sampleId)) notFound();
  return run(async (uid) => {
    const r = await importSample(uid, diagramId, sampleId);
    refreshDiagram();
    return r;
  });
}

export async function restoreVersionAction(diagramId: string, number: number): Promise<{ number: number }> {
  validVersion(number);
  return run(async (uid) => {
    await getOwnedDiagram(uid, diagramId);
    if ((await getVersion(diagramId, number)) === null) notFound();
    const r = await restoreVersionWithMessage(diagramId, number);
    refreshDiagram();
    return r;
  });
}

export async function getVersionAction(diagramId: string, number: number): Promise<DiagramState | null> {
  validVersion(number);
  return run(async (uid) => {
    await getOwnedDiagram(uid, diagramId);
    return getVersion(diagramId, number);
  });
}

export async function listVersionsAction(diagramId: string) {
  return run(async (uid) => {
    await getOwnedDiagram(uid, diagramId);
    return listVersions(diagramId);
  });
}

export async function listMessagesAction(diagramId: string) {
  return run(async (uid) => {
    await getOwnedDiagram(uid, diagramId);
    const rows = await listMessages(diagramId, 100);
    return rows.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() }));
  });
}

export async function confirmAssumptionAction(
  diagramId: string,
  key: string,
  value: string,
): Promise<ActionResult<{ number: number }>> {
  return runResult(async (uid) => {
    const r = await confirmAssumptionFor(uid, diagramId, key, value);
    refreshDiagram();
    return r;
  });
}

export async function saveFieldsAction(
  diagramId: string,
  input: SaveFieldsInput,
): Promise<ActionResult<{ number: number | null }>> {
  return runResult(async (uid) => {
    const r = await saveFieldsFor(uid, diagramId, input);
    refreshDiagram();
    return r;
  });
}

export async function savePinnedAction(diagramId: string, positions: PinnedPositions): Promise<ActionResult> {
  return runResult(async (uid) => {
    await savePinnedPositions(uid, diagramId, positions);
    refreshDiagram();
    return {};
  });
}

export async function clearPinnedAction(diagramId: string): Promise<void> {
  return run(async (uid) => {
    await clearPinnedPositions(uid, diagramId);
    refreshDiagram();
  });
}

export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}
