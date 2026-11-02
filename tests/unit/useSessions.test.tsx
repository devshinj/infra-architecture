import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

import { NEW_SESSION, type SessionSummary, useSessions } from "@/ui/chat/useSessions";

afterEach(() => vi.unstubAllGlobals());

const s = (id: string, updatedAt: string): SessionSummary => ({ id, nodeId: "n1", nodeLabel: "API 서버", title: id, updatedAt });

test("loads a session's lines once on first select", async () => {
  const fetchMock = vi.fn(async () =>
    Response.json({
      session: s("a", "2026-11-01T00:00:00Z"),
      messages: [
        { id: "u1", role: "user", content: "왜 두 대예요?", meta: {}, createdAt: "2026-11-01T00:00:00Z" },
        { id: "m1", role: "assistant", content: "이중화예요.", meta: { applied: 0, version: null, status: "complete" }, createdAt: "2026-11-01T00:00:01Z" },
      ],
    }),
  );
  vi.stubGlobal("fetch", fetchMock);
  const { result } = renderHook(() => useSessions({ diagramId: "d1", initial: [s("a", "2026-11-01T00:00:00Z")] }));
  expect(result.current.active).toBe("main");
  act(() => result.current.select("a"));
  expect(result.current.active).toBe("a");
  expect(result.current.linesOf("a")).toBe("loading");
  await waitFor(() => expect(result.current.linesOf("a")).not.toBe("loading"));
  expect(fetchMock).toHaveBeenCalledWith("/api/diagrams/d1/sessions/a");
  const lines = result.current.linesOf("a");
  expect(lines !== "loading" && lines.map((l) => [l.kind, l.text])).toEqual([["user", "왜 두 대예요?"], ["assistant", "이중화예요."]]);
  act(() => result.current.select("main"));
  act(() => result.current.select("a"));
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

test("upsert moves a session to the top", () => {
  const { result } = renderHook(() => useSessions({ diagramId: "d1", initial: [s("a", "2026-11-01T02:00:00Z"), s("b", "2026-11-01T01:00:00Z")] }));
  act(() => result.current.upsert(s("b", "2026-11-01T03:00:00Z")));
  expect(result.current.sessions.map((x) => x.id)).toEqual(["b", "a"]);
  act(() => result.current.upsert(s("c", "2026-11-01T04:00:00Z")));
  expect(result.current.sessions.map((x) => x.id)).toEqual(["c", "b", "a"]);
});

test("a new session's lines move to its id when the server names it", () => {
  const { result } = renderHook(() => useSessions({ diagramId: "d1", initial: [] }));
  act(() => result.current.startNew({ nodeId: "n1", nodeLabel: "API 서버", text: "  왜   두 대예요? " }));
  expect(result.current.active).toBe(NEW_SESSION);
  expect(result.current.summaryOf(NEW_SESSION)).toMatchObject({ nodeId: "n1", title: "왜 두 대예요?" });
  act(() => result.current.setLines(NEW_SESSION, (ls) => [...ls, { id: "u", kind: "user", text: "왜 두 대예요?" }]));
  act(() => result.current.upsert(s("x", "2026-11-01T04:00:00Z")));
  expect(result.current.active).toBe("x");
  expect(result.current.summaryOf(NEW_SESSION)).toBeNull();
  const lines = result.current.linesOf("x");
  expect(lines !== "loading" && lines.map((l) => l.text)).toEqual(["왜 두 대예요?"]);
});
