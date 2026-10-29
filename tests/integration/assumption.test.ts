import { expect, test } from "vitest";

import { emptyState } from "@/domain/types";
import type { ChatEvent } from "@/server/chat/events";
import { runChatTurn } from "@/server/chat/pipeline";
import { confirmAssumptionFor } from "@/server/assumptions";
import type { ClefClient } from "@/server/llm/clef";
import type { QwenClient } from "@/server/llm/qwen";
import { NotFoundError, ValidationError } from "@/server/projects";
import { createVersion, getLatestState } from "@/server/versions";

import { makeOwnedDiagram } from "./helpers";
import { db } from "@/db/client";
import { diagramVersions } from "@/db/schema";
import { eq } from "drizzle-orm";

const clef: ClefClient = {
  async decide() {
    throw new Error("not used");
  },
  async classifyIntent() {
    return { intent: "structure_change", confidence: 0.9 };
  },
};

function qwenSaying(text: string): QwenClient {
  return {
    async streamCompletion(_m, { onDelta }) {
      onDelta(text);
      return { text, finishReason: "stop" };
    },
  };
}

test("confirmAssumptionFor creates a form version and the model cannot override it", async () => {
  const ids = await makeOwnedDiagram();
  await createVersion(ids.diagramId, emptyState(), { source: "import" });

  const r = await confirmAssumptionFor(ids.userId, ids.diagramId, "environment", "사내 IDC");
  expect(r.number).toBe(2);
  const [v2] = await db.select().from(diagramVersions).where(eq(diagramVersions.diagramId, ids.diagramId)).orderBy(diagramVersions.number).offset(1);
  expect(v2!.source).toBe("form");

  const events: ChatEvent[] = [];
  const lines = [
    JSON.stringify({ op: "set_assumption", key: "environment", value: "클라우드(AWS)" }),
    JSON.stringify({ op: "set_assumption", key: "scale", value: "소규모(일 1천 명 이하)" }),
  ].join("\n");
  await runChatTurn(
    { ...ids, text: "AWS 로 바꿔줘", signal: new AbortController().signal, emit: (e) => events.push(e) },
    { qwen: qwenSaying(lines), clef },
  );

  expect(events.filter((e) => e.t === "skip")).toHaveLength(1);
  const latest = await getLatestState(ids.diagramId);
  expect(latest!.state.assumptions.environment).toEqual({ key: "environment", value: "사내 IDC", confirmed: true });
  expect(latest!.state.assumptions.scale?.value).toBe("소규모(일 1천 명 이하)");
});

test("confirmAssumptionFor validates input and ownership", async () => {
  const ids = await makeOwnedDiagram();
  const other = await makeOwnedDiagram();
  await expect(confirmAssumptionFor(ids.userId, ids.diagramId, "Bad Key", "x")).rejects.toBeInstanceOf(ValidationError);
  await expect(confirmAssumptionFor(ids.userId, ids.diagramId, "ok", "")).rejects.toBeInstanceOf(ValidationError);
  await expect(confirmAssumptionFor(ids.userId, ids.diagramId, "ok", "x".repeat(81))).rejects.toBeInstanceOf(ValidationError);
  await expect(confirmAssumptionFor(ids.userId, other.diagramId, "ok", "x")).rejects.toBeInstanceOf(NotFoundError);
});
