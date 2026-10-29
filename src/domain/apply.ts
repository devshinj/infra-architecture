import type { Command } from "./commands";
import type { DiagramState } from "./types";

export type ApplyResult =
  | { ok: true; state: DiagramState }
  | { ok: false; error: string; state: DiagramState };

const fail = (state: DiagramState, error: string): ApplyResult => ({ ok: false, error, state });
const idTaken = (s: DiagramState, id: string) => id in s.groups || id in s.nodes;
const parentOk = (s: DiagramState, parent: string | null) => parent === null || parent in s.groups;
const endpointOk = (s: DiagramState, id: string) => id in s.nodes || id in s.groups;

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
        for (let n = 2; id in state.edges; n++) id = `${stem}-${n}`;
      } else if (id in state.edges) {
        return fail(state, `edge ${id} already exists`);
      }
      const edge = { id, from: cmd.from, to: cmd.to, edgeKind: cmd.edge_kind, ...(cmd.label !== undefined ? { label: cmd.label } : {}) };
      return { ok: true, state: { ...state, edges: { ...state.edges, [id]: edge } } };
    }
    case "update_node": {
      const node = state.nodes[cmd.id];
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
      const edge = state.edges[cmd.id];
      if (!edge) return fail(state, `edge ${cmd.id} not found`);
      const next = {
        ...edge,
        ...(cmd.label !== undefined ? { label: cmd.label } : {}),
        ...(cmd.edge_kind !== undefined ? { edgeKind: cmd.edge_kind } : {}),
      };
      return { ok: true, state: { ...state, edges: { ...state.edges, [cmd.id]: next } } };
    }
    case "remove_node": {
      if (!(cmd.id in state.nodes)) return fail(state, `node ${cmd.id} not found`);
      const nodes = { ...state.nodes };
      delete nodes[cmd.id];
      const edges = Object.fromEntries(Object.entries(state.edges).filter(([, e]) => e.from !== cmd.id && e.to !== cmd.id));
      return { ok: true, state: { ...state, nodes, edges } };
    }
    case "remove_edge": {
      if (!(cmd.id in state.edges)) return fail(state, `edge ${cmd.id} not found`);
      const edges = { ...state.edges };
      delete edges[cmd.id];
      return { ok: true, state: { ...state, edges } };
    }
    case "set_assumption": {
      const cur = state.assumptions[cmd.key];
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
