import { z } from "zod";

import { EDGE_KINDS, GROUP_KINDS, NODE_KINDS } from "./catalog";
import type { FlowOp } from "./flows";

const tuple = <T extends readonly { kind: string }[]>(defs: T) =>
  defs.map((d) => d.kind) as [T[number]["kind"], ...T[number]["kind"][]];

const id = z.string().regex(/^[a-z0-9][a-z0-9-]{0,63}$/);
const nodeKind = z.enum(tuple(NODE_KINDS));
const groupKind = z.enum(tuple(GROUP_KINDS));
const edgeKind = z.enum(tuple(EDGE_KINDS));
const parent = id.nullable();
const payload = z.enum(["api", "file"]);
const direction = z.enum(["one_way", "two_way"]);
const attrs = z.record(z.string(), z.union([z.string(), z.number(), z.null()]));
// 흐름 명령. 저장소(applyFlowOps)는 이 검사를 믿는다: 이름 1~60자(앞뒤 공백 제거), 요약·결과 200자, 단계 설명 120자, 단계 1~20개.
// 짧은 설명(short)은 길이를 묻지 않는다(저장할 때 자른다).
const flowName = z.string().trim().min(1).max(60);
const flowNote = z.string().max(200);
const flowStep = z.object({ edge: id, from: id, short: z.string(), text: z.string().max(120) });
const flowSteps = z.array(flowStep).min(1).max(20);

export const commandSchema = z.discriminatedUnion("op", [
  z.object({ op: z.literal("add_group"), id, group_kind: groupKind, label: z.string().min(1), parent }),
  z.object({ op: z.literal("add_node"), id, kind: nodeKind, label: z.string().min(1), sub: z.string().optional(), parent, attrs: attrs.optional() }),
  z.object({ op: z.literal("add_edge"), id: id.optional(), from: id, to: id, edge_kind: edgeKind, label: z.string().optional(), payload: payload.optional(), direction: direction.optional() }),
  z.object({ op: z.literal("update_node"), id, label: z.string().min(1).optional(), sub: z.string().optional(), parent: parent.optional(), attrs: attrs.optional() }),
  z.object({ op: z.literal("update_edge"), id, label: z.string().optional(), edge_kind: edgeKind.optional(), payload: payload.optional(), direction: direction.optional() }),
  z.object({ op: z.literal("remove_node"), id }),
  z.object({ op: z.literal("remove_edge"), id }),
  z.object({ op: z.literal("remove_group"), id }),
  z.object({ op: z.literal("set_assumption"), key: z.string().min(1), value: z.string() }),
  z.object({ op: z.literal("add_flow"), id, name: flowName, origin: z.enum(["user", "system"]), summary: flowNote.optional(), result: flowNote.optional(), steps: flowSteps }),
  z.object({ op: z.literal("update_flow"), id, name: flowName.optional(), summary: flowNote.optional(), result: flowNote.optional(), steps: flowSteps.optional() }),
  z.object({ op: z.literal("remove_flow"), id }),
]);

export type Command = z.infer<typeof commandSchema>;

/** 구성도 상태가 아니라 흐름 저장소에 적용하는 명령. */
export type FlowCommand = Extract<Command, { op: "add_flow" | "update_flow" | "remove_flow" }>;
export const FLOW_OPS: ReadonlySet<Command["op"]> = new Set<Command["op"]>(["add_flow", "update_flow", "remove_flow"]);
export const isFlowCommand = (c: Command): c is FlowCommand => FLOW_OPS.has(c.op);

/** 흐름 명령을 저장소 명령 모양으로(모양이 같다는 것을 타입으로 확인한다). */
export const toFlowOp = (c: FlowCommand): FlowOp => c;

/**
 * 구성(노드·연결·영역과 그 속성)을 바꾸는 명령인지. 요약의 "바꾼 곳" 은 이것만 센다.
 * set_assumption(가정)은 적용·저장하지만 바꾼 곳으로 세지 않는다. 흐름 명령도 세지 않는다.
 */
export const isStructural = (cmd: Command): boolean => cmd.op !== "set_assumption" && !isFlowCommand(cmd);

/** 스키마가 받는 명령 이름 전부(스키마에서 뽑는다). */
export const COMMAND_OPS: readonly Command["op"][] = commandSchema.options.map((o) => o.shape.op.value);

export function parseCommand(raw: unknown): { ok: true; cmd: Command } | { ok: false; error: string } {
  const r = commandSchema.safeParse(raw);
  if (r.success) return { ok: true, cmd: r.data };
  return { ok: false, error: r.error.issues.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`).join("; ") };
}
