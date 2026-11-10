import { describe, expect, test } from "vitest";

import { explainRejection, REJECT } from "@/server/mcp/explain";

describe("explainRejection", () => {
  test.each([
    [{ op: "add_node", id: "web", parent: "vpc-1" }, "parent vpc-1 not found", "3번: parent 영역 vpc-1 이 없어요"],
    [{ op: "add_node", id: "web" }, "id web already exists", "3번: id web 은(는) 이미 있어요. 다른 id 를 쓰거나 update_node 로 고쳐 주세요"],
    [{ op: "add_edge", from: "a", to: "b" }, "endpoint b not found", "3번: 연결 끝 b 이(가) 없어요(노드나 영역 id 여야 해요)"],
    [{ op: "update_node", id: "x" }, "node x not found", "3번: 노드 x 이(가) 없어요"],
    [{ op: "remove_edge", id: "e9" }, "edge e9 not found", "3번: 연결 e9 이(가) 없어요"],
    [{ op: "remove_group", id: "g" }, "group g not found", "3번: 영역 g 이(가) 없어요"],
    [{ op: "set_assumption", key: "ha" }, "assumption ha is confirmed", "3번: 가정 ha 은(는) 사용자가 확정해서 바꿀 수 없어요"],
    [{ op: "set_zone_type", id: "vpc" }, "group vpc is not a network zone", "3번: 영역 vpc 은(는) 망 영역(network_zone)이 아니라 망 종류를 붙일 수 없어요"],
    [{ op: "set_zone_type", id: "gov" }, "zone type gov is confirmed", "3번: 영역 gov 의 망 종류는 사용자가 확정해서 바꿀 수 없어요"],
  ])("apply 오류 %#", (cmd, error, want) => {
    expect(explainRejection(2, cmd, error)).toBe(want);
  });

  test("parseCommand 오류는 칸과 원래 문구를 함께 보여 준다", () => {
    expect(explainRejection(0, { op: "add_node" }, "id: Invalid input; label: Invalid input")).toBe(
      "1번: add_node 명령의 형식이 맞지 않아요(id: Invalid input; label: Invalid input)",
    );
  });

  test("모르는 명령·say·set_link_guess·알 수 없는 망 종류", () => {
    expect(explainRejection(0, { op: "add_server" }, REJECT.unknownOp)).toBe("1번: 모르는 명령 add_server 이에요. get_guide 의 명령 목록을 봐 주세요");
    expect(explainRejection(0, "hello", REJECT.unknownOp)).toBe("1번: 명령 이름(op)이 없어요");
    expect(explainRejection(1, { op: "say", text: "안녕" }, REJECT.say)).toBe("2번: say 는 받지 않아요. 바꾼 내용은 summary 에 적어 주세요");
    expect(explainRejection(1, { op: "set_link_guess" }, REJECT.serverOnly)).toBe(
      "2번: set_link_guess 는 서버만 쓰는 명령이에요. 망연계를 추정으로 넣으려면 add_node 에 guess: true 를 주세요",
    );
    expect(explainRejection(1, { op: "set_zone_type", id: "gov", type: "nope" }, REJECT.unknownNetType)).toBe(
      "2번: 알 수 없는 망 종류 nope 이에요. get_guide 의 망 종류 key 를 써 주세요",
    );
  });

  test("망 지식을 못 읽었으면 서버 문제라고 알린다", () => {
    expect(explainRejection(0, { op: "set_zone_type", id: "gov", type: null }, REJECT.noKnowledge)).toBe(
      "1번: 지금 망 지식을 읽지 못해 망 종류를 붙일 수 없어요. 잠시 뒤 다시 시도해 주세요.",
    );
  });

  test("흐름 거절 이유", () => {
    const f = { op: "add_flow", id: "login" };
    expect(explainRejection(4, f, "flow not_found")).toBe("5번: 흐름 login 이(가) 없어요");
    expect(explainRejection(4, f, "flow exists")).toBe("5번: 흐름 login 은(는) 이미 있어요. update_flow 로 고쳐 주세요");
    expect(explainRejection(4, f, "flow too_many_flows")).toBe("5번: 흐름은 구성도마다 20개까지예요");
    expect(explainRejection(4, f, "flow no_steps")).toBe("5번: 흐름 login 에 단계가 없어요");
    expect(explainRejection(4, f, "flow too_many_steps")).toBe("5번: 흐름 login 의 단계는 20개까지예요");
    expect(explainRejection(4, f, "flow missing_edge,against_direction")).toBe(
      "5번: 흐름 login — 단계가 없는 연결을 가리켜요, 한 방향 연결을 거꾸로 지나요",
    );
    expect(explainRejection(4, f, "flow bad_start,disconnected")).toBe(
      "5번: 흐름 login — 단계의 from 이 그 연결의 끝 노드가 아니에요, 앞 단계에서 닿지 않은 노드에서 시작하는 단계가 있어요",
    );
  });

  test("모르는 글은 원문을 그대로", () => {
    expect(explainRejection(6, { op: "add_node" }, "something odd")).toBe("7번: 적용할 수 없어요(something odd)");
  });
});
