// 화면 테스트용 망 지식과 행정망 사례 상태.
import type { NetworkKnowledge } from "@/domain/network";
import { NETWORK_TYPE_SEED } from "@/domain/network-seed";
import { emptyState, type DiagramState, type ZoneType } from "@/domain/types";

export const KNOWLEDGE: NetworkKnowledge = { types: Object.fromEntries(NETWORK_TYPE_SEED.map((t) => [t.key, t])), rules: [] };

const n = (id: string, kind: string, label: string, parent: string | null) => ({ id, kind: kind as never, label, parent, attrs: {} });

/** 행정망 PC → 망 밖 방화벽 → GCloud WAS. 행정망 종류는 AI 추정(미확인), GCloud 는 사용자가 정했다. */
export const adminCase = (admin: ZoneType | null = { key: "admin-net", source: "ai", confirmed: false }): DiagramState => ({
  ...emptyState(),
  groups: {
    "admin-net": { id: "admin-net", groupKind: "network_zone", label: "행정망", parent: null, ...(admin ? { netType: admin } : {}) },
    "gcloud-internet": { id: "gcloud-internet", groupKind: "network_zone", label: "GCloud 인터넷망", parent: null, netType: { key: "gcloud-internet", source: "user", confirmed: true } },
  },
  nodes: {
    pc: n("pc", "client_web", "PC", "admin-net"),
    fw: n("fw", "firewall", "방화벽", null),
    was: n("was", "was", "WAS", "gcloud-internet"),
  },
  edges: {
    e1: { id: "e1", from: "pc", to: "fw", edgeKind: "request" },
    e2: { id: "e2", from: "fw", to: "was", edgeKind: "request" },
  },
});
