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
});
