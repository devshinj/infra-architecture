import { describe, expect, test } from "vitest";

import type { NetRule, NetType, NetworkKnowledge } from "@/domain/network";
import { NETWORK_TYPE_SEED } from "@/domain/network-seed";
import { buildGuide } from "@/server/mcp/read";

import { KNOWLEDGE } from "../fixtures/network";

describe("buildGuide", () => {
  const guide = buildGuide(KNOWLEDGE);

  test("seed 지식으로 20000자 이하", () => {
    expect(guide.length).toBeLessThanOrEqual(20000);
  });

  test("사용법 문구가 들어 있다", () => {
    expect(guide).toContain("get_diagram 으로 다시 읽");
    expect(guide).toContain("모르는 값은 비워");
    expect(guide).toContain("흐름은 버전과 따로");
    expect(guide).toContain("base_version");
    expect(guide).toContain("dry_run");
    expect(guide).toContain("배열의 원소");
  });

  test("Qwen 전용 문구는 없다", () => {
    expect(guide).not.toContain('"op":"say"');
    expect(guide).not.toContain("JSON Lines");
  });

  test("Qwen 이름으로 된 규칙 용어를 MCP 말로 풀이한다", () => {
    for (const term of ["(확정)", "채워야 할 정보", '"흐름:"', "망 짝 규칙", "<KIND>", "영문-소문자-id", "typeSource", "missing", "flows"]) {
      expect(guide).toContain(term);
    }
  });

  test("명령 예와 규칙, 망 지식을 담는다", () => {
    expect(guide).toContain('"op":"add_node"');
    expect(guide).toContain("KIND 허용값");
    expect(guide).toContain("망 종류:");
    expect(guide).toContain("admin-net");
  });

  test("종류 30개·기관 규칙 30개를 더해도 20000자 이하", () => {
    const types: Record<string, NetType> = { ...KNOWLEDGE.types };
    for (let i = 0; i < 30; i++) {
      const key = `extra-net-${i}`;
      types[key] = { key, name: `추가 망 ${i}`, aliases: [`별칭 ${i}`, `다른 이름 ${i}`], description: "x".repeat(200), grade: "internal" };
    }
    const rules: NetRule[] = [];
    for (let i = 0; i < 30; i++) {
      const [a, b] = [`extra-net-${i}`, NETWORK_TYPE_SEED[i % NETWORK_TYPE_SEED.length]!.key].sort() as [string, string];
      rules.push({ a, b, method: "network_link", note: `기관 근거 ${i} `.repeat(3) });
    }
    const big: NetworkKnowledge = { types, rules };
    const text = buildGuide(big);
    expect(text).toContain("extra-net-29");
    expect(text.length).toBeLessThanOrEqual(20000);
  });
});
