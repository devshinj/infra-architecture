import { eq } from "drizzle-orm";
import { describe, expect, test } from "vitest";

import { db } from "@/db/client";
import { diagramVersions } from "@/db/schema";
import { createVersion, listVersions, StaleVersionError } from "@/server/versions";

import { fx } from "../fixtures/spike";
import { makeDiagram } from "./helpers";

const s1 = fx("s1");

describe("MCP 버전 칸", () => {
  test("via 와 summary 가 저장되고 목록에 나온다", async () => {
    const d = await makeDiagram();
    await createVersion(d, s1, { source: "mcp", via: "mcp", summary: "Redis 추가" });
    const [row] = await listVersions(d);
    expect(row).toMatchObject({ source: "mcp", via: "mcp", summary: "Redis 추가" });
  });

  test("via 와 summary 를 안 주면 null 이다", async () => {
    const d = await makeDiagram();
    await createVersion(d, s1, { source: "import" });
    const [row] = await listVersions(d);
    expect(row).toMatchObject({ via: null, summary: null });
  });

  test("tx 안에서 던지면 버전이 생기지 않는다", async () => {
    const d = await makeDiagram();
    await expect(
      db.transaction(async (tx) => {
        await createVersion(d, s1, { source: "ai", tx });
        throw new Error("되감기");
      }),
    ).rejects.toThrow("되감기");
    const rows = await db.select().from(diagramVersions).where(eq(diagramVersions.diagramId, d));
    expect(rows).toHaveLength(0);
  });

  test("tx 안에서 만든 버전은 번호가 이어진다", async () => {
    const d = await makeDiagram();
    await createVersion(d, s1, { source: "import" });
    const r = await db.transaction((tx) => createVersion(d, s1, { source: "ai", tx }));
    expect(r.number).toBe(2);
  });

  test("expectedLatest 가 최신과 다르면 StaleVersionError(latest), 버전은 생기지 않는다", async () => {
    const d = await makeDiagram();
    await createVersion(d, s1, { source: "import" });
    const err = await createVersion(d, s1, { source: "mcp", expectedLatest: 0 }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(StaleVersionError);
    expect((err as StaleVersionError).latest).toBe(1);
    expect(await listVersions(d)).toHaveLength(1);
    expect((await createVersion(d, s1, { source: "mcp", expectedLatest: 1 })).number).toBe(2);
  });
});
