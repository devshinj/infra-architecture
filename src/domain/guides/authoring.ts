// 대본 작성용 짧은 도우미. 설명 탭 글(노드·영역·연결)과 수량 어긋남 안내를 짧게 쓰게 한다.
import type { Command } from "../commands";
import { edgeId } from "../samples/dsl";
import type { Attrs } from "../types";

import type { AuthoredEdge, AuthoredGroup, AuthoredTermed, GuideStep } from "./types";

/** ADR 네 칸: 결정, 까닭, 다른 방법, 대가. */
type Adr = [decision: string, reason: string, alternative: string, cost: string];
/** 사전(seed)에 없는 용어일 때만 쓴다. 비우면 정의는 기본 사전에서 읽는다. */
type Def = { term: string; definition: string };

const adr = ([decision, reason, alternative, cost]: Adr) => ({ decision, reason, alternative, cost });

export const nodeText = (role: string, a: Adr, def?: Def): AuthoredTermed => ({ ...def, role, adr: adr(a) });
export const groupText = (role: string, boundary: string, a: Adr, def?: Def): AuthoredGroup => ({ ...def, role, boundary, adr: adr(a) });
export const edgeText = (flow: string, method: string, why: string, firewall: string): AuthoredEdge => ({ flow, method, why, firewall });

/** explains 의 key. */
export const N = (id: string) => `node:${id}`;
export const G = (id: string) => `group:${id}`;
export const E = (from: string, to: string) => `edge:${edgeId(from, to)}`;

/** 노드 속성 고치기(방화벽 규칙을 단계마다 늘릴 때 쓴다). */
export const update = (id: string, attrs: Attrs): Command => ({ op: "update_node", id, attrs });

// 수량이 다른 요청. 띄어쓰기는 판정 때 지워지므로 "세 대로"는 "세대로"로 맞춘다.
// conflict 는 Clef 보다 먼저 보므로 맞는 요청에 걸리면 안 된다. 그래서 수량 말에 앞의 이름·조사나 뒤의 말을 붙여 좁힌다.
// - "세 대" 만 쓰면 "차세대 방화벽", "4대" 만 쓰면 "L4 대신·L4 대수"("l4대")에 걸린다.
// - "한 대로" 만 쓰면 "말한 대로", "하나만" 만 쓰면 "하나만 물어볼게요", "한 대만" 만 쓰면 "평소엔 한 대만 일해"에 걸린다.
// - "세 대"는 뒤에 무엇이 붙어도 "차세대가·차세대 두 대"처럼 걸리므로, 앞의 이름·조사로만 잡는다.
// - "하나만"은 앞에 무엇이 와도 "질문을 하나만 할게요·API 하나만 물어볼게"에 걸리므로, 뒤의 말("하나만 넣")로만 잡는다.
const NOUNS = ["서버", "was", "l4", "웹", "web", "api", "ec2", "장비", "로드밸런서", "스위치"];
const HEADS = [...NOUNS, "를", "을", "는", "은"];
const TAIL_QTY = ["네 대", "3대", "5대"];
const MORE_TAIL = ["로", "를", "가", "만", "씩", " 넣", " 붙", " 둬", " 두", " 놓", " 추가", " 만들", " 구성", " 이중화", " 배치", " 연결"];
const MORE = [
  ...TAIL_QTY.flatMap((q) => MORE_TAIL.map((t) => `${q}${t}`)),
  // 앞의 이름·조사로 잡는 것: "WAS 세 대", "를 세 대". "세 대"와 "4대"는 이렇게만 잡는다.
  ...HEADS.flatMap((h) => [...TAIL_QTY, "세 대", "4대"].map((q) => `${h} ${q}`)),
];
const FEWER = [
  ...[...NOUNS, "를", "을"].flatMap((h) => ["한 대만", "한 대로", "1대만", "1대로"].map((q) => `${h} ${q}`)),
  ...["한 대만", "1대만", "하나만"].flatMap((q) => [" 둬", " 두", " 넣", " 놓", " 써줘", " 쓰자", " 써서 넣", " 써서 둬", " 써서 두", " 붙", " 만들"].map((t) => `${q}${t}`)),
];

/** 두 대로 정한 단계에 "세 대"·"한 대" 같은 수량 어긋남 안내를 단다. */
export function countConflicts(more: string, fewer: string): NonNullable<GuideStep["conflicts"]> {
  return [...MORE.map((p) => ({ pattern: [p], reply: more })), ...FEWER.map((p) => ({ pattern: [p], reply: fewer }))];
}
