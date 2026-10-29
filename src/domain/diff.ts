import type { DiagramState } from "./types";

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
