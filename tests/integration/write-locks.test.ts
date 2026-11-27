import { expect, test } from "vitest";

import { emptyState } from "@/domain/types";
import { BUSY_MESSAGE } from "@/server/chat/busy";
import { listMessages } from "@/server/chat/messages";
import { importSample } from "@/server/samples";
import { createVersion, getLatestState, restoreVersionLocked } from "@/server/versions";

import { holdDiagramLock, makeOwnedDiagram } from "./helpers";

// 대화 차례는 시작 때 읽은 상태로 저장한다. 차례가 도는 동안(구성도 잠금) 버전을 만드는 다른 쓰기는 거절되어야 덮이지 않는다.
// 가정 확정은 assumption.test.ts, 필드·경고 무시·연결 추정은 각 파일에서 같은 방식으로 본다.

/** 구성도 잠금을 쥔 채 fn 을 돌리고 푼다(도는 중인 대화 차례 흉내). */
async function whileLocked(diagramId: string, fn: () => Promise<void>) {
  const lock = await holdDiagramLock(diagramId);
  try {
    await fn();
  } finally {
    await lock.release();
  }
}

test("importing a sample while a chat turn holds the lock returns busy and saves nothing", async () => {
  const ids = await makeOwnedDiagram();
  await createVersion(ids.diagramId, emptyState(), { source: "import" });
  await whileLocked(ids.diagramId, async () => {
    await expect(importSample(ids.userId, ids.diagramId, "idc-3tier")).rejects.toThrow(BUSY_MESSAGE);
    expect((await getLatestState(ids.diagramId))?.number).toBe(1);
  });
  expect((await importSample(ids.userId, ids.diagramId, "idc-3tier")).number).toBe(2);
});

test("restoring while a chat turn holds the lock is refused without a version or a message", async () => {
  const ids = await makeOwnedDiagram();
  await createVersion(ids.diagramId, emptyState(), { source: "import" });
  await importSample(ids.userId, ids.diagramId, "idc-3tier"); // v2
  await whileLocked(ids.diagramId, async () => {
    expect(await restoreVersionLocked(ids.diagramId, 1)).toEqual({ ok: false });
    expect((await getLatestState(ids.diagramId))?.number).toBe(2);
    expect(await listMessages(ids.diagramId)).toHaveLength(0);
  });
  const r = await restoreVersionLocked(ids.diagramId, 1);
  expect(r).toMatchObject({ ok: true, number: 3 });
  expect(await listMessages(ids.diagramId)).toHaveLength(1);
});
