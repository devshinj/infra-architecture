import { describe, expect, it } from "vitest";
import { METHOD_LABELS, requiredMethod, pairKey, type NetworkKnowledge, type NetType } from "@/domain/network";
import { NETWORK_RULE_SEED, NETWORK_TYPE_SEED } from "@/domain/network-seed";

function knowledge(rules: NetworkKnowledge["rules"] = []): NetworkKnowledge {
  const types: Record<string, NetType> = {};
  for (const t of NETWORK_TYPE_SEED) types[t.key] = t;
  return { types, rules };
}

describe("requiredMethod", () => {
  it("내부 ↔ 외부 는 망연계(기본)", () => {
    expect(requiredMethod(knowledge(), "admin-net", "internet")).toEqual({
      method: "network_link",
      source: "default",
    });
  });

  it("내부 ↔ 경계, 경계 ↔ 외부, 같은 등급 다른 종류는 방화벽", () => {
    const k = knowledge();
    expect(requiredMethod(k, "admin-net", "dmz")?.method).toBe("firewall");
    expect(requiredMethod(k, "dmz", "internet")?.method).toBe("firewall");
    expect(requiredMethod(k, "admin-net", "business-net")?.method).toBe("firewall");
  });

  it("폐쇄는 어느 쪽과도 none", () => {
    const k = knowledge();
    expect(requiredMethod(k, "control-net", "business-net")?.method).toBe("none");
    expect(requiredMethod(k, "control-net", "internet")?.method).toBe("none");
  });

  it("사용자 종류 짝 규칙이 등급 규칙보다 앞선다", () => {
    const k = knowledge([
      { a: "admin-net", b: "gcloud-internal", method: "network_link", note: "○○ 지침 3조" },
    ]);
    const expected = { method: "network_link", source: "user", note: "○○ 지침 3조" };
    expect(requiredMethod(k, "admin-net", "gcloud-internal")).toEqual(expected);
    expect(requiredMethod(k, "gcloud-internal", "admin-net")).toEqual(expected);
  });

  it("모르는 종류·같은 종류는 null", () => {
    const k = knowledge();
    expect(requiredMethod(k, "admin-net", "nope")).toBeNull();
    expect(requiredMethod(k, "nope", "admin-net")).toBeNull();
    expect(requiredMethod(k, "admin-net", "admin-net")).toBeNull();
  });

  it("pairKey 는 사전순으로 정렬한다", () => {
    expect(pairKey("b", "a")).toEqual(["a", "b"]);
  });
});

describe("seed", () => {
  it("key 가 id 형식이고 겹치지 않으며 스펙 1-1 범위를 덮는다", () => {
    const keys = NETWORK_TYPE_SEED.map((t) => t.key);
    expect(new Set(keys).size).toBe(keys.length);
    for (const key of keys) expect(key).toMatch(/^[a-z0-9][a-z0-9-]{0,63}$/);
    const grade = Object.fromEntries(NETWORK_TYPE_SEED.map((t) => [t.key, t.grade]));
    expect(grade).toMatchObject({
      "admin-net": "internal",
      "business-net": "internal",
      "mgmt-net": "internal",
      "backup-net": "internal",
      "dev-net": "internal",
      "gcloud-internal": "internal",
      "control-net": "closed",
      "finance-net": "closed",
      dmz: "boundary",
      internet: "external",
      "inter-agency": "external",
      "gcloud-internet": "external",
      "private-cloud": "external",
    });
    const admin = NETWORK_TYPE_SEED.find((t) => t.key === "admin-net");
    expect(admin?.aliases).toContain("정부 업무망");
    for (const t of NETWORK_TYPE_SEED) {
      expect(t.name.length).toBeGreaterThan(0);
      expect(t.description.length).toBeGreaterThan(0);
    }
  });
});

describe("망분리 대상(separated)", () => {
  const net = (key: string, grade: NetType["grade"], separated: boolean): NetType => ({ key, name: key, aliases: [], description: "", grade, separated });
  const k = (...types: NetType[]): NetworkKnowledge => ({ types: Object.fromEntries(types.map((t) => [t.key, t])), rules: [] });

  it("내부 ↔ 외부 는 둘 중 하나가 망분리 대상일 때만 망연계, 아니면 방화벽", () => {
    const sep = k(net("in", "internal", true), net("out", "external", false));
    expect(requiredMethod(sep, "in", "out")).toEqual({ method: "network_link", source: "default" });
    expect(requiredMethod(sep, "out", "in")?.method).toBe("network_link");

    const open = k(net("in", "internal", false), net("out", "external", false));
    expect(requiredMethod(open, "in", "out")).toEqual({ method: "firewall", source: "default" });

    // 바깥쪽 종류에 표시가 있어도 같은 뜻으로 본다(둘 중 하나).
    const outer = k(net("in", "internal", false), net("out", "external", true));
    expect(requiredMethod(outer, "in", "out")?.method).toBe("network_link");
  });

  it("폐쇄는 망분리 대상 여부와 상관없이 none, 내부 ↔ 경계는 방화벽", () => {
    const kk = k(net("c", "closed", false), net("in", "internal", true), net("edge", "boundary", false));
    expect(requiredMethod(kk, "c", "in")?.method).toBe("none");
    expect(requiredMethod(kk, "in", "edge")?.method).toBe("firewall");
  });

  it("기본 제공 종류: 일반 사무망·클라우드 서브넷은 인터넷과 방화벽, 행정망·금융 업무망은 망연계", () => {
    const seed: NetworkKnowledge = { types: Object.fromEntries(NETWORK_TYPE_SEED.map((t) => [t.key, t])), rules: [], baseRules: NETWORK_RULE_SEED };
    expect(requiredMethod(seed, "office-net", "internet")?.method).toBe("firewall");
    expect(requiredMethod(seed, "cloud-private-subnet", "internet")?.method).toBe("firewall");
    expect(requiredMethod(seed, "on-prem-dc", "private-cloud")?.method).toBe("firewall");
    expect(requiredMethod(seed, "admin-net", "internet")?.method).toBe("network_link");
    expect(requiredMethod(seed, "fin-business", "internet")?.method).toBe("network_link");
    expect(requiredMethod(seed, "business-net", "private-cloud")?.method).toBe("network_link");
  });
});

describe("기본 제공 짝 규칙(baseRules)", () => {
  const seed = (rules: NetworkKnowledge["rules"] = []): NetworkKnowledge => ({
    types: Object.fromEntries(NETWORK_TYPE_SEED.map((t) => [t.key, t])),
    rules,
    baseRules: NETWORK_RULE_SEED,
  });

  it("등급 규칙보다 먼저 쓰고 source 는 default, 까닭(note)을 함께 준다", () => {
    const direct = requiredMethod(seed(), "server-farm", "storage-net");
    expect(direct?.method).toBe("direct");
    expect(direct?.source).toBe("default");
    expect(direct?.note).toBeTruthy();
    // 폐쇄 등급이어도 정해진 구간과는 방화벽으로 잇는다(금융 전산망 ↔ DMZ).
    expect(requiredMethod(seed(), "finance-net", "dmz")?.method).toBe("firewall");
    // 내부 ↔ 경계 기본값(방화벽)과 달리 망연계로 본다(업무망 ↔ 기관 인터넷망).
    expect(requiredMethod(seed(), "agency-internet", "business-net")?.method).toBe("network_link");
    // 외부 ↔ 내부(망분리 대상 아님) 기본값(방화벽)과 달리 잇지 않는다.
    expect(requiredMethod(seed(), "guest-wlan", "office-net")?.method).toBe("none");
  });

  it("같은 짝의 기관 규칙이 기본 제공 짝 규칙보다 먼저다", () => {
    const k = seed([{ a: "server-farm", b: "storage-net", method: "firewall", note: "사내 표준" }]);
    expect(requiredMethod(k, "storage-net", "server-farm")).toEqual({ method: "firewall", source: "user", note: "사내 표준" });
  });

  it("숨긴(지식에 없는) 종류가 낀 짝에는 쓰지 않는다", () => {
    const k = seed();
    delete k.types["storage-net"];
    expect(requiredMethod(k, "server-farm", "storage-net")).toBeNull();
  });

  it("규칙은 있는 종류만 가리키고, 사전순 짝이 겹치지 않으며, 글 길이가 화면 한도 안이다", () => {
    const keys = new Set(NETWORK_TYPE_SEED.map((t) => t.key));
    const seen = new Set<string>();
    for (const r of NETWORK_RULE_SEED) {
      expect(keys.has(r.a), r.a).toBe(true);
      expect(keys.has(r.b), r.b).toBe(true);
      expect(r.a < r.b, `${r.a} < ${r.b}`).toBe(true);
      expect(Object.hasOwn(METHOD_LABELS, r.method)).toBe(true);
      const id = `${r.a}--${r.b}`;
      expect(seen.has(id), id).toBe(false);
      seen.add(id);
      expect([...(r.note ?? "")].length, id).toBeGreaterThan(0);
      expect([...(r.note ?? "")].length, id).toBeLessThanOrEqual(100);
    }
  });
});

describe("기본 제공 종류의 글 한도(서버 검증과 같은 값)", () => {
  it("이름 30자, 다른 이름 10개·각 30자, 설명 200자 이내이고 이름·다른 이름이 종류끼리 겹치지 않는다", () => {
    const names = new Map<string, string>();
    for (const t of NETWORK_TYPE_SEED) {
      expect([...t.name].length, t.key).toBeLessThanOrEqual(30);
      expect(t.aliases.length, t.key).toBeLessThanOrEqual(10);
      for (const a of t.aliases) expect([...a].length, `${t.key}: ${a}`).toBeLessThanOrEqual(30);
      expect([...t.description].length, t.key).toBeLessThanOrEqual(200);
      expect(new Set(t.aliases).size, t.key).toBe(t.aliases.length);
      for (const label of [t.name, ...t.aliases]) {
        const k = label.replace(/\s+/g, "").toLowerCase();
        expect(names.get(k) ?? t.key, `"${label}" 가 ${names.get(k)} 와 ${t.key} 에 겹친다`).toBe(t.key);
        names.set(k, t.key);
      }
    }
  });
});
