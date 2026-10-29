import spike from "../../docs/superpowers/spike/spike-results.json";
import { applyCommands } from "@/domain/apply";
import { EDGE_KINDS, NODE_KINDS } from "@/domain/catalog";
import type { Command } from "@/domain/commands";
import { emptyState } from "@/domain/types";
import type { DiagramState } from "@/domain/types";

interface SpikeGroup { id: string; group_kind: string; label: string; parent: string | null }
interface SpikeNode { id: string; kind: string; label: string; sub?: string | null; parent: string | null; attrs?: Record<string, string | number | null> }
interface SpikeEdge { id: string; from: string; to: string; edge_kind: string; label?: string | null }
interface SpikeState {
  groups: Record<string, SpikeGroup>;
  nodes: Record<string, SpikeNode>;
  edges: Record<string, SpikeEdge>;
  assumptions: Record<string, string>;
}

type AddGroup = Extract<Command, { op: "add_group" }>;
type AddNode = Extract<Command, { op: "add_node" }>;
type AddEdge = Extract<Command, { op: "add_edge" }>;

const NODE_KIND_SET = new Set<string>(NODE_KINDS.map((k) => k.kind));
const EDGE_KIND_SET = new Set<string>(EDGE_KINDS.map((k) => k.kind));
const AUX_NODE_KINDS = new Set(["monitoring", "logging", "ci_cd", "bastion"]);
const EDGE_KIND_MAP: Record<string, string> = { webhook: "async", data_sync: "replication" };

function convert(raw: SpikeState): DiagramState {
  const byId = raw.groups;

  // az 그룹은 제거: 가장 가까운 비-az 조상으로 parent 를 올리고 az 라벨을 노드 attrs 에 기록한다.
  const liftParent = (p: string | null): string | null => {
    while (p !== null && byId[p]?.group_kind === "az") p = byId[p].parent;
    return p;
  };
  const azLabelOf = (p: string | null): string | null => {
    while (p !== null) {
      if (byId[p]?.group_kind === "az") return byId[p].label;
      p = byId[p]?.parent ?? null;
    }
    return null;
  };

  // 그룹은 부모 먼저 순서로 방출한다.
  const ordered: SpikeGroup[] = [];
  const placed = new Set<string>();
  const visit = (g: SpikeGroup) => {
    if (placed.has(g.id)) return;
    const p = liftParent(g.parent);
    if (p !== null) visit(byId[p]);
    placed.add(g.id);
    ordered.push(g);
  };
  Object.values(byId).filter((g) => g.group_kind !== "az").forEach(visit);

  const cmds: Command[] = [];
  for (const g of ordered) {
    cmds.push({
      op: "add_group",
      id: g.id,
      group_kind: (g.group_kind === "redundancy_pair" ? "redundancy_group" : g.group_kind) as AddGroup["group_kind"],
      label: g.label,
      parent: liftParent(g.parent),
    });
  }
  const kindOf = new Map<string, string>();
  for (const n of Object.values(raw.nodes)) {
    const kind = NODE_KIND_SET.has(n.kind) ? n.kind : "generic";
    kindOf.set(n.id, kind);
    const az = azLabelOf(n.parent);
    cmds.push({
      op: "add_node",
      id: n.id,
      kind: kind as AddNode["kind"],
      label: n.label,
      ...(n.sub ? { sub: n.sub } : {}),
      parent: liftParent(n.parent),
      attrs: { ...(n.attrs ?? {}), ...(az !== null ? { az } : {}) },
    });
  }
  for (const e of Object.values(raw.edges)) {
    const mapped = EDGE_KIND_MAP[e.edge_kind] ?? e.edge_kind;
    const touchesAux = AUX_NODE_KINDS.has(kindOf.get(e.from) ?? "") || AUX_NODE_KINDS.has(kindOf.get(e.to) ?? "");
    const edgeKind = touchesAux ? "aux" : EDGE_KIND_SET.has(mapped) ? mapped : "request";
    cmds.push({
      op: "add_edge",
      id: e.id,
      from: e.from,
      to: e.to,
      edge_kind: edgeKind as AddEdge["edge_kind"],
      ...(e.label ? { label: e.label } : {}),
    });
  }
  for (const [key, value] of Object.entries(raw.assumptions ?? {})) {
    cmds.push({ op: "set_assumption", key, value: String(value) });
  }

  const { state, errors } = applyCommands(emptyState(), cmds);
  if (errors.length > 0) {
    throw new Error(`spike fixture conversion failed: ${errors.map((x) => `#${x.index} ${x.error}`).join("; ")}`);
  }
  return state;
}

type FixtureId = "s1" | "s2" | "s3" | "s4" | "s5";

export const spikeFixtures: { id: FixtureId; title: string; state: DiagramState }[] = (
  spike.scenarios as unknown as { id: FixtureId; title: string; state: SpikeState }[]
).map((s) => ({ id: s.id, title: s.title, state: convert(s.state) }));

export function fx(id: string): DiagramState {
  const f = spikeFixtures.find((x) => x.id === id);
  if (!f) throw new Error(`unknown fixture ${id}`);
  return f.state;
}

export function isInExternal(state: DiagramState, nodeId: string): boolean {
  let p = state.nodes[nodeId]?.parent ?? null;
  while (p !== null) {
    const g = state.groups[p];
    if (!g) return false;
    if (g.groupKind === "external_service") return true;
    p = g.parent;
  }
  return false;
}

export function synth(n: number): DiagramState {
  const cmds: Command[] = [
    { op: "add_group", id: "vpc", group_kind: "vpc", label: "VPC", parent: null },
    { op: "add_group", id: "sub", group_kind: "subnet_private", label: "내부 구역", parent: "vpc" },
  ];
  for (let i = 0; i < n; i++) cmds.push({ op: "add_node", id: `app-${i}`, kind: "app_server", label: `APP-${i}`, parent: "sub" });
  for (let i = 1; i < n; i++) cmds.push({ op: "add_edge", from: `app-${i - 1}`, to: `app-${i}`, edge_kind: "request" });
  const { state, errors } = applyCommands(emptyState(), cmds);
  if (errors.length > 0) throw new Error(`synth failed: ${errors[0].error}`);
  return state;
}
