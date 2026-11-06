import { describe, expect, test, vi } from "vitest";

import { assumptionChangeMessage } from "@/domain/assumptions";
import { applyCommand } from "@/domain/apply";
import { parseCommand } from "@/domain/commands";
import type { MissingItem } from "@/domain/missing";
import { emptyState } from "@/domain/types";
import { clefOpenItems, resolveIntent } from "@/server/chat/intent";

describe("resolveIntent", () => {
  test("assumption-change messages are structure_change without asking Clef", async () => {
    const classify = vi.fn(async () => ({ intent: "layout" as const, confidence: 0.99 }));
    expect(await resolveIntent(assumptionChangeMessage("environment", "사내 IDC"), classify)).toBe("structure_change");
    expect(await resolveIntent(assumptionChangeMessage("scale", "대규모(일 10만 명 이상)"), classify)).toBe(
      "structure_change",
    );
    expect(classify).not.toHaveBeenCalled();
  });

  test("other messages use Clef with the confidence floor", async () => {
    expect(await resolveIntent("정리", async () => ({ intent: "layout", confidence: 0.8 }))).toBe("layout");
    expect(await resolveIntent("정리", async () => ({ intent: "layout", confidence: 0.5 }))).toBeNull();
    expect(await resolveIntent("정리", async () => null)).toBeNull();
  });
});

describe("clefOpenItems", () => {
  const state = (() => {
    let s = emptyState();
    for (const raw of [
      { op: "add_node", id: "was", kind: "was", label: "WAS", parent: null },
      { op: "add_node", id: "db", kind: "db_rdb", label: "회원 DB", parent: null },
      { op: "add_node", id: "auth", kind: "external_auth", label: "외부 인증", parent: null },
      { op: "add_edge", id: "e1", from: "was", to: "auth", edge_kind: "request" },
    ]) {
      const p = parseCommand(raw);
      if (!p.ok) throw new Error(p.error);
      const r = applyCommand(s, p.cmd);
      if (!r.ok) throw new Error(r.error);
      s = r.state;
    }
    return s;
  })();
  const item = (targetKind: "node" | "edge", targetId: string, key: string, label: string): MissingItem => ({
    targetKind, targetId, key, label, unknown: false,
  });
  const items = [
    item("node", "was", "cpu", "CPU"),
    item("node", "was", "ram", "RAM"),
    item("node", "db", "cpu", "CPU"),
    item("edge", "e1", "label", "설명"),
    item("edge", "e1", "payload", "전달물"),
  ];

  test("사용자 글에 이름이 나온 대상만 대상별로 묶는다", () => {
    expect(clefOpenItems(state, items, { text: "WAS는 4코어 16기가" })).toEqual(["WAS: CPU·RAM", "WAS → 외부 인증: 설명·전달물"]);
  });

  test("직전 AI 답에 나온 대상도 넣는다", () => {
    expect(clefOpenItems(state, items, { text: "파일로 한쪽만", lastAssistant: "외부 인증 연결의 전달물을 알려 주세요." })).toEqual([
      "WAS → 외부 인증: 설명·전달물",
    ]);
  });

  test("참조한 노드는 이름이 글에 없어도 넣는다", () => {
    expect(clefOpenItems(state, items, { text: "4코어", mentionIds: ["db"] })).toEqual(["회원 DB: CPU"]);
  });

  test("아무 대상도 나오지 않으면 비운다", () => {
    expect(clefOpenItems(state, items, { text: "흐름이 뭐야?", lastAssistant: "구성도를 그렸어요." })).toEqual([]);
  });
});
