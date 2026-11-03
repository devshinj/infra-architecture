import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, test } from "vitest";

import { createJsonlParser } from "@/server/llm/jsonl";

function run(chunks: string[], opts?: { dropPartial?: boolean }) {
  const values: unknown[] = [];
  const bad: string[] = [];
  const p = createJsonlParser((v) => values.push(v), (t) => bad.push(t));
  for (const c of chunks) p.push(c);
  p.end(opts);
  return { values, bad };
}

// 실제 Qwen 출력(스트레스 시험에서 저장, 앞뒤를 잘라 둠).
const raw = (name: string) => readFileSync(join(__dirname, "../fixtures/qwen-raw", name), "utf8");
/** 글을 작은 조각으로 나눠 스트리밍처럼 넣는다. */
const pieces = (text: string, size = 7) => Array.from({ length: Math.ceil(text.length / size) }, (_, i) => text.slice(i * size, (i + 1) * size));
const ops = (values: unknown[]) => values.map((v) => (v as { op?: string }).op);

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

  test("real sample: a pretty-printed say alone is one command", () => {
    const { values, bad } = run(pieces(raw("say-only-pretty.jsonl")));
    expect(ops(values)).toEqual(["say"]);
    expect(bad).toEqual([]);
  });

  test("real sample: pretty-printed bulk edit objects all parse, even in small chunks", () => {
    const { values, bad } = run(pieces(raw("bulk-pretty.jsonl"), 5));
    expect(ops(values)).toEqual(["say", "set_assumption", "add_node", "add_node", "add_node"]);
    expect((values[2] as { attrs: { storage: string } }).attrs.storage).toBe("500GB");
    expect(bad).toEqual([]);
    const mixed = run(pieces(raw("mixed-head.jsonl"), 11));
    expect(mixed.values.length).toBeGreaterThanOrEqual(5);
    expect(mixed.bad).toEqual([]);
  });

  test("real sample: a length-truncated tail is dropped silently with dropPartial, reported without", () => {
    const text = raw("length-tail.jsonl");
    const dropped = run(pieces(text), { dropPartial: true });
    expect(ops(dropped.values)).toEqual(["add_node", "add_node", "add_node", "add_node", "add_group"]);
    expect(dropped.bad).toEqual([]);
    const kept = run(pieces(text));
    expect(kept.values).toHaveLength(5);
    expect(kept.bad).toHaveLength(1);
  });

  test("a truncated pretty object spanning lines is dropped with dropPartial", () => {
    const { values, bad } = run(['{"op":"a"}\n{\n  "op": "b",\n  "attrs": {\n'], { dropPartial: true });
    expect(values).toEqual([{ op: "a" }]);
    expect(bad).toEqual([]);
  });

  test("pretty objects inside a ```json fence", () => {
    const { values, bad } = run(['```json\n{\n  "op": "a"\n}\n{\n  "op": "b"\n}\n```\n']);
    expect(values).toEqual([{ op: "a" }, { op: "b" }]);
    expect(bad).toEqual([]);
  });

  test("a fence line while collecting reports the broken object and goes on", () => {
    const { values, bad } = run(['{\n  "op": "a",\n```\n{"op":"b"}\n']);
    expect(values).toEqual([{ op: "b" }]);
    expect(bad).toHaveLength(1);
  });

  test("braces, quotes and escapes inside strings do not end the object", () => {
    const text = '{\n "op": "say",\n "text": "a {b} }} \\"{\\" \\\\"\n}\n';
    const { values, bad } = run([text]);
    expect(values).toEqual([{ op: "say", text: 'a {b} }} "{" ' + "\\" }]);
    expect(bad).toEqual([]);
  });

  test("array wrappers and commas between objects are ignored", () => {
    const pretty = run(['[\n  {\n    "op": "a"\n  },\n  {\n    "op": "b"\n  }\n]\n']);
    expect(pretty.values).toEqual([{ op: "a" }, { op: "b" }]);
    expect(pretty.bad).toEqual([]);
    const oneLine = run(['[{"op":"a"},{"op":"b"}]\n{"op":"c"},\n']);
    expect(oneLine.values).toEqual([{ op: "a" }, { op: "b" }, { op: "c" }]);
    expect(oneLine.bad).toEqual([]);
  });

  test("several objects on one line give several commands", () => {
    const { values, bad } = run(['{"op":"a"}{"op":"b"} {"op":"c"}\n']);
    expect(values).toEqual([{ op: "a" }, { op: "b" }, { op: "c" }]);
    expect(bad).toEqual([]);
  });

  test("prose outside objects is still a bad line", () => {
    const { values, bad } = run(['설명입니다\n{"op":"a"}\n']);
    expect(values).toEqual([{ op: "a" }]);
    expect(bad).toEqual(["설명입니다"]);
  });
});
