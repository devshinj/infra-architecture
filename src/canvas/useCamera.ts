import { useCallback, useEffect, useRef } from "react";

import type { Rect } from "./layout";

export type Viewport = { x: number; y: number; zoom: number };
/**
 * Screen pixels covered by floating panels: left/right panels, the canvas toolbar along the top, and the collapsed
 * 구성 정보 card (and the legend when it is lifted above the card) along the bottom.
 * Fits use the box between them. `card` is the open card's footprint (from `left` and the bottom edge, gaps included);
 * only 위치 보기 avoids it.
 */
export type Insets = { left: number; right: number; top?: number; bottom?: number; card?: { width: number; height: number } };

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
  /** Changes to ask for one fit of the WHOLE diagram (전체 보기): no READABLE_ZOOM floor. It waits until `settled`. */
  fitAllRequest?: number;
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
/** 노드 이름 글자 크기(canvas.css .node__label)와, 맞춤이 그보다 작게 줄이지 않는 화면 글자 크기. */
export const NODE_LABEL_PX = 14;
export const MIN_LABEL_PX = 10;
/** 맞춤이 내려가지 않는 줌: 노드 이름이 화면에서 MIN_LABEL_PX 이상으로 읽힌다. */
export const READABLE_ZOOM = MIN_LABEL_PX / NODE_LABEL_PX;
/** 다 담지 못해 위쪽에 맞출 때 보이는 띠 가장자리와 구성도 사이의 화면 여백. */
export const EDGE_GAP_PX = 16;

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

export interface FitOptions {
  /** 맞춤이 이보다 줄이지 않는다(READABLE_ZOOM). maxZoom 보다 크면 maxZoom. */
  minZoom?: number;
  /** 줌을 이 값으로 정한다(이어 맞추기에서 더 당기지 않을 때). minZoom 보다 앞선다. */
  zoom?: number;
  /** 다 담지 못할 때 가로로 가운데에 둘 곳(맨 윗줄 노드: 사용자·클라이언트). 없으면 `b` 의 가운데. */
  anchor?: Rect | null;
}

/**
 * The viewport that frames `b` in the box between the insets, zoom clamped to [max(MIN_ZOOM, minZoom), maxZoom].
 * When `b` does not fit at that zoom on an axis, that axis is not centred: vertically the top of `b` sits EDGE_GAP_PX
 * below the top inset; horizontally `anchor` is centred, clamped so no empty space shows beyond `b`'s left/right edge.
 */
export function fitViewport(b: Rect, size: { width: number; height: number }, insets: Insets, maxZoom: number, opts: FitOptions = {}): Viewport {
  const top = insets.top ?? 0;
  const vw = Math.max(1, size.width - insets.left - insets.right);
  const vh = Math.max(1, size.height - top - (insets.bottom ?? 0));
  // Same padding factor as React Flow's fitView (bounds × (1 + padding)).
  const fit = Math.min(vw / Math.max(1, b.width * (1 + PADDING)), vh / Math.max(1, b.height * (1 + PADDING)));
  const floor = Math.min(maxZoom, Math.max(MIN_ZOOM, opts.minZoom ?? MIN_ZOOM));
  const zoom = opts.zoom ?? Math.max(floor, Math.min(maxZoom, fit));
  // 가장자리 여백(EDGE_GAP_PX)까지 넣어 담기지 않을 때만 한쪽에 붙인다. 맞춤 여백(PADDING)으로 재면 띠의 91~97%
  // 너비인 구성도가 가운데가 아니라 왼쪽에 붙는다.
  const fitsX = b.width * zoom + 2 * EDGE_GAP_PX <= vw + 0.5;
  const fitsY = b.height * zoom + 2 * EDGE_GAP_PX <= vh + 0.5;
  let x = insets.left + vw / 2 - (b.x + b.width / 2) * zoom;
  if (!fitsX) {
    const a = opts.anchor ?? b;
    const want = insets.left + vw / 2 - (a.x + a.width / 2) * zoom;
    // 왼쪽 끝이 띠 왼쪽 여백보다 안으로 들어오지 않고, 오른쪽 끝이 띠 오른쪽 여백보다 안으로 들어오지 않게.
    const most = insets.left + EDGE_GAP_PX - b.x * zoom;
    const least = insets.left + vw - EDGE_GAP_PX - (b.x + b.width) * zoom;
    x = Math.min(most, Math.max(least, want));
  }
  const y = fitsY ? top + vh / 2 - (b.y + b.height / 2) * zoom : top + EDGE_GAP_PX - b.y * zoom;
  return { x, y, zoom };
}

/** 맨 윗줄 노드들(가장 위 노드와 위쪽 끝이 반 높이 안에 있는 것)을 감싸는 상자. 다 못 담을 때 가로 기준이다. */
export function topRow(rects: Iterable<Rect>): Rect | null {
  const all = [...rects];
  if (all.length === 0) return null;
  const y0 = Math.min(...all.map((r) => r.y));
  return unionRect(all.filter((r) => r.y - y0 <= r.height / 2));
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
  const y1 = Math.min(insets.top ?? 0, Math.max(0, y2 - 1));
  const cx = (x1 + Math.max(x1 + 1, x2)) / 2;
  const cy = (y1 + Math.max(y1 + 1, y2)) / 2;
  return { x: cx - (r.x + r.width / 2) * z, y: cy - (r.y + r.height / 2) * z, zoom: z };
}

function isVisible(r: Rect, vp: Viewport, size: { width: number; height: number }, insets: Insets): boolean {
  const left = r.x * vp.zoom + vp.x;
  const top = r.y * vp.zoom + vp.y;
  return left >= insets.left && top >= (insets.top ?? 0) && left + r.width * vp.zoom <= size.width - insets.right && top + r.height * vp.zoom <= size.height - (insets.bottom ?? 0);
}

export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

const idsKey = (rects: Record<string, Rect>) => Object.keys(rects).sort().join(",");

/**
 * Camera rules while a diagram is shown:
 * - every fit frames the box between the insets (side panels, toolbar, bottom card/legend); except the stream follow and 전체 보기 it
 *   never shrinks below READABLE_ZOOM (node names ≥ 10px): a diagram too big for that shows its top row instead;
 * - board change → fit at once (max zoom 2, or 1 if it happens mid-turn);
 * - new nodes → fit only when one is off-screen, at most every 600ms (changes in between are batched),
 *   animated 450ms, never zooming in;
 * - end of a chat turn → one 600ms fit of everything (zoom-in allowed up to 1);
 * - a user pan/zoom during a turn stops auto fits until the turn ends (the final fit too);
 * - focus(rect) (위치 보기) → 500ms centre on it, cancelling a scheduled stream fit; a programmatic move, never a user move;
 * - fitRequest change (re-arrange) → fit at once like a board change, once the new layout is settled;
 * - fitAllRequest change (전체 보기) → fit the whole diagram at once, below READABLE_ZOOM if needed; it is the user's
 *   choice, so no automatic fit (follow, end of turn) overrides it until the next board, re-arrange or turn start;
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
    /** 사용자가 전체 보기를 눌렀다: 다음 판·자동 정렬·대화 차례 시작 전까지 자동 맞춤(따라가기·차례 끝 맞춤)이 덮지 않는다. */
    manual: false,
    streaming: input.streaming,
    fitRequest: input.fitRequest,
    fitAllRequest: input.fitAllRequest,
    fitAllPending: false,
    fitPending: false,
  });

  const ready = () => latest.current.size.width > 0 && latest.current.size.height > 0;
  const clearTimer = () => {
    const s = st.current;
    if (s.timer !== null) clearTimeout(s.timer);
    s.timer = null;
  };
  /**
   * Fit everything. `follow` is the calm follow while a turn streams: it never zooms in past the current zoom and may go
   * below READABLE_ZOOM so arriving nodes stay in view. Every other fit (board, 전체 보기·자동 정렬, end of turn) stops at
   * READABLE_ZOOM and, if the diagram is still too big, shows its top (the user/client row) instead.
   */
  const apply = (maxZoom: number, duration: number, follow: boolean, all = false) => {
    const { rects, bounds, size, insets, reducedMotion, getViewport, setViewport } = latest.current;
    const b = bounds ?? unionRect(Object.values(rects));
    if (!b || !ready()) return;
    // 읽을 수 있는 줌 바닥이 없는 것은 전체 보기와, 대화가 그리는 동안의 따라가기뿐이다. 대화 밖에서 노드가 새로 생겨
    // 따라갈 때(샘플 가져오기 직후 등)는 바닥을 지킨다.
    const floorless = all || (follow && st.current.streaming);
    const opts: FitOptions = { anchor: topRow(Object.values(rects)), ...(floorless ? {} : { minZoom: READABLE_ZOOM }) };
    let v = fitViewport(b, size, insets, maxZoom, opts);
    if (follow) {
      const cur = getViewport().zoom;
      // Keep the zoom, move only the centre.
      if (v.zoom > cur) v = fitViewport(b, size, insets, maxZoom, { ...opts, zoom: cur });
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
  const stopped = () => (st.current.streaming && st.current.userMoved) || st.current.manual;
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
      s.manual = false;
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
      s.manual = false;
      apply(s.streaming ? FINAL_MAX_ZOOM : BOARD_MAX_ZOOM, 0, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- helpers read refs only
  }, [fitRequest, settled, layoutFailed, sizeReady]);

  // 전체 보기: 구성도 전체를 담는다(읽을 수 있는 줌 바닥 없음). 도구 모음·카드 여백은 그대로 피한다.
  const { fitAllRequest } = input;
  useEffect(() => {
    const s = st.current;
    if (s.fitAllRequest !== fitAllRequest) {
      s.fitAllRequest = fitAllRequest;
      s.fitAllPending = true;
    }
    if (layoutFailed) {
      s.fitAllPending = false;
      return;
    }
    if (s.fitAllPending && settled && sizeReady) {
      s.fitAllPending = false;
      clearTimer();
      s.pending.clear();
      apply(s.streaming ? FINAL_MAX_ZOOM : BOARD_MAX_ZOOM, 0, false, true);
      s.manual = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- helpers read refs only
  }, [fitAllRequest, settled, layoutFailed, sizeReady]);

  // Turn start / end.
  useEffect(() => {
    const s = st.current;
    if (s.streaming === streaming) return;
    s.streaming = streaming;
    if (streaming) {
      s.userMoved = false;
      s.manual = false;
      return;
    }
    clearTimer();
    s.pending.clear();
    if (!s.userMoved && !s.manual) apply(FINAL_MAX_ZOOM, FINAL_FIT_DURATION, false);
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
