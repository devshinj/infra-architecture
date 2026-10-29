import spike from "../../docs/superpowers/spike/spike-results.json";
import { applyCommands } from "@/domain/apply";
import type { Command } from "@/domain/commands";
import { emptyState } from "@/domain/types";
import type { DiagramState } from "@/domain/types";
import { convertSpikeScenario, type SpikeState } from "@/server/samples";

type FixtureId = "s1" | "s2" | "s3" | "s4" | "s5";

export const spikeFixtures: { id: FixtureId; title: string; state: DiagramState }[] = (
  spike.scenarios as unknown as { id: FixtureId; title: string; state: SpikeState }[]
).map((s) => ({ id: s.id, title: s.title, state: convertSpikeScenario(s.state) }));

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
