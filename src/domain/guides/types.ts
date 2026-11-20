import type { Command } from "@/domain/commands";

export type GuideEnv = "onprem" | "cloud";
export const GUIDE_ENVS: readonly GuideEnv[] = ["onprem", "cloud"];
export const ENV_LABEL: Record<GuideEnv, string> = { onprem: "온프레미스", cloud: "클라우드" };

export type NoteKind = "flow" | "net" | "link" | "caution";
export const NOTE_LABEL: Record<NoteKind, string> = { flow: "흐름", net: "망 특성", link: "연계 구간", caution: "주의" };
export interface GuideNote {
  kind: NoteKind;
  text: string;
}

type Adr = { decision: string; reason: string; alternative: string; cost: string };
export interface AuthoredTermed {
  term?: string;
  definition?: string;
  role: string;
  adr: Adr;
}
export interface AuthoredGroup extends AuthoredTermed {
  boundary: string;
}
export interface AuthoredEdge {
  flow: string;
  method: string;
  why: string;
  firewall: string;
}
/** key 는 "node:<id>" | "group:<id>" | "edge:<id>". */
export type AuthoredExplains = Record<string, AuthoredTermed | AuthoredGroup | AuthoredEdge>;

export interface GuideStep {
  id: string;
  goal: string;
  example: string;
  keywords: string[][];
  conflicts?: { pattern: string[]; reply: string }[];
  commands: Command[];
  say: string;
  notes?: GuideNote[];
  miss: string;
  explains: AuthoredExplains;
}

export interface GuideVariant {
  /** 환경 확정 때 넣는 set_assumption environment 값. 예 "사내 IDC", "클라우드(AWS)". */
  environment: string;
  steps: GuideStep[];
  outro: string;
  otherEnv?: { from: string; to: string }[];
}

export interface Guide {
  id: string;
  title: string;
  intro: string;
  learns: string[];
  envIntro: string;
  variants: Partial<Record<GuideEnv, GuideVariant>>;
}

export const GUIDE_LIMITS = { say: 160, note: 120, notes: 3, miss: 100, goal: 30 } as const;
export const GUIDE_MIN_CONFIDENCE = 0.6;
/** 질문 확률이 이 값 이상이면 match 확률이 높아도 질문으로 본다. */
export const GUIDE_QUESTION_WINS = 0.85;
