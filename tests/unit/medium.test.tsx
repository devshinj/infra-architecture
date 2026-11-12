import "@testing-library/jest-dom/vitest";
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

import { EdgeLayer } from "@/canvas/EdgeLayer";
import { buildDisplayGraph, type DisplayEdge } from "@/canvas/display";
import type { Layout } from "@/canvas/layout";
import { pointAlong } from "@/canvas/mediumMark";
import { applyCommands } from "@/domain/apply";
import { crossesBoundary } from "@/domain/boundary";
import { categoryOf, NODE_KINDS } from "@/domain/catalog";
import { commandSchema, type Command } from "@/domain/commands";
import { commandsBetween } from "@/domain/diff";
import { FIELD_LABELS } from "@/domain/missing";
import { requiredMethod, type NetworkKnowledge } from "@/domain/network";
import { NETWORK_RULE_SEED, NETWORK_TYPE_SEED } from "@/domain/network-seed";
import { crossingPaths } from "@/domain/networkRules";
import { emptyState } from "@/domain/types";
import { evaluateRules } from "@/domain/warnings";
import { normalizeAiCommand } from "@/server/chat/normalize";

vi.mock("@/canvas/motion", () => ({ startBundleMotion: vi.fn(() => vi.fn()) }));
afterEach(cleanup);

const build = (cmds: Command[]) => applyCommands(emptyState(), cmds).state;

/** 휴대폰 앱(망 밖) ↔ 밴드(기기망) ↔ 서버(업무망). */
const field = (medium?: "wireless" | "serial") =>
  build([
    { op: "add_group", id: "iot", group_kind: "network_zone", label: "기기망", parent: null },
    { op: "add_group", id: "biz", group_kind: "network_zone", label: "업무망", parent: null },
    { op: "add_node", id: "app", kind: "client_mobile", label: "앱", parent: null },
    { op: "add_node", id: "band", kind: "iot_device", label: "밴드", parent: "iot" },
    { op: "add_node", id: "was", kind: "was", label: "WAS", parent: "biz" },
    { op: "add_edge", id: "e-ble", from: "app", to: "band", edge_kind: "request", label: "BLE(GATT)", ...(medium ? { medium } : {}) },
  ]);

describe("연결의 통신 수단(medium)", () => {
  test("add_edge·update_edge 로 넣고 바꾼다. 허용값이 아니면 명령이 거부된다", () => {
    const s = field("wireless");
    expect(s.edges["e-ble"].medium).toBe("wireless");
    const next = applyCommands(s, [{ op: "update_edge", id: "e-ble", medium: "ip" }]).state;
    expect(next.edges["e-ble"].medium).toBe("ip");
    expect(commandSchema.safeParse({ op: "update_edge", id: "e-ble", medium: "radio" }).success).toBe(false);
  });

  test("AI 가 흔히 쓰는 표기를 허용값으로 바꾸고, 모르는 값은 키를 지운다", () => {
    const edge = { op: "add_edge", from: "app", to: "band", edge_kind: "request" };
    expect(normalizeAiCommand({ ...edge, medium: "BLE" })).toMatchObject({ medium: "wireless" });
    expect(normalizeAiCommand({ ...edge, medium: "RTSP" })).toMatchObject({ medium: "video" });
    expect(normalizeAiCommand({ ...edge, medium: "WebRTC" })).toMatchObject({ medium: "media" });
    expect(normalizeAiCommand({ ...edge, medium: "RS-485" })).toMatchObject({ medium: "serial" });
    expect(normalizeAiCommand({ ...edge, medium: "OSDP" })).toMatchObject({ medium: "serial" });
    expect(normalizeAiCommand({ ...edge, medium: "광케이블" })).not.toHaveProperty("medium");
    expect(normalizeAiCommand({ ...edge, medium: null })).not.toHaveProperty("medium");
  });

  test("두 상태의 차이에 수단이 실리고, 수단이 없어지면 ip 로 되돌린다", () => {
    const plain = field();
    const ble = field("wireless");
    expect(commandsBetween(plain, ble)).toContainEqual({ op: "update_edge", id: "e-ble", medium: "wireless" });
    expect(commandsBetween(ble, plain)).toContainEqual({ op: "update_edge", id: "e-ble", medium: "ip" });
  });

  test("근거리 무선은 망을 넘는 통신으로 보지 않는다(경계 판정·통신 길·경고 모두)", () => {
    const plain = field();
    const ble = field("wireless");
    expect(crossesBoundary(plain, plain.edges["e-ble"])).toBe(true);
    expect(crossesBoundary(ble, ble.edges["e-ble"])).toBe(false);
    expect(crossingPaths(plain)).toHaveLength(1);
    expect(crossingPaths(ble)).toHaveLength(0);
    expect(evaluateRules(plain).some((w) => w.edgeId === "e-ble")).toBe(true);
    expect(evaluateRules(ble).some((w) => w.edgeId === "e-ble")).toBe(false);
  });

  test("유선 직렬(RS-485 등)도 기기끼리 바로 붙는 연결이라 망을 넘는 통신으로 보지 않는다", () => {
    const wire = field("serial");
    expect(wire.edges["e-ble"].medium).toBe("serial");
    expect(crossesBoundary(wire, wire.edges["e-ble"])).toBe(false);
    expect(crossingPaths(wire)).toHaveLength(0);
    expect(evaluateRules(wire).some((w) => w.edgeId === "e-ble")).toBe(false);
  });

  test("화면용 연결에는 표지를 다는 수단만 싣는다(ip 는 뺀다)", () => {
    const opts = { hideAux: false, busSimplify: false, mergeDuplicates: false, collapsed: new Set<string>(), selectedId: null };
    expect(buildDisplayGraph(field("wireless"), opts).edges[0].medium).toBe("wireless");
    const ip = applyCommands(field("wireless"), [{ op: "update_edge", id: "e-ble", medium: "ip" }]).state;
    expect(buildDisplayGraph(ip, opts).edges[0]).not.toHaveProperty("medium");
  });
});

describe("선 위 통신 수단 표지", () => {
  test("pointAlong 은 꺾은선 길이 비율 자리를 준다", () => {
    const pts = [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }];
    expect(pointAlong(pts, 0.25)).toEqual({ x: 50, y: 0 });
    expect(pointAlong(pts, 0.75)).toEqual({ x: 100, y: 50 });
    expect(pointAlong([{ x: 0, y: 0 }], 0.5)).toBeNull();
  });

  test("수단이 있는 연결에만 표지를 그리고, 누르는 자리는 가리지 않는다", () => {
    const layout: Layout = {
      nodes: {}, groups: {}, width: 300, height: 100,
      edges: [
        { id: "e1", points: [{ x: 0, y: 10 }, { x: 200, y: 10 }] },
        { id: "e2", points: [{ x: 0, y: 60 }, { x: 200, y: 60 }] },
      ],
    };
    const edges: DisplayEdge[] = [
      { id: "e1", from: "a", to: "b", edgeKind: "request", sourceEdgeIds: ["e1"], medium: "video" },
      { id: "e2", from: "a", to: "c", edgeKind: "request", sourceEdgeIds: ["e2"] },
    ];
    render(<EdgeLayer layout={layout} edges={edges} selectedId={null} hoverId={null} hoverLabels motion={false} appearing={new Set()} nodeCount={3} />);
    const marks = document.querySelectorAll(".edge-medium");
    expect(marks).toHaveLength(1);
    expect(marks[0]).toHaveAttribute("data-medium", "video");
    expect(marks[0]).toHaveAttribute("transform", "translate(50 10)");
    expect(marks[0].closest("[data-edge-id]")).toHaveAttribute("data-edge-id", "e1");
  });
});

describe("현장 기기·실시간·AI 노드 종류", () => {
  test("새 종류의 분류와 속성 칸 이름표가 있다", () => {
    expect(categoryOf("iot_device")).toBe("device");
    expect(categoryOf("camera")).toBe("device");
    expect(categoryOf("control_display")).toBe("client");
    expect(categoryOf("vector_db")).toBe("data");
    for (const kind of ["iot_gateway", "mqtt_broker", "video_recorder", "model_server", "llm_gateway", "ai_agent", "tool_server", "signaling_server", "media_server"]) {
      expect(NODE_KINDS.some((k) => k.kind === kind), kind).toBe(true);
    }
    for (const k of NODE_KINDS) for (const a of k.requiredAttrs) expect(Object.hasOwn(FIELD_LABELS, a), `${k.kind}.${a}`).toBe(true);
  });

  test("현장 기기에서 서버로 가는 연결은 '방화벽 없는 진입' 경고의 출발점이 아니다", () => {
    const s = build([
      { op: "add_node", id: "cam", kind: "camera", label: "카메라", parent: null },
      { op: "add_node", id: "nvr", kind: "video_recorder", label: "NVR", parent: null },
      { op: "add_edge", from: "cam", to: "nvr", edge_kind: "request", label: "RTSP", medium: "video" },
    ]);
    expect(evaluateRules(s).filter((w) => w.rule === "no_firewall")).toEqual([]);
  });
});

describe("영상·기기 망의 기본 제공 짝 규칙", () => {
  const seed: NetworkKnowledge = { types: Object.fromEntries(NETWORK_TYPE_SEED.map((t) => [t.key, t])), rules: [], baseRules: NETWORK_RULE_SEED };

  test("기기망은 클라우드로 나가는 연결을 방화벽으로 열고, 업무망과는 망연계다", () => {
    expect(requiredMethod(seed, "iot-net", "internet")?.method).toBe("firewall");
    expect(requiredMethod(seed, "iot-net", "private-cloud")?.method).toBe("firewall");
    expect(requiredMethod(seed, "iot-net", "business-net")?.method).toBe("network_link");
  });

  test("영상망은 인터넷과 잇지 않고, 통합관제망은 영상망과 방화벽·행정망과 망연계·인터넷과는 잇지 않는다", () => {
    expect(requiredMethod(seed, "video-net", "internet")?.method).toBe("none");
    expect(requiredMethod(seed, "video-net", "office-net")?.method).toBe("firewall");
    expect(requiredMethod(seed, "control-center-net", "video-net")?.method).toBe("firewall");
    expect(requiredMethod(seed, "control-center-net", "admin-net")?.method).toBe("network_link");
    expect(requiredMethod(seed, "control-center-net", "local-gov-net")?.method).toBe("network_link");
    expect(requiredMethod(seed, "control-center-net", "internet")?.method).toBe("none");
  });
});
