import { describe, expect, test } from "vitest";

import { createSkipTally, skipKey } from "@/server/chat/skips";

describe("skipKey", () => {
  test("apply errors drop the id so the same cause groups together", () => {
    expect(skipKey("apply", "add_edge", "endpoint client-web not found")).toBe("apply add_edge endpoint … not found");
    expect(skipKey("apply", "add_node", "parent pair-was not found")).toBe("apply add_node parent … not found");
    expect(skipKey("apply", "add_group", "id was already exists")).toBe("apply add_group id … already exists");
  });
  test("other kinds keep op and detail; long keys are capped", () => {
    expect(skipKey("invalid", "add_node", "sub: Invalid input: expected string, received null")).toBe(
      "invalid add_node sub: Invalid input: expected string, received null",
    );
    expect(skipKey("unknown_op", "warn")).toBe("unknown_op warn");
    expect(skipKey("bad_json")).toBe("bad_json");
    expect(skipKey("invalid", "add_node", "x".repeat(300)).length).toBeLessThanOrEqual(100);
  });
});

describe("createSkipTally", () => {
  test("counts by key, keeps up to 3 truncated samples", () => {
    const t = createSkipTally();
    expect(t.total()).toBe(0);
    expect(t.counts()).toEqual({});
    t.add("a", "line-1");
    t.add("b", "x".repeat(500));
    t.add("a", "line-3");
    t.add("a", "line-4");
    t.add("c");
    expect(t.counts()).toEqual({ a: 3, b: 1, c: 1 });
    expect(t.total()).toBe(5);
    const samples = t.samples();
    expect(samples).toHaveLength(3);
    expect(samples[0]).toBe("line-1");
    expect(samples[1]!.length).toBeLessThanOrEqual(120);
    expect(samples[2]).toBe("line-3");
  });
  test("counts() returns a copy", () => {
    const t = createSkipTally();
    t.add("a");
    t.counts().a = 99;
    expect(t.counts()).toEqual({ a: 1 });
  });
});
