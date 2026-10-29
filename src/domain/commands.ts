import { z } from "zod";

import { EDGE_KINDS, GROUP_KINDS, NODE_KINDS } from "./catalog";

const tuple = <T extends readonly { kind: string }[]>(defs: T) =>
  defs.map((d) => d.kind) as [T[number]["kind"], ...T[number]["kind"][]];

const id = z.string().regex(/^[a-z0-9][a-z0-9-]{0,63}$/);
const nodeKind = z.enum(tuple(NODE_KINDS));
const groupKind = z.enum(tuple(GROUP_KINDS));
const edgeKind = z.enum(tuple(EDGE_KINDS));
const parent = id.nullable();
const attrs = z.record(z.string(), z.union([z.string(), z.number(), z.null()]));

export const commandSchema = z.discriminatedUnion("op", [
  z.object({ op: z.literal("add_group"), id, group_kind: groupKind, label: z.string().min(1), parent }),
  z.object({ op: z.literal("add_node"), id, kind: nodeKind, label: z.string().min(1), sub: z.string().optional(), parent, attrs: attrs.optional() }),
  z.object({ op: z.literal("add_edge"), id: id.optional(), from: id, to: id, edge_kind: edgeKind, label: z.string().optional() }),
  z.object({ op: z.literal("update_node"), id, label: z.string().min(1).optional(), sub: z.string().optional(), parent: parent.optional(), attrs: attrs.optional() }),
  z.object({ op: z.literal("update_edge"), id, label: z.string().optional(), edge_kind: edgeKind.optional() }),
  z.object({ op: z.literal("remove_node"), id }),
  z.object({ op: z.literal("remove_edge"), id }),
  z.object({ op: z.literal("set_assumption"), key: z.string().min(1), value: z.string() }),
]);

export type Command = z.infer<typeof commandSchema>;

export function parseCommand(raw: unknown): { ok: true; cmd: Command } | { ok: false; error: string } {
  const r = commandSchema.safeParse(raw);
  if (r.success) return { ok: true, cmd: r.data };
  return { ok: false, error: r.error.issues.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`).join("; ") };
}
