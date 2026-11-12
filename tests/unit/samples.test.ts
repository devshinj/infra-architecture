import { describe, expect, test } from "vitest";

import { checkFlow } from "@/domain/flows";
import { NETWORK_RULE_SEED, NETWORK_TYPE_SEED } from "@/domain/network-seed";
import { buildSample, SAMPLE_LIST } from "@/domain/samples";
import type { NetworkKnowledge } from "@/domain/network";
import { evaluateRules } from "@/domain/warnings";
import { convertSpikeScenario, SAMPLES, sampleState, type SpikeState } from "@/server/samples";

test("az groups are removed, nodes get attrs.az and children are re-parented", () => {
  const raw: SpikeState = {
    groups: {
      vpc: { id: "vpc", group_kind: "vpc", label: "VPC", parent: null },
      az1: { id: "az1", group_kind: "az", label: "AZ-a", parent: "vpc" },
      sub: { id: "sub", group_kind: "subnet_private", label: "내부 구역", parent: "az1" },
    },
    nodes: {
      n1: { id: "n1", kind: "app_server", label: "APP", parent: "sub" },
      n2: { id: "n2", kind: "app_server", label: "APP2", parent: "az1" },
    },
    edges: {},
    assumptions: {},
  };
  const s = convertSpikeScenario(raw);
  expect(s.groups.az1).toBeUndefined();
  expect(s.groups.sub.parent).toBe("vpc");
  expect(s.nodes.n1.parent).toBe("sub");
  expect(s.nodes.n1.attrs.az).toBe("AZ-a");
  expect(s.nodes.n2.parent).toBe("vpc");
  expect(s.nodes.n2.attrs.az).toBe("AZ-a");
});

// 기본 제공 망 지식(사용자가 처음 받는 것과 같다).
const KNOWLEDGE: NetworkKnowledge = { types: Object.fromEntries(NETWORK_TYPE_SEED.map((t) => [t.key, t])), rules: [], baseRules: NETWORK_RULE_SEED };

/** 샘플마다 처음부터 뜨는 경고. 모두 실제로 맞는 위험이고, 이 밖의 경고가 뜨면 샘플이나 규칙이 어긋난 것이다. */
const EXPECTED_WARNINGS: Record<string, string[]> = {
  "aws-shop": ["warn spof_cloud:admin-app"],
  "eks-msa": ["warn multi_az:db-product"],
  serverless: [],
  "idc-3tier": ["warn spof:db-proxy"],
  "gov-netsep": ["warn network_direct:e-was-1-sms"],
  "iot-control": ["check link_unusual:ctrl--iot", "warn spof:ctrl-db"],
  "llm-rag": ["warn spof:groupware"],
  "access-control": ["warn spof:acs"],
};

test("the sample menu lists every sample once, in order", () => {
  expect(SAMPLES.map((s) => s.id)).toEqual(Object.keys(EXPECTED_WARNINGS));
  expect(new Set(SAMPLES.map((s) => s.title)).size).toBe(SAMPLES.length);
});

describe.each(SAMPLE_LIST.map((s) => [s.id, s] as const))("sample %s", (id, sample) => {
  const { state, flows } = buildSample(sample);

  test("builds without command errors and only the intended warnings show up", () => {
    const got = evaluateRules(state, KNOWLEDGE).map((w) => `${w.level} ${w.id}`).sort();
    expect(got).toEqual([...EXPECTED_WARNINGS[id]!].sort());
  });

  test("has 1~2 flows whose steps all follow existing edges", () => {
    expect(flows.length).toBeGreaterThanOrEqual(1);
    expect(flows.length).toBeLessThanOrEqual(2);
    for (const f of flows) expect(checkFlow(state, f)).toEqual([]);
  });

  test("labels are Korean except product names, and zone types are confirmed by a person", () => {
    for (const g of Object.values(state.groups)) {
      // DMZ·VIP 는 원어로 쓰는 용어다.
      expect(g.label).toMatch(/[가-힣]|^DMZ$|VIP$/);
      if (g.netType) expect(g.netType).toMatchObject({ source: "user", confirmed: true });
    }
    for (const a of Object.values(state.assumptions)) expect(a.confirmed).toBe(false);
  });

  test("sampleState gives the same diagram as buildSample", () => {
    expect(sampleState(id)).toEqual(state);
  });
});
