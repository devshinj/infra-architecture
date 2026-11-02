import { describe, expect, test } from "vitest";

import { createJsonlParser } from "@/server/llm/jsonl";

function run(chunks: string[]) {
  const values: unknown[] = [];
  const bad: string[] = [];
  const p = createJsonlParser((v) => values.push(v), (t) => bad.push(t));
  for (const c of chunks) p.push(c);
  p.end();
  return { values, bad };
}

describe("createJsonlParser", () => {
  test("splits across chunk boundaries", () => {
    const { values, bad } = run(['{"op":"say","te', 'xt":"a"}\n{"op"', ':"say","text":"b"}']);
    expect(values).toEqual([
      { op: "say", text: "a" },
      { op: "say", text: "b" },
    ]);
    expect(bad).toEqual([]);
  });

  test("think block spanning chunks is removed", () => {
    const { values, bad } = run(["<thi", "nk>x\ny</th", 'ink>{"op":"say","text":"a"}\n']);
    expect(values).toEqual([{ op: "say", text: "a" }]);
    expect(bad).toEqual([]);
  });

  test("think block in one chunk, text before it kept", () => {
    const { values, bad } = run(['{"a":1}<think>zzz</think>\n{"b":2}\n']);
    expect(values).toEqual([{ a: 1 }, { b: 2 }]);
    expect(bad).toEqual([]);
  });

  test("unclosed think discards the rest but keeps text before it", () => {
    const { values, bad } = run(['{"a":1}\n{"b":2}<think>{"c":3}\n{"d":4}']);
    expect(values).toEqual([{ a: 1 }, { b: 2 }]);
    expect(bad).toEqual([]);
  });

  test("lone '<' is not swallowed", () => {
    const { values, bad } = run(['{"a":"x<y"}', "\n"]);
    expect(values).toEqual([{ a: "x<y" }]);
    expect(bad).toEqual([]);
  });

  test("code fences are ignored", () => {
    const { values, bad } = run(['```jsonl\n{"a":1}\n```\n']);
    expect(values).toEqual([{ a: 1 }]);
    expect(bad).toEqual([]);
    expect(run(['```\n{"a":1}\n  ```  \n']).values).toEqual([{ a: 1 }]);
  });

  test("blank lines and CRLF", () => {
    const { values, bad } = run(['\n\n{"a":1}\r\n\r\n{"b":2}\r\n']);
    expect(values).toEqual([{ a: 1 }, { b: 2 }]);
    expect(bad).toEqual([]);
  });

  test("bad line reported with first 160 chars", () => {
    const long = "x".repeat(300);
    const { values, bad } = run([long + "\n"]);
    expect(values).toEqual([]);
    expect(bad).toEqual(["x".repeat(160)]);
  });

  test("end() processes the remaining buffer; push after end is ignored", () => {
    const values: unknown[] = [];
    const p = createJsonlParser((v) => values.push(v), () => {});
    p.push('{"a":1}');
    expect(values).toEqual([]);
    p.end();
    expect(values).toEqual([{ a: 1 }]);
    p.push('{"b":2}\n');
    p.end();
    expect(values).toEqual([{ a: 1 }]);
  });

  test("object spread over several lines is parsed as one command", () => {
    const text = '{\n  "op": "update_node",\n  "id": "was-1",\n  "attrs": {\n    "memo": "a } b { c \\" }"\n  }\n}\n';
    const { values, bad } = run([text]);
    expect(values).toEqual([{ op: "update_node", id: "was-1", attrs: { memo: 'a } b { c " }' } }]);
    expect(bad).toEqual([]);
  });

  test("two pretty objects in a row give two commands, even across chunks", () => {
    const { values, bad } = run(['{\n  "op": "a"\n}\n{\n  "op"', ': "b"\n}\n']);
    expect(values).toEqual([{ op: "a" }, { op: "b" }]);
    expect(bad).toEqual([]);
  });

  test("single-line objects around a multi-line one still work", () => {
    const { values, bad } = run(['{"op":"x"}\n{\n"op":"y"\n}\n{"op":"z"}']);
    expect(values).toEqual([{ op: "x" }, { op: "y" }, { op: "z" }]);
    expect(bad).toEqual([]);
  });

  test("unbalanced object is one bad line at the end", () => {
    const { values, bad } = run(['{\n  "op": "a",\n  "id": 1\n']);
    expect(values).toEqual([]);
    expect(bad).toHaveLength(1);
  });

  test("an unclosed object followed by a new command loses only the broken one", () => {
    const { values, bad } = run(['{"op":"a",\n{"op":"b"}\n']);
    expect(values).toEqual([{ op: "b" }]);
    expect(bad).toHaveLength(1);
  });

  test("a runaway object is reported once after the line cap", () => {
    const { values, bad } = run(["{\n" + '"k": 1,\n'.repeat(300)]);
    expect(values).toEqual([]);
    expect(bad.length).toBeGreaterThanOrEqual(1);
    expect(bad.length).toBeLessThan(5);
  });

  test("a broken line does not swallow the valid lines after it", () => {
    const good = Array.from({ length: 30 }, (_, i) => `{"op":"say","text":"${i}"}`).join("\n") + "\n";
    for (const broken of ['{"op":"update_node","id":"x","attrs":{"ip":"1"', '{"op":"say","text":"abc}']) {
      const { values, bad } = run([broken + "\n" + good]);
      expect(values).toHaveLength(30);
      expect(bad).toHaveLength(1);
    }
  });

  test("brace on the next line stays one object", () => {
    const { values, bad } = run(['{\n  "op": "update_node",\n  "id": "x",\n  "attrs":\n  {\n    "ip": "1"\n  }\n}\n']);
    expect(values).toEqual([{ op: "update_node", id: "x", attrs: { ip: "1" } }]);
    expect(bad).toEqual([]);
  });
});
