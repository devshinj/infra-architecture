import type { Command } from "./commands";
import type { DiagramState, Group } from "./types";

const equal = (a: unknown, b: unknown): boolean => {
  if (a === b) return true;
  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) return false;
  const ka = Object.keys(a);
  const kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  return ka.every((k) => k in b && equal((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]));
};

export function diffStates(a: DiagramState, b: DiagramState): { added: Set<string>; removed: Set<string>; changed: Set<string> } {
  const added = new Set<string>();
  const removed = new Set<string>();
  const changed = new Set<string>();
  for (const key of ["groups", "nodes", "edges"] as const) {
    const ma: Record<string, unknown> = a[key];
    const mb: Record<string, unknown> = b[key];
    for (const id of Object.keys(mb)) {
      if (!(id in ma)) added.add(id);
      else if (!equal(ma[id], mb[id])) changed.add(id);
    }
    for (const id of Object.keys(ma)) if (!(id in mb)) removed.add(id);
  }
  return { added, removed, changed };
}

/** 그룹의 깊이(최상위 0). 순환이면 멈춘다. */
function depth(groups: Record<string, Group>, id: string): number {
  let d = 0;
  const seen = new Set<string>();
  for (let cur = groups[id]?.parent; cur && groups[cur] && !seen.has(cur); cur = groups[cur]!.parent) {
    seen.add(cur);
    d++;
  }
  return d;
}

/**
 * a 를 b 로 만드는 구성 명령(적용 가능한 순서). 대화 기록에 "그 차례에 낸 명령"을 되살리는 데 쓴다
 * (명령을 저장하기 전의 옛 메시지를 버전 차이로 채우는 스크립트).
 * 영역은 이름·상위를 바꿀 수 없어 추가·삭제만, 망 종류는 key 만 본다. 가정은 지우는 명령이 없어 바뀐 값만 낸다.
 * 흐름·경고·망연계 표시(guess)는 다루지 않는다.
 */
export function commandsBetween(a: DiagramState, b: DiagramState): Command[] {
  const out: Command[] = [];
  const addedGroups = Object.values(b.groups)
    .filter((g) => !(g.id in a.groups))
    .sort((x, y) => depth(b.groups, x.id) - depth(b.groups, y.id));
  for (const g of addedGroups) out.push({ op: "add_group", id: g.id, group_kind: g.groupKind, label: g.label, parent: g.parent });
  for (const g of Object.values(b.groups)) {
    const before = a.groups[g.id]?.netType?.key ?? null;
    const after = g.netType?.key ?? null;
    if (before !== after && (after !== null || g.id in a.groups)) out.push({ op: "set_zone_type", id: g.id, type: after });
  }
  for (const n of Object.values(b.nodes)) {
    const o = a.nodes[n.id];
    if (!o) {
      const attrs = Object.keys(n.attrs ?? {}).length ? { attrs: n.attrs } : {};
      out.push({ op: "add_node", id: n.id, kind: n.kind, label: n.label, ...(n.sub !== undefined ? { sub: n.sub } : {}), parent: n.parent, ...attrs });
      continue;
    }
    const attrs: Record<string, string | number | null> = {};
    for (const [k, v] of Object.entries(n.attrs ?? {})) if (!equal(o.attrs?.[k], v)) attrs[k] = v;
    for (const k of Object.keys(o.attrs ?? {})) if (!(k in (n.attrs ?? {}))) attrs[k] = null;
    const ch = {
      ...(o.label !== n.label ? { label: n.label } : {}),
      ...(o.sub !== n.sub && n.sub !== undefined ? { sub: n.sub } : {}),
      ...(o.parent !== n.parent ? { parent: n.parent } : {}),
      ...(Object.keys(attrs).length ? { attrs } : {}),
    };
    if (Object.keys(ch).length) out.push({ op: "update_node", id: n.id, ...ch });
  }
  for (const e of Object.values(b.edges)) {
    const o = a.edges[e.id];
    if (!o) {
      out.push({
        op: "add_edge",
        id: e.id,
        from: e.from,
        to: e.to,
        edge_kind: e.edgeKind,
        ...(e.label !== undefined ? { label: e.label } : {}),
        ...(e.payload ? { payload: e.payload } : {}),
        ...(e.direction ? { direction: e.direction } : {}),
      });
      continue;
    }
    const ch = {
      ...(o.label !== e.label && e.label !== undefined ? { label: e.label } : {}),
      ...(o.edgeKind !== e.edgeKind ? { edge_kind: e.edgeKind } : {}),
      ...(o.payload !== e.payload && e.payload ? { payload: e.payload } : {}),
      ...(o.direction !== e.direction && e.direction ? { direction: e.direction } : {}),
    };
    if (Object.keys(ch).length) out.push({ op: "update_edge", id: e.id, ...ch });
  }
  for (const id of Object.keys(a.edges)) if (!(id in b.edges)) out.push({ op: "remove_edge", id });
  for (const id of Object.keys(a.nodes)) if (!(id in b.nodes)) out.push({ op: "remove_node", id });
  const removedGroups = Object.keys(a.groups)
    .filter((id) => !(id in b.groups))
    .sort((x, y) => depth(a.groups, y) - depth(a.groups, x));
  for (const id of removedGroups) out.push({ op: "remove_group", id });
  for (const [key, v] of Object.entries(b.assumptions ?? {})) {
    if (a.assumptions?.[key]?.value !== v.value) out.push({ op: "set_assumption", key, value: v.value });
  }
  return out;
}
