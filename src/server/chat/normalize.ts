import type { EdgeMedium } from "@/domain/types";

/**
 * AI 출력 한 줄을 도메인 스키마에 넘기기 전에 다듬는다. 대화 경로와 점검 스크립트만 쓴다.
 * 도메인 스키마(`@/domain/commands`)는 엄격하게 두고, 모델이 흔히 내는 형태만 받아 준다.
 * - 생략 가능하지만 null 은 안 되는 칸의 null → 키 제거
 * - add_node / add_group 에 parent 가 없으면 parent: null
 * - attrs 값: 문자열·숫자 배열 → "a, b", true/false → "true"/"false"
 * - id 처럼 쓰는 칸(id, from, to, parent, target): 소문자로 바꾸고 "_" 를 "-" 로 바꿔 id 형식에 맞으면 그 값을 쓴다.
 *   모든 명령이 같은 정규화를 거치므로 노드 id 와 그것을 가리키는 칸이 서로 어긋나지 않는다.
 * - payload·direction·medium: 한국어·영어 흔한 표기를 enum 값으로 바꾸고, 알 수 없는 값은 키를 지워 명령 전체가 거부되지 않게 한다.
 * - 흐름 명령의 단계(steps[].edge·from)도 같은 id 정규화를 거친다(연결·노드 id 와 어긋나지 않게).
 * 그 밖의 값은 그대로 둬서 스키마가 거부하게 한다.
 */

/** op 별로 "생략 가능, null 불가" 인 칸. parent 는 null 을 받으므로 넣지 않는다. */
const DROP_NULL: Readonly<Record<string, readonly string[]>> = {
  add_node: ["sub", "attrs", "guess"],
  add_edge: ["id", "label", "payload", "direction", "medium"],
  update_node: ["label", "sub", "attrs"],
  update_edge: ["label", "edge_kind", "payload", "direction", "medium"],
  add_flow: ["summary", "result"],
  update_flow: ["name", "summary", "result", "steps"],
};

const NEEDS_PARENT: ReadonlySet<string> = new Set(["add_node", "add_group"]);
const HAS_ATTRS: ReadonlySet<string> = new Set(["add_node", "update_node"]);

const PAYLOADS: Readonly<Record<string, "api" | "file">> = { api: "api", 파일: "file", file: "file" };
const DIRECTIONS: Readonly<Record<string, "one_way" | "two_way">> = {
  단방향: "one_way", one_way: "one_way", oneway: "one_way", "one-way": "one_way",
  양방향: "two_way", two_way: "two_way", twoway: "two_way", "two-way": "two_way", bidirectional: "two_way",
};

const MEDIA: Readonly<Record<string, EdgeMedium>> = {
  ip: "ip", 유선: "ip", wired: "ip", tcp: "ip", http: "ip", https: "ip",
  wireless: "wireless", 무선: "wireless", "근거리 무선": "wireless", ble: "wireless", bluetooth: "wireless", 블루투스: "wireless", nfc: "wireless", zigbee: "wireless",
  video: "video", 영상: "video", "영상 스트림": "video", rtsp: "video", stream: "video",
  media: "media", 미디어: "media", "실시간 미디어": "media", webrtc: "media", srtp: "media", rtp: "media",
  serial: "serial", 직렬: "serial", "유선 직렬": "serial", "rs-485": "serial", rs485: "serial", "rs-232": "serial", rs232: "serial", osdp: "serial", wiegand: "serial", "modbus rtu": "serial",
};

const ID_FIELDS = ["id", "from", "to", "parent", "target"] as const;
const STEP_ID_FIELDS = ["edge", "from"] as const;
const HAS_STEPS: ReadonlySet<string> = new Set(["add_flow", "update_flow"]);
const ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,63}$/;

function normalizeId(v: unknown): unknown {
  if (typeof v !== "string") return v;
  const c = v.toLowerCase().replace(/_/g, "-");
  return c !== v && ID_PATTERN.test(c) ? c : v;
}

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

function flattenAttr(v: unknown): unknown {
  if (typeof v === "boolean") return v ? "true" : "false";
  if (Array.isArray(v) && v.every((x) => typeof x === "string" || typeof x === "number")) return v.join(", ");
  return v;
}

export function normalizeAiCommand(raw: unknown): unknown {
  if (!isPlainObject(raw) || typeof raw.op !== "string") return raw;
  const op = raw.op;
  const out: Record<string, unknown> = { ...raw };
  for (const key of DROP_NULL[op] ?? []) {
    if (out[key] === null) delete out[key];
  }
  for (const key of ID_FIELDS) {
    if (key in out) out[key] = normalizeId(out[key]);
  }
  // 망 종류 키도 id 형식이다. null(종류 지우기)은 그대로 둔다.
  if (op === "set_zone_type" && "type" in out) out.type = normalizeId(out.type);
  if (op === "add_edge" || op === "update_edge") {
    for (const [key, table] of [["payload", PAYLOADS], ["direction", DIRECTIONS], ["medium", MEDIA]] as const) {
      if (!(key in out)) continue;
      const k = typeof out[key] === "string" ? (out[key] as string).trim().toLowerCase() : "";
      const v = Object.hasOwn(table, k) ? table[k] : undefined;
      if (v === undefined) delete out[key];
      else out[key] = v;
    }
  }
  if (HAS_STEPS.has(op) && Array.isArray(out.steps)) {
    out.steps = out.steps.map((step: unknown) => {
      if (!isPlainObject(step)) return step;
      const s: Record<string, unknown> = { ...step };
      for (const key of STEP_ID_FIELDS) if (key in s) s[key] = normalizeId(s[key]);
      return s;
    });
  }
  if (NEEDS_PARENT.has(op) && !("parent" in out)) out.parent = null;
  if (HAS_ATTRS.has(op) && isPlainObject(out.attrs)) {
    out.attrs = Object.fromEntries(Object.entries(out.attrs).map(([k, v]) => [k, flattenAttr(v)]));
  }
  return out;
}
