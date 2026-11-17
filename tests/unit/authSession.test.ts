import { describe, expect, test } from "vitest";

import { keepIfCurrent } from "@/server/auth/session";

describe("keepIfCurrent", () => {
  const lookup = (v: number | null) => async () => v;

  test("같은 세션 번호면 토큰을 그대로 둔다", async () => {
    const token = { sub: "u1", sv: 2 };
    expect(await keepIfCurrent(token, lookup(2))).toBe(token);
  });

  test("번호가 올랐거나 계정이 없으면 끊는다", async () => {
    expect(await keepIfCurrent({ sub: "u1", sv: 1 }, lookup(2))).toBeNull();
    expect(await keepIfCurrent({ sub: "u1", sv: 0 }, lookup(null))).toBeNull();
  });

  test("sv 가 없는 옛 토큰은 0 으로 본다", async () => {
    expect(await keepIfCurrent({ sub: "u1" }, lookup(0))).not.toBeNull();
    expect(await keepIfCurrent({ sub: "u1" }, lookup(1))).toBeNull();
  });

  test("로그인 정보가 없는 토큰은 묻지 않는다", async () => {
    let asked = false;
    await keepIfCurrent({}, async () => ((asked = true), 0));
    expect(asked).toBe(false);
  });
});
