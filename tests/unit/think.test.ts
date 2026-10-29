import { describe, expect, test } from "vitest";

import { COMMAND_OPS } from "@/domain/commands";
import { createThinkStripper } from "@/server/llm/think";

function run(chunks: string[]): string[] {
  const out: string[] = [];
  const s = createThinkStripper((t) => out.push(t));
  for (const c of chunks) s.push(c);
  s.end();
  return out;
}

describe("createThinkStripper", () => {
  test("removes think blocks split across chunks", () => {
    const out = run(["안녕", "<th", "ink>속마음", "</thi", "nk>하세요", "<", "t"]);
    expect(out.join("")).toBe("안녕하세요<t");
    expect(out.every((t) => t.length > 0)).toBe(true);
  });

  test("drops an unclosed think block at end", () => {
    expect(run(["a<think>b", "c"]).join("")).toBe("a");
  });

  test("passes plain text through as it arrives", () => {
    expect(run(["ab", "cd"])).toEqual(["ab", "cd"]);
  });
});

test("COMMAND_OPS lists every schema op", () => {
  expect([...COMMAND_OPS].sort()).toEqual(
    ["add_edge", "add_group", "add_node", "remove_edge", "remove_node", "set_assumption", "update_edge", "update_node"],
  );
});
