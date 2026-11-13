import { expect, test } from "vitest";

import { computeMissing } from "@/domain/missing";
import { infoChangeText, infoCounts } from "@/domain/infoCounts";
import { emptyState, type DiagramState } from "@/domain/types";
import { mergeWarnings } from "@/domain/warnings";

const node = (id: string, kind: string) => [id, { id, kind, label: id, parent: null, attrs: {} }] as const;

const base: DiagramState = { ...emptyState(), nodes: Object.fromEntries([node("w", "web_server")]) as DiagramState["nodes"] };
const busy: DiagramState = {
  ...emptyState(),
  nodes: Object.fromEntries([node("w", "web_server"), node("c", "cache")]) as DiagramState["nodes"],
  assumptions: {
    environment: { key: "environment", value: "AWS", confirmed: false },
    scale: { key: "scale", value: "소규모", confirmed: true },
  } as DiagramState["assumptions"],
};

test("infoCounts 는 구성 정보 카드의 세 숫자와 같다", () => {
  expect(infoCounts(busy)).toEqual({
    missing: computeMissing(busy).count,
    warnings: mergeWarnings(busy).active.length,
    unconfirmed: 1,
  });
});

test("infoChangeText: 바뀐 숫자만 카드 순서로, 하나도 안 바뀌면 그대로라고 한다", () => {
  const a = infoCounts(busy);
  const b = infoCounts(base);
  const text = infoChangeText(a, b);
  expect(text).toContain(`주의 ${a.warnings} → ${b.warnings}`);
  expect(text).toContain("미확정 가정 1 → 0");
  expect(text.indexOf("주의")).toBeLessThan(text.indexOf("미확정 가정"));
  if (a.missing === b.missing) expect(text).not.toContain("채워야 할 정보");
  expect(infoChangeText({ missing: 55, warnings: 12, unconfirmed: 7 }, { missing: 53, warnings: 12, unconfirmed: 6 })).toBe(
    "채워야 할 정보 55 → 53 · 미확정 가정 7 → 6",
  );
  expect(infoChangeText(a, a)).toBe("구성 정보 숫자는 그대로예요");
});
