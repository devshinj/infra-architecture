import { expect, test } from "vitest";

import { ASSUMPTION_CHOICES, ASSUMPTION_LABELS, confirmAssumption } from "@/domain/assumptions";
import { emptyState } from "@/domain/types";

test("confirmAssumption sets confirmed and does not mutate input", () => {
  const s = { ...emptyState(), assumptions: { scale: { key: "scale", value: "중규모(일 1만 명)", confirmed: false } } };
  const snapshot = JSON.stringify(s);
  const out = confirmAssumption(s, "scale", "대규모(일 10만 명 이상)");
  expect(out.assumptions.scale).toEqual({ key: "scale", value: "대규모(일 10만 명 이상)", confirmed: true });
  expect(JSON.stringify(s)).toBe(snapshot);
  expect(confirmAssumption(s, "custom", "x").assumptions.custom).toEqual({ key: "custom", value: "x", confirmed: true });
});

test("choices exist for every label key", () => {
  for (const k of Object.keys(ASSUMPTION_LABELS)) expect(ASSUMPTION_CHOICES[k]?.length).toBeGreaterThan(0);
});
