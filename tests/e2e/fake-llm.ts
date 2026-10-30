import http from "node:http";

// samples.ts 는 서버 모듈(env 검증)을 끌어오므로 먼저 자리표시자 값을 둔다(반드시 첫 import).
import "./fake-env";

import spike from "../../docs/superpowers/spike/spike-results.json";
import { WARNING_PROMPT } from "../../src/server/chat/prompt";
import { convertSpikeScenario, type SpikeState } from "../../src/server/samples";
import { FAKE_PORT } from "./fake-config";

const MODEL = "qwen3.8-flash-next";
const FAST_MS = 80;
const SLOW_MS = 600;

const s1 = (spike.scenarios as unknown as { id: string; state: SpikeState }[]).find((s) => s.id === "s1")!;

/** s1 을 샘플 가져오기와 같은 변환을 거쳐 명령 줄(부모 먼저 그룹 → 노드 → 연결 → 가정)로 만든다. */
function s1Lines(): string[] {
  const st = convertSpikeScenario(s1.state);
  const lines: unknown[] = [{ op: "say", text: "쇼핑몰 구성을 그리겠습니다." }];
  for (const g of Object.values(st.groups)) {
    lines.push({ op: "add_group", id: g.id, group_kind: g.groupKind, label: g.label, parent: g.parent });
  }
  for (const n of Object.values(st.nodes)) {
    lines.push({ op: "add_node", id: n.id, kind: n.kind, label: n.label, ...(n.sub ? { sub: n.sub } : {}), parent: n.parent, attrs: n.attrs });
  }
  for (const e of Object.values(st.edges)) {
    lines.push({ op: "add_edge", id: e.id, from: e.from, to: e.to, edge_kind: e.edgeKind, ...(e.label ? { label: e.label } : {}) });
  }
  for (const a of Object.values(st.assumptions)) lines.push({ op: "set_assumption", key: a.key, value: a.value });
  return lines.map((l) => JSON.stringify(l));
}

export const S1_NODE_COUNT = Object.keys(s1.state.nodes).length;

type Msg = { role: string; content: string };

async function linesFor(messages: Msg[]): Promise<{ lines: string[]; delay: number }> {
  const last = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
  const reqAt = last.lastIndexOf("요청: ");
  const request = reqAt >= 0 ? last.slice(reqAt + 4) : last;
  const delay = request.includes("천천히") ? SLOW_MS : FAST_MS;
  const refs = /참조 노드:\n([\s\S]*?)\n\n요청: /.exec(last)?.[1] ?? "없음";
  if (refs !== "없음") {
    const id = refs.split("\n")[0]!.split(" ")[0]!;
    return {
      delay,
      lines: [JSON.stringify({ op: "update_node", id, attrs: { ram: "32GB" } }), JSON.stringify({ op: "say", text: "RAM 을 32GB 로 바꿨어요." })],
    };
  }
  // 경고 E2E: "공개DB 다시" 는 같은 DB 를 고쳐(명령 1개 이상 적용) 경고 점검이 다시 돌게 한다. "공개DB" 보다 먼저 맞춘다.
  if (request.includes("공개DB 다시")) {
    return { lines: [JSON.stringify({ op: "update_node", id: "pubdb", attrs: { version: "8.0" } }), JSON.stringify({ op: "say", text: "DB 를 고쳤어요." })], delay };
  }
  // 공개DB: 공개 서브넷 안의 DB → db_public 코드 규칙이 걸린다.
  if (request.includes("공개DB")) {
    return {
      delay,
      lines: [
        JSON.stringify({ op: "add_group", id: "pubnet", group_kind: "subnet_public", label: "공개 구역", parent: null }),
        JSON.stringify({ op: "add_node", id: "pubdb", kind: "db_rdb", label: "공개 DB", parent: "pubnet" }),
        JSON.stringify({ op: "say", text: "공개 DB 를 그렸어요." }),
      ],
    };
  }
  if (request.includes("쇼핑몰")) return { lines: s1Lines(), delay };
  return { lines: [JSON.stringify({ op: "say", text: "네, 알겠습니다." })], delay };
}

/** 경고 문구 요청: 받은 id 마다 고정 문구 한 줄. */
function warningLines(messages: Msg[]): { lines: string[]; delay: number } {
  const user = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
  const ids = [...user.matchAll(/id=("(?:[^"\\]|\\.)*")/g)].map((m) => JSON.parse(m[1]!) as string);
  return { lines: ids.map((id) => JSON.stringify({ id, text: "가짜 경고 문구" })), delay: FAST_MS };
}

function chunk(content: string | null, finish: string | null): string {
  const body = {
    id: "x",
    object: "chat.completion.chunk",
    created: 0,
    model: MODEL,
    choices: [{ index: 0, delta: content === null ? {} : { content }, finish_reason: finish }],
  };
  return `data: ${JSON.stringify(body)}\n\n`;
}

function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve) => {
    let b = "";
    req.on("data", (d) => (b += d));
    req.on("end", () => resolve(b));
  });
}

export function startFakeLlm(): Promise<http.Server> {
  const server = http.createServer(async (req, res) => {
    const url = req.url ?? "";
    const json = (code: number, body: unknown) => {
      res.writeHead(code, { "Content-Type": "application/json" });
      res.end(JSON.stringify(body));
    };
    if (req.method === "GET" && url === "/v1/models") return json(200, { data: [{ id: MODEL }] });
    if (req.method === "GET" && url === "/health") return json(200, { ok: true });
    if (req.method === "POST" && url === "/v1/systemone") {
      const body = JSON.parse(await readBody(req)) as { state?: unknown; questions?: Record<string, { type?: string }> };
      // noul 질문은 기본 0.1, 상태에 "외부DB" 가 있으면 0.95. 의도 분류는 항상 structure_change 0.95.
      const exposed = String(body.state ?? "").includes("외부DB");
      const answers: Record<string, unknown> = {};
      for (const [key, q] of Object.entries(body.questions ?? {})) {
        answers[key] =
          q?.type === "noul"
            ? { type: "noul", probability: exposed ? 0.95 : 0.1 }
            : { type: "choice", choice: "structure_change", confidence: 0.95, probabilities: {} };
      }
      if (!("intent" in answers)) answers.intent = { type: "choice", choice: "structure_change", confidence: 0.95, probabilities: {} };
      return json(200, { answers });
    }
    if (req.method === "POST" && url === "/v1/chat/completions") {
      const body = JSON.parse(await readBody(req)) as { messages: Msg[] };
      const isWarning = body.messages.some((m) => m.role === "system" && m.content === WARNING_PROMPT);
      const { lines, delay } = isWarning ? warningLines(body.messages) : await linesFor(body.messages);
      res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" });
      let closed = false;
      res.on("close", () => (closed = true));
      for (const line of lines) {
        if (closed) return;
        res.write(chunk(line + "\n", null));
        await new Promise((r) => setTimeout(r, delay));
      }
      if (closed) return;
      res.write(chunk(null, "stop"));
      res.write("data: [DONE]\n\n");
      res.end();
      return;
    }
    json(404, { error: "not found" });
  });
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(FAKE_PORT, "127.0.0.1", () => resolve(server));
  });
}
