"use server";

import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";

import { auth, signOut } from "@/auth";
import type { TermEntry } from "@/domain/explain";
import type { DiagramState } from "@/domain/types";
import {
  clearPinnedPositions,
  createDiagram,
  createProjectWithDiagram,
  deleteDiagram,
  deleteProject,
  duplicateDiagram,
  firstDiagramId,
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
import { BusyError, confirmFlow, deleteFlow, removeFlowStep, renameFlow } from "@/server/flows";
import { ensureSeeded, listTerms, updateTerm, type TermPatch } from "@/server/glossary";
import { setWarningIgnoredFor } from "@/server/ignore";
import { confirmLinkGuessFor, rejectLinkGuessFor, removeNoLinkFor } from "@/server/linkGuess";
import { setZoneTypeFor } from "@/server/zoneType";
import { importSample, SAMPLES } from "@/server/samples";
import { listMessages } from "@/server/chat/messages";
import { toGlossaryItem, type GlossaryItem } from "@/domain/glossary-types";
import { GRADE_LABELS, METHOD_LABELS, type LinkMethod, type NetGrade, type NetRule } from "@/domain/network";
import {
  addNetworkType,
  countZonesUsingType,
  deleteNetworkRule,
  deleteNetworkType,
  listNetworkRules,
  listNetworkTypes,
  resetNetworkType,
  setNetworkTypeHidden,
  updateNetworkType,
  upsertNetworkRule,
  type NetTypeRow,
} from "@/server/network";
import { createMcpKey, deleteMcpKey, listMcpKeys } from "@/server/mcpKeys";
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
      if (e instanceof ValidationError || e instanceof BusyError) return { ok: false as const, error: e.message };
      throw e;
    }
  });
}

const validVersion = (n: number) => {
  if (!Number.isInteger(n) || n < 1) notFound();
};

const refreshAll = () => revalidatePath("/", "layout");
const refreshDiagram = () => revalidatePath(DIAGRAM_ROUTE, "page");

/** 첫 구성도 이름. 새 프로젝트는 곧바로 그릴 수 있게 빈 구성도 하나를 함께 만든다. */
const FIRST_DIAGRAM_NAME = "새 구성도";

export async function createProjectAction(name: string): Promise<ActionResult<{ id: string; diagramId: string }>> {
  return runResult(async (uid) => {
    const p = await createProjectWithDiagram(uid, name, FIRST_DIAGRAM_NAME);
    refreshAll();
    return p;
  });
}

export async function renameProjectAction(projectId: string, name: string): Promise<ActionResult> {
  return runResult(async (uid) => {
    await renameProject(uid, projectId, name);
    refreshAll();
    return {};
  });
}

/**
 * leave: 지금 보고 있는 프로젝트를 지울 때 true. 지운 뒤 서버에서 홈으로 보낸다
 * (클라이언트가 나중에 옮기면 액션 응답이 지운 주소를 다시 그려 404 가 잠깐 보인다).
 */
export async function deleteProjectAction(projectId: string, leave = false): Promise<void> {
  await run(async (uid) => {
    await deleteProject(uid, projectId);
    refreshAll();
  });
  if (leave) redirect("/");
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

/** leave: 지금 보고 있는 구성도를 지울 때 true. 같은 프로젝트의 다른 구성도로, 없으면 홈으로 보낸다. */
export async function deleteDiagramAction(diagramId: string, leave = false): Promise<void> {
  const next = await run(async (uid) => {
    const { projectId } = await getOwnedDiagram(uid, diagramId);
    await deleteDiagram(uid, diagramId);
    refreshAll();
    if (!leave) return null;
    const sibling = await firstDiagramId(uid, projectId);
    return sibling ? `/p/${projectId}/d/${sibling}` : "/";
  });
  if (next) redirect(next);
}

/** 사본 이름을 동시에 빼앗겨 몇 번 다시 시도해도 실패하면 그 안내를 데이터로 돌려준다(운영에서는 던진 메시지가 가려진다). */
export async function duplicateDiagramAction(
  diagramId: string,
): Promise<ActionResult<{ id: string; name: string; projectId: string }>> {
  return runResult(async (uid) => {
    const src = await getOwnedDiagram(uid, diagramId);
    const d = await duplicateDiagram(uid, diagramId);
    refreshAll();
    return { id: d.id, name: d.name, projectId: src.projectId };
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

export async function setWarningIgnoredAction(
  diagramId: string,
  warningId: string,
  ignored: boolean,
): Promise<ActionResult<{ number: number | null }>> {
  return runResult(async (uid) => {
    const r = await setWarningIgnoredFor(uid, diagramId, warningId, ignored);
    refreshDiagram();
    return r;
  });
}

export async function setZoneTypeAction(
  diagramId: string,
  groupId: string,
  key: string | null,
): Promise<ActionResult<{ number: number | null }>> {
  return runResult(async (uid) => {
    const r = await setZoneTypeFor(uid, diagramId, groupId, key);
    refreshDiagram();
    return r;
  });
}

export async function confirmLinkGuessAction(
  diagramId: string,
  nodeId: string,
): Promise<ActionResult<{ number: number | null }>> {
  return runResult(async (uid) => {
    const r = await confirmLinkGuessFor(uid, diagramId, nodeId);
    refreshDiagram();
    return r;
  });
}

export async function rejectLinkGuessAction(
  diagramId: string,
  nodeId: string,
): Promise<ActionResult<{ number: number | null; partial: boolean }>> {
  return runResult(async (uid) => {
    const r = await rejectLinkGuessFor(uid, diagramId, nodeId);
    refreshDiagram();
    return r;
  });
}

export async function removeNoLinkAction(
  diagramId: string,
  key: string,
): Promise<ActionResult<{ number: number | null }>> {
  return runResult(async (uid) => {
    const r = await removeNoLinkFor(uid, diagramId, key);
    refreshDiagram();
    return r;
  });
}

// 흐름은 흐름 라우트로 따로 불러오므로 페이지를 다시 그리지 않는다. 대화 차례가 돌고 있으면 BusyError 안내를 데이터로 돌려준다.
export async function renameFlowAction(diagramId: string, key: string, name: string): Promise<ActionResult> {
  return runResult(async (uid) => {
    await renameFlow(uid, diagramId, key, name);
    return {};
  });
}

export async function deleteFlowAction(diagramId: string, key: string): Promise<ActionResult> {
  return runResult(async (uid) => {
    await deleteFlow(uid, diagramId, key);
    return {};
  });
}

export async function confirmFlowAction(diagramId: string, key: string): Promise<ActionResult> {
  return runResult(async (uid) => {
    await confirmFlow(uid, diagramId, key);
    return {};
  });
}

/** 끊긴 흐름의 단계 하나(0부터 센 번호)를 지운다. */
export async function removeFlowStepAction(diagramId: string, key: string, stepIndex: number): Promise<ActionResult> {
  return runResult(async (uid) => {
    await removeFlowStep(uid, diagramId, key, stepIndex);
    return {};
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

/**
 * 설명 본문의 용어 풀이와, 설명을 만드는 동안 사전 정의를 바로 보이는 데 쓰는 로그인 사용자의 사전
 * (비어 있으면 시드를 먼저 복사한다).
 */
export async function listTermsAction(): Promise<TermEntry[]> {
  return run(async (uid) => {
    await ensureSeeded(uid);
    const rows = await listTerms(uid);
    return rows.map((r) => ({
      key: r.key,
      term: r.term,
      definition: r.definition,
      aliases: r.aliases,
      reviewed: r.reviewed,
      source: r.source,
      why: r.why,
      compare: r.compare,
    }));
  });
}

/** 용어 사전 화면용 전체 행(비어 있으면 시드를 먼저 복사한다). */
export async function listGlossaryAction(): Promise<GlossaryItem[]> {
  return run(async (uid) => {
    await ensureSeeded(uid);
    return (await listTerms(uid)).map(toGlossaryItem);
  });
}

type TextPatch = Pick<TermPatch, "term" | "fullName" | "category" | "definition" | "why" | "compare">;

/** 내용만 고친다(검수 상태는 그대로). 길이 오류는 데이터로 돌려준다. */
export async function updateTermAction(id: string, patch: TextPatch): Promise<ActionResult<{ term: GlossaryItem }>> {
  return runResult(async (uid) => {
    await ensureSeeded(uid);
    const { term, fullName, category, definition, why, compare } = patch;
    const row = await updateTerm(uid, id, { term, fullName, category, definition, why, compare });
    revalidatePath("/glossary");
    return { term: toGlossaryItem(row) };
  });
}

export async function setTermReviewedAction(id: string, reviewed: boolean): Promise<ActionResult<{ term: GlossaryItem }>> {
  return runResult(async (uid) => {
    await ensureSeeded(uid);
    const row = await updateTerm(uid, id, { reviewed });
    revalidatePath("/glossary");
    return { term: toGlossaryItem(row) };
  });
}

// ---- 망 지식(망 종류·기관 연결 규칙) ----

export type NetworkRuleRow = NetRule & { id: string };
export type NetworkKnowledgeData = { types: NetTypeRow[]; rules: NetworkRuleRow[] };

const bad = (what: string) => new ValidationError(`${what} 값이 올바르지 않아요`);
const reqString = (v: unknown, what: string): string => {
  if (typeof v !== "string") throw bad(what);
  return v;
};
const reqStrings = (v: unknown, what: string): string[] => {
  if (!Array.isArray(v) || v.some((x) => typeof x !== "string")) throw bad(what);
  return v as string[];
};
const reqBool = (v: unknown, what: string): boolean => {
  if (typeof v !== "boolean") throw bad(what);
  return v;
};
const reqGrade = (v: unknown): NetGrade => {
  if (typeof v !== "string" || !Object.hasOwn(GRADE_LABELS, v)) throw bad("등급");
  return v as NetGrade;
};
const reqMethod = (v: unknown): LinkMethod => {
  if (typeof v !== "string" || !Object.hasOwn(METHOD_LABELS, v)) throw bad("연결 방식");
  return v as LinkMethod;
};

/** 지우기 확인에 보일 수. 지울 때만 세므로(구성도를 모두 훑는다) 목록에는 싣지 않는다. */
export async function countNetworkTypeUsageAction(id: string): Promise<ActionResult<{ count: number }>> {
  return runResult(async (uid) => {
    const key = (await listNetworkTypes(uid)).find((t) => t.id === reqString(id, "종류"))?.key;
    if (!key) throw new NotFoundError();
    return { count: await countZonesUsingType(uid, key) };
  });
}

export async function addNetworkTypeAction(input: {
  name: string;
  aliases: string[];
  description: string;
  grade: NetGrade;
  separated?: boolean;
}): Promise<ActionResult<{ type: NetTypeRow }>> {
  return runResult(async (uid) => {
    const type = await addNetworkType(uid, {
      name: reqString(input?.name, "이름"),
      aliases: reqStrings(input?.aliases, "다른 이름"),
      description: reqString(input?.description, "설명"),
      grade: reqGrade(input?.grade),
      ...(input?.separated === undefined ? {} : { separated: reqBool(input.separated, "망분리 대상") }),
    });
    revalidatePath("/network");
    return { type };
  });
}

export async function updateNetworkTypeAction(
  id: string,
  patch: Partial<{ name: string; aliases: string[]; description: string; grade: NetGrade; separated: boolean }>,
): Promise<ActionResult<{ type: NetTypeRow }>> {
  return runResult(async (uid) => {
    const p: Parameters<typeof updateNetworkType>[2] = {};
    if (patch?.name !== undefined) p.name = reqString(patch.name, "이름");
    if (patch?.aliases !== undefined) p.aliases = reqStrings(patch.aliases, "다른 이름");
    if (patch?.description !== undefined) p.description = reqString(patch.description, "설명");
    if (patch?.grade !== undefined) p.grade = reqGrade(patch.grade);
    if (patch?.separated !== undefined) p.separated = reqBool(patch.separated, "망분리 대상");
    const type = await updateNetworkType(uid, reqString(id, "종류"), p);
    revalidatePath("/network");
    return { type };
  });
}

export async function resetNetworkTypeAction(id: string): Promise<ActionResult<{ type: NetTypeRow }>> {
  return runResult(async (uid) => {
    const type = await resetNetworkType(uid, reqString(id, "종류"));
    revalidatePath("/network");
    return { type };
  });
}

export async function setNetworkTypeHiddenAction(id: string, hidden: boolean): Promise<ActionResult<{ type: NetTypeRow }>> {
  return runResult(async (uid) => {
    if (typeof hidden !== "boolean") throw bad("숨김");
    const type = await setNetworkTypeHidden(uid, reqString(id, "종류"), hidden);
    revalidatePath("/network");
    return { type };
  });
}

/** 지운 종류를 쓰던 규칙도 함께 지워지므로 남은 규칙을 돌려준다. */
export async function deleteNetworkTypeAction(id: string): Promise<ActionResult<{ rules: NetworkRuleRow[] }>> {
  return runResult(async (uid) => {
    await deleteNetworkType(uid, reqString(id, "종류"));
    revalidatePath("/network");
    return { rules: await listNetworkRules(uid) };
  });
}

export async function upsertNetworkRuleAction(rule: {
  a: string;
  b: string;
  method: LinkMethod;
  note?: string;
}): Promise<ActionResult<{ rules: NetworkRuleRow[] }>> {
  return runResult(async (uid) => {
    const note = rule?.note === undefined ? "" : reqString(rule.note, "근거");
    await upsertNetworkRule(uid, {
      a: reqString(rule?.a, "종류"),
      b: reqString(rule?.b, "종류"),
      method: reqMethod(rule?.method),
      note,
    });
    revalidatePath("/network");
    return { rules: await listNetworkRules(uid) };
  });
}

export async function deleteNetworkRuleAction(id: string): Promise<ActionResult<{ rules: NetworkRuleRow[] }>> {
  return runResult(async (uid) => {
    await deleteNetworkRule(uid, reqString(id, "규칙"));
    revalidatePath("/network");
    return { rules: await listNetworkRules(uid) };
  });
}

export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}

/** Claude Code 연결 키. 날짜는 문자열로 넘긴다(화면에서 그대로 보이고 서버 액션 경계도 가볍다). */
export type McpKeyRow = { id: string; name: string; prefix: string; createdAt: string; lastUsedAt: string | null };

const toKeyRow = (k: Awaited<ReturnType<typeof listMcpKeys>>[number]): McpKeyRow => ({
  id: k.id,
  name: k.name,
  prefix: k.prefix,
  createdAt: k.createdAt.toISOString(),
  lastUsedAt: k.lastUsedAt ? k.lastUsedAt.toISOString() : null,
});

export async function listMcpKeysAction(): Promise<ActionResult<{ keys: McpKeyRow[] }>> {
  return runResult(async (uid) => ({ keys: (await listMcpKeys(uid)).map(toKeyRow) }));
}

/** 키 원문은 이 응답으로만 한 번 나간다. */
export async function createMcpKeyAction(name: string): Promise<ActionResult<{ id: string; key: string; prefix: string }>> {
  return runResult(async (uid) => {
    const k = await createMcpKey(uid, typeof name === "string" ? name : "");
    revalidatePath("/claude-code");
    return k;
  });
}

export async function deleteMcpKeyAction(id: string): Promise<ActionResult> {
  return runResult(async (uid) => {
    await deleteMcpKey(uid, reqString(id, "키"));
    revalidatePath("/claude-code");
    return {};
  });
}
