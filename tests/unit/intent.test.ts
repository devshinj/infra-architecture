import { describe, expect, test, vi } from "vitest";

import { assumptionChangeMessage } from "@/domain/assumptions";
import { resolveIntent } from "@/server/chat/intent";

describe("resolveIntent", () => {
  test("assumption-change messages are structure_change without asking Clef", async () => {
    const classify = vi.fn(async () => ({ intent: "layout" as const, confidence: 0.99 }));
    expect(await resolveIntent(assumptionChangeMessage("environment", "사내 IDC"), classify)).toBe("structure_change");
    expect(await resolveIntent(assumptionChangeMessage("scale", "대규모(일 10만 명 이상)"), classify)).toBe(
      "structure_change",
    );
    expect(classify).not.toHaveBeenCalled();
  });

  test("other messages use Clef with the confidence floor", async () => {
    expect(await resolveIntent("정리", async () => ({ intent: "layout", confidence: 0.8 }))).toBe("layout");
    expect(await resolveIntent("정리", async () => ({ intent: "layout", confidence: 0.5 }))).toBeNull();
    expect(await resolveIntent("정리", async () => null)).toBeNull();
  });
});
