import { expect, test } from "vitest";

import { noLinkKey, parseNoLinkKey } from "@/domain/assumptions";
import { crossingNote } from "@/domain/flows";
import type { NetworkKnowledge } from "@/domain/network";
import { NETWORK_RULE_SEED, NETWORK_TYPE_SEED } from "@/domain/network-seed";
import { crossingPaths, evaluateNetworkRules, linkWarningId, parseLinkWarningId } from "@/domain/networkRules";
import { emptyState, type DiagramState } from "@/domain/types";
import { evaluateRules, mergeWarnings } from "@/domain/warnings";

const K: NetworkKnowledge = { types: Object.fromEntries(NETWORK_TYPE_SEED.map((t) => [t.key, t])), rules: [] };
const n = (id: string, kind: string, label: string, parent: string | null) => ({ id, kind: kind as never, label, parent, attrs: {} });
const e = (id: string, from: string, to: string) => ({ id, from, to, edgeKind: "request" as const });

/** 행정망(내부, 확인됨) PC → 망 밖 방화벽 → GCloud 인터넷망(외부) WAS */
const adminCase = (over?: { admin?: Partial<{ source: "ai" | "user"; confirmed: boolean }>; mid?: "firewall" | "network_link" }): DiagramState => ({
  ...emptyState(),
  groups: {
    "admin-net": { id: "admin-net", groupKind: "network_zone", label: "행정망", parent: null, netType: { key: "admin-net", source: "user", confirmed: true, ...over?.admin } },
    "gcloud-internet": { id: "gcloud-internet", groupKind: "network_zone", label: "GCloud 인터넷망", parent: null, netType: { key: "gcloud-internet", source: "user", confirmed: true } },
  },
  nodes: {
    pc: n("pc", "client_web", "PC", "admin-net"),
    mid: n("mid", over?.mid ?? "firewall", "중간", null),
    was: n("was", "was", "WAS", "gcloud-internet"),
  },
  edges: { e1: e("e1", "pc", "mid"), e2: e("e2", "mid", "was") },
});

test("행정망 사례: 방화벽만 거치면 link_expected 하나, 망 짝 id", () => {
  const w = evaluateNetworkRules(adminCase(), K);
  expect(w).toHaveLength(1);
  expect(w[0].id).toBe(linkWarningId("link_expected", "admin-net", "gcloud-internet"));
  expect(w[0].id).toBe("link_expected:admin-net--gcloud-internet");
  expect(w[0].level).toBe("check");
  expect(w[0].nodeId).toBe("was");
  expect(w[0].edgeId).toBe("e2");
  expect(w[0].text).toContain("기관 규정과 방화벽 담당자에게 확인해 보세요");
  expect(w[0].guide).toBe("망연계를 넣으려면 대화로 '망연계 넣어 줘'라고 말해 주세요.");
});

test("망연계를 거치면 표시 없음", () => {
  expect(evaluateNetworkRules(adminCase({ mid: "network_link" }), K)).toEqual([]);
});

test("AI 추정 종류면 문구 앞에 추정 문장", () => {
  const w = evaluateNetworkRules(adminCase({ admin: { source: "ai", confirmed: false } }), K);
  expect(w[0].text.startsWith("행정망을(를) '")).toBe(true);
  expect(w[0].text).toContain("(으)로 추정했어요. ");
  const sure = evaluateNetworkRules(adminCase({ admin: { source: "ai", confirmed: true } }), K);
  expect(sure[0].text).not.toContain("추정했어요");
});

test("사용자 규칙이면 근거를 문구에 넣는다", () => {
  const k = { ...K, rules: [{ a: "admin-net", b: "gcloud-internet", method: "network_link" as const, note: "망 운영 지침 3조" }] };
  const [w] = evaluateNetworkRules(adminCase(), k);
  expect(w.text).toContain("등록한 기관 규칙(망 운영 지침 3조)에 따르면");
  expect(w.text).not.toContain("보통");
});

test("종류가 한쪽이라도 없으면 판정 없음", () => {
  const s = adminCase();
  delete s.groups["admin-net"].netType;
  expect(evaluateNetworkRules(s, K)).toEqual([]);
});

test("망 밖 노드 끝은 판정 없음", () => {
  const s = adminCase();
  s.nodes.was.parent = null;
  expect(evaluateNetworkRules(s, K)).toEqual([]);
});

test("같은 망 짝의 길 둘이면 경고는 하나", () => {
  const s = adminCase();
  s.nodes.was2 = n("was2", "was", "WAS2", "gcloud-internet");
  s.edges.e3 = e("e3", "mid", "was2");
  expect(crossingPaths(s)).toHaveLength(2);
  expect(evaluateNetworkRules(s, K)).toHaveLength(1);
});

test("폐쇄망 짝은 link_unusual", () => {
  const s = adminCase();
  s.groups["admin-net"].netType = { key: "control-net", source: "user", confirmed: true };
  const [w] = evaluateNetworkRules(s, K);
  expect(w.id).toBe("link_unusual:admin-net--gcloud-internet");
  expect(w.text).toContain("행정망(폐쇄)와(과) GCloud 인터넷망 사이는 보통 잇지 않는 구간이에요");
  expect(w.text).toContain("기관 규정과 방화벽 담당자에게 확인해 보세요");
});

test("확정된 no_link 가정이 있으면 link_expected 없음, 미확정이면 있음", () => {
  const key = noLinkKey("gcloud-internet", "admin-net");
  expect(key).toBe("no_link:admin-net--gcloud-internet");
  const s = adminCase();
  s.assumptions[key] = { key, value: "망연계 없이 통신", confirmed: true };
  expect(evaluateNetworkRules(s, K)).toEqual([]);
  s.assumptions[key].confirmed = false;
  expect(evaluateNetworkRules(s, K)).toHaveLength(1);
});

test("noLinkKey 는 파싱된다", () => {
  expect(parseNoLinkKey(noLinkKey("b", "a"))).toEqual(["a", "b"]);
  expect(parseNoLinkKey("environment")).toBeNull();
  expect(parseNoLinkKey("no_link:a--")).toBeNull();
});

test("경계 노드 고리(방화벽 ↔ 방화벽)에서 멈춘다", () => {
  const s = adminCase();
  s.nodes.mid2 = n("mid2", "firewall", "중간2", null);
  s.edges.e3 = e("e3", "mid", "mid2");
  s.edges.e4 = e("e4", "mid2", "mid");
  s.edges.e5 = e("e5", "mid2", "was");
  const paths = crossingPaths(s);
  expect(paths.length).toBeGreaterThan(0);
  expect(paths.every((p) => new Set(p.via).size === p.via.length)).toBe(true);
  expect(evaluateNetworkRules(s, K)).toHaveLength(1);
});

test("끝이 그룹인 연결을 건너뛴다", () => {
  const s = adminCase();
  s.edges.eg = e("eg", "mid", "admin-net");
  s.edges.eh = e("eh", "gcloud-internet", "pc");
  expect(() => crossingPaths(s)).not.toThrow();
  expect(crossingPaths(s)).toHaveLength(1);
});

test("evaluateRules(state) 지식 없이 부르면 이전과 같다", () => {
  const s = adminCase();
  const before = evaluateRules(s);
  expect(before.some((w) => w.rule.startsWith("link_"))).toBe(false);
  expect(evaluateRules(s, undefined)).toEqual(before);
  expect(evaluateRules(s, K).slice(0, before.length)).toEqual(before);
  expect(evaluateRules(s, K)).toHaveLength(before.length + 1);
  expect(mergeWarnings(s).active).toEqual(before);
});

test("mergeWarnings: link 경고는 저장된 문구로 덮지 않는다", () => {
  const s = adminCase();
  const [fresh] = evaluateNetworkRules(s, K);
  s.warnings = [{ ...fresh, text: "옛 문구" }];
  expect(mergeWarnings(s, K).active.find((w) => w.id === fresh.id)?.text).toBe(fresh.text);
});

test("crossingNote: link_expected 길의 단계에 '망연계 필요 예상'을 붙이고, 지식 없이 부르면 이전과 같다", () => {
  const s = adminCase();
  const step = { edge: "e2", from: "mid", short: "x", text: "x" };
  const plain = crossingNote(s, step);
  expect(crossingNote(s, step, K)).toBe(`${plain} · 망연계 필요 예상`);
  const s2 = adminCase({ mid: "network_link" });
  expect(crossingNote(s2, step, K)).toBe(crossingNote(s2, step));
  const closed = adminCase();
  closed.groups["admin-net"].netType = { key: "control-net", source: "user", confirmed: true };
  expect(crossingNote(closed, step, K)).toBe(`${plain} · 보통 잇지 않는 구간`);
});

test("parseLinkWarningId: 망 짝 경고 id 를 규칙과 두 망 id 로 푼다", () => {
  expect(parseLinkWarningId(linkWarningId("link_expected", "gcloud-internet", "admin-net"))).toEqual({ rule: "link_expected", zoneA: "admin-net", zoneB: "gcloud-internet" });
  expect(parseLinkWarningId("link_unusual:a--b-c")).toEqual({ rule: "link_unusual", zoneA: "a", zoneB: "b-c" });
  // 망 id 안의 "--" 도 맞게 가른다(작은 쪽이 앞).
  expect(parseLinkWarningId("link_expected:a--b--c")).toEqual({ rule: "link_expected", zoneA: "a", zoneB: "b--c" });
  expect(parseLinkWarningId("spof:web")).toBeNull();
  expect(parseLinkWarningId("link_expected:only")).toBeNull();
  expect(parseLinkWarningId("link_expected:b--a")).toBeNull();
});

/** 두 망 영역의 노드를 중간 노드 하나로 잇는 사례(망 종류는 인자로). */
const pairCase = (typeA: string, typeB: string, mid: "firewall" | "network_link" = "firewall"): DiagramState => ({
  ...emptyState(),
  groups: {
    "zone-a": { id: "zone-a", groupKind: "network_zone", label: "가 망", parent: null, netType: { key: typeA, source: "user", confirmed: true } },
    "zone-b": { id: "zone-b", groupKind: "network_zone", label: "나 망", parent: null, netType: { key: typeB, source: "user", confirmed: true } },
  },
  nodes: { a: n("a", "was", "A", "zone-a"), mid: n("mid", mid, "중간", null), b: n("b", "was", "B", "zone-b") },
  edges: { e1: e("e1", "a", "mid"), e2: e("e2", "mid", "b") },
});
const KB: NetworkKnowledge = { ...K, baseRules: NETWORK_RULE_SEED };

test("망분리 대상이 아닌 내부 망(사무망)은 방화벽만 거쳐 인터넷과 이어도 표시가 없다", () => {
  expect(evaluateNetworkRules(pairCase("office-net", "internet"), KB)).toEqual([]);
  // 같은 구성이라도 망분리 대상(업무망)이면 망연계를 예상한다.
  expect(evaluateNetworkRules(pairCase("business-net", "internet"), KB).map((w) => w.rule)).toEqual(["link_expected"]);
});

test("직접 연결 짝(서버팜 ↔ 스토리지망)은 표시가 없다", () => {
  expect(evaluateNetworkRules(pairCase("server-farm", "storage-net"), KB)).toEqual([]);
});

test("기본 제공 짝 규칙에 걸리면 그 까닭 한 줄을 문구에 넣고, 기관 규칙처럼 말하지 않는다", () => {
  const [unusual] = evaluateNetworkRules(pairCase("guest-wlan", "office-net"), KB);
  expect(unusual?.rule).toBe("link_unusual");
  expect(unusual?.text).toContain("게스트망은 사내 망과 잇지 않고 인터넷만 쓰게 해요.");
  expect(unusual?.text).toContain("기관 규정과 방화벽 담당자에게 확인해 보세요");
  expect(unusual?.text).not.toContain("등록한 기관 규칙");

  const [expected] = evaluateNetworkRules(pairCase("business-net", "agency-internet"), KB);
  expect(expected?.rule).toBe("link_expected");
  expect(expected?.text).toContain("망연계가 필요해요. 업무 자료를 다루는 망과 인터넷 구역 사이는");
});
