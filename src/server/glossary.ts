import { and, asc, eq, ilike, or, sql } from "drizzle-orm";

import { db } from "@/db/client";
import { glossaryTerms } from "@/db/schema";
import { normalizeTerm, pickTerm } from "@/domain/explain";
import { GLOSSARY_SEED } from "@/domain/glossary-seed";
import { NotFoundError, ValidationError } from "@/server/projects";

export type GlossaryRow = typeof glossaryTerms.$inferSelect;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** 그 사용자 사전이 비어 있으면 시드 50개를 미검수로 복사한다. 동시에 불려도 unique(userId,key) 로 한 벌만 남는다. */
export async function ensureSeeded(userId: string): Promise<void> {
  const [{ n }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(glossaryTerms)
    .where(eq(glossaryTerms.userId, userId));
  if (n > 0) return;
  await db
    .insert(glossaryTerms)
    .values(
      GLOSSARY_SEED.map((e) => ({
        userId,
        key: normalizeTerm(e.term),
        term: e.term,
        fullName: e.fullName,
        category: e.category,
        definition: e.definition,
        why: e.why,
        compare: e.compare,
        aliases: e.aliases,
        source: "seed" as const,
        reviewed: false,
      })),
    )
    .onConflictDoNothing({ target: [glossaryTerms.userId, glossaryTerms.key] });
}

/** keys 순서대로 key 또는 aliases 가 맞는 첫 항목. 앞 key 의 항목이 뒤 key 의 항목보다 먼저다. */
export async function findTerm(userId: string, keys: string[]): Promise<GlossaryRow | null> {
  const wanted = [...new Set(keys.map(normalizeTerm).filter(Boolean))];
  if (!wanted.length) return null;
  const arr = sql`array[${sql.join(
    wanted.map((k) => sql`${k}`),
    sql`, `,
  )}]::text[]`;
  const rows = await db
    .select()
    .from(glossaryTerms)
    .where(
      and(
        eq(glossaryTerms.userId, userId),
        or(sql`${glossaryTerms.key} = any(${arr})`, sql`jsonb_exists_any(${glossaryTerms.aliases}, ${arr})`),
      ),
    );
  return pickTerm(rows, wanted);
}

const escapeLike = (s: string) => s.replace(/[\\%_]/g, (c) => `\\${c}`);

/**
 * 용어 사전 목록. q 는 term·fullName·definition 부분 일치(대소문자 무시).
 * 정렬은 대소문자를 무시한 term 의 코드 포인트 순이다(DB 로캘과 상관없이 영문 → 한글).
 */
export async function listTerms(
  userId: string,
  opts: { q?: string; unreviewedOnly?: boolean } = {},
): Promise<GlossaryRow[]> {
  const q = opts.q?.trim();
  const pattern = q ? `%${escapeLike(q)}%` : null;
  return db
    .select()
    .from(glossaryTerms)
    .where(
      and(
        eq(glossaryTerms.userId, userId),
        pattern
          ? or(
              ilike(glossaryTerms.term, pattern),
              ilike(glossaryTerms.fullName, pattern),
              ilike(glossaryTerms.definition, pattern),
            )
          : undefined,
        opts.unreviewedOnly ? eq(glossaryTerms.reviewed, false) : undefined,
      ),
    )
    .orderBy(sql`lower(${glossaryTerms.term}) collate "C"`, asc(glossaryTerms.term), asc(glossaryTerms.id));
}

export interface AiTermInput {
  term: string;
  fullName?: string;
  category: string;
  definition: string;
  why?: string;
  compare?: string;
}

/** AI 가 만든 정의를 미검수로 사전에 넣는다. 같은 key 가 이미 있으면 그 항목을 그대로 돌려준다(덮어쓰지 않음). */
export async function addAiTerm(userId: string, entry: AiTermInput): Promise<GlossaryRow> {
  const term = entry.term.trim();
  const key = normalizeTerm(term);
  if (!key) throw new ValidationError("용어가 비어 있어요");
  const [inserted] = await db
    .insert(glossaryTerms)
    .values({
      userId,
      key,
      term,
      fullName: entry.fullName?.trim() ?? "",
      category: entry.category.trim(),
      definition: entry.definition.trim(),
      why: entry.why?.trim() ?? "",
      compare: entry.compare?.trim() ?? "",
      aliases: [],
      source: "ai",
      reviewed: false,
    })
    .onConflictDoNothing({ target: [glossaryTerms.userId, glossaryTerms.key] })
    .returning();
  if (inserted) return inserted;
  const [existing] = await db
    .select()
    .from(glossaryTerms)
    .where(and(eq(glossaryTerms.userId, userId), eq(glossaryTerms.key, key)));
  return existing!;
}

export interface TermPatch {
  term?: string;
  fullName?: string;
  category?: string;
  definition?: string;
  why?: string;
  compare?: string;
  reviewed?: boolean;
}

// [최소, 최대, 이름] — 글자 수는 코드 포인트 기준.
const TEXT_LIMITS = {
  term: [1, 40, "용어"],
  fullName: [0, 80, "정식 명칭"],
  category: [0, 80, "분류"],
  definition: [1, 120, "정의"],
  why: [0, 120, "필요한 이유"],
  compare: [0, 120, "비교"],
} as const satisfies Record<string, readonly [number, number, string]>;

type TextField = keyof typeof TEXT_LIMITS;

/**
 * 사전 항목을 고친다. 내용을 고쳐도 검수 상태는 그대로이고, 검수는 reviewed 로만 바꾼다.
 * key 는 노드와 잇는 정규화 키라 바뀌지 않는다. 남의 것·없는 것·잘못된 id 는 NotFoundError.
 */
export async function updateTerm(userId: string, id: string, patch: TermPatch): Promise<GlossaryRow> {
  if (!UUID_RE.test(id)) throw new NotFoundError();
  const set: Partial<Record<TextField, string>> & { reviewed?: boolean } = {};
  for (const field of Object.keys(TEXT_LIMITS) as TextField[]) {
    const v = patch[field];
    if (v === undefined) continue;
    const [min, max, name] = TEXT_LIMITS[field];
    if (typeof v !== "string") throw new ValidationError(`${name} 값이 올바르지 않아요`);
    const s = v.trim();
    const len = [...s].length;
    if (len < min || len > max) {
      throw new ValidationError(min ? `${name}은(는) ${min}~${max}자로 입력해 주세요` : `${name}은(는) ${max}자 이내로 입력해 주세요`);
    }
    set[field] = s;
  }
  if (patch.reviewed !== undefined) {
    if (typeof patch.reviewed !== "boolean") throw new ValidationError("검수 값이 올바르지 않아요");
    set.reviewed = patch.reviewed;
  }

  const where = and(eq(glossaryTerms.id, id), eq(glossaryTerms.userId, userId));
  const [row] = Object.keys(set).length
    ? await db
        .update(glossaryTerms)
        .set({ ...set, updatedAt: new Date() })
        .where(where)
        .returning()
    : await db.select().from(glossaryTerms).where(where);
  if (!row) throw new NotFoundError();
  return row;
}
