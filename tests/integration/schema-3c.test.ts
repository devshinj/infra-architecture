import { eq } from "drizzle-orm";
import { expect, test } from "vitest";

import { db } from "@/db/client";
import { diagrams, explanations, glossaryTerms } from "@/db/schema";

import { makeOwnedDiagram } from "./helpers";

const term = (userId: string, key: string) => ({
  userId,
  key,
  term: key,
  fullName: "",
  category: "network",
  definition: "정의",
  why: "",
  compare: "",
  source: "seed" as const,
});

test("glossary key is unique per user but shared keys across users are allowed", async () => {
  const a = await makeOwnedDiagram();
  const b = await makeOwnedDiagram();

  await db.insert(glossaryTerms).values(term(a.userId, "vpc"));
  await db.insert(glossaryTerms).values(term(b.userId, "vpc"));
  await expect(db.insert(glossaryTerms).values(term(a.userId, "vpc"))).rejects.toThrow();
});

test("explanations cascade with the diagram", async () => {
  const edgeData = { kind: "edge", flow: "f", method: "m", why: "w", firewall: "x" } as const;
  const { diagramId } = await makeOwnedDiagram();
  await db.insert(explanations).values({
    diagramId,
    targetKind: "node",
    targetId: "n1",
    signature: "sig",
    data: edgeData,
  });
  await expect(
    db.insert(explanations).values({
      diagramId,
      targetKind: "node",
      targetId: "n1",
      signature: "sig2",
      data: edgeData,
    }),
  ).rejects.toThrow();

  await db.delete(diagrams).where(eq(diagrams.id, diagramId));
  const rows = await db.select().from(explanations).where(eq(explanations.diagramId, diagramId));
  expect(rows).toHaveLength(0);
});
