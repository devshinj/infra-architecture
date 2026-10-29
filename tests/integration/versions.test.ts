import { describe, expect, test } from "vitest";

import {
  createVersion,
  getLatestState,
  getVersion,
  listVersions,
  restoreVersion,
} from "@/server/versions";

import { fx } from "../fixtures/spike";
import { makeDiagram } from "./helpers";

const s1 = fx("s1");
const s2 = fx("s2");

describe("diagram versions", () => {
  test("versions number sequentially and restore is non-destructive", async () => {
    const d = await makeDiagram();
    await createVersion(d, s1, { source: "import" });
    await createVersion(d, s2, { source: "ai" });
    const r = await restoreVersion(d, 1);
    expect(r.number).toBe(3);
    const list = await listVersions(d);
    expect(list.map((v) => v.number)).toEqual([3, 2, 1]);
    expect(list[0]).toMatchObject({ source: "restore", restoredFrom: 1 });
    expect(await getVersion(d, 3)).toEqual(s1);
    expect(await getVersion(d, 2)).toEqual(s2);
    expect(await getVersion(d, 9)).toBeNull();
    expect(await getLatestState(d)).toEqual({ number: 3, state: s1 });
  });

  test("concurrent createVersion gets distinct numbers", async () => {
    const d = await makeDiagram();
    const rs = await Promise.all(
      Array.from({ length: 5 }, () => createVersion(d, s1, { source: "ai" })),
    );
    expect(rs.map((r) => r.number).sort()).toEqual([1, 2, 3, 4, 5]);
  });

  test("aborted status is stored", async () => {
    const d = await makeDiagram();
    await createVersion(d, s1, { source: "ai", status: "aborted" });
    expect((await listVersions(d))[0].status).toBe("aborted");
  });

  test("latest state is null for an empty diagram", async () => {
    expect(await getLatestState(await makeDiagram())).toBeNull();
  });
});
