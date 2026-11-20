import { describe, expect, test } from "vitest";

import { judgeFlowOps } from "@/domain/flows";
import { GLOSSARY_SEED } from "@/domain/glossary-seed";
import { buildGuideState } from "@/domain/guides/apply";
import { GUIDE_LIST, guideEnvs } from "@/domain/guides";
import { findConflict, keywordMatch, normalizeUtterance } from "@/domain/guides/judge";
import { GUIDE_LIMITS, type AuthoredEdge, type AuthoredGroup, type AuthoredTermed, type GuideEnv } from "@/domain/guides/types";
import { normalizeTerm, overLimit, pickTerm, targetTermCandidates, type AnyExplanation } from "@/domain/explain";
import { computeMissing } from "@/domain/missing";
import type { NetworkKnowledge } from "@/domain/network";
import { NETWORK_RULE_SEED, NETWORK_TYPE_SEED } from "@/domain/network-seed";
import { evaluateRules } from "@/domain/warnings";

// 기본 제공 망 지식(samples.test.ts 와 같다).
const KNOWLEDGE: NetworkKnowledge = { types: Object.fromEntries(NETWORK_TYPE_SEED.map((t) => [t.key, t])), rules: [], baseRules: NETWORK_RULE_SEED };

/** 대본마다 끝 상태에 뜨는 경고("<대본 id>:<환경>"). 의도한 경고만 적는다. */
const EXPECTED_GUIDE_WARNINGS: Record<string, string[]> = {};

const GLOSSARY_ROWS = GLOSSARY_SEED.map((e) => ({ key: normalizeTerm(e.term), aliases: e.aliases }));
const len = (s: string): number => [...s].length;

test("GUIDE_LIST is defined", () => {
  expect(Array.isArray(GUIDE_LIST)).toBe(true);
  // 대본 id 는 서로 달라야 한다.
  expect(new Set(GUIDE_LIST.map((g) => g.id)).size).toBe(GUIDE_LIST.length);
});

const cases = GUIDE_LIST.flatMap((g) => guideEnvs(g).map((env) => [`${g.id}:${env}`, g, env] as const));

describe.each(cases)("guide %s", (key, g, env: GuideEnv) => {
  const variant = g.variants[env]!;
  const opts = { netTypes: KNOWLEDGE.types };
  const finished = () => buildGuideState(variant, variant.steps.length, opts);

  test("every step applies from an empty diagram", () => {
    for (let i = 1; i <= variant.steps.length; i++) {
      const { state } = buildGuideState(variant, i, opts);
      const empty = Object.values(state.groups).filter(
        (grp) => !Object.values(state.nodes).some((n) => n.parent === grp.id) && !Object.values(state.groups).some((c) => c.parent === grp.id),
      );
      expect(empty.map((x) => x.id), `단계 ${i} 뒤 빈 영역`).toEqual([]);
    }
  });

  test("the finished diagram has no missing info", () => {
    expect(computeMissing(finished().state, KNOWLEDGE).count).toBe(0);
  });

  test("the finished diagram shows only the intended warnings", () => {
    const got = evaluateRules(finished().state, KNOWLEDGE).map((w) => `${w.level} ${w.id}`).sort();
    expect(got).toEqual([...(EXPECTED_GUIDE_WARNINGS[key] ?? [])].sort());
  });

  test("every flow is accepted", () => {
    const { state, flowOps } = finished();
    const outcomes = judgeFlowOps(state, [], flowOps);
    expect(outcomes.map((o) => (o.kind === "rejected" ? o.reason : o.kind))).toEqual(outcomes.map(() => "saved"));
  });

  test("text fits the limits", () => {
    expect(variant.steps.length).toBeGreaterThanOrEqual(10);
    expect(variant.steps.length).toBeLessThanOrEqual(14);
    for (const s of variant.steps) {
      expect(len(s.say), `${s.id} say`).toBeLessThanOrEqual(GUIDE_LIMITS.say);
      expect(len(s.miss), `${s.id} miss`).toBeLessThanOrEqual(GUIDE_LIMITS.miss);
      expect(len(s.goal), `${s.id} goal`).toBeLessThanOrEqual(GUIDE_LIMITS.goal);
      expect((s.notes ?? []).length, `${s.id} notes`).toBeLessThanOrEqual(GUIDE_LIMITS.notes);
      for (const n of s.notes ?? []) expect(len(n.text), `${s.id} note`).toBeLessThanOrEqual(GUIDE_LIMITS.note);
      for (const [target, ex] of Object.entries(s.explains)) {
        const asExplanation: AnyExplanation = target.startsWith("edge:")
          ? { kind: "edge", ...(ex as AuthoredEdge) }
          : {
              kind: target.startsWith("group:") ? "group" : "node",
              term: (ex as AuthoredTermed).term ?? "",
              definition: (ex as AuthoredTermed).definition ?? "",
              definitionSource: "glossary",
              reviewed: true,
              role: (ex as AuthoredTermed).role,
              ...(target.startsWith("group:") ? { boundary: (ex as AuthoredGroup).boundary } : {}),
              adr: (ex as AuthoredTermed).adr,
            } as AnyExplanation;
        expect(overLimit(asExplanation), `${s.id} ${target}`).toEqual([]);
      }
    }
  });

  test("every node, group and edge has an authored explanation", () => {
    const { state } = finished();
    const explains = new Map(variant.steps.flatMap((s) => Object.entries(s.explains)));
    const targets = [
      ...Object.keys(state.nodes).map((id) => ["node", id] as const),
      ...Object.keys(state.groups).map((id) => ["group", id] as const),
      ...Object.keys(state.edges).map((id) => ["edge", id] as const),
    ];
    for (const [kind, id] of targets) {
      const ex = explains.get(`${kind}:${id}`);
      expect(ex, `${kind}:${id} 설명`).toBeDefined();
      if (kind === "edge" || !ex) continue;
      if ((ex as AuthoredTermed).definition) continue;
      const keys = targetTermCandidates(state, kind, id).map((c) => c.key);
      expect(pickTerm(GLOSSARY_ROWS, keys), `${kind}:${id} 사전 용어`).not.toBeNull();
    }
  });

  test("every explains key names a node, group or edge of the finished diagram", () => {
    const { state } = finished();
    for (const s of variant.steps) {
      for (const key of Object.keys(s.explains)) {
        const [kind, id] = [key.slice(0, key.indexOf(":")), key.slice(key.indexOf(":") + 1)];
        const table = kind === "node" ? state.nodes : kind === "group" ? state.groups : kind === "edge" ? state.edges : null;
        expect(table !== null && Object.hasOwn(table, id), `${s.id} ${key}`).toBe(true);
      }
    }
  });

  test("quantity conflicts catch wrong counts but not correct requests or questions", () => {
    // 맞는 요청·질문인데 수량 말과 글자가 겹치는 문장. conflict 는 Clef 보다 먼저 보므로 걸리면 안 된다.
    const safe = ["아까 말한 대로 L4 두 대로 이중화해 줘", "하나만 물어볼게요, VIP 가 뭐야?", "L4 대신 다른 걸 써도 돼?", "L4 대수는 두 대로 해 줘", "L4 두 대로 하고 평소엔 한 대만 일하게 해 줘", "차세대 방화벽 뒤에 WAS 두 대를 넣어 줘", "API 서버를 AZ 마다 한 대씩 두 대 넣어 줘"];
    for (const s of variant.steps) for (const t of safe) expect(findConflict(t, s), `${s.id}: ${t}`).toBeNull();
    for (const s of variant.steps.filter((x) => x.conflicts?.length)) {
      for (const t of ["세 대로 해 줘", "서버 3대 넣어 줘", "WAS 는 세 대", "한 대만 넣어 줘", "서버 하나만"]) expect(findConflict(t, s), `${s.id}: ${t}`).not.toBeNull();
    }
  });

  test("each example is a keyword match for its own step and hits no conflict", () => {
    for (const s of variant.steps) {
      expect(keywordMatch(s.example, s.keywords), s.id).toBe(true);
      expect(findConflict(s.example, s), s.id).toBeNull();
    }
  });

  test("no empty keyword or conflict piece", () => {
    for (const s of variant.steps) {
      expect(s.keywords.length, `${s.id} keywords`).toBeGreaterThan(0);
      for (const group of s.keywords) {
        expect(group.length, `${s.id} keyword group`).toBeGreaterThan(0);
        for (const k of group) expect(normalizeUtterance(k), `${s.id} keyword "${k}"`).not.toBe("");
      }
      for (const c of s.conflicts ?? []) {
        for (const p of c.pattern) expect(normalizeUtterance(p), `${s.id} conflict "${p}"`).not.toBe("");
      }
    }
  });

  test("no guide uses set_link_guess", () => {
    for (const s of variant.steps) expect(s.commands.some((c) => c.op === "set_link_guess"), s.id).toBe(false);
  });

  test("step ids are unique", () => {
    const ids = variant.steps.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
