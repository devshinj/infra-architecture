import { eq } from "drizzle-orm";
import { describe, expect, test, vi } from "vitest";

import { db } from "@/db/client";
import { diagrams } from "@/db/schema";
import { emptyState, type DiagramState } from "@/domain/types";
import { confirmAssumptionFor } from "@/server/assumptions";
import { saveFieldsFor } from "@/server/fields";
import { suggestFlows } from "@/server/flowSuggest";
import { confirmFlow, deleteFlow, listFlows, removeFlowStep, renameFlow } from "@/server/flows";
import { createGuideRun, getGuideRun, isLearning, LEARNING_LOCKED_MESSAGE } from "@/server/guide/runs";
import { quitGuide, restoreGuideVersion } from "@/server/guide/start";
import { setWarningIgnoredFor } from "@/server/ignore";
import type { QwenClient } from "@/server/llm/qwen";
import { confirmLinkGuessFor, rejectLinkGuessFor, removeNoLinkFor } from "@/server/linkGuess";
import { applyMcpCommands, restoreMcpVersion } from "@/server/mcp/apply";
import {
  clearPinnedPositions,
  deleteDiagram,
  duplicateDiagram,
  getOwnedDiagram,
  renameDiagram,
  savePinnedPositions,
  ValidationError,
} from "@/server/projects";
import { importSample, SAMPLES } from "@/server/samples";
import { createVersion, getLatestState } from "@/server/versions";
import { setZoneTypeFor } from "@/server/zoneType";

import { makeOwnedDiagram } from "./helpers";

function sample(): DiagramState {
  const s = emptyState();
  s.nodes.web = { id: "web", kind: "web_server", label: "웹", parent: null, attrs: {} };
  s.nodes.was = { id: "was", kind: "was", label: "WAS", parent: null, attrs: {} };
  s.edges.e1 = { id: "e1", from: "web", to: "was", edgeKind: "request" };
  return s;
}

/** 학습 중인 구성도(버전 1 하나). */
async function learning() {
  const ids = await makeOwnedDiagram();
  await createVersion(ids.diagramId, sample(), { source: "import" });
  await createGuideRun({ diagramId: ids.diagramId, guideId: "shop", env: "onprem" });
  return ids;
}

const versionCount = async (diagramId: string) => (await getLatestState(diagramId))?.number ?? 0;

function fakeQwen() {
  const chat = vi.fn();
  return { qwen: { chat } as unknown as QwenClient, chat };
}

/** 잠금 문구로 거절된다. */
async function expectLocked(p: Promise<unknown>) {
  const err = await p.then(
    () => null,
    (e: unknown) => e,
  );
  expect(err).toBeInstanceOf(ValidationError);
  expect((err as Error).message).toBe(LEARNING_LOCKED_MESSAGE);
}

/** 잠금 문구로는 거절되지 않는다(다른 이유로 실패하는 건 괜찮다). */
async function expectNotLocked(p: Promise<unknown>) {
  const err = await p.then(
    () => null,
    (e: unknown) => e,
  );
  expect((err as Error | null)?.message).not.toBe(LEARNING_LOCKED_MESSAGE);
}

describe("learning lock", () => {
  test("field edits are locked", async () => {
    const { userId, diagramId } = await learning();
    await expectLocked(saveFieldsFor(userId, diagramId, { targetKind: "node", targetId: "web", values: { a: "b" }, unknown: [] }));
    expect(await versionCount(diagramId)).toBe(1);
  });

  test("assumption confirm is locked", async () => {
    const { userId, diagramId } = await learning();
    await expectLocked(confirmAssumptionFor(userId, diagramId, "scale", "100"));
    expect(await versionCount(diagramId)).toBe(1);
  });

  test("warning ignore is locked", async () => {
    const { userId, diagramId } = await learning();
    await expectLocked(setWarningIgnoredFor(userId, diagramId, "spof:web", true));
    expect(await versionCount(diagramId)).toBe(1);
  });

  test("zone type is locked", async () => {
    const { userId, diagramId } = await learning();
    await expectLocked(setZoneTypeFor(userId, diagramId, "biz", null));
    expect(await versionCount(diagramId)).toBe(1);
  });

  test("link guess actions are locked", async () => {
    const { userId, diagramId } = await learning();
    await expectLocked(confirmLinkGuessFor(userId, diagramId, "link"));
    await expectLocked(rejectLinkGuessFor(userId, diagramId, "link"));
    await expectLocked(removeNoLinkFor(userId, diagramId, "a|b"));
    expect(await versionCount(diagramId)).toBe(1);
  });

  test("flow edits are locked", async () => {
    const { userId, diagramId } = await learning();
    await expectLocked(renameFlow(userId, diagramId, "login", "새 이름"));
    await expectLocked(deleteFlow(userId, diagramId, "login"));
    await expectLocked(confirmFlow(userId, diagramId, "login"));
    await expectLocked(removeFlowStep(userId, diagramId, "login", 0));
  });

  test("auto flow suggest is a silent no-op", async () => {
    const { userId, diagramId } = await learning();
    const { qwen, chat } = fakeQwen();
    expect(await suggestFlows(userId, diagramId, { auto: true }, { qwen })).toEqual({ ok: true, saved: 0 });
    expect(chat).not.toHaveBeenCalled();
    const [row] = await db.select({ at: diagrams.flowsSuggestedAt }).from(diagrams).where(eq(diagrams.id, diagramId));
    expect(row.at).toBeNull();
    expect(await listFlows(userId, diagramId)).toEqual([]);
  });

  test("manual flow suggest is refused", async () => {
    const { userId, diagramId } = await learning();
    const { qwen, chat } = fakeQwen();
    expect(await suggestFlows(userId, diagramId, { auto: false }, { qwen })).toEqual({ ok: false, message: LEARNING_LOCKED_MESSAGE });
    expect(chat).not.toHaveBeenCalled();
  });

  test("sample import is locked", async () => {
    const { userId, diagramId } = await learning();
    await expectLocked(importSample(userId, diagramId, SAMPLES[0]!.id));
    expect(await versionCount(diagramId)).toBe(1);
  });

  test("mcp writes are refused", async () => {
    const { userId, diagramId } = await learning();
    const r = await applyMcpCommands({
      userId,
      diagramId,
      baseVersion: 1,
      commands: [{ op: "add_node", id: "x", kind: "db_rdb", label: "DB", parent: null }],
    });
    expect(r).toMatchObject({ ok: false, kind: "locked", message: LEARNING_LOCKED_MESSAGE });
    const dry = await applyMcpCommands({ userId, diagramId, baseVersion: 1, commands: [], dryRun: true });
    expect(dry).toMatchObject({ ok: false, message: LEARNING_LOCKED_MESSAGE });
    const restored = await restoreMcpVersion({ userId, diagramId, baseVersion: 1, number: 1 });
    expect(restored).toMatchObject({ ok: false, kind: "locked", message: LEARNING_LOCKED_MESSAGE });
    expect(await versionCount(diagramId)).toBe(1);
  });

  test("pins, restore and duplicate still work", async () => {
    const { userId, diagramId } = await learning();
    await savePinnedPositions(userId, diagramId, { web: { x: 1, y: 2 } });
    expect((await getOwnedDiagram(userId, diagramId)).pinnedPositions).toEqual({ web: { x: 1, y: 2 } });
    await clearPinnedPositions(userId, diagramId);
    expect((await getOwnedDiagram(userId, diagramId)).pinnedPositions).toEqual({});

    const r = await restoreGuideVersion(diagramId, 1);
    expect(r.ok).toBe(true);
    expect(await versionCount(diagramId)).toBe(2);

    await renameDiagram(userId, diagramId, "새 이름");
    const copy = await duplicateDiagram(userId, diagramId);
    expect(copy.id).not.toBe(diagramId);
    await deleteDiagram(userId, copy.id);
  });

  test("the duplicate is a normal diagram", async () => {
    const { userId, diagramId } = await learning();
    const copy = await duplicateDiagram(userId, diagramId);
    expect(await getGuideRun(copy.id)).toBeNull();
    expect(await isLearning(copy.id)).toBe(false);
    await confirmAssumptionFor(userId, copy.id, "scale", "100");
    expect(await versionCount(copy.id)).toBe(2);
    // 원본은 그대로 학습 중이다.
    expect(await isLearning(diagramId)).toBe(true);
  });

  test("everything unlocks after quit", async () => {
    const { userId, diagramId } = await learning();
    await quitGuide(userId, diagramId);
    expect(await isLearning(diagramId)).toBe(false);
    await confirmAssumptionFor(userId, diagramId, "scale", "100");
    await expectNotLocked(saveFieldsFor(userId, diagramId, { targetKind: "node", targetId: "web", values: {}, unknown: [] }));
    await expectNotLocked(setWarningIgnoredFor(userId, diagramId, "spof:web", true));
    await expectNotLocked(setZoneTypeFor(userId, diagramId, "biz", null));
    await expectNotLocked(confirmLinkGuessFor(userId, diagramId, "link"));
    await expectNotLocked(renameFlow(userId, diagramId, "login", "새 이름"));
    await importSample(userId, diagramId, SAMPLES[0]!.id);
    const latest = await versionCount(diagramId);
    const r = await applyMcpCommands({
      userId,
      diagramId,
      baseVersion: latest,
      commands: [{ op: "add_node", id: "x", kind: "db_rdb", label: "DB", parent: null }],
    });
    expect(r.ok).toBe(true);
    const back = await restoreMcpVersion({ userId, diagramId, baseVersion: latest + 1, number: 1 });
    expect(back.ok).toBe(true);
    const manual = await suggestFlows(userId, diagramId, { auto: false }, { qwen: null });
    expect(manual).not.toEqual({ ok: false, message: LEARNING_LOCKED_MESSAGE });
  });
});
