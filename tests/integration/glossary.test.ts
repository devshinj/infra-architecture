import { randomUUID } from "node:crypto";

import { and, eq, inArray } from "drizzle-orm";
import { expect, test } from "vitest";

import { db } from "@/db/client";
import { glossaryTerms } from "@/db/schema";
import { normalizeTerm } from "@/domain/explain";
import { GLOSSARY_SEED, GLOSSARY_SEED_CORE } from "@/domain/glossary-seed";
import { GLOSSARY_SEED_EXTRA } from "@/domain/glossary-seed-extra";
import { addAiTerm, ensureSeeded, findTerm, listTerms, updateTerm } from "@/server/glossary";
import { NotFoundError, ValidationError } from "@/server/projects";

import { makeOwnedDiagram } from "./helpers";

const newUser = async () => (await makeOwnedDiagram()).userId;
const rowsOf = (userId: string) => db.select().from(glossaryTerms).where(eq(glossaryTerms.userId, userId));

test("ensureSeeded copies the whole seed once, concurrent calls don't duplicate", async () => {
  const userId = await newUser();
  await Promise.all([ensureSeeded(userId), ensureSeeded(userId), ensureSeeded(userId)]);
  const rows = await rowsOf(userId);
  expect(rows).toHaveLength(GLOSSARY_SEED.length);
  expect(rows.every((r) => r.source === "seed" && r.reviewed === false)).toBe(true);

  // 사용자가 지운 뒤에도 남은 행이 있으면 다시 넣지 않는다.
  await db.delete(glossaryTerms).where(eq(glossaryTerms.id, rows[0]!.id));
  await ensureSeeded(userId);
  expect(await rowsOf(userId)).toHaveLength(GLOSSARY_SEED.length - 1);
});

test("ensureSeeded: 1차분만 있던 계정에는 2차분만 한 번 더 넣고, 그 뒤 지운 항목은 다시 넣지 않는다", async () => {
  const userId = await newUser();
  await ensureSeeded(userId);
  // 2차분이 생기기 전의 계정을 흉내 낸다: 2차분을 모두 지우고, 1차분 하나는 사용자가 지웠고 하나는 고쳤다.
  const extraKeys = GLOSSARY_SEED_EXTRA.map((e) => normalizeTerm(e.term));
  await db.delete(glossaryTerms).where(and(eq(glossaryTerms.userId, userId), inArray(glossaryTerms.key, extraKeys)));
  const [gone, kept] = GLOSSARY_SEED_CORE;
  await db.delete(glossaryTerms).where(and(eq(glossaryTerms.userId, userId), eq(glossaryTerms.key, normalizeTerm(gone!.term))));
  const [keptRow] = await db.select().from(glossaryTerms).where(and(eq(glossaryTerms.userId, userId), eq(glossaryTerms.key, normalizeTerm(kept!.term))));
  await updateTerm(userId, keptRow!.id, { definition: "내가 고친 정의입니다.", reviewed: true });
  // 2차분의 말 하나를 AI 가 먼저 넣어 둔 경우: 그 항목은 그대로 둔다.
  const taken = GLOSSARY_SEED_EXTRA[0]!;
  await addAiTerm(userId, { term: taken.term, category: "AI 분류", definition: "AI 가 먼저 넣은 정의입니다." });

  await ensureSeeded(userId);

  const rows = await rowsOf(userId);
  expect(rows).toHaveLength(GLOSSARY_SEED.length - 1);
  expect(rows.find((r) => r.key === normalizeTerm(gone!.term))).toBeUndefined();
  expect(rows.find((r) => r.key === normalizeTerm(kept!.term))).toMatchObject({ definition: "내가 고친 정의입니다.", reviewed: true });
  expect(rows.find((r) => r.key === normalizeTerm(taken.term))).toMatchObject({ source: "ai", definition: "AI 가 먼저 넣은 정의입니다." });
  expect(rows.filter((r) => extraKeys.includes(r.key) && r.source === "seed")).toHaveLength(GLOSSARY_SEED_EXTRA.length - 1);

  // 2차분이 들어간 뒤 사용자가 지운 2차분 항목은 다시 생기지 않는다.
  const second = normalizeTerm(GLOSSARY_SEED_EXTRA[1]!.term);
  await db.delete(glossaryTerms).where(and(eq(glossaryTerms.userId, userId), eq(glossaryTerms.key, second)));
  await ensureSeeded(userId);
  expect((await rowsOf(userId)).find((r) => r.key === second)).toBeUndefined();
});

test("findTerm matches alias", async () => {
  const userId = await newUser();
  await ensureSeeded(userId);
  expect((await findTerm(userId, ["redis"]))!.term).toBe("Redis");
  expect((await findTerm(userId, ["l4"]))!.term).toBe("L4 로드밸런서");
  // 앞 key 가 없으면 다음 key, 둘 다 있으면 앞 key 가 이긴다.
  expect((await findTerm(userId, ["없는용어", "캐시"]))!.term).toBe("캐시");
  expect((await findTerm(userId, ["apachetomcat", "was"]))!.term).toBe("Tomcat");
  expect((await findTerm(userId, ["was", "apachetomcat"]))!.term).toBe("WAS");
  expect(await findTerm(userId, ["없는용어"])).toBeNull();
  expect(await findTerm(userId, [])).toBeNull();
});

test("glossary is per user", async () => {
  const a = await newUser();
  const b = await newUser();
  await ensureSeeded(a);
  await ensureSeeded(b);
  const mine = await addAiTerm(a, { term: "Varnish", category: "캐시", definition: "Varnish는 HTTP 캐시 서버입니다." });
  expect(await findTerm(b, ["varnish"])).toBeNull();
  expect((await listTerms(b, { q: "Varnish" })).length).toBe(0);
  await expect(updateTerm(b, mine.id, { reviewed: true })).rejects.toBeInstanceOf(NotFoundError);
  await expect(updateTerm(b, randomUUID(), { reviewed: true })).rejects.toBeInstanceOf(NotFoundError);
  await expect(updateTerm(b, "not-a-uuid", { reviewed: true })).rejects.toBeInstanceOf(NotFoundError);
  expect((await findTerm(a, ["varnish"]))!.reviewed).toBe(false);
});

test("addAiTerm keeps existing", async () => {
  const userId = await newUser();
  await ensureSeeded(userId);
  const added = await addAiTerm(userId, {
    term: "HAProxy 2.8",
    category: "로드밸런서",
    definition: "HAProxy는 TCP·HTTP 로드밸런서입니다.",
  });
  expect(added).toMatchObject({ key: "haproxy", source: "ai", reviewed: false, fullName: "", why: "", compare: "", aliases: [] });

  const again = await addAiTerm(userId, { term: "HAProxy", category: "x", definition: "다른 정의입니다." });
  expect(again.id).toBe(added.id);
  expect(again.definition).toBe("HAProxy는 TCP·HTTP 로드밸런서입니다.");

  // 시드 항목과 같은 key 여도 덮어쓰지 않는다.
  const redis = await addAiTerm(userId, { term: "Redis 7", category: "x", definition: "덮어쓰기 시도입니다." });
  expect(redis).toMatchObject({ term: "Redis", source: "seed" });
});

test("updateTerm validates and keeps reviewed unless set", async () => {
  const userId = await newUser();
  await ensureSeeded(userId);
  const redis = (await findTerm(userId, ["redis"]))!;

  const reviewed = await updateTerm(userId, redis.id, { reviewed: true });
  expect(reviewed.reviewed).toBe(true);

  const edited = await updateTerm(userId, redis.id, { definition: "  새 정의입니다.  ", why: "" });
  expect(edited).toMatchObject({ definition: "새 정의입니다.", why: "", reviewed: true, key: "redis" });

  const unreviewed = await updateTerm(userId, redis.id, { reviewed: false });
  expect(unreviewed.reviewed).toBe(false);

  const bad = [
    { definition: "" },
    { definition: "가".repeat(121) },
    { why: "가".repeat(121) },
    { compare: "가".repeat(121) },
    { term: "" },
    { term: "가".repeat(41) },
    { fullName: "가".repeat(81) },
    { category: "가".repeat(81) },
    { reviewed: "yes" as unknown as boolean },
  ];
  for (const patch of bad) {
    await expect(updateTerm(userId, redis.id, patch), JSON.stringify(patch)).rejects.toBeInstanceOf(ValidationError);
  }
  // 경계값은 통과한다(코드 포인트 기준).
  const edge = await updateTerm(userId, redis.id, {
    definition: "😀".repeat(120),
    term: "가".repeat(40),
    fullName: "",
    category: "가".repeat(80),
  });
  expect([...edge.definition]).toHaveLength(120);
});

test("listTerms filters", async () => {
  const userId = await newUser();
  await ensureSeeded(userId);
  const all = await listTerms(userId);
  expect(all).toHaveLength(GLOSSARY_SEED.length);
  // 대소문자 무시 코드 포인트 순: 영문 → 한글
  const terms = all.map((r) => r.term.toLowerCase());
  expect(terms).toEqual([...terms].sort((x, y) => (x < y ? -1 : x > y ? 1 : 0)));
  expect(all[0]!.term).toBe("ACL");
  expect(all.at(-1)!.term).toBe("허브-스포크");

  expect((await listTerms(userId, { q: "redis" })).map((r) => r.term)).toContain("Redis");
  // definition 부분 일치
  expect((await listTerms(userId, { q: "Remote Dictionary" })).map((r) => r.term)).toEqual(["Redis"]);
  // LIKE 특수문자는 글자 그대로 찾는다.
  expect(await listTerms(userId, { q: "%%%" })).toHaveLength(0);

  const redis = (await findTerm(userId, ["redis"]))!;
  await updateTerm(userId, redis.id, { reviewed: true });
  const unreviewed = await listTerms(userId, { unreviewedOnly: true });
  expect(unreviewed).toHaveLength(GLOSSARY_SEED.length - 1);
  expect(unreviewed.some((r) => r.id === redis.id)).toBe(false);
});
