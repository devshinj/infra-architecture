import { describe, expect, it } from "vitest";
import { checkGuards, checkScope, compareBaseline, judgeQwen, scopeNote, summarizeOps, type CaseResult } from "../../scripts/eval-intent-lib";
import type { DiagramState } from "@/domain/types";

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

describe("checkGuards", () => {
  const none = { guessed: [], flows: {} };
  it("나오면 안 되는 명령을 잡는다", () => {
    expect(checkGuards({ forbid: ["remove_edge", "update_flow"] }, [{ op: "add_node" }, { op: "remove_edge" }], none)).toBe(
      "나오면 안 되는 명령: remove_edge",
    );
    expect(checkGuards({ forbid: ["remove_edge"] }, [{ op: "add_node" }], none)).toBeNull();
  });

  it("지어낸 전달물·방향을 잡는다", () => {
    expect(checkGuards({}, [], { guessed: ["e-a-b"], flows: {} })).toBe("망을 안 넘는 연결에 전달물·방향을 지어냄: e-a-b");
  });

  it("남은 단계의 짧은 설명이 바뀌면 잡고, 새 단계는 묻지 않는다", () => {
    const flows = { signup: [{ edge: "e1", short: "가입 요청" }, { edge: "e2", short: "회원 저장" }] };
    const cmd = (steps: { edge: string; short: string }[]) => [{ op: "update_flow", id: "signup", steps }];
    expect(checkGuards({ keepStepText: true }, cmd([{ edge: "e1", short: "로그인 요청" }, { edge: "e2", short: "회원 저장" }]), { guessed: [], flows })).toBe(
      "signup 단계 글을 바꿈: 가입 요청→로그인 요청",
    );
    expect(checkGuards({ keepStepText: true }, cmd([{ edge: "e1", short: "가입 요청" }, { edge: "e9", short: "인증" }]), { guessed: [], flows })).toBeNull();
    expect(checkGuards({}, cmd([{ edge: "e1", short: "로그인 요청" }]), { guessed: [], flows })).toBeNull();
  });
});

describe("judgeQwen nodes_attr", () => {
  const exp = { expect: "nodes_attr" as const, nodes: ["a", "b"], key: "os" };
  it("대상 전부에 그 속성을 적어야 하고, 다른 노드에 적으면 안 된다", () => {
    expect(judgeQwen(exp, [{ op: "update_node", id: "a", attrs: { os: "x" } }, { op: "update_node", id: "b", attrs: { os: "x" } }])).toBeNull();
    expect(judgeQwen(exp, [{ op: "update_node", id: "a", attrs: { os: "x" } }, { op: "update_node", id: "c", attrs: { os: "x" } }])).toBe(
      "대상이 다름(빠짐: b / 더함: c)",
    );
    expect(judgeQwen(exp, [{ op: "update_node", id: "a", attrs: { os: "x" } }, { op: "update_node", id: "b", attrs: { cpu: "4" } }])).toBe(
      "대상이 다름(빠짐: b / 더함: -)",
    );
  });
});

describe("checkScope", () => {
  const base = (): DiagramState => ({
    groups: { biz: { id: "biz", groupKind: "network_zone", label: "업무망", parent: null } },
    nodes: {
      web: { id: "web", kind: "web_server", label: "웹 서버", parent: "biz", attrs: {} },
      was: { id: "was", kind: "was", label: "WAS", parent: "biz", attrs: { os: "Rocky 9", sw: null } },
      db: { id: "db", kind: "db_rdb", label: "DB", parent: "biz", attrs: {} },
    },
    edges: {
      "e-web-was": { id: "e-web-was", from: "web", to: "was", edgeKind: "request" },
      "e-was-db": { id: "e-was-db", from: "was", to: "db", edgeKind: "request" },
    },
    assumptions: {},
  });
  const kinds = (issues: ReturnType<typeof checkScope>) => issues.map((i) => i.kind);

  it("바뀐 것이 없으면 넘침이 없다", () => {
    expect(checkScope({}, base(), base())).toEqual([]);
  });

  it("허용하지 않은 기존 노드·연결·영역을 바꾸거나 지우면 기존 대상", () => {
    const after = base();
    after.nodes.db!.label = "회원 DB";
    delete after.edges["e-was-db"];
    after.groups.biz!.label = "내부망";
    const issues = checkScope({ touch: ["web"] }, base(), after);
    expect(kinds(issues)).toEqual(["기존 대상"]);
    expect(issues[0]!.detail).toBe("db 바뀜, e-was-db 지워짐, biz 바뀜");
  });

  it("touch 에 든 대상은 바꾸거나 지워도 된다", () => {
    const after = base();
    after.nodes.db!.label = "회원 DB";
    delete after.edges["e-was-db"];
    expect(checkScope({ touch: ["db", "e-was-db"] }, base(), after)).toEqual([]);
  });

  it("새 노드·영역은 허용 개수까지", () => {
    const after = base();
    after.nodes["was-2"] = { id: "was-2", kind: "was", label: "WAS #2", parent: "biz", attrs: {} };
    after.nodes["was-3"] = { id: "was-3", kind: "was", label: "WAS #3", parent: "biz", attrs: {} };
    after.groups.rg = { id: "rg", groupKind: "redundancy_group", label: "WAS VIP", parent: "biz" };
    expect(checkScope({ newNodes: 2, newGroups: 1 }, base(), after)).toEqual([]);
    const issues = checkScope({ newNodes: 1 }, base(), after);
    expect(kinds(issues)).toEqual(["새 노드", "새 영역"]);
    expect(issues[0]!.detail).toBe("2개(허용 1): was-2, was-3");
  });

  it("새 노드에 닿는 새 연결은 되고, 허용하지 않은 기존 노드끼리의 새 연결은 넘침", () => {
    const after = base();
    after.nodes.mq = { id: "mq", kind: "queue", label: "큐", parent: "biz", attrs: {} };
    after.edges["e-was-mq"] = { id: "e-was-mq", from: "was", to: "mq", edgeKind: "async" };
    expect(checkScope({ newNodes: 1 }, base(), after)).toEqual([]);
    after.edges["e-web-db"] = { id: "e-web-db", from: "web", to: "db", edgeKind: "request" };
    expect(kinds(checkScope({ newNodes: 1 }, base(), after))).toEqual(["새 연결"]);
    expect(checkScope({ newNodes: 1, touch: ["web"] }, base(), after)).toEqual([]);
  });

  it("말하지 않은 속성값은 넘침, 말한 key 와 기존 값을 복사한 것은 된다", () => {
    const after = base();
    after.nodes["was-2"] = { id: "was-2", kind: "was", label: "WAS #2", parent: "biz", attrs: { os: "Rocky 9", sw: "Tomcat 10", cpu: null } };
    const issues = checkScope({ newNodes: 1 }, base(), after);
    expect(kinds(issues)).toEqual(["속성값"]);
    expect(issues[0]!.detail).toBe("was-2.sw=Tomcat 10");
    expect(checkScope({ newNodes: 1, attrs: ["sw"] }, base(), after)).toEqual([]);
    expect(checkScope({ newNodes: 1, attrs: ["was-2.sw"] }, base(), after)).toEqual([]);
    expect(kinds(checkScope({ newNodes: 1, attrs: ["db.sw"] }, base(), after))).toEqual(["속성값"]);
  });

  it("touch 에 든 기존 노드에 적은 속성값도 본다", () => {
    const after = base();
    after.nodes.was!.attrs = { os: "Rocky 9", sw: "Tomcat 10" };
    expect(kinds(checkScope({ touch: ["was"] }, base(), after))).toEqual(["속성값"]);
  });

  it("그리기 규칙이 종류에 따라 적게 하는 managed 는 속성값 넘침으로 세지 않는다", () => {
    const after = base();
    after.nodes.cdn = { id: "cdn", kind: "cdn", label: "CDN", parent: null, attrs: { managed: "yes" } };
    expect(checkScope({ newNodes: 1 }, base(), after)).toEqual([]);
  });

  it("scopeNote 는 검사별로 한 줄에 모은다", () => {
    expect(scopeNote([])).toBeNull();
    expect(scopeNote([{ kind: "새 노드", detail: "2개(허용 1): a, b" }, { kind: "속성값", detail: "a.sw=X" }])).toBe("범위 넘침 — 새 노드: 2개(허용 1): a, b / 속성값: a.sw=X");
  });
});
