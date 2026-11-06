import { eq } from "drizzle-orm";
import { describe, expect, test } from "vitest";

import { db } from "@/db/client";
import { diagramVersions } from "@/db/schema";
import { noLinkKey } from "@/domain/assumptions";
import { linkWarningId } from "@/domain/networkRules";
import { emptyState, type DiagramState } from "@/domain/types";
import { BUSY_MESSAGE } from "@/server/chat/busy";
import { withDiagramLock } from "@/server/chat/lock";
import { applyFlowOps, listFlows } from "@/server/flows";
import { confirmLinkGuessFor, rejectLinkGuessFor } from "@/server/linkGuess";
import { NotFoundError, ValidationError } from "@/server/projects";
import { createVersion, getLatestState } from "@/server/versions";
import { setZoneTypeFor } from "@/server/zoneType";

import { makeOwnedDiagram } from "./helpers";

/** 업무망(web) → [망연계 link, AI 추정] → 내부망(db). 원래 연결 e0 (web → db) 를 대신했다. */
function guessed(): DiagramState {
  const s = emptyState();
  s.groups.biz = { id: "biz", groupKind: "network_zone", label: "업무망", parent: null, netType: { key: "business-net", source: "ai", confirmed: false } };
  s.groups.adm = { id: "adm", groupKind: "network_zone", label: "행정망", parent: null };
  s.groups.app = { id: "app", groupKind: "dmz", label: "앱", parent: "biz" };
  s.nodes.web = { id: "web", kind: "web_server", label: "웹", parent: "biz", attrs: {} };
  s.nodes.link = { id: "link", kind: "network_link", label: "망연계", parent: null, attrs: {}, guess: { replaced: [{ from: "web", to: "db", edgeKind: "request", id: "e0" }] } };
  s.nodes.db = { id: "db", kind: "db_rdb", label: "DB", parent: "adm", attrs: {} };
  s.edges.e1 = { id: "e1", from: "web", to: "link", edgeKind: "request" };
  s.edges.e2 = { id: "e2", from: "link", to: "db", edgeKind: "request" };
  return s;
}

async function setup(state = guessed()) {
  const ids = await makeOwnedDiagram();
  await createVersion(ids.diagramId, state, { source: "import" });
  return ids;
}
const count = async (id: string) => (await db.select().from(diagramVersions).where(eq(diagramVersions.diagramId, id))).length;
const latest = async (id: string) => (await getLatestState(id))!.state;

describe("setZoneTypeFor", () => {
  test("AI 추정을 확인하면 user·confirmed, 같은 값 다시면 버전 없음, 지식에 없는 key 는 ValidationError", async () => {
    const ids = await setup();
    const r = await setZoneTypeFor(ids.userId, ids.diagramId, "biz", "business-net");
    expect(r.number).toBe(2);
    expect((await latest(ids.diagramId)).groups.biz.netType).toEqual({ key: "business-net", source: "user", confirmed: true });
    const n = await count(ids.diagramId);
    expect(await setZoneTypeFor(ids.userId, ids.diagramId, "biz", "business-net")).toEqual({ number: null });
    expect(await count(ids.diagramId)).toBe(n);
    await expect(setZoneTypeFor(ids.userId, ids.diagramId, "biz", "nope-net")).rejects.toThrow(ValidationError);
    await expect(setZoneTypeFor(ids.userId, ids.diagramId, "app", "admin-net")).rejects.toThrow("대상을 찾을 수 없어요");
    await expect(setZoneTypeFor(ids.userId, ids.diagramId, "ghost", "admin-net")).rejects.toThrow("대상을 찾을 수 없어요");
  });

  test("다른 종류로 바꾸고, null 이면 칸을 지운다", async () => {
    const ids = await setup();
    await setZoneTypeFor(ids.userId, ids.diagramId, "biz", "admin-net");
    expect((await latest(ids.diagramId)).groups.biz.netType).toMatchObject({ key: "admin-net", source: "user" });
    await setZoneTypeFor(ids.userId, ids.diagramId, "biz", null);
    expect("netType" in (await latest(ids.diagramId)).groups.biz).toBe(false);
    expect(await setZoneTypeFor(ids.userId, ids.diagramId, "biz", null)).toEqual({ number: null });
  });
});

describe("confirmLinkGuessFor", () => {
  test("guess 가 사라지고 노드·연결은 그대로", async () => {
    const ids = await setup();
    expect((await confirmLinkGuessFor(ids.userId, ids.diagramId, "link")).number).toBe(2);
    const s = await latest(ids.diagramId);
    expect(s.nodes.link).toBeDefined();
    expect("guess" in s.nodes.link).toBe(false);
    expect(Object.keys(s.edges).sort()).toEqual(["e1", "e2"]);
    expect(await confirmLinkGuessFor(ids.userId, ids.diagramId, "link")).toEqual({ number: null });
  });
});

describe("rejectLinkGuessFor", () => {
  test("노드만 지우고 원래 연결 복원, 확정 no_link 가정, 경고 무시, 흐름 단계 합침, 버전 하나", async () => {
    const ids = await setup();
    await applyFlowOps(ids.diagramId, guessed(), [{
      op: "add_flow", id: "f", name: "흐름", origin: "user", result: "끝",
      steps: [{ edge: "e1", from: "web", short: "가", text: "가 설명" }, { edge: "e2", from: "link", short: "나", text: "나 설명" }],
    }], "ai");
    const n = await count(ids.diagramId);
    const r = await rejectLinkGuessFor(ids.userId, ids.diagramId, "link");
    expect(r).toEqual({ number: n + 1, partial: false });
    expect(await count(ids.diagramId)).toBe(n + 1);
    const s = await latest(ids.diagramId);
    expect(s.nodes.link).toBeUndefined();
    expect(s.nodes.web).toBeDefined();
    expect(s.edges.e0).toMatchObject({ from: "web", to: "db" });
    const key = noLinkKey("biz", "adm");
    expect(s.assumptions[key]).toEqual({ key, value: "망연계 없이 통신(사용자 확인)", confirmed: true });
    expect(s.ignoredWarnings).toContain(linkWarningId("link_expected", "biz", "adm"));
    const [f] = await listFlows(ids.userId, ids.diagramId);
    expect(f.steps.map((x) => x.edge)).toEqual(["e0"]);
  });

  test("두 번째 호출은 버전 없음", async () => {
    const ids = await setup();
    await rejectLinkGuessFor(ids.userId, ids.diagramId, "link");
    const n = await count(ids.diagramId);
    expect(await rejectLinkGuessFor(ids.userId, ids.diagramId, "link")).toEqual({ number: null, partial: false });
    expect(await count(ids.diagramId)).toBe(n);
  });

  test("한쪽 끝이 망 밖이면 가정·무시 없이 되돌리기만 한다", async () => {
    const s = guessed();
    s.nodes.db.parent = null;
    const ids = await setup(s);
    expect((await rejectLinkGuessFor(ids.userId, ids.diagramId, "link")).number).toBe(2);
    const after = await latest(ids.diagramId);
    expect(after.nodes.link).toBeUndefined();
    expect(Object.keys(after.assumptions)).toEqual([]);
    expect(after.ignoredWarnings).toBeUndefined();
  });

  test("잠금 중이면 BUSY_MESSAGE", async () => {
    const ids = await setup();
    const held = withDiagramLock(ids.diagramId, async () => {
      await expect(rejectLinkGuessFor(ids.userId, ids.diagramId, "link")).rejects.toThrow(BUSY_MESSAGE);
      await expect(confirmLinkGuessFor(ids.userId, ids.diagramId, "link")).rejects.toThrow(BUSY_MESSAGE);
      await expect(setZoneTypeFor(ids.userId, ids.diagramId, "biz", "admin-net")).rejects.toThrow(BUSY_MESSAGE);
    });
    await held;
  });

  test("다른 계정 구성도는 NotFoundError", async () => {
    const ids = await setup();
    const other = await makeOwnedDiagram();
    await expect(rejectLinkGuessFor(other.userId, ids.diagramId, "link")).rejects.toThrow(NotFoundError);
    await expect(confirmLinkGuessFor(other.userId, ids.diagramId, "link")).rejects.toThrow(NotFoundError);
    await expect(setZoneTypeFor(other.userId, ids.diagramId, "biz", null)).rejects.toThrow(NotFoundError);
  });
});
