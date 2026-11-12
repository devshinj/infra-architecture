import { expect, test } from "vitest";

import type { GroupKind, NodeKind } from "@/domain/catalog";
import { emptyState, type DiagramState, type DNode, type Warning } from "@/domain/types";
import { evaluateRules, mergeWarnings, RULES, warningDelta, warningsByNode } from "@/domain/warnings";

const node = (id: string, kind: NodeKind, label: string, parent: string | null = null): DNode => ({ id, kind, label, parent, attrs: {} });
const build = (
  nodes: DNode[],
  groups: [string, GroupKind, string | null][] = [],
  edges: [string, string, string, "request" | "async" | "aux"][] = [],
): DiagramState => ({
  ...emptyState(),
  nodes: Object.fromEntries(nodes.map((n) => [n.id, n])),
  groups: Object.fromEntries(groups.map(([id, groupKind, parent]) => [id, { id, groupKind, label: id, parent }])),
  edges: Object.fromEntries(edges.map(([id, from, to, edgeKind]) => [id, { id, from, to, edgeKind }])),
});
const ids = (s: DiagramState) => evaluateRules(s).map((w) => w.id);

test("db in public subnet warns", () => {
  const s = build([node("db", "db_rdb", "주 DB", "inner")], [["pub", "subnet_public", null], ["inner", "vpc", "pub"]]);
  expect(ids(s)).toContain("db_public:db");
});

test("db in private subnet does not", () => {
  const s = build([node("db", "db_rdb", "주 DB", "priv")], [["priv", "subnet_private", null]]);
  expect(ids(s)).not.toContain("db_public:db");
});

test("group parent cycle does not hang", () => {
  const s = build([node("db", "db_rdb", "DB", "a")], [["a", "vpc", "b"], ["b", "vpc", "a"]]);
  expect(() => evaluateRules(s)).not.toThrow();
});

test("spof for a lone was, none inside redundancy_group", () => {
  expect(ids(build([node("w", "was", "WAS")]))).toContain("spof:w");
  const grouped = build([node("w", "was", "WAS", "r")], [["r", "redundancy_group", null]]);
  expect(ids(grouped)).not.toContain("spof:w");
});

test("confirmed 이중화 없음 turns spof off", () => {
  const s = build([node("w", "was", "WAS")]);
  s.assumptions.redundancy = { key: "redundancy", value: "이중화 없음", confirmed: false };
  expect(ids(s)).toContain("spof:w");
  s.assumptions.redundancy.confirmed = true;
  expect(ids(s)).not.toContain("spof:w");
});

test("spof fires for a lone node whatever the redundancy assumption value is (only a confirmed 이중화 없음 turns it off)", () => {
  for (const confirmed of [false, true]) {
    const s = build([node("w", "was", "WAS")]);
    s.assumptions.redundancy = { key: "redundancy", value: "웹/WAS/DB 이중화 및 멀티 AZ", confirmed };
    expect(ids(s)).toContain("spof:w");
  }
  // 이중화 그룹 안이면 가정과 상관없이 없다.
  const grouped = build([node("w", "was", "WAS", "r")], [["r", "redundancy_group", null]]);
  grouped.assumptions.redundancy = { key: "redundancy", value: "전 구간 이중화", confirmed: true };
  expect(ids(grouped)).not.toContain("spof:w");
});

test("db_proxy and cache are single points of failure too", () => {
  const s = build([node("p", "db_proxy", "DB 프록시"), node("c", "cache", "Redis"), node("l", "lb_l4", "L4")]);
  s.assumptions.redundancy = { key: "redundancy", value: "핵심 구간 이중화", confirmed: false };
  expect(ids(s)).toEqual(expect.arrayContaining(["spof:p", "spof:c", "spof:l"]));
});

test("client to k8s_ingress or bastion is a legitimate entry, no no_firewall", () => {
  for (const kind of ["k8s_ingress", "bastion"] as const) {
    const s = build([node("c", "client_web", "사용자"), node("t", kind, "진입점")], [], [["e1", "c", "t", "request"]]);
    expect(evaluateRules(s).some((x) => x.rule === "no_firewall")).toBe(false);
  }
});

test("client to was directly warns with edge id, client to lb does not", () => {
  const direct = build([node("c", "client_web", "사용자"), node("w", "was", "WAS")], [], [["e1", "c", "w", "request"]]);
  const w = evaluateRules(direct).find((x) => x.rule === "no_firewall")!;
  expect(w).toMatchObject({ id: "no_firewall:e1", nodeId: "w", edgeId: "e1" });
  const viaLb = build([node("c", "client_web", "사용자"), node("l", "lb_l4", "LB")], [], [["e1", "c", "l", "request"]]);
  expect(evaluateRules(viaLb).some((x) => x.rule === "no_firewall")).toBe(false);
});

test("cache without any db warns, with db does not", () => {
  expect(ids(build([node("c", "cache", "Redis")]))).toContain("cache_without_db:c");
  expect(ids(build([node("c", "cache", "Redis"), node("d", "db_nosql", "Mongo")]))).not.toContain("cache_without_db:c");
});

test("labels are filled into the template", () => {
  const s = build([node("db", "db_rdb", "주 DB", "pub")], [["pub", "dmz", null]]);
  expect(evaluateRules(s).find((w) => w.id === "db_public:db")!.text).toBe("주 DB이(가) 공개 구역에 있어요.");
  const e = build([node("c", "client_web", "사용자"), node("w", "was", "WAS")], [], [["e1", "c", "w", "async"]]);
  expect(evaluateRules(e).find((w) => w.rule === "no_firewall")!.text).toBe("사용자에서 WAS(으)로 바로 들어와요.");
});

test("db_exposed is Clef-only and exports instructions", () => {
  expect(RULES.find((r) => r.rule === "db_exposed")!.instructions).toContain("방화벽 없이 직접 접근");
  expect(ids(build([node("d", "db_rdb", "DB", "priv")], [["priv", "subnet_private", null]])).some((i) => i.startsWith("db_exposed"))).toBe(false);
});

const stored = (id: string, rule: string, nodeId: string, text: string): Warning => ({ id, rule, nodeId, level: "warn", text, guide: "g" });

test("stored qwen text wins for code rules that still fire", () => {
  const s = build([node("w", "was", "WAS")]);
  s.warnings = [stored("spof:w", "spof", "w", "큐웬 문구")];
  expect(mergeWarnings(s).active.find((w) => w.id === "spof:w")!.text).toBe("큐웬 문구");
});

test("stale code warning in state is dropped when the rule no longer fires", () => {
  const s = build([node("w", "was", "WAS", "r")], [["r", "redundancy_group", null]]);
  s.warnings = [stored("spof:w", "spof", "w", "옛 문구")];
  expect(mergeWarnings(s).active).toEqual([]);
});

test("db_exposed kept only while its node exists", () => {
  const s = build([node("d", "db_rdb", "DB", "r")], [["r", "redundancy_group", null]]);
  s.warnings = [stored("db_exposed:d", "db_exposed", "d", "노출"), stored("db_exposed:gone", "db_exposed", "gone", "없음")];
  expect(mergeWarnings(s).active.map((w) => w.id)).toEqual(["db_exposed:d"]);
});

test("ignored warnings are hidden", () => {
  const s = build([node("w", "was", "WAS")]);
  s.ignoredWarnings = ["spof:w"];
  const m = mergeWarnings(s);
  expect(m.active).toEqual([]);
  expect(m.ignored.map((w) => w.id)).toEqual(["spof:w"]);
});

test("warningsByNode counts active only", () => {
  const s = build([node("w", "was", "WAS"), node("d", "db_rdb", "DB")]);
  s.ignoredWarnings = ["spof:d"];
  expect(warningsByNode(mergeWarnings(s).active)).toEqual({ w: 1 });
});

// 업무망(WAS)·인터넷망(API)·망 밖(망연계)
const zoned = (edges: [string, string, string, "request" | "async" | "aux"][]) =>
  build(
    [node("was", "was", "WAS", "biz"), node("api", "external_api", "API", "net"), node("link", "network_link", "망연계")],
    [["biz", "network_zone", null], ["net", "network_zone", null]],
    edges,
  );

test("network_direct warns on WAS(업무망) → API(인터넷망) direct edge", () => {
  const s = zoned([["e", "was", "api", "request"]]);
  const w = evaluateRules(s).find((x) => x.rule === "network_direct");
  expect(w).toMatchObject({ id: "network_direct:e", nodeId: "api", edgeId: "e", level: "warn", text: "WAS에서 API(으)로 망을 바로 넘어가요." });
  expect(w?.guide).toBe("서로 다른 망 사이 통신은 방화벽·망연계 솔루션·VPN 을 거치게 그리세요.");
  expect(RULES.find((r) => r.rule === "network_direct")?.patternId).toBeTruthy();
});

test("no warning through network_link", () => {
  const s = zoned([["a", "was", "link", "request"], ["b", "link", "api", "request"]]);
  expect(ids(s).some((i) => i.startsWith("network_direct"))).toBe(false);
});

test("pass-through node with no edge at all warns (unused_passthrough)", () => {
  const kinds: NodeKind[] = ["firewall", "waf", "lb_l4", "lb_l7", "api_gateway", "nat", "vpn", "network_link", "cdn"];
  for (const k of kinds) expect(ids(build([node("p", k, "경계 방화벽")]))).toContain("unused_passthrough:p");
  const s = build([node("fw", "firewall", "경계 방화벽")]);
  expect(evaluateRules(s).find((w) => w.rule === "unused_passthrough")?.text).toContain("경계 방화벽");
});

test("pass-through node with any edge, or a non pass-through node alone, does not warn unused_passthrough", () => {
  const inOnly = build([node("web", "web_server", "웹"), node("fw", "firewall", "FW")], [], [["e1", "web", "fw", "request"]]);
  expect(ids(inOnly)).not.toContain("unused_passthrough:fw");
  const outOnly = build([node("fw", "firewall", "FW"), node("was", "was", "WAS")], [], [["e1", "fw", "was", "request"]]);
  expect(ids(outOnly)).not.toContain("unused_passthrough:fw");
  for (const k of ["web_server", "was", "monitoring", "dns", "batch_server"] as NodeKind[]) {
    expect(ids(build([node("n", k, "N")]))).not.toContain("unused_passthrough:n");
  }
});

test("spof text says 1대뿐 only when it is the only node of its kind; otherwise it is outside the redundancy group", () => {
  const text = (s: DiagramState, id: string) => evaluateRules(s).find((w) => w.id === `spof:${id}`)?.text;
  expect(text(build([node("w", "was", "WAS")]), "w")).toBe("WAS이(가) 1대뿐이라 멈추면 서비스도 멈춰요.");
  const two = build([node("w1", "was", "WAS #1"), node("w2", "was", "WAS #2")]);
  expect(text(two, "w1")).toBe("WAS #1이(가) 이중화 묶음(VIP)에 들어 있지 않아 멈춰도 대신할 서버로 넘어가지 않아요.");
  // 같은 종류가 묶음 안에 있어도, 밖에 있는 노드는 묶음에 없다고 알린다.
  const mixed = build([node("w1", "was", "WAS #1", "r"), node("w2", "was", "WAS #2")], [["r", "redundancy_group", null]]);
  expect(text(mixed, "w2")).toContain("이중화 묶음(VIP)에 들어 있지 않아");
  // 다른 종류는 세지 않는다.
  expect(text(build([node("w", "was", "WAS"), node("d", "db_rdb", "DB")]), "w")).toContain("1대뿐");
});

test("warningDelta counts new, resolved and all active warnings (ignored ones are left out)", () => {
  const web = node("web", "web_server", "웹", "dmz");
  const was = node("was", "was", "WAS", "biz");
  const fw = node("fw", "firewall", "방화벽");
  const zones: [string, GroupKind, string | null][] = [["dmz", "network_zone", null], ["biz", "network_zone", null]];
  const direct = build([web, was, fw], zones, [["e1", "web", "was", "request"]]);
  const routed = build([web, was, fw], zones, [["e2", "web", "fw", "request"], ["e3", "fw", "was", "request"]]);
  const before = mergeWarnings(direct).active.map((w) => w.id);
  expect(before).toEqual(expect.arrayContaining(["network_direct:e1", "unused_passthrough:fw"]));
  const d = warningDelta(direct, routed);
  expect(d.resolved).toBe(2);
  expect(d.fresh).toBe(0);
  expect(d.now).toBe(mergeWarnings(routed).active.length);
  // 거꾸로 가면 둘 다 새 경고다.
  expect(warningDelta(routed, direct)).toMatchObject({ fresh: 2, resolved: 0 });
  // 무시한 경고는 어느 쪽에서도 세지 않는다.
  const ignored = { ...direct, ignoredWarnings: ["network_direct:e1"] };
  expect(warningDelta(ignored, routed).resolved).toBe(1);
  expect(warningDelta(direct, direct)).toEqual({ fresh: 0, resolved: 0, now: before.length });
});

// ── 클라우드 이중화: 관리형 서비스·AZ 분산 ──
const cloud: [string, GroupKind, string | null][] = [["region", "cloud_region", null], ["vpc", "vpc", "region"], ["priv", "subnet_private", "vpc"]];
const withAttrs = (n: DNode, attrs: DNode["attrs"]): DNode => ({ ...n, attrs });
const warnOf = (s: DiagramState, id: string) => evaluateRules(s).find((w) => w.id === id);

test("on-prem spof text: differently named nodes of one kind are each 1대뿐, not 'outside the group'", () => {
  const dbs = build([node("a", "db_rdb", "주문 DB"), node("b", "db_rdb", "결제 DB")]);
  expect(warnOf(dbs, "spof:a")!.text).toContain("1대뿐");
  expect(warnOf(dbs, "spof:b")!.text).toContain("1대뿐");
});

test("managed load balancer / DB proxy / compute inside a VPC raise no redundancy warning", () => {
  for (const kind of ["lb_l7", "lb_l4", "db_proxy", "app_server"] as NodeKind[]) {
    const s = build([withAttrs(node("m", kind, "M", "priv"), { managed: "yes" })], cloud);
    expect(ids(s).filter((id) => id.endsWith(":m") && !id.startsWith("unused_passthrough"))).toEqual([]);
  }
  // 같은 ALB 라도 관리형 표시가 없으면 직접 운영하는 서버로 보고 묶음 밖이라 알린다.
  const plain = build([node("alb", "lb_l7", "ALB", "priv")], cloud);
  expect(ids(plain).filter((id) => !id.startsWith("unused_passthrough"))).toEqual(["spof_cloud:alb"]);
});

test("managed DB/cache: multi_az yes is fine, no warns, unknown is a check", () => {
  const db = (attrs: DNode["attrs"]) => build([withAttrs(node("d", "db_rdb", "RDS", "priv"), { managed: "yes", ...attrs })], cloud);
  expect(ids(db({ multi_az: "yes" }))).toEqual([]);
  expect(warnOf(db({ multi_az: "no" }), "multi_az:d")).toMatchObject({ level: "warn", text: "RDS이(가) 한 AZ 에만 있어 그 AZ 가 멈추면 데이터도 쓸 수 없어요." });
  expect(warnOf(db({}), "multi_az:d")).toMatchObject({ level: "check", text: "RDS이(가) 여러 AZ 에 복제(Multi-AZ)되는지 알 수 없어요." });
  const cache = build([withAttrs(node("c", "cache", "ElastiCache", "priv"), { managed: "예", multi_az: null })], cloud);
  expect(warnOf(cache, "multi_az:c")!.level).toBe("check");
});

test("self-run cloud server outside a group warns spof_cloud with the AZ guide", () => {
  const s = build([node("w", "was", "Admin App", "priv")], cloud);
  const w = warnOf(s, "spof_cloud:w")!;
  expect(w.text).toBe("Admin App이(가) 1대뿐이라 멈추면 서비스도 멈춰요.");
  expect(w.guide).toContain("서로 다른 AZ");
  expect(w.guide).not.toContain("VIP");
  expect(ids(s)).not.toContain("spof:w");
});

test("self-run cloud group: one az_spread per group — warn when all in one AZ, check when an AZ is unknown, none when spread", () => {
  const groups: [string, GroupKind, string | null][] = [...cloud, ["asg", "redundancy_group", "priv"]];
  const pair = (a: string | null, b: string | null) =>
    build([withAttrs(node("w2", "was", "WAS #2", "asg"), { az: b }), withAttrs(node("w1", "was", "WAS #1", "asg"), { az: a })], groups);
  expect(ids(pair("2a", "2c"))).toEqual([]);
  const same = evaluateRules(pair("2a", "2a"));
  expect(same.map((w) => w.id)).toEqual(["az_spread:w1"]);
  expect(same[0]).toMatchObject({ level: "warn", text: "asg의 서버가 모두 AZ 2a에 있어 그 AZ 가 멈추면 함께 멈춰요." });
  const unknown = evaluateRules(pair("2a", null));
  expect(unknown.map((w) => [w.id, w.level])).toEqual([["az_spread:w1", "check"]]);
});

test("confirmed 이중화 없음 also turns the cloud redundancy rules off", () => {
  const s = build([node("w", "was", "WAS", "priv"), withAttrs(node("d", "db_rdb", "RDS", "priv"), { managed: "yes" })], cloud);
  expect(ids(s).sort()).toEqual(["multi_az:d", "spof_cloud:w"]);
  s.assumptions.redundancy = { key: "redundancy", value: "이중화 없음", confirmed: true };
  expect(ids(s)).toEqual([]);
});

test("multi_az / az_spread texts are recomputed, never replaced by a stored text", () => {
  const s = build([withAttrs(node("d", "db_rdb", "RDS", "priv"), { managed: "yes", multi_az: "no" })], cloud);
  s.warnings = [stored("multi_az:d", "multi_az", "d", "예전: 알 수 없어요")];
  expect(mergeWarnings(s).active[0]!.text).toContain("한 AZ 에만");
});
