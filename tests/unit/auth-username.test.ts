import { beforeEach, expect, test, vi } from "vitest";

// DB 없이 가입·로그인이 아이디를 어떤 값으로 찾고 저장하는지만 본다.
const calls = vi.hoisted(() => ({ eq: [] as unknown[], inserted: [] as unknown[] }));

vi.mock("drizzle-orm", () => ({
  eq: (_col: unknown, value: unknown) => {
    calls.eq.push(value);
    return { value };
  },
}));
vi.mock("@/db/schema", () => ({ users: { id: "id", username: "username", email: "email" } }));
vi.mock("@/db/client", () => {
  const chain = { from: () => chain, where: () => chain, limit: async () => [] };
  return {
    db: {
      select: () => chain,
      insert: () => ({
        values: (v: unknown) => {
          calls.inserted.push(v);
          return { returning: async () => [{ id: "u1" }] };
        },
      }),
    },
  };
});
vi.mock("bcryptjs", () => ({ default: { hash: async () => "hash", compare: async () => true } }));

import { verifyCredentials } from "@/server/auth/password";
import { signup } from "@/server/auth/signup";

beforeEach(() => {
  calls.eq.length = 0;
  calls.inserted.length = 0;
});

test("signup stores the username trimmed and lowercased", async () => {
  expect(await signup({ username: " Jae_01 ", password: "password1", email: "A@B.co" })).toEqual({ ok: true, userId: "u1" });
  expect(calls.inserted[0]).toMatchObject({ username: "jae_01", email: "a@b.co" });
});

test("login looks the username up the same way", async () => {
  await verifyCredentials("  JAE_01", "password1");
  expect(calls.eq).toEqual(["jae_01"]);
});

test("signup rejects an over-long password before touching the DB", async () => {
  expect(await signup({ username: "jae", password: "a".repeat(73), email: "a@b.co" })).toMatchObject({
    ok: false,
    field: "password",
  });
  expect(calls.eq).toEqual([]);
});
