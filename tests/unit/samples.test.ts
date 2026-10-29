import { expect, test } from "vitest";

import { convertSpikeScenario, type SpikeState } from "@/server/samples";

test("az groups are removed, nodes get attrs.az and children are re-parented", () => {
  const raw: SpikeState = {
    groups: {
      vpc: { id: "vpc", group_kind: "vpc", label: "VPC", parent: null },
      az1: { id: "az1", group_kind: "az", label: "AZ-a", parent: "vpc" },
      sub: { id: "sub", group_kind: "subnet_private", label: "내부 구역", parent: "az1" },
    },
    nodes: {
      n1: { id: "n1", kind: "app_server", label: "APP", parent: "sub" },
      n2: { id: "n2", kind: "app_server", label: "APP2", parent: "az1" },
    },
    edges: {},
    assumptions: {},
  };
  const s = convertSpikeScenario(raw);
  expect(s.groups.az1).toBeUndefined();
  expect(s.groups.sub.parent).toBe("vpc");
  expect(s.nodes.n1.parent).toBe("sub");
  expect(s.nodes.n1.attrs.az).toBe("AZ-a");
  expect(s.nodes.n2.parent).toBe("vpc");
  expect(s.nodes.n2.attrs.az).toBe("AZ-a");
});
