import { beforeEach, expect, test, vi } from "vitest";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { auth } from "@/auth";
import { listGlossaryAction, listTermsAction, setTermReviewedAction, updateTermAction } from "@/app/(app)/actions";

import { normalizeTerm } from "@/domain/explain";
import { GLOSSARY_SEED } from "@/domain/glossary-seed";

import { makeOwnedDiagram } from "./helpers";

const authMock = vi.mocked(auth) as unknown as ReturnType<typeof vi.fn>;
const as = (userId: string) => authMock.mockResolvedValue({ user: { id: userId } });

beforeEach(() => authMock.mockReset());

test("actions are per user", async () => {
  const a = (await makeOwnedDiagram()).userId;
  const b = (await makeOwnedDiagram()).userId;

  as(a);
  const aRows = await listGlossaryAction();
  expect(aRows.length).toBeGreaterThan(0);
  const target = aRows[0]!;

  const saved = await updateTermAction(target.id, { definition: "고친 정의" });
  expect(saved).toMatchObject({ ok: true, term: { id: target.id, definition: "고친 정의" } });
  const bad = await updateTermAction(target.id, { definition: "" });
  expect(bad.ok).toBe(false);
  const rev = await setTermReviewedAction(target.id, true);
  expect(rev).toMatchObject({ ok: true, term: { reviewed: true } });

  // b 는 자기 사전을 따로 받고, a 의 행은 건드릴 수 없다(404).
  as(b);
  const bRows = await listGlossaryAction();
  expect(bRows.every((r) => r.id !== target.id)).toBe(true);
  expect(bRows.find((r) => r.key === target.key)!.definition).not.toBe("고친 정의");
  await expect(updateTermAction(target.id, { definition: "x" })).rejects.toThrow();
  await expect(setTermReviewedAction(target.id, false)).rejects.toThrow();
});

test("listTermsAction carries aliases, review state, why and compare for the panel", async () => {
  const a = (await makeOwnedDiagram()).userId;
  as(a);
  const terms = await listTermsAction();
  // 필요한 이유·비교가 있는 시드 항목이 그대로 실려 온다.
  const seed = GLOSSARY_SEED.find((e) => e.why && e.compare && e.aliases.length)!;
  expect(terms.find((t) => t.key === normalizeTerm(seed.term))).toEqual({
    key: normalizeTerm(seed.term),
    term: seed.term,
    definition: seed.definition,
    aliases: seed.aliases,
    reviewed: false,
    why: seed.why,
    compare: seed.compare,
  });
  expect(terms.some((t) => t.aliases.length > 0)).toBe(true);
});
