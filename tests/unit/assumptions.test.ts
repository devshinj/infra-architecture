import { expect, test } from "vitest";

import { ASSUMPTION_CHOICES, ASSUMPTION_LABELS, assumptionChangeMessage, confirmAssumption } from "@/domain/assumptions";
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

test("assumption change message: structural keys ask to remove and move", () => {
  expect(assumptionChangeMessage("environment", "사내 IDC")).toBe(
    "가정 변경: 환경 → 사내 IDC. 이 가정에 맞지 않는 영역·노드는 지우고, 계속 쓰는 노드는 새 영역으로 옮겨 구성을 다시 맞춰 줘.",
  );
  expect(assumptionChangeMessage("deploy", "Kubernetes")).toBe(
    "가정 변경: 배포 방식 → Kubernetes. 이 가정에 맞지 않는 영역·노드는 지우고, 계속 쓰는 노드는 새 영역으로 옮겨 구성을 다시 맞춰 줘.",
  );
  expect(assumptionChangeMessage("scale", "대규모(일 10만 명 이상)")).toBe(
    "가정 변경: 규모 → 대규모(일 10만 명 이상). 이 가정에 맞게 구성을 조정해 줘.",
  );
  expect(assumptionChangeMessage("custom", "x")).toBe("가정 변경: custom → x. 이 가정에 맞게 구성을 조정해 줘.");
});
