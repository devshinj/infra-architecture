import { and, eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { db } from "@/db/client";
import { diagrams, explanations, flows, projects } from "@/db/schema";
import { signatureOf, type ExplainTargetKind } from "@/domain/explain";
import { getGuide } from "@/domain/guides";
import type { GuideEnv } from "@/domain/guides/types";
import { listMessages } from "@/server/chat/messages";
import { runChatTurn, type ChatDeps } from "@/server/chat/pipeline";
import { getGuideRun, isLearning, saveGuideRun } from "@/server/guide/runs";
import {
  GUIDE_QUIT_MESSAGE,
  LEARNING_PROJECT_NAME,
  liveGuideView,
  quitGuide,
  restoreGuideVersion,
  startGuide,
  syncGuideAfterRestore,
} from "@/server/guide/start";
import type { ClefClient } from "@/server/llm/clef";
import type { QwenClient } from "@/server/llm/qwen";
import { NotFoundError, ValidationError } from "@/server/projects";
import { withDiagramLock } from "@/server/chat/lock";
import { getLatestState, listVersions, restoreVersionWithMessage } from "@/server/versions";

import { makeOwnedDiagram } from "./helpers";

const SHOP = getGuide("shop")!;
const ONPREM = SHOP.variants.onprem!;
const CLOUD = SHOP.variants.cloud!;

const clefDown: ClefClient = {
  async decide() {
    throw new Error("clef down");
  },
  async classifyIntent() {
    throw new Error("classifyIntent must not be called while learning");
  },
};
const neverQwen: QwenClient = {
  async streamCompletion() {
    throw new Error("qwen must not be called");
  },
};
const deps: ChatDeps = { qwen: neverQwen, clef: clefDown };

/** 사용자 하나(빈 프로젝트 "p" 하나)를 만든다. */
async function makeUser(): Promise<string> {
  return (await makeOwnedDiagram()).userId;
}

/** 대본의 예시 문장을 보내 from 단계부터 count 개를 마친다. */
async function doSteps(userId: string, diagramId: string, count: number, variant = ONPREM, from = 0): Promise<void> {
  for (const step of variant.steps.slice(from, from + count)) {
    const events: { t: string }[] = [];
    await runChatTurn({ userId, diagramId, text: step.example, signal: new AbortController().signal, emit: (e) => events.push(e) }, deps);
    expect(events.filter((e) => e.t === "error")).toEqual([]);
  }
}

const learningProjects = (userId: string) =>
  db.select({ id: projects.id }).from(projects).where(and(eq(projects.ownerId, userId), eq(projects.name, LEARNING_PROJECT_NAME)));

const flowKeys = async (diagramId: string) =>
  (await db.select({ key: flows.key }).from(flows).where(eq(flows.diagramId, diagramId))).map((f) => f.key).sort();

async function addFlowRow(diagramId: string, key: string): Promise<void> {
  await db.insert(flows).values({ diagramId, key, data: { id: key, name: key, origin: "user", steps: [] }, source: "user", reviewed: true });
}

beforeEach(() => {
  vi.spyOn(console, "info").mockImplementation(() => {});
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe("startGuide", () => {
  test("startGuide creates the learning project once and a diagram per start", async () => {
    const userId = await makeUser();
    const a = await startGuide(userId, "shop", null);
    const b = await startGuide(userId, "shop", null);
    const c = await startGuide(userId, "shop", "onprem");
    expect(b.projectId).toBe(a.projectId);
    expect(c.projectId).toBe(a.projectId);
    expect(new Set([a.diagramId, b.diagramId, c.diagramId]).size).toBe(3);
    expect(await learningProjects(userId)).toHaveLength(1);

    const runs = await Promise.all([a, b, c].map((x) => getGuideRun(x.diagramId)));
    expect(runs.map((r) => r?.status)).toEqual(["active", "active", "active"]);
    const names = await db.select({ id: diagrams.id, name: diagrams.name }).from(diagrams).where(eq(diagrams.projectId, a.projectId));
    const nameOf = (id: string) => names.find((n) => n.id === id)?.name;
    expect(nameOf(a.diagramId)).toBe(SHOP.title);
    expect(nameOf(b.diagramId)).toBe(`${SHOP.title} 사본`);
    expect(nameOf(c.diagramId)).toBe(`${SHOP.title} (온프레미스)`);
  });

  test("startGuide reuses an existing learning project", async () => {
    const userId = await makeUser();
    const [p] = await db.insert(projects).values({ ownerId: userId, name: LEARNING_PROJECT_NAME }).returning({ id: projects.id });
    const r = await startGuide(userId, "shop", "cloud");
    expect(r.projectId).toBe(p.id);
  });

  test("startGuide with env confirms it and posts the first step", async () => {
    const userId = await makeUser();
    const { diagramId } = await startGuide(userId, "shop", "onprem");
    expect(await getGuideRun(diagramId)).toEqual({
      diagramId,
      guideId: "shop",
      env: "onprem",
      envVersion: 2,
      step: 0,
      stepVersions: [],
      marks: [{ version: 2, env: "onprem", envVersion: 2, stepVersions: [] }],
      status: "active",
    });
    const versions = await listVersions(diagramId);
    expect(versions.map((v) => [v.number, v.source, v.summary])).toEqual([
      [2, "ai", "학습: 환경 온프레미스"],
      [1, "import", null],
    ]);
    const state = (await getLatestState(diagramId))!.state;
    expect(state.assumptions.environment).toMatchObject({ value: ONPREM.environment, confirmed: true });

    // 메시지는 확정 안내 하나뿐이다(R3). 첫 대화라 가상 값 안내가 붙는다. 첫 단계는 카드(GuideView)가 보인다.
    const msgs = await listMessages(diagramId);
    expect(msgs).toHaveLength(1);
    expect(msgs[0]).toMatchObject({ role: "assistant", content: "온프레미스로 진행합니다. 위 카드의 이번 단계를 말로 요청해 보세요.\n값은 예시입니다." });
    expect(await liveGuideView(diagramId)).toMatchObject({
      env: "onprem",
      step: 0,
      total: ONPREM.steps.length,
      status: "active",
      current: { goal: ONPREM.steps[0]!.goal, example: ONPREM.steps[0]!.example },
    });
  });

  test("startGuide without env posts the env question", async () => {
    const userId = await makeUser();
    const { diagramId } = await startGuide(userId, "shop", null);
    expect(await getGuideRun(diagramId)).toMatchObject({ env: null, envVersion: null, step: 0, stepVersions: [], status: "active" });
    expect((await listVersions(diagramId)).map((v) => v.number)).toEqual([1]);
    const msgs = await listMessages(diagramId);
    expect(msgs).toHaveLength(1);
    const content = `${SHOP.envIntro}\n값은 예시입니다.`;
    expect(msgs[0]).toMatchObject({ role: "assistant", content, meta: { guide: { kind: "env", envChoices: ["onprem", "cloud"] }, says: [content], changed: 0, version: null } });
    expect(await liveGuideView(diagramId)).toMatchObject({ env: null, envChoices: ["onprem", "cloud"], current: null });
  });

  test("startGuide rejects an unknown guide or env", async () => {
    const userId = await makeUser();
    await expect(startGuide(userId, "nope", null)).rejects.toBeInstanceOf(ValidationError);
    await expect(startGuide(userId, "shop", "mars" as GuideEnv)).rejects.toBeInstanceOf(ValidationError);
    await expect(startGuide(userId, "shop", "toString" as GuideEnv)).rejects.toBeInstanceOf(ValidationError);
    // 검사에 걸리면 아무것도 만들지 않는다.
    expect(await learningProjects(userId)).toEqual([]);
  });
});

describe("quitGuide", () => {
  test("quitGuide stops the run and unlocks edits", async () => {
    const userId = await makeUser();
    const { diagramId } = await startGuide(userId, "shop", "onprem");
    expect(await isLearning(diagramId)).toBe(true);
    await quitGuide(userId, diagramId);
    expect(await getGuideRun(diagramId)).toMatchObject({ status: "quit", env: "onprem" });
    expect(await isLearning(diagramId)).toBe(false);
    const msgs = await listMessages(diagramId);
    expect(msgs.at(-1)).toMatchObject({ role: "system", content: GUIDE_QUIT_MESSAGE });
    expect(GUIDE_QUIT_MESSAGE).toBe("학습을 그만뒀어요. 이제 자유롭게 고칠 수 있어요.");

    // 두 번 눌러도 메시지가 또 남지 않는다.
    await quitGuide(userId, diagramId);
    expect(await listMessages(diagramId)).toHaveLength(msgs.length);
    // 남의 구성도는 없는 것으로 본다.
    await expect(quitGuide(await makeUser(), diagramId)).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("syncGuideAfterRestore", () => {
  test("restoring to an earlier step moves the step back and drops later flows", async () => {
    const userId = await makeUser();
    const { diagramId } = await startGuide(userId, "shop", "onprem");
    await doSteps(userId, diagramId, 3);
    const run = (await getGuideRun(diagramId))!;
    expect(run).toMatchObject({ step: 3, stepVersions: [3, 4, 5] });
    // 대본 흐름(마지막 단계가 넣는다)이 이미 있다고 치고, 사용자 흐름과 섞어 둔다.
    for (const key of ["product-view", "checkout", "mine"]) await addFlowRow(diagramId, key);

    await restoreVersionWithMessage(diagramId, 4);
    const view = await syncGuideAfterRestore(diagramId, 4);
    expect(await getGuideRun(diagramId)).toMatchObject({ env: "onprem", envVersion: 2, step: 2, stepVersions: [3, 4], status: "active" });
    expect(view).toMatchObject({ step: 2, status: "active", current: { goal: ONPREM.steps[2]!.goal } });
    expect(await flowKeys(diagramId)).toEqual(["mine"]);

    // 환경 확정 버전 자체로 되돌리면 환경은 두고 첫 단계로 간다.
    await restoreVersionWithMessage(diagramId, 2);
    expect(await syncGuideAfterRestore(diagramId, 2)).toMatchObject({ env: "onprem", step: 0, status: "active" });
    expect(await getGuideRun(diagramId)).toMatchObject({ env: "onprem", envVersion: 2, step: 0, stepVersions: [] });
  });

  test("restoring before the env version asks the env again", async () => {
    const userId = await makeUser();
    const { diagramId } = await startGuide(userId, "shop", "onprem");
    await doSteps(userId, diagramId, 1);
    for (const key of ["product-view", "mine"]) await addFlowRow(diagramId, key);

    await restoreVersionWithMessage(diagramId, 1);
    const view = await syncGuideAfterRestore(diagramId, 1);
    expect(await getGuideRun(diagramId)).toMatchObject({ env: null, envVersion: null, step: 0, stepVersions: [], status: "active" });
    expect(view).toMatchObject({ env: null, envChoices: ["onprem", "cloud"], step: 0, status: "active", current: null });
    expect(await flowKeys(diagramId)).toEqual(["mine"]);

    // 다시 환경을 고르면 이어서 할 수 있다.
    await runChatTurn({ userId, diagramId, text: "클라우드로 할게요", signal: new AbortController().signal, emit: () => {} }, deps);
    expect(await getGuideRun(diagramId)).toMatchObject({ env: "cloud", step: 0, status: "active" });
  });

  test("an out-of-range step quits the run on open", async () => {
    const userId = await makeUser();
    const { diagramId } = await startGuide(userId, "shop", "onprem");
    const run = (await getGuideRun(diagramId))!;
    await saveGuideRun({ ...run, step: 99 });
    // 구성도 화면이 여는 길(getLiveGuideRun)에서 quit 로 바뀐다.
    expect(await liveGuideView(diagramId)).toMatchObject({ status: "quit", current: null });
    expect(await getGuideRun(diagramId)).toMatchObject({ status: "quit" });
    expect(await isLearning(diagramId)).toBe(false);
    // 그만둔 학습은 되돌려도 맞추지 않는다.
    expect(await syncGuideAfterRestore(diagramId, 1)).toBeNull();
    expect(await getGuideRun(diagramId)).toMatchObject({ status: "quit", step: 99 });
  });

  test("explanations are re-saved for the restored state", async () => {
    const userId = await makeUser();
    const { diagramId } = await startGuide(userId, "shop", "onprem");
    await doSteps(userId, diagramId, 3);

    await restoreVersionWithMessage(diagramId, 3);
    const restored = (await getLatestState(diagramId))!.state;
    const targets = Object.keys(ONPREM.steps[0]!.explains).map((key) => {
      const at = key.indexOf(":");
      return { kind: key.slice(0, at) as ExplainTargetKind, id: key.slice(at + 1) };
    });
    const rows = async () =>
      db
        .select({ kind: explanations.targetKind, id: explanations.targetId, signature: explanations.signature })
        .from(explanations)
        .where(eq(explanations.diagramId, diagramId));
    const stale = (list: Awaited<ReturnType<typeof rows>>) =>
      targets.filter((t) => list.find((r) => r.kind === t.kind && r.id === t.id)?.signature !== signatureOf(restored, t.kind, t.id));
    // 뒤 단계가 이웃을 붙여 서명이 바뀐 대상이 있다(되돌린 상태와 안 맞는다).
    expect(stale(await rows()).length).toBeGreaterThan(0);

    await syncGuideAfterRestore(diagramId, 3);
    expect(await getGuideRun(diagramId)).toMatchObject({ step: 1, stepVersions: [3] });
    expect(stale(await rows())).toEqual([]);
  });

  test("redo to a later step version restores that step", async () => {
    const userId = await makeUser();
    const { diagramId } = await startGuide(userId, "shop", "onprem");
    await doSteps(userId, diagramId, 3); // v3 v4 v5
    await restoreVersionWithMessage(diagramId, 3); // v6
    expect(await syncGuideAfterRestore(diagramId, 3)).toMatchObject({ step: 1 });
    // 다시 하기: 지운 단계 기록이 아니라 그 버전이 끝낸 단계로 맞춘다.
    await restoreVersionWithMessage(diagramId, 5); // v7
    expect(await syncGuideAfterRestore(diagramId, 5)).toMatchObject({ step: 3, current: { goal: ONPREM.steps[3]!.goal } });
    expect(await getGuideRun(diagramId)).toMatchObject({ env: "onprem", envVersion: 2, step: 3, stepVersions: [3, 4, 5], status: "active" });
    // 다음 차례는 4단계를 그리고 학습을 이어간다.
    await doSteps(userId, diagramId, 1, ONPREM, 3);
    expect(await getGuideRun(diagramId)).toMatchObject({ step: 4, stepVersions: [3, 4, 5, 8], status: "active" });
  });

  test("restoring a restore-created version follows its origin", async () => {
    const userId = await makeUser();
    const { diagramId } = await startGuide(userId, "shop", "onprem");
    await doSteps(userId, diagramId, 3); // v3 v4 v5
    await restoreVersionWithMessage(diagramId, 4); // v6 (v4 의 되돌림)
    await syncGuideAfterRestore(diagramId, 4);
    await restoreVersionWithMessage(diagramId, 5); // v7 (v5 의 되돌림)
    await syncGuideAfterRestore(diagramId, 5);
    await restoreVersionWithMessage(diagramId, 6); // v8 → v6 → v4
    expect(await syncGuideAfterRestore(diagramId, 6)).toMatchObject({ step: 2 });
    expect(await getGuideRun(diagramId)).toMatchObject({ step: 2, stepVersions: [3, 4] });
    // 되돌림의 되돌림도 원본까지 따라간다(v9 → v8 → v6 → v4 는 아니고 v7 → v5).
    await restoreVersionWithMessage(diagramId, 7); // v9
    expect(await syncGuideAfterRestore(diagramId, 7)).toMatchObject({ step: 3 });
    await doSteps(userId, diagramId, 1, ONPREM, 3);
    expect(await getGuideRun(diagramId)).toMatchObject({ step: 4, status: "active" });
  });

  test("restoring a version from the earlier env branch brings that env back", async () => {
    const userId = await makeUser();
    const { diagramId } = await startGuide(userId, "shop", "onprem"); // v2
    await doSteps(userId, diagramId, 2); // v3 v4
    await restoreVersionWithMessage(diagramId, 1); // v5
    await syncGuideAfterRestore(diagramId, 1);
    await runChatTurn({ userId, diagramId, text: "클라우드로 할게요", signal: new AbortController().signal, emit: () => {} }, deps); // v6
    await doSteps(userId, diagramId, 1, CLOUD); // v7
    expect(await getGuideRun(diagramId)).toMatchObject({ env: "cloud", envVersion: 6, stepVersions: [7] });
    for (const key of ["product-view", "checkout", "mine"]) await addFlowRow(diagramId, key);

    await restoreVersionWithMessage(diagramId, 3); // v8
    const view = await syncGuideAfterRestore(diagramId, 3);
    expect(view).toMatchObject({ env: "onprem", step: 1, total: ONPREM.steps.length, current: { goal: ONPREM.steps[1]!.goal } });
    expect(await getGuideRun(diagramId)).toMatchObject({ env: "onprem", envVersion: 2, step: 1, stepVersions: [3], status: "active" });
    // 어느 환경 대본의 흐름이든 아직 안 한 단계 것은 남지 않는다.
    expect(await flowKeys(diagramId)).toEqual(["mine"]);
    await doSteps(userId, diagramId, 1, ONPREM, 1);
    expect(await getGuideRun(diagramId)).toMatchObject({ env: "onprem", step: 2, stepVersions: [3, 9], status: "active" });
  });

  test("restore is refused before restoring while a guide turn holds the lock", async () => {
    const userId = await makeUser();
    const { diagramId } = await startGuide(userId, "shop", "onprem");
    await doSteps(userId, diagramId, 2); // v3 v4
    const before = await listVersions(diagramId);
    const held = await withDiagramLock(diagramId, () => restoreGuideVersion(diagramId, 3));
    expect(held).toEqual({ ok: true, value: { ok: false } });
    expect(await listVersions(diagramId)).toEqual(before);
    expect(await getGuideRun(diagramId)).toMatchObject({ step: 2, stepVersions: [3, 4] });

    // 잠금이 풀리면 한 번에 되돌리고 맞춘다.
    const r = await restoreGuideVersion(diagramId, 3);
    expect(r).toMatchObject({ ok: true, number: 5, guide: { step: 1 } });
    expect(await getGuideRun(diagramId)).toMatchObject({ step: 1, stepVersions: [3] });
    expect((await listMessages(diagramId)).at(-1)).toMatchObject({ role: "system" });
  });
});
