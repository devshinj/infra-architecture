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
// "세 대" 하나만 쓰면 "차세대 방화벽"에도 걸려, 뒤에 붙는 말까지 적는다. "한 대"도 "한 대가 멈추면"에 걸리지 않게 좁힌다.
const MORE = [
  "세 대로", "세 대를", "세 대가", "세 대만", "세 대씩", "세 대 넣", "세 대 붙", "세 대 둬", "세 대 두", "세 대 놓",
  "세 대 추가", "세 대 만들", "세 대 구성", "세 대 이중화", "세 대 배치", "세 대 연결", "를 세 대", "을 세 대", "는 세 대", "은 세 대",
  // 문장 끝의 "WAS 세 대" 처럼 뒤에 아무것도 없을 때: 앞의 이름으로 잡는다.
  "서버 세 대", "was 세 대", "l4 세 대", "웹 세 대", "api 세 대", "ec2 세 대", "장비 세 대", "로드밸런서 세 대",
  "3대", "4대", "5대",
];
const FEWER = ["한 대만", "1대만", "한 대로", "1대로", "하나만"];

/** 두 대로 정한 단계에 "세 대"·"한 대" 같은 수량 어긋남 안내를 단다. */
export function countConflicts(more: string, fewer: string): NonNullable<GuideStep["conflicts"]> {
  return [...MORE.map((p) => ({ pattern: [p], reply: more })), ...FEWER.map((p) => ({ pattern: [p], reply: fewer }))];
}
