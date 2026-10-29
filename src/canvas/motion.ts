import { EDGE_KINDS } from "@/domain/catalog";

import { BASE_SPEED, type Bundle, type Segment } from "./segments";

export type MotionKind = "comet" | "capsule" | "sheen";

const NS = "http://www.w3.org/2000/svg";
const SLACK = 200; // dash gap beyond the path so the pattern never repeats on it
const COMET_LAYERS = [
  { len: 34, cls: "motion-comet--tail" },
  { len: 16, cls: "motion-comet--mid" },
  { len: 4, cls: "motion-comet--head" },
] as const;
const SHEEN_LEN = 22;
const CAPSULE = { w: 9, h: 4, gap: 28 };

const def = (s: Segment) => EDGE_KINDS.find((e) => e.kind === s.edgeKind)!;

/** Bundle speed in px/s: the slowest moving segment sets it (same rule as segments.ts timing). */
function bundleSpeed(bundle: Bundle): number {
  const factors = bundle.segments.map((s) => def(s).speedFactor).filter((f) => f > 0);
  return factors.length ? BASE_SPEED * Math.min(...factors) : 0;
}

function make<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number>, cls: string) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, String(attrs[k]));
  e.setAttribute("class", cls);
  return e;
}

/** Where a segment's overlays go: the host group EdgeLayer renders for that segment, or the svg itself. */
function hostOf(svg: SVGSVGElement, key: string): Element {
  for (const h of svg.querySelectorAll("[data-motion-seg]")) {
    if (h.getAttribute("data-motion-seg") === key) return h;
  }
  return svg;
}

/**
 * One dash travelling along a segment during the segment's keyframe window inside the bundle period,
 * so forks leave together and joins arrive together. The dash waits hidden before the path
 * (offset = dash length) and ends hidden past it (offset = -L).
 */
function dashAlong(path: SVGPathElement, dashLen: number, seg: Segment, bundle: Bundle, speed: number): Animation {
  const L = seg.length;
  const period = bundle.periodMs;
  const t0 = Math.min(1, seg.startMs / period);
  const t1 = Math.min(1, (seg.startMs + ((L + dashLen) / speed) * 1000) / period);
  path.setAttribute("stroke-dasharray", `${dashLen} ${L + SLACK}`);
  return path.animate(
    [
      { offset: 0, strokeDashoffset: dashLen },
      { offset: t0, strokeDashoffset: dashLen },
      { offset: t1, strokeDashoffset: -L },
      { offset: 1, strokeDashoffset: -L },
    ],
    { duration: period, delay: bundle.offsetMs, iterations: Infinity, fill: "backwards" },
  );
}

/**
 * Start the motion of every segment in `bundle` whose edge kind uses `kind`.
 * Returns a function that stops everything and removes the overlays it created.
 */
export function startBundleMotion(svg: SVGSVGElement, bundle: Bundle, kind: MotionKind): () => void {
  const noop = () => {};
  if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return noop;
  const speed = bundleSpeed(bundle);
  if (speed <= 0) return noop;

  const created: Element[] = [];
  const anims: Animation[] = [];
  const capsules: { seg: Segment; probe: SVGPathElement; el: SVGRectElement; k: number }[] = [];
  let raf = 0;

  for (const seg of bundle.segments.filter((s) => def(s).motion === kind)) {
    const host = hostOf(svg, seg.key);
    if (kind === "capsule") {
      const probe = make("path", { d: seg.d, fill: "none", stroke: "none" }, "motion-path");
      host.appendChild(probe);
      created.push(probe);
      for (let k = 0; k < 2; k++) {
        const el = make(
          "rect",
          { x: -CAPSULE.w / 2, y: -CAPSULE.h / 2, width: CAPSULE.w, height: CAPSULE.h, rx: 2, visibility: "hidden" },
          "motion-capsule",
        );
        host.appendChild(el);
        created.push(el);
        capsules.push({ seg, probe, el, k });
      }
      continue;
    }
    const layers =
      kind === "comet"
        ? COMET_LAYERS.map((l) => ({ len: l.len, cls: `motion-path motion-comet ${l.cls}` }))
        : [{ len: SHEEN_LEN, cls: "motion-path motion-sheen" }];
    for (const layer of layers) {
      const p = make("path", { d: seg.d }, layer.cls);
      host.appendChild(p);
      created.push(p);
      if (typeof p.animate === "function") anims.push(dashAlong(p, layer.len, seg, bundle, speed));
    }
  }

  if (capsules.length) {
    const t0 = performance.now();
    const tick = (now: number) => {
      // Same phase as WAAPI `delay: offsetMs` + fill "backwards": nothing before the first window.
      const x = now - t0 - bundle.offsetMs;
      const t = x < 0 ? -1 : x % bundle.periodMs;
      for (const c of capsules) {
        const pos = (speed * (t - c.seg.startMs)) / 1000 - c.k * CAPSULE.gap;
        if (t < 0 || pos < 0 || pos > c.seg.length) {
          c.el.setAttribute("visibility", "hidden");
          continue;
        }
        const from = Math.max(0, Math.min(pos, c.seg.length - 0.5));
        const a = c.probe.getPointAtLength(pos);
        const p0 = c.probe.getPointAtLength(from);
        const p1 = c.probe.getPointAtLength(from + 0.5);
        const ang = (Math.atan2(p1.y - p0.y, p1.x - p0.x) * 180) / Math.PI;
        c.el.setAttribute("transform", `translate(${a.x} ${a.y}) rotate(${ang})`);
        c.el.setAttribute("visibility", "visible");
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  }

  return () => {
    cancelAnimationFrame(raf);
    for (const a of anims) a.cancel();
    for (const e of created) e.remove();
  };
}
