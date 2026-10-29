import type { Command } from "./commands";
import type { DiagramState } from "./types";

export type ApplyResult =
  | { ok: true; state: DiagramState }
  | { ok: false; error: string; state: DiagramState };

const fail = (state: DiagramState, error: string): ApplyResult => ({ ok: false, error, state });
const has = (o: object, k: string) => Object.hasOwn(o, k);
/** Groups, nodes and edges share one id space (selection is by id). */
const idTaken = (s: DiagramState, id: string) => has(s.groups, id) || has(s.nodes, id) || has(s.edges, id);
const parentOk = (s: DiagramState, parent: string | null) => parent === null || has(s.groups, parent);
const endpointOk = (s: DiagramState, id: string) => has(s.nodes, id) || has(s.groups, id);

export function applyCommand(state: DiagramState, cmd: Command): ApplyResult {
  switch (cmd.op) {
    case "add_group": {
      if (idTaken(state, cmd.id)) return fail(state, `id ${cmd.id} already exists`);
      if (!parentOk(state, cmd.parent)) return fail(state, `parent ${cmd.parent} not found`);
      return {
        ok: true,
        state: {
          ...state,
          groups: { ...state.groups, [cmd.id]: { id: cmd.id, groupKind: cmd.group_kind, label: cmd.label, parent: cmd.parent } },
        },
      };
    }
    case "add_node": {
      if (idTaken(state, cmd.id)) return fail(state, `id ${cmd.id} already exists`);
      if (!parentOk(state, cmd.parent)) return fail(state, `parent ${cmd.parent} not found`);
      const node = {
        id: cmd.id,
        kind: cmd.kind,
        label: cmd.label,
        ...(cmd.sub !== undefined ? { sub: cmd.sub } : {}),
        parent: cmd.parent,
        attrs: { ...(cmd.attrs ?? {}) },
      };
      return { ok: true, state: { ...state, nodes: { ...state.nodes, [cmd.id]: node } } };
    }
    case "add_edge": {
      if (!endpointOk(state, cmd.from)) return fail(state, `endpoint ${cmd.from} not found`);
      if (!endpointOk(state, cmd.to)) return fail(state, `endpoint ${cmd.to} not found`);
      let id = cmd.id;
      if (id === undefined) {
        const stem = `e-${cmd.from}-${cmd.to}`;
        id = stem;
        for (let n = 2; idTaken(state, id); n++) id = `${stem}-${n}`;
      } else if (idTaken(state, id)) {
        return fail(state, `id ${id} already exists`);
      }
      const edge = { id, from: cmd.from, to: cmd.to, edgeKind: cmd.edge_kind, ...(cmd.label !== undefined ? { label: cmd.label } : {}) };
      return { ok: true, state: { ...state, edges: { ...state.edges, [id]: edge } } };
    }
    case "update_node": {
      const node = has(state.nodes, cmd.id) ? state.nodes[cmd.id] : undefined;
      if (!node) return fail(state, `node ${cmd.id} not found`);
      if (cmd.parent !== undefined && !parentOk(state, cmd.parent)) return fail(state, `parent ${cmd.parent} not found`);
      const next = {
        ...node,
        ...(cmd.label !== undefined ? { label: cmd.label } : {}),
        ...(cmd.sub !== undefined ? { sub: cmd.sub } : {}),
        ...(cmd.parent !== undefined ? { parent: cmd.parent } : {}),
        attrs: cmd.attrs ? { ...node.attrs, ...cmd.attrs } : node.attrs,
      };
      return { ok: true, state: { ...state, nodes: { ...state.nodes, [cmd.id]: next } } };
    }
    case "update_edge": {
      const edge = has(state.edges, cmd.id) ? state.edges[cmd.id] : undefined;
      if (!edge) return fail(state, `edge ${cmd.id} not found`);
      const next = {
        ...edge,
        ...(cmd.label !== undefined ? { label: cmd.label } : {}),
        ...(cmd.edge_kind !== undefined ? { edgeKind: cmd.edge_kind } : {}),
      };
      return { ok: true, state: { ...state, edges: { ...state.edges, [cmd.id]: next } } };
    }
    case "remove_node": {
      if (!has(state.nodes, cmd.id)) return fail(state, `node ${cmd.id} not found`);
      const nodes = { ...state.nodes };
      delete nodes[cmd.id];
      const edges = Object.fromEntries(Object.entries(state.edges).filter(([, e]) => e.from !== cmd.id && e.to !== cmd.id));
      return { ok: true, state: { ...state, nodes, edges } };
    }
    case "remove_edge": {
      if (!has(state.edges, cmd.id)) return fail(state, `edge ${cmd.id} not found`);
      const edges = { ...state.edges };
      delete edges[cmd.id];
      return { ok: true, state: { ...state, edges } };
    }
    case "set_assumption": {
      const cur = has(state.assumptions, cmd.key) ? state.assumptions[cmd.key] : undefined;
      if (cur?.confirmed) return fail(state, `assumption ${cmd.key} is confirmed`);
      const next = { key: cmd.key, value: cmd.value, confirmed: false };
      return { ok: true, state: { ...state, assumptions: { ...state.assumptions, [cmd.key]: next } } };
    }
  }
}

export function applyCommands(
  state: DiagramState,
  cmds: Command[],
): { state: DiagramState; errors: { index: number; error: string }[] } {
  const errors: { index: number; error: string }[] = [];
  let cur = state;
  cmds.forEach((cmd, index) => {
    const r = applyCommand(cur, cmd);
    if (r.ok) cur = r.state;
    else errors.push({ index, error: r.error });
  });
  return { state: cur, errors };
}
