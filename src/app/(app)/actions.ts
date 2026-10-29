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
  renameDiagram,
  renameProject,
  savePinnedPositions,
  type PinnedPositions,
} from "@/server/projects";
import { importSample } from "@/server/samples";
import { getVersion, listVersions, restoreVersion } from "@/server/versions";

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

const refreshAll = () => revalidatePath("/", "layout");
const refreshDiagram = () => revalidatePath(DIAGRAM_ROUTE, "page");

export async function createProjectAction(name: string): Promise<{ id: string }> {
  return run(async (uid) => {
    const p = await createProject(uid, name);
    refreshAll();
    return { id: p.id };
  });
}

export async function renameProjectAction(projectId: string, name: string): Promise<void> {
  return run(async (uid) => {
    await renameProject(uid, projectId, name);
    refreshAll();
  });
}

export async function deleteProjectAction(projectId: string): Promise<void> {
  return run(async (uid) => {
    await deleteProject(uid, projectId);
    refreshAll();
  });
}

export async function createDiagramAction(projectId: string, name: string): Promise<{ id: string }> {
  return run(async (uid) => {
    const d = await createDiagram(uid, projectId, name);
    refreshAll();
    return d;
  });
}

export async function renameDiagramAction(diagramId: string, name: string): Promise<void> {
  return run(async (uid) => {
    await renameDiagram(uid, diagramId, name);
    refreshAll();
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
  return run(async (uid) => {
    const r = await importSample(uid, diagramId, sampleId);
    refreshDiagram();
    return r;
  });
}

export async function restoreVersionAction(diagramId: string, number: number): Promise<{ number: number }> {
  return run(async (uid) => {
    await getOwnedDiagram(uid, diagramId);
    const r = await restoreVersion(diagramId, number);
    refreshDiagram();
    return r;
  });
}

export async function getVersionAction(diagramId: string, number: number): Promise<DiagramState | null> {
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

export async function savePinnedAction(diagramId: string, positions: PinnedPositions): Promise<void> {
  return run(async (uid) => {
    await savePinnedPositions(uid, diagramId, positions);
    refreshDiagram();
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
