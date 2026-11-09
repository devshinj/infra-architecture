import { randomInt } from "node:crypto";

import { and, asc, eq, inArray, or, sql } from "drizzle-orm";

import { db } from "@/db/client";
import { diagramVersions, diagrams, networkRules, networkTypes, projects } from "@/db/schema";
import {
  GRADE_LABELS,
  METHOD_LABELS,
  pairKey,
  type LinkMethod,
  type NetGrade,
  type NetRule,
  type NetworkKnowledge,
} from "@/domain/network";
import { NETWORK_TYPE_SEED } from "@/domain/network-seed";
import type { DiagramState } from "@/domain/types";
import { NotFoundError, ValidationError } from "@/server/projects";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const NAME_MAX = 30;
const ALIAS_MAX = 30;
const ALIAS_COUNT_MAX = 10;
const DESC_MAX = 200;
const NOTE_MAX = 100;

export interface NetTypeRow {
  id: string;
  key: string;
  name: string;
  aliases: string[];
  description: string;
  grade: NetGrade;
  source: "seed" | "user";
  edited: boolean;
  hidden: boolean;
}

const len = (s: string) => [...s].length;

function checkGrade(g: unknown): NetGrade {
  if (typeof g !== "string" || !Object.hasOwn(GRADE_LABELS, g)) throw new ValidationError("망 등급 값이 올바르지 않아요");
  return g as NetGrade;
}

function checkName(v: unknown): string {
  if (typeof v !== "string") throw new ValidationError("이름 값이 올바르지 않아요");
  const s = v.trim();
  if (len(s) < 1 || len(s) > NAME_MAX) throw new ValidationError(`이름은 1~${NAME_MAX}자로 입력해 주세요`);
  return s;
}

function checkAliases(v: unknown): string[] {
  if (!Array.isArray(v) || v.some((a) => typeof a !== "string")) {
    throw new ValidationError("다른 이름 값이 올바르지 않아요");
  }
  const out = [...new Set((v as string[]).map((a) => a.trim()).filter(Boolean))];
  if (out.length > ALIAS_COUNT_MAX) throw new ValidationError(`다른 이름은 최대 ${ALIAS_COUNT_MAX}개예요`);
  if (out.some((a) => len(a) > ALIAS_MAX)) {
    throw new ValidationError(`다른 이름은 각각 ${ALIAS_MAX}자 이내로 입력해 주세요`);
  }
  return out;
}

function checkDescription(v: unknown): string {
  if (typeof v !== "string") throw new ValidationError("설명 값이 올바르지 않아요");
  const s = v.trim();
  if (len(s) > DESC_MAX) throw new ValidationError(`설명은 ${DESC_MAX}자 이내로 입력해 주세요`);
  return s;
}

const toRow = (r: typeof networkTypes.$inferSelect): NetTypeRow => ({
  id: r.id,
  key: r.key,
  name: r.name,
  aliases: r.aliases,
  description: r.description,
  grade: r.grade,
  source: r.source,
  edited: r.edited,
  hidden: r.hidden,
});

/** 없는 기본 제공 종류만 넣는다. 이미 있는 행(숨긴 것, 고친 것 포함)은 건드리지 않는다. */
export async function ensureNetworkSeeded(userId: string): Promise<void> {
  await db
    .insert(networkTypes)
    .values(
      NETWORK_TYPE_SEED.map((t) => ({
        userId,
        key: t.key,
        name: t.name,
        aliases: [...t.aliases],
        description: t.description,
        grade: t.grade,
        source: "seed" as const,
      })),
    )
    .onConflictDoNothing({ target: [networkTypes.userId, networkTypes.key] });
}

/** 숨긴 종류와, 숨긴 종류를 가리키는 규칙은 뺀다. */
export async function getNetworkKnowledge(userId: string): Promise<NetworkKnowledge> {
  await ensureNetworkSeeded(userId);
  const typeRows = await db.select().from(networkTypes).where(eq(networkTypes.userId, userId));
  const types: NetworkKnowledge["types"] = {};
  for (const r of typeRows) {
    if (r.hidden) continue;
    types[r.key] = { key: r.key, name: r.name, aliases: r.aliases, description: r.description, grade: r.grade };
  }
  const rules: NetRule[] = [];
  for (const r of await listNetworkRules(userId)) {
    if (!types[r.a] || !types[r.b]) continue;
    rules.push(r.note ? { a: r.a, b: r.b, method: r.method, note: r.note } : { a: r.a, b: r.b, method: r.method });
  }
  return { types, rules };
}

export async function listNetworkTypes(userId: string): Promise<NetTypeRow[]> {
  await ensureNetworkSeeded(userId);
  const rows = await db
    .select()
    .from(networkTypes)
    .where(eq(networkTypes.userId, userId))
    .orderBy(sql`${networkTypes.source} desc`, asc(networkTypes.name), asc(networkTypes.id));
  return rows.map(toRow);
}

const KEY_SUFFIX_LEN = 8;
const KEY_TRIES = 5;
const BASE36 = "0123456789abcdefghijklmnopqrstuvwxyz";

/**
 * 이름에서 id 모양 key 를 만든다. 영문·숫자가 남지 않으면(한글 등) net 으로 시작한다.
 * 뒤에 무작위 글자를 붙여, 지운 종류의 key 를 새 종류에 다시 주지 않는다(그 key 를 가진 망이 엉뚱한 종류가 되지 않게).
 */
function newTypeKey(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64 - KEY_SUFFIX_LEN - 1)
    .replace(/-+$/g, "");
  const suffix = Array.from({ length: KEY_SUFFIX_LEN }, () => BASE36[randomInt(BASE36.length)]).join("");
  return `${slug || "net"}-${suffix}`;
}

export async function addNetworkType(
  userId: string,
  input: { name: string; aliases: string[]; description: string; grade: NetGrade },
): Promise<NetTypeRow> {
  const name = checkName(input.name);
  const aliases = checkAliases(input.aliases);
  const description = checkDescription(input.description);
  const grade = checkGrade(input.grade);
  // 기본 제공 key 와 겹치지 않게 먼저 채워 둔다.
  await ensureNetworkSeeded(userId);

  for (let i = 0; i < KEY_TRIES; i++) {
    const key = newTypeKey(name);
    const [row] = await db
      .insert(networkTypes)
      .values({ userId, key, name, aliases, description, grade, source: "user" })
      .onConflictDoNothing({ target: [networkTypes.userId, networkTypes.key] })
      .returning();
    if (row) return toRow(row);
  }
  throw new ValidationError("종류를 만들지 못했어요. 다시 해 주세요");
}

async function getOwnedType(userId: string, id: string): Promise<typeof networkTypes.$inferSelect> {
  if (!UUID_RE.test(id)) throw new NotFoundError();
  const [row] = await db
    .select()
    .from(networkTypes)
    .where(and(eq(networkTypes.id, id), eq(networkTypes.userId, userId)));
  if (!row) throw new NotFoundError();
  return row;
}

export async function updateNetworkType(
  userId: string,
  id: string,
  patch: Partial<{ name: string; aliases: string[]; description: string; grade: NetGrade }>,
): Promise<NetTypeRow> {
  const cur = await getOwnedType(userId, id);
  const set: Partial<typeof networkTypes.$inferInsert> = {};
  if (patch.name !== undefined) set.name = checkName(patch.name);
  if (patch.aliases !== undefined) set.aliases = checkAliases(patch.aliases);
  if (patch.description !== undefined) set.description = checkDescription(patch.description);
  if (patch.grade !== undefined) set.grade = checkGrade(patch.grade);
  if (!Object.keys(set).length) return toRow(cur);
  if (cur.source === "seed") set.edited = true;
  const [row] = await db
    .update(networkTypes)
    .set({ ...set, updatedAt: new Date() })
    .where(and(eq(networkTypes.id, id), eq(networkTypes.userId, userId)))
    .returning();
  if (!row) throw new NotFoundError();
  return toRow(row);
}

/** 기본 제공 종류를 처음 값으로 되돌린다. 숨김 여부는 그대로 둔다. */
export async function resetNetworkType(userId: string, id: string): Promise<NetTypeRow> {
  const cur = await getOwnedType(userId, id);
  const seed = cur.source === "seed" ? NETWORK_TYPE_SEED.find((t) => t.key === cur.key) : undefined;
  if (!seed) throw new ValidationError("기본 제공 종류만 처음 값으로 되돌릴 수 있어요");
  const [row] = await db
    .update(networkTypes)
    .set({
      name: seed.name,
      aliases: [...seed.aliases],
      description: seed.description,
      grade: seed.grade,
      edited: false,
      updatedAt: new Date(),
    })
    .where(and(eq(networkTypes.id, id), eq(networkTypes.userId, userId)))
    .returning();
  return toRow(row!);
}

export async function setNetworkTypeHidden(userId: string, id: string, hidden: boolean): Promise<NetTypeRow> {
  const cur = await getOwnedType(userId, id);
  if (cur.source !== "seed") throw new ValidationError("기본 제공 종류만 숨길 수 있어요");
  if (typeof hidden !== "boolean") throw new ValidationError("숨김 값이 올바르지 않아요");
  const [row] = await db
    .update(networkTypes)
    .set({ hidden, updatedAt: new Date() })
    .where(and(eq(networkTypes.id, id), eq(networkTypes.userId, userId)))
    .returning();
  return toRow(row!);
}

/** 직접 만든 종류만 지운다. 그 종류를 쓰는 규칙도 함께 지운다. */
export async function deleteNetworkType(userId: string, id: string): Promise<void> {
  const cur = await getOwnedType(userId, id);
  if (cur.source !== "user") throw new ValidationError("기본 제공 종류는 지울 수 없어요. 숨기기를 써 주세요");
  await db.transaction(async (tx) => {
    await tx
      .delete(networkRules)
      .where(and(eq(networkRules.userId, userId), or(eq(networkRules.typeA, cur.key), eq(networkRules.typeB, cur.key))));
    await tx.delete(networkTypes).where(and(eq(networkTypes.id, id), eq(networkTypes.userId, userId)));
  });
}

/** 그 계정 구성도들의 최신 버전에서 netType.key 가 같은 망 영역 수. */
export async function countZonesUsingType(userId: string, key: string): Promise<number> {
  const rows = await db
    .select({ state: diagramVersions.state })
    .from(diagramVersions)
    .innerJoin(diagrams, eq(diagrams.id, diagramVersions.diagramId))
    .innerJoin(projects, eq(projects.id, diagrams.projectId))
    .where(
      and(
        eq(projects.ownerId, userId),
        sql`${diagramVersions.number} = (select max(v.number) from diagram_versions v where v.diagram_id = ${diagramVersions.diagramId})`,
      ),
    );
  let n = 0;
  for (const r of rows) {
    const groups = Object.values((r.state as DiagramState).groups ?? {});
    n += groups.filter((g) => g.groupKind === "network_zone" && g.netType?.key === key).length;
  }
  return n;
}

export async function listNetworkRules(userId: string): Promise<(NetRule & { id: string })[]> {
  const rows = await db
    .select()
    .from(networkRules)
    .where(eq(networkRules.userId, userId))
    .orderBy(asc(networkRules.typeA), asc(networkRules.typeB));
  return rows.map((r) => {
    const [a, b] = pairKey(r.typeA, r.typeB);
    return r.note ? { id: r.id, a, b, method: r.method, note: r.note } : { id: r.id, a, b, method: r.method };
  });
}

export async function upsertNetworkRule(userId: string, rule: NetRule): Promise<void> {
  if (typeof rule.method !== "string" || !Object.hasOwn(METHOD_LABELS, rule.method)) {
    throw new ValidationError("연결 방식 값이 올바르지 않아요");
  }
  const method: LinkMethod = rule.method;
  const note = (rule.note ?? "").trim();
  if (len(note) > NOTE_MAX) throw new ValidationError(`근거는 ${NOTE_MAX}자 이내로 입력해 주세요`);
  if (rule.a === rule.b) throw new ValidationError("서로 다른 두 종류를 골라 주세요");
  const [a, b] = pairKey(rule.a, rule.b);
  await ensureNetworkSeeded(userId);
  const found = await db
    .select({ key: networkTypes.key })
    .from(networkTypes)
    .where(and(eq(networkTypes.userId, userId), inArray(networkTypes.key, [a, b])));
  if (found.length !== 2) throw new ValidationError("없는 망 종류예요");
  await db
    .insert(networkRules)
    .values({ userId, typeA: a, typeB: b, method, note })
    .onConflictDoUpdate({
      target: [networkRules.userId, networkRules.typeA, networkRules.typeB],
      set: { method, note, updatedAt: new Date() },
    });
}

export async function deleteNetworkRule(userId: string, id: string): Promise<void> {
  if (!UUID_RE.test(id)) throw new NotFoundError();
  const res = await db
    .delete(networkRules)
    .where(and(eq(networkRules.id, id), eq(networkRules.userId, userId)))
    .returning({ id: networkRules.id });
  if (!res.length) throw new NotFoundError();
}
