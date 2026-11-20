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
    const safe = ["아까 말한 대로 L4 두 대로 이중화해 줘", "하나만 물어볼게요, VIP 가 뭐야?", "L4 대신 다른 걸 써도 돼?", "L4 대수는 두 대로 해 줘", "L4 두 대로 하고 평소엔 한 대만 일하게 해 줘", "차세대 방화벽 뒤에 WAS 두 대를 넣어 줘", "API 서버를 AZ 마다 한 대씩 두 대 넣어 줘", "질문을 하나만 할게요", "API 하나만 물어볼게", "차세대 두 대를 넣어 줘", "차세대가 뭐야?", "차세대만 써도 돼?", "API 하나만 써도 돼?", "하나만 써서 해도 돼?"];
    for (const s of variant.steps) for (const t of safe) expect(findConflict(t, s), `${s.id}: ${t}`).toBeNull();
    for (const s of variant.steps.filter((x) => x.conflicts?.length)) {
      for (const t of ["L4 세 대로 해 줘", "서버 3대 넣어 줘", "WAS 는 세 대", "웹 서버 세 대 붙여 줘", "한 대만 넣어 줘", "서버 하나만 둬 줘", "서버 하나만 써 줘", "하나만 쓰자", "하나만 써서 넣어 줘"]) expect(findConflict(t, s), `${s.id}: ${t}`).not.toBeNull();
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

  // 다시 하기(redo)는 되돌리기가 지운 흐름을 다시 넣지 않는다(syncGuideLocked 는 지우기만 한다).
  // 흐름을 마지막 단계에서만 넣어야 되돌렸다 다시 해도 흐름이 빠지지 않는다.
  test("add_flow appears only in the last step", () => {
    const last = variant.steps.length - 1;
    const withFlow = variant.steps.flatMap((s, i) => (s.commands.some((c) => c.op === "add_flow") ? [i] : []));
    expect(withFlow.filter((i) => i !== last).map((i) => variant.steps[i]!.id)).toEqual([]);
  });

  test("no script uses update_flow or remove_flow", () => {
    for (const s of variant.steps) expect(s.commands.filter((c) => c.op === "update_flow" || c.op === "remove_flow").map((c) => c.op), s.id).toEqual([]);
  });

  // 학습 중에 설명 탭이 Qwen 을 부르지 않게: 그 단계까지 생긴 대상은 그 단계까지의 대본 설명이 있어야 한다.
  test("every target present after a step has its explanation in that step or earlier", () => {
    for (let i = 1; i <= variant.steps.length; i++) {
      const { state } = buildGuideState(variant, i, opts);
      const known = new Set(variant.steps.slice(0, i).flatMap((s) => Object.keys(s.explains)));
      const targets = [
        ...Object.keys(state.nodes).map((id) => `node:${id}`),
        ...Object.keys(state.groups).map((id) => `group:${id}`),
        ...Object.keys(state.edges).map((id) => `edge:${id}`),
      ];
      expect(targets.filter((t) => !known.has(t)), `단계 ${i}(${variant.steps[i - 1]!.id}) 뒤 설명 없는 대상`).toEqual([]);
    }
  });

  test("step ids are unique", () => {
    const ids = variant.steps.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
