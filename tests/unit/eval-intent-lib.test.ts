import { describe, expect, it } from "vitest";
import { compareBaseline, judgeQwen, summarizeOps, type CaseResult } from "../../scripts/eval-intent-lib";

describe("judgeQwen", () => {
  it("질문에는 명령이 없어야 한다", () => {
    expect(judgeQwen({ expect: "none" }, [])).toBeNull();
    expect(judgeQwen({ expect: "none" }, [{ op: "add_node" }, { op: "add_node" }])).toBe("명령 2개를 냄(add_node×2)");
  });

  it("구성 명령은 흐름·가정 명령으로 채워지지 않는다", () => {
    expect(judgeQwen({ expect: "structure" }, [{ op: "add_flow" }, { op: "set_assumption" }])).toMatch(/^구성 명령 없음/);
    expect(judgeQwen({ expect: "structure" }, [{ op: "update_edge" }])).toBeNull();
  });

  it("흐름은 기대한 종류의 흐름 명령이 하나라도 있으면 맞다", () => {
    expect(judgeQwen({ expect: "flow", ops: ["remove_flow"] }, [{ op: "remove_flow" }])).toBeNull();
    expect(judgeQwen({ expect: "flow", ops: ["remove_flow"] }, [{ op: "add_flow" }])).toMatch(/^기대한 흐름 명령\(remove_flow\) 없음/);
    expect(judgeQwen({ expect: "flow", ops: ["add_flow"] }, [{ op: "add_node" }])).toBe("흐름 명령 없음(add_node)");
  });

  it("연결 값은 그 연결의 마지막 값으로 본다", () => {
    const exp = { expect: "edge", edge: "e1", payload: "file", direction: "one_way" } as const;
    expect(judgeQwen(exp, [{ op: "update_edge", id: "e1", payload: "file" }, { op: "update_edge", id: "e1", direction: "one_way" }])).toBeNull();
    expect(judgeQwen(exp, [{ op: "update_edge", id: "e1", payload: "api", direction: "one_way" }])).toBe("값이 다름(api, one_way)");
    expect(judgeQwen(exp, [{ op: "update_edge", id: "e2", payload: "file", direction: "one_way" }])).toMatch(/^e1 갱신 없음/);
  });

  it("노드 속성은 빈 attrs 를 인정하지 않는다", () => {
    expect(judgeQwen({ expect: "node_attr", node: "was" }, [{ op: "update_node", id: "was", attrs: {} }])).toMatch(/^was 속성 갱신 없음/);
    expect(judgeQwen({ expect: "node_attr", node: "was" }, [{ op: "update_node", id: "was", attrs: { cpu: "4" } }])).toBeNull();
  });

  it("기록·건너뜀은 늘 맞다", () => {
    expect(judgeQwen({ expect: "record" }, [{ op: "add_node" }])).toBeNull();
    expect(judgeQwen({ expect: "skip" }, [])).toBeNull();
  });
});

describe("summarizeOps", () => {
  it("없으면 명령 없음", () => expect(summarizeOps([])).toBe("명령 없음"));
});

describe("compareBaseline", () => {
  const r = (id: string, intentOk: boolean, qwenOk: boolean | null, routed = "question"): CaseResult => ({
    id, intent: routed, confidence: 0.9, routed, intentOk, qwenOk, qwenNote: qwenOk === false ? "명령 1개를 냄(add_node)" : undefined,
  });

  it("나빠진 것과 나아진 것을 가른다", () => {
    const { worse, better } = compareBaseline([r("a", true, true), r("b", false, false, "null")], [r("a", false, false, "null"), r("b", true, true)]);
    expect(worse).toEqual([
      { id: "a", what: "의도", from: "question", to: "null" },
      { id: "a", what: "Qwen", from: "맞음", to: "명령 1개를 냄(add_node)" },
    ]);
    expect(better.map((c) => `${c.id}:${c.what}`)).toEqual(["b:의도", "b:Qwen"]);
  });

  it("기준에 없는 문장이나 Qwen 을 재지 않은 쪽은 비교하지 않는다", () => {
    const { worse, better } = compareBaseline([r("a", true, null)], [r("a", true, false), r("new", false, false)]);
    expect(worse).toEqual([]);
    expect(better).toEqual([]);
  });
});
