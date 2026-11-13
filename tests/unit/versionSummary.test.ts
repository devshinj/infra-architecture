import { expect, test } from "vitest";

import { applyCommands } from "@/domain/apply";
import { emptyState } from "@/domain/types";
import { changeDelta, REQUEST_MAX, turnVersionSummary } from "@/domain/versionSummary";

const before = applyCommands(emptyState(), [
  { op: "add_node", id: "was", kind: "was", label: "WAS", parent: null },
  { op: "add_node", id: "db", kind: "db_rdb", label: "DB", parent: null },
  { op: "add_edge", id: "e1", from: "was", to: "db", edge_kind: "request" },
]).state;
const after = applyCommands(before, [
  { op: "add_node", id: "cache", kind: "cache", label: "캐시", parent: null },
  { op: "add_edge", id: "e2", from: "was", to: "cache", edge_kind: "request" },
  { op: "add_edge", id: "e3", from: "cache", to: "db", edge_kind: "request" },
  { op: "update_node", id: "db", label: "주문 DB" },
]).state;

test("changeDelta counts added and removed nodes·edges·zones and changed items", () => {
  expect(changeDelta(before, after)).toBe("노드 +1 · 연결 +2 · 변경 1");
  expect(changeDelta(after, before)).toBe("노드 −1 · 연결 −2 · 변경 1");
  expect(changeDelta(before, before)).toBe("");
});

test("turnVersionSummary is '<request> · <delta>', with whitespace collapsed and long requests cut", () => {
  expect(turnVersionSummary("  캐시 서버를\n하나 더 추가해 줘 ", before, after)).toBe("캐시 서버를 하나 더 추가해 줘 · 노드 +1 · 연결 +2 · 변경 1");
  const long = "가".repeat(REQUEST_MAX + 5);
  expect(turnVersionSummary(long, before, before)).toBe(`${"가".repeat(REQUEST_MAX - 1)}…`);
  expect(turnVersionSummary("", before, after)).toBe("노드 +1 · 연결 +2 · 변경 1");
});
