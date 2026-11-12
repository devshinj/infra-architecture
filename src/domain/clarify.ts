// 그리기 전에 되묻기: 구조가 통째로 달라지는 갈림길이 요청에 없을 때만 선택지를 보여 준다.
// 판단은 코드 규칙으로 한다(AI 를 더 부르지 않는다). 목록에 없는 애매함은 지금처럼 AI 가 가정한다.
// 한 번 답하면 가정(assumptions)에 남아 다시 묻지 않는다.

import { ASSUMPTION_CHOICES, ASSUMPTION_LABELS } from "./assumptions";
import type { NodeKind } from "./catalog";
import type { DiagramState } from "./types";

/** 선택지 끝에 늘 붙는 "정하지 않고 맡기기". */
export const CLARIFY_AUTO = "알아서 정해 줘";
/** 맡겼을 때 가정에 남기는 값. AI 가 제 값으로 바꿔 쓸 수 있다. */
export const CLARIFY_AUTO_VALUE = "알아서 정함";
/** 한 번에 묻는 질문 수 상한. */
export const CLARIFY_MAX = 3;
export const CLARIFY_REPLY = "그리기 전에 정해 주세요. 고르기 어려우면 '알아서 정해 줘'를 누르면 돼요.";

export interface ClarifyQuestion {
  /** 가정 key. */
  key: string;
  /** 짧은 이름(가정 칩·요약에 쓴다). */
  label: string;
  question: string;
  /** CLARIFY_AUTO 는 넣지 않는다(화면이 붙인다). */
  choices: string[];
}

interface Fork {
  /** 가정 key. 이름과 선택지는 ASSUMPTION_LABELS·ASSUMPTION_CHOICES 에 있다. */
  key: string;
  question: string;
  /** 요청에 이 갈림길이 걸렸는가. */
  about: RegExp | ((text: string, state: DiagramState) => boolean);
  /** 요청이 이미 선택을 말했는가. */
  said: RegExp;
  /** 구성도에 이 종류가 있으면 이미 정해진 것으로 본다. */
  settledBy?: readonly NodeKind[];
}

const isEmpty = (s: DiagramState) => Object.keys(s.nodes).length === 0 && Object.keys(s.groups).length === 0;
const hasZone = (s: DiagramState) => Object.values(s.groups).some((g) => g.groupKind === "network_zone");

const WHOLE_SYSTEM = /구성도|아키텍처|인프라|서비스|시스템|플랫폼|쇼핑몰|사이트|홈페이지|포털/;

const FORKS: readonly Fork[] = [
  {
    key: "environment",
    question: "어디에 올리는 구성인가요?",
    // 빈 구성도에 서비스·시스템 전체를 처음 그릴 때만(노드 하나 넣는 요청에는 묻지 않는다).
    about: (t, s) => isEmpty(s) && WHOLE_SYSTEM.test(t),
    said: /aws|azure|gcp|클라우드|cloud|idc|온프레미스|온프렘|on-?prem|사내|전산실|데이터\s*센터|하이브리드|ec2|vpc|쿠버네티스|k8s|eks|서버리스/,
  },
  {
    key: "call_mode",
    question: "실시간 영상·음성은 어떤 방식인가요?",
    about: /화상|영상\s*통화|음성\s*통화|영상\s*회의|webrtc|라이브\s*방송|실시간\s*방송/,
    said: /1\s*:\s*1|일대일|1\s*대\s*1|다자|그룹|단체|여러\s*명|\d+\s*명|\d+\s*인|sfu|mcu|p2p|방송|송출|웨비나/,
    settledBy: ["media_server", "signaling_server"],
  },
  {
    key: "llm_serving",
    question: "LLM 은 어디에서 돌리나요?",
    about: /llm|챗봇|생성형|gpt|rag|에이전트|agent|언어\s*모델|ai\s*(비서|상담|검색|기능|서비스|모델)/,
    said: /외부|openai|claude|gemini|bedrock|사내|자체|내부|vllm|ollama|온프레미스|gpu|모델\s*서버|서빙|호스팅/,
    settledBy: ["model_server", "llm_gateway"],
  },
  {
    key: "video_site",
    question: "어떤 곳의 영상 관제인가요?",
    about: /cctv|관제|영상\s*감시|감시\s*카메라|ip\s*카메라|nvr|vms/,
    said: /지자체|통합\s*관제|시청|구청|군청|도청|공공|일반|사옥|공장|매장|건물|빌딩|병원|학교|아파트|물류|창고|주차/,
    settledBy: ["camera", "video_recorder"],
  },
  {
    key: "iot_link",
    question: "기기는 무엇을 거쳐 서버에 닿나요?",
    about: /iot|사물\s*인터넷|센서|웨어러블|스마트\s*(밴드|워치|홈|팜|팩토리)|비콘|디바이스/,
    said: /ble|블루투스|bluetooth|게이트웨이|허브|wi-?fi|와이파이|lte|5g|셀룰러|직접|zigbee|지그비|lora|mqtt|nfc|thread|matter/,
    settledBy: ["iot_device", "iot_gateway"],
  },
  {
    key: "net_separation",
    question: "망분리 대상 기관인가요?",
    // 내부 망과 바깥이 함께 나왔고 아직 망을 그리지 않았을 때.
    about: (t, s) => !hasZone(s) && /업무망|내부망|사내망/.test(t) && /인터넷|외부망|클라우드|dmz/.test(t),
    said: /공공|금융|은행|증권|보험|카드사|지자체|기관|부처|공단|공사|병원|일반\s*기업|민간|스타트업|망\s*연계|망\s*분리|방화벽으로|행정망/,
  },
];

const KEYS: ReadonlySet<string> = new Set(FORKS.map((f) => f.key));
const labelOf = (key: string) => ASSUMPTION_LABELS[key] ?? key;
const choicesOf = (key: string) => ASSUMPTION_CHOICES[key] ?? [];

/**
 * 그리기 요청(text)에서 물어야 할 갈림길. 요청에 그 주제가 나왔고, 선택을 말하지 않았고,
 * 가정에도 구성도에도 아직 정해진 것이 없을 때만 낸다(최대 CLARIFY_MAX 개, 정해 둔 차례대로).
 */
export function detectForks(text: string, state: DiagramState): ClarifyQuestion[] {
  const t = text.toLowerCase();
  const kinds = new Set(Object.values(state.nodes).map((n) => n.kind));
  const out: ClarifyQuestion[] = [];
  for (const f of FORKS) {
    if (Object.hasOwn(state.assumptions, f.key)) continue;
    if (f.settledBy?.some((k) => kinds.has(k))) continue;
    const about = typeof f.about === "function" ? f.about(t, state) : f.about.test(t);
    if (!about || f.said.test(t)) continue;
    out.push({ key: f.key, label: labelOf(f.key), question: f.question, choices: choicesOf(f.key) });
    if (out.length === CLARIFY_MAX) break;
  }
  return out;
}

/** 받은 선택 가운데 아는 key·아는 값만 남긴다(값은 선택지 중 하나이거나 CLARIFY_AUTO). */
export function validChoices(raw: unknown): Record<string, string> {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return {};
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (KEYS.has(key) && typeof value === "string" && (value === CLARIFY_AUTO || choicesOf(key).includes(value))) out[key] = value;
  }
  return out;
}

/** 선택을 가정 값으로: 맡긴 것은 CLARIFY_AUTO_VALUE. */
export const choiceValue = (value: string) => (value === CLARIFY_AUTO ? CLARIFY_AUTO_VALUE : value);

/** 사용자 말풍선에 남기는 한 줄("통화 방식: 다자간(미디어 서버 경유) · LLM 위치: 알아서 정해 줘"). */
export function choicesSummary(choices: Record<string, string>): string {
  return Object.entries(choices)
    .map(([key, value]) => `${labelOf(key)}: ${value}`)
    .join(" · ");
}

/** 그리기 요청 끝에 붙여 AI 에게 알리는 글. 고른 것은 그대로 따르고, 맡긴 것은 AI 가 정해 가정으로 밝힌다. */
export function choicesNote(choices: Record<string, string>): string {
  const picked = Object.entries(choices).filter(([, v]) => v !== CLARIFY_AUTO);
  const auto = Object.entries(choices).filter(([, v]) => v === CLARIFY_AUTO);
  const name = labelOf;
  const lines: string[] = [];
  if (picked.length) lines.push(`사용자가 고른 것(그대로 따른다): ${picked.map(([k, v]) => `${name(k)} = ${v}`).join(", ")}`);
  if (auto.length) lines.push(`사용자가 맡긴 것(알맞게 정하고 set_assumption 으로 밝힌다): ${auto.map(([k]) => `${name(k)}(key ${k})`).join(", ")}`);
  return lines.join("\n");
}
