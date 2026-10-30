import { useCallback, useEffect, useRef } from "react";

import type { Rect } from "./layout";

export type Viewport = { x: number; y: number; zoom: number };
/**
 * Screen pixels covered by floating panels: left/right panels, and the collapsed 구성 정보 card along the bottom.
 * Fits use the box between them. `card` is the open card's footprint (from `left` and the bottom edge, gaps included);
 * only 위치 보기 avoids it.
 */
export type Insets = { left: number; right: number; bottom?: number; card?: { width: number; height: number } };

export interface CameraInput {
  /** Changes when a different board is shown (version view, compare, another diagram): fit at once. */
  boardKey: string;
  /** Drawn rects (flow coordinates) by id. A changed id set within a board is "new nodes". */
  rects: Record<string, Rect>;
  /** Everything to frame when fitting; defaults to the union of `rects`. */
  bounds?: Rect | null;
  /** Canvas size in pixels. Nothing happens while it is 0. */
  size: { width: number; height: number };
  insets: Insets;
  /** A chat turn is assembling the diagram. */
  streaming: boolean;
  reducedMotion: boolean;
  /** Changes to ask for one full fit at once (자동 정렬·대화 재정렬). It waits until `settled`. */
  fitRequest?: number;
  /** False while the layout for the current inputs is still being computed (default true). */
  settled?: boolean;
  /** True when the last layout run failed: a pending fitRequest is dropped (its layout will not come). */
  layoutFailed?: boolean;
  getViewport(): Viewport;
  setViewport(v: Viewport, opts: { duration: number }): void;
}

export const STREAM_FIT_GAP_MS = 600;
export const STREAM_FIT_DURATION = 450;
export const FINAL_FIT_DURATION = 600;
export const FOCUS_DURATION = 500;
/** 위치 보기: 줌은 그대로 두되 이보다 멀면 여기까지 당긴다. */
export const FOCUS_MIN_ZOOM = 0.8;
/** 열린 카드 오른쪽 빈 곳이 이보다 좁으면 카드 위쪽에 둔다. */
export const FOCUS_SIDE_MIN = 360;
const PADDING = 0.1;
const MIN_ZOOM = 0.2;
const BOARD_MAX_ZOOM = 2;
const FINAL_MAX_ZOOM = 1;

export function unionRect(rects: Iterable<Rect>): Rect | null {
  let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
  for (const r of rects) {
    x1 = Math.min(x1, r.x);
    y1 = Math.min(y1, r.y);
    x2 = Math.max(x2, r.x + r.width);
    y2 = Math.max(y2, r.y + r.height);
  }
  return x1 === Infinity ? null : { x: x1, y: y1, width: x2 - x1, height: y2 - y1 };
}

/** The viewport that frames `b` in the strip between the insets, zoom clamped to [MIN_ZOOM, maxZoom]. */
export function fitViewport(b: Rect, size: { width: number; height: number }, insets: Insets, maxZoom: number): Viewport {
  const vw = Math.max(1, size.width - insets.left - insets.right);
  const vh = Math.max(1, size.height - (insets.bottom ?? 0));
  // Same padding factor as React Flow's fitView (bounds × (1 + padding)).
  const fit = Math.min(vw / Math.max(1, b.width * (1 + PADDING)), vh / Math.max(1, b.height * (1 + PADDING)));
  const zoom = Math.max(MIN_ZOOM, Math.min(maxZoom, fit));
  return {
    x: insets.left + vw / 2 - (b.x + b.width / 2) * zoom,
    y: vh / 2 - (b.y + b.height / 2) * zoom,
    zoom,
  };
}

/**
 * 위치 보기: `r` 의 가운데를 보이는 빈 곳의 가운데에 둔다. 줌은 `zoom` 을 유지하되 FOCUS_MIN_ZOOM 아래면 올린다.
 * 카드가 열려 있으면 카드를 피한다: 카드 오른쪽이 FOCUS_SIDE_MIN 이상이면 그쪽, 아니면 카드 위쪽.
 */
export function focusViewport(r: Rect, size: { width: number; height: number }, insets: Insets, zoom: number): Viewport {
  const z = Math.max(FOCUS_MIN_ZOOM, zoom);
  let x1 = insets.left;
  const x2 = size.width - insets.right;
  let y2 = size.height - (insets.bottom ?? 0);
  const card = insets.card;
  if (card) {
    const side = insets.left + card.width;
    if (x2 - side >= FOCUS_SIDE_MIN) x1 = side;
    else y2 = Math.min(y2, size.height - card.height);
  }
  const cx = (x1 + Math.max(x1 + 1, x2)) / 2;
  const cy = Math.max(1, y2) / 2;
  return { x: cx - (r.x + r.width / 2) * z, y: cy - (r.y + r.height / 2) * z, zoom: z };
}

function isVisible(r: Rect, vp: Viewport, size: { width: number; height: number }, insets: Insets): boolean {
  const left = r.x * vp.zoom + vp.x;
  const top = r.y * vp.zoom + vp.y;
  return left >= insets.left && top >= 0 && left + r.width * vp.zoom <= size.width - insets.right && top + r.height * vp.zoom <= size.height - (insets.bottom ?? 0);
}

export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

const idsKey = (rects: Record<string, Rect>) => Object.keys(rects).sort().join(",");

/**
 * Camera rules while a diagram is shown:
 * - board change → fit at once (max zoom 2, or 1 if it happens mid-turn);
 * - new nodes → fit only when one is off-screen, at most every 600ms (changes in between are batched),
 *   animated 450ms, never zooming in;
 * - end of a chat turn → one 600ms fit of everything (zoom-in allowed up to 1);
 * - a user pan/zoom during a turn stops auto fits until the turn ends (the final fit too);
 * - focus(rect) (위치 보기) → 500ms centre on it, cancelling a scheduled stream fit; a programmatic move, never a user move;
 * - fitRequest change (re-arrange) → fit at once like a board change, once the new layout is settled;
 * - reduced motion → every move is instant.
 */
export function useCamera(input: CameraInput): { onMoveStart(event: unknown): void; focus(r: Rect): void } {
  const latest = useRef(input);
  useEffect(() => {
    latest.current = input;
  });

  const st = useRef({
    board: null as string | null,
    ids: new Set<string>(),
    boardPending: false,
    pending: new Set<string>(),
    lastFit: -Infinity,
    timer: null as ReturnType<typeof setTimeout> | null,
    userMoved: false,
    streaming: input.streaming,
    fitRequest: input.fitRequest,
    fitPending: false,
  });

  const ready = () => latest.current.size.width > 0 && latest.current.size.height > 0;
  const clearTimer = () => {
    const s = st.current;
    if (s.timer !== null) clearTimeout(s.timer);
    s.timer = null;
  };
  const apply = (maxZoom: number, duration: number, noZoomIn: boolean) => {
    const { rects, bounds, size, insets, reducedMotion, getViewport, setViewport } = latest.current;
    const b = bounds ?? unionRect(Object.values(rects));
    if (!b || !ready()) return;
    const v = fitViewport(b, size, insets, maxZoom);
    if (noZoomIn) {
      const cur = getViewport().zoom;
      if (v.zoom > cur) {
        // Keep the zoom, move only the centre.
        const vw = Math.max(1, size.width - insets.left - insets.right);
        v.zoom = cur;
        v.x = insets.left + vw / 2 - (b.x + b.width / 2) * cur;
        v.y = Math.max(1, size.height - (insets.bottom ?? 0)) / 2 - (b.y + b.height / 2) * cur;
      }
    }
    setViewport(v, { duration: reducedMotion ? 0 : duration });
    st.current.lastFit = Date.now();
  };
  const anyPendingOff = () => {
    const { rects, size, insets, getViewport } = latest.current;
    const vp = getViewport();
    for (const id of st.current.pending) {
      const r = rects[id];
      if (r && !isVisible(r, vp, size, insets)) return true;
    }
    return false;
  };
  const stopped = () => st.current.streaming && st.current.userMoved;
  const flush = () => {
    const s = st.current;
    if (!stopped() && ready() && anyPendingOff()) apply(BOARD_MAX_ZOOM, STREAM_FIT_DURATION, true);
    s.pending.clear();
  };
  const schedule = () => {
    const s = st.current;
    if (s.timer !== null) return;
    if (stopped() || !ready() || !anyPendingOff()) {
      s.pending.clear();
      return;
    }
    const wait = s.lastFit + STREAM_FIT_GAP_MS - Date.now();
    if (wait <= 0) flush();
    else
      s.timer = setTimeout(() => {
        s.timer = null;
        flush();
      }, wait);
  };

  const { boardKey, rects, streaming } = input;
  const key = idsKey(rects);
  const sizeReady = input.size.width > 0 && input.size.height > 0;

  // Board change / new nodes. `latest` is refreshed first (effects run in order).
  useEffect(() => {
    const s = st.current;
    const ids = key === "" ? [] : key.split(",");
    if (s.board !== boardKey) {
      s.board = boardKey;
      s.ids = new Set(ids);
      s.pending.clear();
      clearTimer();
      s.boardPending = true;
    } else {
      const added = ids.filter((id) => !s.ids.has(id));
      s.ids = new Set(ids);
      for (const id of added) s.pending.add(id);
      if (added.length > 0) schedule();
    }
    if (s.boardPending && sizeReady) {
      s.boardPending = false;
      // A board that first appears mid-turn (the first node on an empty canvas) must not start zoomed in.
      apply(s.streaming ? FINAL_MAX_ZOOM : BOARD_MAX_ZOOM, 0, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- helpers read refs only
  }, [boardKey, key, sizeReady]);

  // Re-arrange: the pins were dropped, so wait for that layout before fitting.
  const { fitRequest, settled = true, layoutFailed = false } = input;
  useEffect(() => {
    const s = st.current;
    if (s.fitRequest !== fitRequest) {
      s.fitRequest = fitRequest;
      s.fitPending = true;
    }
    if (layoutFailed) {
      s.fitPending = false;
      return;
    }
    if (s.fitPending && settled && sizeReady) {
      s.fitPending = false;
      clearTimer();
      s.pending.clear();
      apply(s.streaming ? FINAL_MAX_ZOOM : BOARD_MAX_ZOOM, 0, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- helpers read refs only
  }, [fitRequest, settled, layoutFailed, sizeReady]);

  // Turn start / end.
  useEffect(() => {
    const s = st.current;
    if (s.streaming === streaming) return;
    s.streaming = streaming;
    if (streaming) {
      s.userMoved = false;
      return;
    }
    clearTimer();
    s.pending.clear();
    if (!s.userMoved) apply(FINAL_MAX_ZOOM, FINAL_FIT_DURATION, false);
    s.userMoved = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- helpers read refs only
  }, [streaming]);

  useEffect(() => clearTimer, []);

  // React Flow passes the DOM event for user input and null for programmatic moves.
  const onMoveStart = useCallback((event: unknown) => {
    const s = st.current;
    if (!event || !s.streaming) return;
    s.userMoved = true;
    s.pending.clear();
    if (s.timer !== null) clearTimeout(s.timer);
    s.timer = null;
  }, []);

  const focus = useCallback((r: Rect) => {
    const { size, insets, reducedMotion, getViewport, setViewport } = latest.current;
    if (!(size.width > 0 && size.height > 0)) return;
    // A scheduled stream fit must not pull the camera off the focus target.
    clearTimer();
    st.current.pending.clear();
    setViewport(focusViewport(r, size, insets, getViewport().zoom), { duration: reducedMotion ? 0 : FOCUS_DURATION });
  }, []);

  return { onMoveStart, focus };
}
