import { describe, expect, it } from "vitest";
import { requiredMethod, pairKey, type NetworkKnowledge, type NetType } from "@/domain/network";
import { NETWORK_TYPE_SEED } from "@/domain/network-seed";

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
