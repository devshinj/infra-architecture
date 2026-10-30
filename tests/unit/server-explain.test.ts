import { describe, expect, test, vi } from "vitest";

import { NODE_KINDS } from "@/domain/catalog";
import { normalizeTerm, signatureOf, type NodeExplanation } from "@/domain/explain";
import { emptyState, type DiagramState } from "@/domain/types";
import { buildExplainMessages, EXPLAIN_EDGE_PROMPT, EXPLAIN_NODE_PROMPT } from "@/server/chat/prompt";
import { explainTarget, type ExplainRepo } from "@/server/explain";
import type { GlossaryRow } from "@/server/glossary";
import { EXPLAIN_SCORE_QUESTION, type ClefAnswers, type ClefClient } from "@/server/llm/clef";
import type { ChatMessage, QwenClient } from "@/server/llm/qwen";
import { NotFoundError, ValidationError } from "@/server/projects";

const L4_DEF = "L4 로드밸런서(Layer 4 Load Balancer)는 전송 계층의 IP·포트만 보고 요청을 나눠 보내는 장비입니다.";

function sample(): DiagramState {
  const s = emptyState();
  s.groups.vpc = { id: "vpc", groupKind: "vpc", label: "서비스 VPC", parent: null };
  s.nodes.lb = { id: "lb", kind: "lb_l4", label: "L4", parent: "vpc", attrs: {} };
  s.nodes["was-1"] = { id: "was-1", kind: "was", label: "WAS#1", sub: "Tomcat 10", parent: "vpc", attrs: {} };
  s.nodes.zz = { id: "zz", kind: "cache", label: "관계없는 캐시", parent: null, attrs: {} };
  s.edges.e1 = { id: "e1", from: "lb", to: "was-1", edgeKind: "request", label: "HTTP 8080" };
  return s;
}

const row = (over: Partial<GlossaryRow>): GlossaryRow => ({
  id: `id-${over.key}`,
  userId: "u",
  key: "",
  term: "",
  fullName: "",
  category: "",
  definition: "",
  why: "",
  compare: "",
  aliases: [],
  reviewed: false,
  source: "seed",
  updatedAt: new Date(0),
  ...over,
});

const L4_ROW = row({ key: normalizeTerm("L4 로드밸런서"), term: "L4 로드밸런서", definition: L4_DEF, why: "서버 여러 대에 요청을 나누려고", compare: "L4는 IP·포트, L7은 요청 내용을 봅니다.", reviewed: true, aliases: ["l4"] });

/** 메모리 저장소. 호출 순서를 log 에 남긴다. */
function fakeRepo(state: DiagramState | null = sample(), terms: GlossaryRow[] = [L4_ROW]) {
  const log: string[] = [];
  const cache = new Map<string, { signature: string; data: unknown }>();
  const glossary = [...terms];
  const repo: ExplainRepo = {
    async getOwnedDiagram(userId) {
      log.push("owned");
      if (userId !== "u") throw new NotFoundError();
    },
    async getLatestState() {
      return state ? { state } : null;
    },
    async ensureSeeded() {
      log.push("seed");
    },
    async findTerm(_userId, keys) {
      log.push(`find:${keys.join(",")}`);
      for (const k of keys) {
        const hit = glossary.find((r) => r.key === k) ?? glossary.find((r) => r.aliases.includes(k));
        if (hit) return hit;
      }
      return null;
    },
    addAiTerm: vi.fn(async (_userId, entry) => {
      log.push("addAiTerm");
      const r = row({ key: normalizeTerm(entry.term), term: entry.term, category: entry.category, definition: entry.definition, why: entry.why ?? "", compare: entry.compare ?? "", source: "ai", reviewed: false });
      glossary.push(r);
      return r;
    }),
    async getCached(_d, kind, id) {
      return (cache.get(`${kind}:${id}`) as never) ?? null;
    },
    async saveExplanation(r) {
      log.push(`save:${r.targetKind}:${r.targetId}`);
      cache.set(`${r.targetKind}:${r.targetId}`, { signature: r.signature, data: r.data });
    },
    async listSignatures() {
      return [...cache.entries()].map(([k, v]) => ({ targetKind: k.split(":")[0] as "node", targetId: k.split(":")[1]!, signature: v.signature }));
    },
  };
  return { repo, log, cache, glossary };
}

type Reply = string | Error | ((msgs: ChatMessage[], i: number) => string);

function fakeQwen(reply: Reply) {
  const calls: ChatMessage[][] = [];
  const qwen: QwenClient = {
    streamCompletion: vi.fn(async (messages: ChatMessage[], { onDelta }) => {
      calls.push(messages);
      if (reply instanceof Error) throw reply;
      const text = typeof reply === "function" ? reply(messages, calls.length - 1) : reply;
      onDelta(text);
      return { text, finishReason: "stop" };
    }),
  };
  return { qwen, calls };
}

/** score 답을 돌려주는 가짜 Clef. null 이면 실패한다. */
function fakeClef(scoreOf: (i: number) => number | null = () => 0.3) {
  const calls: Array<{ state: unknown; questions: Record<string, unknown>; opts?: { capMs?: number; maxRetries?: number } }> = [];
  const clef: ClefClient = {
    decide: vi.fn(async (state: unknown, questions: Record<string, unknown>, _s?: AbortSignal, opts?: { capMs?: number; maxRetries?: number }): Promise<ClefAnswers> => {
      calls.push({ state, questions, opts });
      const s = scoreOf(calls.length - 1);
      if (s === null) throw new Error("Clef is not configured");
      return { q: { type: "score", score: s } };
    }),
    classifyIntent: vi.fn(async () => null),
  };
  return { clef, calls };
}

const ADR = { decision: "L4 를 앞에 둔다", reason: "WAS 여러 대에 나누려고", alternative: "L7 로드밸런서", cost: "URL 기준 분배는 못 한다" };
const nodeJson = (over: Record<string, unknown> = {}) => JSON.stringify({ role: "들어온 요청을 WAS 로 나눠 보냅니다.", adr: ADR, ...over });
const TOMCAT_DEF = "Tomcat(Apache Tomcat)은 Java 웹 애플리케이션을 실행하는 오픈소스 WAS입니다.";
const edgeJson = (over: Record<string, unknown> = {}) =>
  JSON.stringify({ flow: "사용자 웹 요청", method: "HTTP 8080 동기 요청", why: "L4 가 받은 요청을 WAS 에 넘기려고", firewall: "L4 → WAS 8080 허용", ...over });

const userOf = (msgs: ChatMessage[]) => msgs.find((m) => m.role === "user")!.content;
const systemOf = (msgs: ChatMessage[]) => msgs.find((m) => m.role === "system")!.content;

describe("explainTarget", () => {
  test("glossary definition is used and qwen is told not to define", async () => {
    const { repo, log, cache } = fakeRepo();
    const { qwen, calls } = fakeQwen(nodeJson({ definition: "무시할 정의" }));
    const { clef } = fakeClef();
    const r = await explainTarget("u", "d", "node", "lb", {}, { qwen, clef, repo });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const e = r.explanation as NodeExplanation;
    expect(e).toMatchObject({
      kind: "node",
      term: "L4 로드밸런서",
      definition: L4_DEF,
      definitionSource: "glossary",
      reviewed: true,
      why: L4_ROW.why,
      compare: L4_ROW.compare,
      role: "들어온 요청을 WAS 로 나눠 보냅니다.",
      adr: ADR,
    });
    expect(r.signature).toBe(signatureOf(sample(), "node", "lb"));
    expect(calls).toHaveLength(1);
    expect(systemOf(calls[0]!)).toBe(EXPLAIN_NODE_PROMPT);
    expect(userOf(calls[0]!)).toContain(JSON.stringify(L4_DEF));
    expect(userOf(calls[0]!)).toContain("definition 키는 쓰지 않는다");
    expect(repo.addAiTerm).not.toHaveBeenCalled();
    expect(log.indexOf("seed")).toBeLessThan(log.findIndex((l) => l.startsWith("find:")));
    expect(log).toContain("find:l4로드밸런서");
    expect(cache.get("node:lb")).toEqual({ signature: r.signature, data: e });
  });

  test("missing term is generated and added unreviewed", async () => {
    const { repo, log, glossary } = fakeRepo();
    const { qwen, calls } = fakeQwen(nodeJson({ definition: TOMCAT_DEF }));
    const r = await explainTarget("u", "d", "node", "was-1", {}, { qwen, clef: fakeClef().clef, repo });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.explanation).toMatchObject({ kind: "node", term: "Tomcat 10", definition: TOMCAT_DEF, definitionSource: "ai", reviewed: false });
    expect((r.explanation as NodeExplanation).why).toBeUndefined();
    expect(userOf(calls[0]!)).not.toContain("definition 키는 쓰지 않는다");
    const wasKo = NODE_KINDS.find((k) => k.kind === "was")!.labelKo;
    expect(repo.addAiTerm).toHaveBeenCalledWith("u", { term: "Tomcat 10", category: wasKo, definition: TOMCAT_DEF, why: "", compare: "" });
    expect(log.indexOf("seed")).toBeLessThan(log.indexOf("addAiTerm"));
    expect(glossary.at(-1)).toMatchObject({ source: "ai", reviewed: false });
  });

  test("cached explanation is returned when signature matches", async () => {
    const { repo, cache } = fakeRepo();
    const sig = signatureOf(sample(), "node", "lb")!;
    const data = { kind: "node", term: "캐시된 것" };
    cache.set("node:lb", { signature: sig, data });
    const { qwen, calls } = fakeQwen(nodeJson());
    const r = await explainTarget("u", "d", "node", "lb", {}, { qwen, clef: fakeClef().clef, repo });
    expect(r).toEqual({ ok: true, explanation: data, signature: sig });
    expect(calls).toHaveLength(0);

    // 서명이 다르면 다시 만든다.
    cache.set("node:lb", { signature: "old", data });
    const again = await explainTarget("u", "d", "node", "lb", {}, { qwen, clef: fakeClef().clef, repo });
    expect(calls).toHaveLength(1);
    expect(again.ok && (again.explanation as NodeExplanation).term).toBe("L4 로드밸런서");

    // force 면 서명이 같아도 다시 만든다.
    await explainTarget("u", "d", "node", "lb", { force: true }, { qwen, clef: fakeClef().clef, repo });
    expect(calls).toHaveLength(2);
  });

  test("instruction forces regeneration with the instruction in the prompt", async () => {
    const { repo, cache } = fakeRepo();
    const first = await explainTarget("u", "d", "node", "lb", {}, { qwen: fakeQwen(nodeJson()).qwen, clef: fakeClef().clef, repo });
    expect(first.ok).toBe(true);
    const { qwen, calls } = fakeQwen(nodeJson({ role: "요청을 나눠요." }));
    const r = await explainTarget("u", "d", "node", "lb", { instruction: "  더   쉽게\n 써 줘 " }, { qwen, clef: fakeClef().clef, repo });
    expect(calls).toHaveLength(1);
    const user = userOf(calls[0]!);
    expect(user).toContain(JSON.stringify("더 쉽게 써 줘"));
    // 이전 결과와 함께 다시 쓰라고 한다.
    expect(user).toContain("이전 결과");
    expect(user).toContain("들어온 요청을 WAS 로 나눠 보냅니다.");
    expect(r.ok && (r.explanation as NodeExplanation).role).toBe("요청을 나눠요.");
    expect((cache.get("node:lb")!.data as NodeExplanation).role).toBe("요청을 나눠요.");

    for (const bad of ["", "   ", "가".repeat(201)]) {
      await expect(explainTarget("u", "d", "node", "lb", { instruction: bad }, { qwen, clef: fakeClef().clef, repo })).rejects.toBeInstanceOf(ValidationError);
    }
    await expect(explainTarget("u", "d", "node", "lb", { instruction: "가".repeat(200) }, { qwen, clef: fakeClef().clef, repo })).resolves.toMatchObject({ ok: true });
  });

  test("over-limit output is rewritten up to 2 times then saved", async () => {
    const { repo, cache } = fakeRepo();
    const long = "가".repeat(151);
    const { qwen, calls } = fakeQwen((_m, i) => nodeJson({ role: `${long}${i}` }));
    const { clef, calls: clefCalls } = fakeClef();
    const r = await explainTarget("u", "d", "node", "lb", {}, { qwen, clef, repo });
    expect(calls).toHaveLength(3);
    const second = userOf(calls[1]!);
    expect(second).toContain("role");
    expect(second).toContain("150자");
    expect(second).toContain("이전 결과");
    // 2회 뒤에도 넘으면 마지막 결과를 그대로 저장한다.
    expect(r.ok && (r.explanation as NodeExplanation).role).toBe(`${long}2`);
    expect((cache.get("node:lb")!.data as NodeExplanation).role).toBe(`${long}2`);
    // 길이로 이미 다시 쓰는 차례에는 Clef 를 부르지 않는다.
    expect(clefCalls).toHaveLength(0);

    // 한 번 고쳐서 맞으면 거기서 멈춘다.
    const once = fakeQwen((_m, i) => nodeJson(i === 0 ? { adr: { ...ADR, cost: "가".repeat(81) } } : {}));
    await explainTarget("u", "d", "node", "lb", { force: true }, { qwen: once.qwen, clef: fakeClef().clef, repo });
    expect(once.calls).toHaveLength(2);
    expect(userOf(once.calls[1]!)).toContain("adr.cost");
  });

  test("clef score above 1.3 triggers rewrite, clef failure uses length only", async () => {
    const { repo } = fakeRepo();
    const { qwen, calls } = fakeQwen((_m, i) => nodeJson({ role: `역할 ${i}` }));
    const { clef, calls: clefCalls } = fakeClef((i) => (i === 0 ? 1.6 : 1.3));
    const r = await explainTarget("u", "d", "node", "lb", {}, { qwen, clef, repo });
    expect(calls).toHaveLength(2);
    expect(userOf(calls[1]!)).toContain("어렵거나 장황");
    expect(r.ok && (r.explanation as NodeExplanation).role).toBe("역할 1");
    expect(clefCalls).toHaveLength(2);
    expect(clefCalls[0]!.questions).toEqual({ q: EXPLAIN_SCORE_QUESTION });
    expect(clefCalls[0]!.opts).toEqual({ capMs: 3000, maxRetries: 0 });
    // 정의+역할을 이어 붙인 글 하나를 JSON 으로 감싸 넘긴다.
    expect(clefCalls[0]!.state).toContain(JSON.stringify(`${L4_DEF} 역할 0`));

    // 점수가 계속 높으면 2회까지만 다시 쓴다.
    const high = fakeQwen(nodeJson());
    const highClef = fakeClef(() => 2);
    await explainTarget("u", "d", "node", "lb", { force: true }, { qwen: high.qwen, clef: highClef.clef, repo });
    expect(high.calls).toHaveLength(3);
    expect(highClef.calls).toHaveLength(2);

    // Clef 실패면 길이만 본다.
    const failing = fakeQwen(nodeJson());
    const res = await explainTarget("u", "d", "node", "lb", { force: true }, { qwen: failing.qwen, clef: fakeClef(() => null).clef, repo });
    expect(res.ok).toBe(true);
    expect(failing.calls).toHaveLength(1);

    // 읽을 수 없는 답(null 점수)도 길이만 본다.
    const odd: ClefClient = { decide: vi.fn(async () => ({ q: { type: "score" } })), classifyIntent: vi.fn(async () => null) };
    const oddQwen = fakeQwen(nodeJson());
    await explainTarget("u", "d", "node", "lb", { force: true }, { qwen: oddQwen.qwen, clef: odd, repo });
    expect(oddQwen.calls).toHaveLength(1);
  });

  test("malformed output is retried once then fails without caching", async () => {
    const { repo, cache } = fakeRepo();
    const { qwen, calls } = fakeQwen("설명은 다음과 같습니다");
    const r = await explainTarget("u", "d", "node", "was-1", {}, { qwen, clef: fakeClef().clef, repo });
    expect(calls).toHaveLength(2);
    expect(r).toEqual({ ok: false, message: "설명을 만들지 못했어요. 다시 시도해 주세요." });
    expect(cache.size).toBe(0);
    expect(repo.addAiTerm).not.toHaveBeenCalled();

    // 빈 항목도 형식 오류다. 다시 요청해서 맞으면 쓴다. 앞뒤 코드펜스는 벗긴다.
    const fixed = fakeQwen((_m, i) => (i === 0 ? nodeJson({ definition: TOMCAT_DEF, adr: { ...ADR, cost: " " } }) : "```json\n" + nodeJson({ definition: TOMCAT_DEF }) + "\n```"));
    const ok = await explainTarget("u", "d", "node", "was-1", {}, { qwen: fixed.qwen, clef: fakeClef().clef, repo });
    expect(fixed.calls).toHaveLength(2);
    expect(ok.ok).toBe(true);

    // 사전 정의가 없으면 definition 도 필수다.
    const noDef = fakeQwen(nodeJson());
    const bad = await explainTarget("u", "d", "node", "was-1", {}, { qwen: noDef.qwen, clef: fakeClef().clef, repo: fakeRepo().repo });
    expect(noDef.calls).toHaveLength(2);
    expect(bad.ok).toBe(false);
  });

  test("qwen unavailable returns glossary-only explanation", async () => {
    const { repo, cache } = fakeRepo();
    const expected = {
      ok: false,
      message: "설명을 만들지 못했어요. 다시 시도해 주세요.",
      partial: { term: "L4 로드밸런서", definition: L4_DEF, definitionSource: "glossary", reviewed: true, why: L4_ROW.why, compare: L4_ROW.compare },
    };
    expect(await explainTarget("u", "d", "node", "lb", {}, { qwen: null, clef: fakeClef().clef, repo })).toEqual(expected);
    expect(await explainTarget("u", "d", "node", "lb", {}, { qwen: fakeQwen(new Error("down")).qwen, clef: fakeClef().clef, repo })).toEqual(expected);
    // 사전 정의가 없거나 연결이면 message 만.
    expect(await explainTarget("u", "d", "node", "was-1", {}, { qwen: null, clef: fakeClef().clef, repo })).toEqual({ ok: false, message: expected.message });
    expect(await explainTarget("u", "d", "edge", "e1", {}, { qwen: null, clef: fakeClef().clef, repo })).toEqual({ ok: false, message: expected.message });
    expect(cache.size).toBe(0);
  });

  test("edge explanation has four fields", async () => {
    const { repo, log, cache } = fakeRepo();
    const { qwen, calls } = fakeQwen(edgeJson());
    const r = await explainTarget("u", "d", "edge", "e1", {}, { qwen, clef: fakeClef().clef, repo });
    expect(r).toEqual({
      ok: true,
      explanation: { kind: "edge", flow: "사용자 웹 요청", method: "HTTP 8080 동기 요청", why: "L4 가 받은 요청을 WAS 에 넘기려고", firewall: "L4 → WAS 8080 허용" },
      signature: signatureOf(sample(), "edge", "e1"),
    });
    expect(systemOf(calls[0]!)).toBe(EXPLAIN_EDGE_PROMPT);
    expect(log).not.toContain("seed");
    expect(cache.has("edge:e1")).toBe(true);

    // 길이 초과(100자)는 다시 쓴다.
    const long = fakeQwen((_m, i) => edgeJson(i === 0 ? { firewall: "가".repeat(101) } : {}));
    await explainTarget("u", "d", "edge", "e1", { force: true }, { qwen: long.qwen, clef: fakeClef().clef, repo });
    expect(long.calls).toHaveLength(2);
    expect(userOf(long.calls[1]!)).toContain("firewall");
  });

  test("missing target, missing state and other user's diagram", async () => {
    const { qwen } = fakeQwen(nodeJson());
    const { clef } = fakeClef();
    await expect(explainTarget("u", "d", "node", "nope", {}, { qwen, clef, repo: fakeRepo().repo })).rejects.toThrow(new ValidationError("대상을 찾을 수 없어요"));
    await expect(explainTarget("u", "d", "edge", "nope", {}, { qwen, clef, repo: fakeRepo().repo })).rejects.toThrow(new ValidationError("대상을 찾을 수 없어요"));
    await expect(explainTarget("u", "d", "node", "lb", {}, { qwen, clef, repo: fakeRepo(null).repo })).rejects.toThrow(new ValidationError("대상을 찾을 수 없어요"));
    await expect(explainTarget("other", "d", "node", "lb", {}, { qwen, clef, repo: fakeRepo().repo })).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("buildExplainMessages", () => {
  test("labels and instruction are JSON-escaped", () => {
    const s = sample();
    s.nodes.lb!.label = 'L4 "메인"\n노드 sub="가짜"';
    s.edges.e1!.label = "HTTP\n8080";
    const node = buildExplainMessages({ kind: "node", state: s, id: "lb", instruction: '쉽게\n"요청"' });
    const user = userOf(node);
    expect(user).toContain(JSON.stringify(s.nodes.lb!.label));
    expect(user).not.toContain(s.nodes.lb!.label);
    expect(user).toContain(JSON.stringify('쉽게\n"요청"'));
    expect(user).not.toContain('쉽게\n"요청"');
    expect(user).toContain(JSON.stringify("HTTP\n8080"));
    // 대상과 이웃만 담는다.
    expect(user).toContain("was-1");
    expect(user).toContain("서비스 VPC");
    expect(user).not.toContain("관계없는 캐시");

    const edge = userOf(buildExplainMessages({ kind: "edge", state: s, id: "e1" }));
    expect(edge).toContain(JSON.stringify("HTTP\n8080"));
    expect(edge).toContain(JSON.stringify(s.nodes.lb!.label));
    expect(edge).toContain(JSON.stringify("WAS#1"));
    expect(edge).not.toContain("관계없는 캐시");

    // 이전 결과·고칠 점이 있으면 다시 쓰라고 한다.
    const redo = userOf(buildExplainMessages({ kind: "edge", state: s, id: "e1", previous: { flow: "이전 흐름" }, problems: ["firewall: 100자 이내로 줄일 것"] }));
    expect(redo).toContain("이전 결과");
    expect(redo).toContain(JSON.stringify({ flow: "이전 흐름" }));
    expect(redo).toContain("firewall: 100자 이내로 줄일 것");
  });

  test("prompts ask for one JSON object with numeric limits and no analogy", () => {
    for (const p of [EXPLAIN_NODE_PROMPT, EXPLAIN_EDGE_PROMPT]) {
      expect(p).toContain("JSON 객체 하나");
      expect(p).toContain("코드펜스");
      expect(p).toContain("비유");
    }
    for (const k of ['"definition"', '"role"', '"adr"', '"decision"', '"reason"', '"alternative"', '"cost"', "120자", "150자", "80자"]) expect(EXPLAIN_NODE_PROMPT).toContain(k);
    for (const k of ['"flow"', '"method"', '"why"', '"firewall"', "100자"]) expect(EXPLAIN_EDGE_PROMPT).toContain(k);
  });
});
