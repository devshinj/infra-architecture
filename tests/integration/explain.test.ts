import { and, eq } from "drizzle-orm";
import { expect, test, vi } from "vitest";

import { db } from "@/db/client";
import { diagramVersions, explanations, glossaryTerms } from "@/db/schema";
import { normalizeTerm, signatureOf, type NodeExplanation } from "@/domain/explain";
import { emptyState, type DiagramState } from "@/domain/types";
import { explainTarget, listSignatures } from "@/server/explain";
import { findTerm, updateTerm } from "@/server/glossary";
import type { ClefClient } from "@/server/llm/clef";
import type { QwenClient } from "@/server/llm/qwen";
import { NotFoundError } from "@/server/projects";
import { createVersion } from "@/server/versions";

import { makeOwnedDiagram } from "./helpers";

function sample(): DiagramState {
  const s = emptyState();
  s.nodes.lb = { id: "lb", kind: "lb_l4", label: "L4", parent: null, attrs: {} };
  s.nodes.app = { id: "app", kind: "batch_server", label: "배치", parent: null, attrs: { sw: "Varnishy 3" } };
  s.edges.e1 = { id: "e1", from: "lb", to: "app", edgeKind: "request", label: "HTTP 8080" };
  return s;
}

const ADR = { decision: "결정", reason: "이유", alternative: "대안", cost: "대가" };
const DEF = "Varnishy(가상 제품)는 시험용으로 만든 가상의 애플리케이션 서버 소프트웨어입니다.";

function fakeQwen() {
  const calls: string[] = [];
  const qwen: QwenClient = {
    streamCompletion: vi.fn(async (messages, { onDelta }) => {
      const user = messages.at(-1)!.content;
      calls.push(user);
      const text = user.includes("대상 연결")
        ? JSON.stringify({ flow: "요청", method: "HTTP 8080", why: "나눠 보내려고", firewall: "8080 허용" })
        : JSON.stringify({ definition: DEF, role: "요청을 받아 처리합니다.", adr: ADR });
      onDelta(text);
      return { text, finishReason: "stop" };
    }),
  };
  return { qwen, calls };
}

const clef: ClefClient = {
  decide: vi.fn(async () => ({ q: { type: "score", score: 0.2 } })),
  classifyIntent: vi.fn(async () => null),
};

async function setup() {
  const ids = await makeOwnedDiagram();
  await createVersion(ids.diagramId, sample(), { source: "import" });
  return ids;
}

const rowsOf = (diagramId: string) => db.select().from(explanations).where(eq(explanations.diagramId, diagramId));

test("explainTarget round-trips through the cache table", async () => {
  const ids = await setup();
  const { qwen, calls } = fakeQwen();
  const deps = { qwen, clef };

  // 사전에 있는 용어(시드 L4): 정의는 사전에서.
  const lb = await explainTarget(ids.userId, ids.diagramId, "node", "lb", {}, deps);
  expect(lb.ok).toBe(true);
  if (!lb.ok) return;
  expect(lb.explanation).toMatchObject({ kind: "node", term: "L4 로드밸런서", definitionSource: "glossary", reviewed: false });
  expect((lb.explanation as NodeExplanation).why).toBeTruthy();
  expect(lb.signature).toBe(signatureOf(sample(), "node", "lb"));

  // 없는 용어: AI 정의를 미검수로 사전에 넣는다.
  const app = await explainTarget(ids.userId, ids.diagramId, "node", "app", {}, deps);
  expect(app.ok && app.explanation).toMatchObject({ term: "Varnishy 3", definition: DEF, definitionSource: "ai", reviewed: false });
  const [term] = await db
    .select()
    .from(glossaryTerms)
    .where(and(eq(glossaryTerms.userId, ids.userId), eq(glossaryTerms.key, normalizeTerm("Varnishy 3"))));
  expect(term).toMatchObject({ term: "Varnishy 3", definition: DEF, source: "ai", reviewed: false, category: "배치 서버" });

  const edge = await explainTarget(ids.userId, ids.diagramId, "edge", "e1", {}, deps);
  expect(edge.ok && edge.explanation).toMatchObject({ kind: "edge", firewall: "8080 허용" });

  const rows = await rowsOf(ids.diagramId);
  expect(rows).toHaveLength(3);
  expect(rows.find((r) => r.targetId === "lb")!.data).toEqual(lb.explanation);

  // 같은 서명이면 캐시에서, Qwen 호출 없음.
  const before = calls.length;
  const cached = await explainTarget(ids.userId, ids.diagramId, "node", "lb", {}, deps);
  expect(cached).toEqual(lb);
  expect(calls.length).toBe(before);

  // 다시 쓰기는 같은 행을 덮어쓴다(upsert). 버전은 만들지 않는다.
  await explainTarget(ids.userId, ids.diagramId, "node", "lb", { instruction: "더 쉽게" }, deps);
  expect(calls.length).toBe(before + 1);
  expect(await rowsOf(ids.diagramId)).toHaveLength(3);
  const versions = await db.select().from(diagramVersions).where(eq(diagramVersions.diagramId, ids.diagramId));
  expect(versions).toHaveLength(1);
});

test("cached explanation shows the current glossary entry", async () => {
  const ids = await setup();
  const { qwen, calls } = fakeQwen();
  const deps = { qwen, clef };
  const first = await explainTarget(ids.userId, ids.diagramId, "node", "app", {}, deps);
  expect(first.ok && first.explanation).toMatchObject({ definition: DEF, reviewed: false, definitionSource: "ai" });
  const lb = await explainTarget(ids.userId, ids.diagramId, "node", "lb", {}, deps);
  expect(lb.ok && lb.explanation).toMatchObject({ reviewed: false, definitionSource: "glossary" });
  const n = calls.length;

  const app = (await findTerm(ids.userId, ["varnishy"]))!;
  await updateTerm(ids.userId, app.id, { definition: "Varnishy는 고친 정의입니다.", reviewed: true });
  const l4 = (await findTerm(ids.userId, ["l4"]))!;
  await updateTerm(ids.userId, l4.id, { reviewed: true, why: "고친 이유" });

  const again = await explainTarget(ids.userId, ids.diagramId, "node", "app", {}, deps);
  expect(again.ok && again.explanation).toMatchObject({ definition: "Varnishy는 고친 정의입니다.", reviewed: true, definitionSource: "ai", role: "요청을 받아 처리합니다." });
  const lbAgain = await explainTarget(ids.userId, ids.diagramId, "node", "lb", {}, deps);
  expect(lbAgain.ok && lbAgain.explanation).toMatchObject({ reviewed: true, why: "고친 이유", definitionSource: "glossary" });
  expect(calls.length).toBe(n);
});

test("other user's diagram is not found", async () => {
  const a = await setup();
  const b = await makeOwnedDiagram();
  const { qwen, calls } = fakeQwen();
  await expect(explainTarget(b.userId, a.diagramId, "node", "lb", {}, { qwen, clef })).rejects.toBeInstanceOf(NotFoundError);
  await expect(listSignatures(b.userId, a.diagramId)).rejects.toBeInstanceOf(NotFoundError);
  expect(calls).toHaveLength(0);
  expect(await rowsOf(a.diagramId)).toHaveLength(0);
});

test("listSignatures", async () => {
  const ids = await setup();
  expect(await listSignatures(ids.userId, ids.diagramId)).toEqual({});
  const deps = { ...fakeQwen(), clef };
  await explainTarget(ids.userId, ids.diagramId, "node", "lb", {}, deps);
  await explainTarget(ids.userId, ids.diagramId, "edge", "e1", {}, deps);
  expect(await listSignatures(ids.userId, ids.diagramId)).toEqual({
    "node:lb": signatureOf(sample(), "node", "lb"),
    "edge:e1": signatureOf(sample(), "edge", "e1"),
  });
});

test("sub-derived AI definition is not added to the glossary", async () => {
  const ids = await makeOwnedDiagram();
  const s = emptyState();
  s.nodes.adm = { id: "adm", kind: "batch_server", label: "관리", sub: "Varnishy Admin", parent: null, attrs: {} };
  await createVersion(ids.diagramId, s, { source: "import" });
  const { qwen, calls } = fakeQwen();
  const r = await explainTarget(ids.userId, ids.diagramId, "node", "adm", {}, { qwen, clef });
  expect(r.ok && r.explanation).toMatchObject({ term: "Varnishy Admin", definition: DEF, definitionSource: "ai", reviewed: false });
  expect(calls[0]).toContain(`정의할 용어: ${JSON.stringify("Varnishy Admin")}`);
  expect(await findTerm(ids.userId, ["Varnishy Admin"])).toBeNull();
  expect(await rowsOf(ids.diagramId)).toHaveLength(1);
});
