import { randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";
import { expect, test } from "vitest";

import { db } from "@/db/client";
import { diagrams, networkRules, networkTypes, projects } from "@/db/schema";
import { pairKey } from "@/domain/network";
import { NETWORK_TYPE_SEED } from "@/domain/network-seed";
import type { DiagramState } from "@/domain/types";
import {
  addNetworkType,
  countZonesUsingType,
  deleteNetworkRule,
  deleteNetworkType,
  ensureNetworkSeeded,
  getNetworkKnowledge,
  listNetworkRules,
  listNetworkTypes,
  resetNetworkType,
  setNetworkTypeHidden,
  updateNetworkType,
  upsertNetworkRule,
} from "@/server/network";
import { NotFoundError, ValidationError } from "@/server/projects";
import { createVersion } from "@/server/versions";

import { makeOwnedDiagram } from "./helpers";

const newUser = async () => (await makeOwnedDiagram()).userId;
const rowsOf = (userId: string) => db.select().from(networkTypes).where(eq(networkTypes.userId, userId));
const seedRow = async (userId: string, key: string) => (await listNetworkTypes(userId)).find((t) => t.key === key)!;

test("ensureNetworkSeeded: 두 번 불러도 한 벌, 숨긴 seed 는 다시 보이지 않는다", async () => {
  const userId = await newUser();
  await Promise.all([ensureNetworkSeeded(userId), ensureNetworkSeeded(userId)]);
  expect(await rowsOf(userId)).toHaveLength(NETWORK_TYPE_SEED.length);

  const t = await seedRow(userId, NETWORK_TYPE_SEED[0]!.key);
  await setNetworkTypeHidden(userId, t.id, true);
  await ensureNetworkSeeded(userId);
  expect(await rowsOf(userId)).toHaveLength(NETWORK_TYPE_SEED.length);
  expect((await seedRow(userId, t.key)).hidden).toBe(true);
});

test("getNetworkKnowledge: 숨긴 종류 제외, 규칙 포함", async () => {
  const userId = await newUser();
  await ensureNetworkSeeded(userId);
  const [k1, k2, k3] = NETWORK_TYPE_SEED.map((t) => t.key);
  await upsertNetworkRule(userId, { a: k1!, b: k2!, method: "network_link", note: "" });
  await upsertNetworkRule(userId, { a: k1!, b: k3!, method: "firewall", note: "내부 지침" });
  await setNetworkTypeHidden(userId, (await seedRow(userId, k3!)).id, true);

  const k = await getNetworkKnowledge(userId);
  expect(k.types[k3!]).toBeUndefined();
  expect(Object.keys(k.types)).toHaveLength(NETWORK_TYPE_SEED.length - 1);
  const [a, b] = pairKey(k1!, k2!);
  expect(k.rules).toEqual([{ a, b, method: "network_link" }]);
  expect("note" in k.rules[0]!).toBe(false);
});

test("updateNetworkType: seed 를 고치면 edited, reset 하면 seed 값으로", async () => {
  const userId = await newUser();
  await ensureNetworkSeeded(userId);
  const seed = NETWORK_TYPE_SEED[0]!;
  const t = await seedRow(userId, seed.key);
  const u = await updateNetworkType(userId, t.id, { name: "바뀐 이름", aliases: ["가", "나"], grade: "closed" });
  expect(u).toMatchObject({ name: "바뀐 이름", aliases: ["가", "나"], grade: "closed", edited: true });
  const r = await resetNetworkType(userId, t.id);
  expect(r).toMatchObject({
    name: seed.name,
    aliases: seed.aliases,
    grade: seed.grade,
    description: seed.description,
    edited: false,
  });

  await expect(updateNetworkType(userId, t.id, { name: "" })).rejects.toBeInstanceOf(ValidationError);
  await expect(updateNetworkType(userId, t.id, { name: "가".repeat(31) })).rejects.toBeInstanceOf(ValidationError);
  await expect(
    updateNetworkType(userId, t.id, { aliases: Array.from({ length: 11 }, (_, i) => `a${i}`) }),
  ).rejects.toBeInstanceOf(ValidationError);
  await expect(updateNetworkType(userId, t.id, { description: "가".repeat(201) })).rejects.toBeInstanceOf(ValidationError);
});

test("addNetworkType: key 는 뒤에 무작위 글자를 붙인다(한글 이름은 net-…, 영문은 slug-…)", async () => {
  const userId = await newUser();
  const a = await addNetworkType(userId, { name: "우리 망", aliases: [], description: "", grade: "internal" });
  const b = await addNetworkType(userId, { name: "또 다른 망", aliases: [], description: "", grade: "external" });
  expect(a.key).toMatch(/^net-[0-9a-z]{8}$/);
  expect(b.key).toMatch(/^net-[0-9a-z]{8}$/);
  expect(a.key).not.toBe(b.key);
  expect(a.source).toBe("user");
  const c = await addNetworkType(userId, { name: "Lab Net", aliases: [], description: "", grade: "internal" });
  const d = await addNetworkType(userId, { name: "lab net", aliases: [], description: "", grade: "internal" });
  expect(c.key).toMatch(/^lab-net-[0-9a-z]{8}$/);
  expect(d.key).toMatch(/^lab-net-[0-9a-z]{8}$/);
  expect(c.key).not.toBe(d.key);
  // 긴 영문 이름도 key 규칙(64자)을 지킨다.
  const e = await addNetworkType(userId, { name: "a".repeat(30), aliases: [], description: "", grade: "internal" });
  expect(e.key).toMatch(/^[a-z0-9][a-z0-9-]{0,63}$/);
});

test("addNetworkType: 지운 종류의 key 를 새 종류에 다시 주지 않는다", async () => {
  const userId = await newUser();
  const a = await addNetworkType(userId, { name: "우리기관 업무망", aliases: [], description: "", grade: "internal" });
  await deleteNetworkType(userId, a.id);
  const b = await addNetworkType(userId, { name: "협력사 외부망", aliases: [], description: "", grade: "external" });
  expect(b.key).not.toBe(a.key);
  const c = await addNetworkType(userId, { name: "Cloud X", aliases: [], description: "", grade: "external" });
  await deleteNetworkType(userId, c.id);
  const d = await addNetworkType(userId, { name: "Cloud-X", aliases: [], description: "", grade: "external" });
  expect(d.key).not.toBe(c.key);
  // 지운 key 는 지식에 없다(그 key 를 가진 망은 종류 없음으로 본다).
  expect((await getNetworkKnowledge(userId)).types[a.key]).toBeUndefined();
});

test("addNetworkType: 같은 계열 이름을 50개 넘게 만들어도 막지 않는다", async () => {
  const userId = await newUser();
  const keys = new Set<string>();
  for (let i = 0; i < 52; i++) {
    keys.add((await addNetworkType(userId, { name: "우리 망", aliases: [], description: "", grade: "internal" })).key);
  }
  expect(keys.size).toBe(52);
});

test("deleteNetworkType: seed 는 거절, user 는 지우고 그 규칙도 지운다", async () => {
  const userId = await newUser();
  await ensureNetworkSeeded(userId);
  const seed = await seedRow(userId, NETWORK_TYPE_SEED[0]!.key);
  await expect(deleteNetworkType(userId, seed.id)).rejects.toBeInstanceOf(ValidationError);

  const mine = await addNetworkType(userId, { name: "내 망", aliases: [], description: "", grade: "internal" });
  await upsertNetworkRule(userId, { a: seed.key, b: mine.key, method: "firewall" });
  expect(await listNetworkRules(userId)).toHaveLength(1);
  await deleteNetworkType(userId, mine.id);
  expect(await listNetworkRules(userId)).toHaveLength(0);
  expect((await listNetworkTypes(userId)).some((t) => t.id === mine.id)).toBe(false);
});

test("upsertNetworkRule: a,b 순서와 상관없이 한 행, 검사", async () => {
  const userId = await newUser();
  await ensureNetworkSeeded(userId);
  const [k1, k2] = NETWORK_TYPE_SEED.map((t) => t.key);
  await upsertNetworkRule(userId, { a: k1!, b: k2!, method: "firewall" });
  await upsertNetworkRule(userId, { a: k2!, b: k1!, method: "none", note: "근거" });
  const rules = await listNetworkRules(userId);
  expect(rules).toHaveLength(1);
  expect(rules[0]).toMatchObject({ method: "none", note: "근거" });
  expect(rules[0]!.a <= rules[0]!.b).toBe(true);

  await expect(upsertNetworkRule(userId, { a: k1!, b: k1!, method: "firewall" })).rejects.toBeInstanceOf(ValidationError);
  await expect(upsertNetworkRule(userId, { a: k1!, b: "nope", method: "firewall" })).rejects.toBeInstanceOf(ValidationError);
  await expect(upsertNetworkRule(userId, { a: k1!, b: k2!, method: "x" as never })).rejects.toBeInstanceOf(ValidationError);
  await expect(
    upsertNetworkRule(userId, { a: k1!, b: k2!, method: "firewall", note: "가".repeat(101) }),
  ).rejects.toBeInstanceOf(ValidationError);

  await deleteNetworkRule(userId, rules[0]!.id);
  expect(await db.select().from(networkRules).where(eq(networkRules.userId, userId))).toHaveLength(0);
});

test("다른 계정 행은 NotFoundError", async () => {
  const owner = await newUser();
  const other = await newUser();
  await ensureNetworkSeeded(owner);
  const [k1, k2] = NETWORK_TYPE_SEED.map((t) => t.key);
  const t = await seedRow(owner, k1!);
  await upsertNetworkRule(owner, { a: k1!, b: k2!, method: "firewall" });
  const [rule] = await listNetworkRules(owner);

  await expect(updateNetworkType(other, t.id, { name: "x" })).rejects.toBeInstanceOf(NotFoundError);
  await expect(resetNetworkType(other, t.id)).rejects.toBeInstanceOf(NotFoundError);
  await expect(setNetworkTypeHidden(other, t.id, true)).rejects.toBeInstanceOf(NotFoundError);
  await expect(deleteNetworkType(other, t.id)).rejects.toBeInstanceOf(NotFoundError);
  await expect(deleteNetworkRule(other, rule!.id)).rejects.toBeInstanceOf(NotFoundError);
  await expect(deleteNetworkRule(other, "not-a-uuid")).rejects.toBeInstanceOf(NotFoundError);
  await expect(deleteNetworkRule(other, randomUUID())).rejects.toBeInstanceOf(NotFoundError);
});

const stateWith = (...keys: (string | null)[]): DiagramState =>
  ({
    nodes: {},
    edges: {},
    assumptions: {},
    groups: Object.fromEntries(
      keys.map((k, i) => [
        `z${i}`,
        {
          id: `z${i}`,
          groupKind: "network_zone",
          label: `z${i}`,
          parent: null,
          ...(k ? { netType: { key: k, source: "user", confirmed: true } } : {}),
        },
      ]),
    ),
  }) as unknown as DiagramState;

test("countZonesUsingType: 두 프로젝트 구성도의 망을 센다 (최신 버전만, 남의 것 제외)", async () => {
  const a = await makeOwnedDiagram();
  const b = await makeOwnedDiagram();
  const [p2] = await db.insert(projects).values({ ownerId: a.userId, name: "p2" }).returning({ id: projects.id });
  const [d2] = await db.insert(diagrams).values({ projectId: p2!.id, name: "d2" }).returning({ id: diagrams.id });

  await createVersion(a.diagramId, stateWith("admin-net", "admin-net"), { source: "ai" });
  await createVersion(a.diagramId, stateWith("admin-net", null), { source: "ai" }); // 최신
  await createVersion(d2!.id, stateWith("admin-net", "dmz"), { source: "ai" });
  await createVersion(b.diagramId, stateWith("admin-net"), { source: "ai" });

  expect(await countZonesUsingType(a.userId, "admin-net")).toBe(2);
  expect(await countZonesUsingType(a.userId, "dmz")).toBe(1);
  expect(await countZonesUsingType(a.userId, "none")).toBe(0);
  expect(await countZonesUsingType(b.userId, "admin-net")).toBe(1);
});
