"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

// 캔버스의 노드·영역·연결선·흐름 빛 모양을 그대로 쓴다. 이 둘은 CSS 와 아이콘뿐이라 React Flow·ELK 를 끌고 오지 않는다.
import "@/canvas/canvas.css";
import "@/canvas/edges.css";
import { CategoryIcon } from "@/canvas/icons";
import { GROUP_KINDS } from "@/domain/catalog";
import chat from "@/ui/chat/chat.module.css";

import styles from "./AuthScene.module.css";
import { AUTH_BG } from "./background";
import { COMET_PATHS, NODE_H, polylineLength, SCENE_EDGES, SCENE_NODES, SCENE_SIZE, SCENE_ZONES, type SceneEdge } from "./layout";

/** 장면 속 사용자가 하는 말 한 줄. */
const PROMPT = "사내 IDC에 WEB·WAS를 두 대씩 이중화해 줘";

/**
 * 한 번 그렸으면 이 탭에서는 다시 그리지 않는다(로그인 ↔ 가입을 오가도 다 그린 그림으로 둔다).
 * 서버 렌더와 첫 화면은 늘 "그리는" 상태라 하이드레이션이 어긋나지 않는다. 이후 클라이언트 이동에서만 쉰 상태로 그린다.
 */
let playedInThisTab = false;

const ARROW = { size: 5, spread: 0.5 }; // src/canvas/EdgeLayer.tsx 의 열린 화살촉과 같은 값

function arrowD(points: [number, number][]): string {
  const [tx, ty] = points[points.length - 1]!;
  const [px, py] = points[points.length - 2]!;
  const ang = Math.atan2(ty - py, tx - px);
  const { size: s, spread } = ARROW;
  const f = (n: number) => Math.round(n * 100) / 100;
  return `M${f(tx - s * Math.cos(ang - spread))},${f(ty - s * Math.sin(ang - spread))} L${tx},${ty} L${f(tx - s * Math.cos(ang + spread))},${f(ty - s * Math.sin(ang + spread))}`;
}

const toD = (pts: SceneEdge["points"]) => pts.map(([x, y], i) => `${i ? "L" : "M"} ${x} ${y}`).join(" ");

function zoneVars(kind: (typeof GROUP_KINDS)[number]["kind"]) {
  const def = GROUP_KINDS.find((g) => g.kind === kind)!;
  return { dashed: def.dashed, vars: { "--zone": `var(${def.zoneToken})`, "--tint": `var(${def.tintToken})` } };
}

/** 흐름 빛: 캔버스 요청선 혜성(src/canvas/motion.ts COMET_LAYERS)과 같은 세 겹. */
const COMET_LAYERS = [
  { len: 34, cls: "motion-comet--tail" },
  { len: 16, cls: "motion-comet--mid" },
  { len: 4, cls: "motion-comet--head" },
] as const;
const COMET_LEAD = COMET_LAYERS[0].len;
/** 혜성 속도(px/s)와 한 번 지난 뒤 쉬는 시간. 왼쪽 길과 오른쪽 길을 번갈아, 한 번에 하나만 지난다. */
const COMET = { speed: 120, restMs: 2500 } as const;
/** 혜성이 처음 출발하는 때: 처음 그리는 장면이면 다 그린 뒤(그림은 약 3.2초에 멈춘다), 이미 그린 장면이면 곧바로. */
const COMET_START = { afterBuild: 3600, atRest: 600 } as const;
const COMET_LEN = COMET_PATHS.map(polylineLength);

function startComets(svg: SVGSVGElement, startMs: number): Animation[] {
  const travel = COMET_LEN.map((L) => ((L + COMET_LEAD) / COMET.speed) * 1000);
  const half = Math.max(...travel) + COMET.restMs;
  const cycle = half * COMET_PATHS.length;
  const anims: Animation[] = [];
  svg.querySelectorAll<SVGPathElement>("[data-comet]").forEach((p) => {
    const i = Number(p.dataset.comet);
    const len = Number(p.dataset.len);
    const L = COMET_LEN[i]!;
    // 세 겹의 앞 끝이 함께 가도록 모두 같은 거리(길 + 가장 긴 겹)를 같은 시간에 간다.
    const end = len - (L + COMET_LEAD);
    anims.push(
      p.animate(
        [
          { offset: 0, strokeDashoffset: len },
          { offset: travel[i]! / cycle, strokeDashoffset: end },
          { offset: 1, strokeDashoffset: end },
        ],
        { duration: cycle, delay: startMs + i * half, iterations: Infinity, fill: "backwards" },
      ),
    );
  });
  return anims;
}

function saveData(): boolean {
  return (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;
}

/**
 * 로그인·가입·비밀번호 화면 옆 판: 대화 한 줄이 뜨고, 그 말대로 구성도가 한 번 그려진다.
 * 그림은 서버에서 다 그린 채로 오고(스크립트가 꺼져도 보인다), 그리는 움직임은 CSS 만으로 덧입힌다.
 * 스크립트가 켜져 있고 움직임을 줄이지 않았으면 그 뒤로 흐름 빛·점 격자 훑기·배경 영상이 조용히 돈다.
 * 모서리 단추로 멈출 수 있고, 탭이 숨거나 판이 화면 밖이면 저절로 멈춘다.
 * 보조기기에는 그림 전체를 한 문장으로만 알리고, 멈춤 단추만 따로 읽힌다.
 */
export function AuthScene({ className }: { className?: string }) {
  const [rest] = useState(playedInThisTab);
  const [live, setLive] = useState(false);
  const [videoOk, setVideoOk] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const [away, setAway] = useState(false);
  const [bgReady, setBgReady] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const comets = useRef<Animation[]>([]);
  const paused = userPaused || away;

  useEffect(() => {
    playedInThisTab = true;
    // matchMedia 가 없는 환경(jsdom 등)에서는 움직이지 않는 그림으로 둔다.
    if (typeof window.matchMedia !== "function") return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      setLive(!reduce.matches);
      setVideoOk(!reduce.matches && !saveData());
    };
    sync();
    reduce.addEventListener("change", sync);
    return () => reduce.removeEventListener("change", sync);
  }, []);

  // 배경 그림: 포스터(또는 그림)가 실제로 불러지면 그때 깐다. 파일이 없으면 아무것도 그리지 않는다.
  useEffect(() => {
    if (!AUTH_BG) return;
    const probe = new Image();
    probe.onload = () => setBgReady(true);
    probe.src = AUTH_BG.kind === "video" ? AUTH_BG.poster : AUTH_BG.src;
    return () => {
      probe.onload = null;
    };
  }, []);

  // 탭이 숨거나 판이 화면 밖이면 멈춘다.
  useEffect(() => {
    if (!live) return;
    let hidden = document.visibilityState === "hidden";
    let off = false;
    const sync = () => setAway(hidden || off);
    const onVis = () => {
      hidden = document.visibilityState === "hidden";
      sync();
    };
    document.addEventListener("visibilitychange", onVis);
    const el = rootRef.current;
    const io =
      el && typeof IntersectionObserver === "function"
        ? new IntersectionObserver(([e]) => {
            off = !e!.isIntersecting;
            sync();
          })
        : null;
    if (el) io?.observe(el);
    sync();
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      io?.disconnect();
    };
  }, [live]);

  useEffect(() => {
    const svg = svgRef.current;
    if (!live || !svg || typeof svg.animate !== "function") return;
    const anims = startComets(svg, rest ? COMET_START.atRest : COMET_START.afterBuild);
    comets.current = anims;
    return () => {
      for (const a of anims) a.cancel();
      comets.current = [];
    };
  }, [live, rest]);

  const showVideo = bgReady && live && videoOk && AUTH_BG?.kind === "video";

  useEffect(() => {
    for (const a of comets.current) {
      if (paused) a.pause();
      else a.play();
    }
    const v = videoRef.current;
    if (!v) return;
    if (paused) v.pause();
    else v.play().catch(() => {});
  }, [paused, live, showVideo]);

  const still = bgReady && AUTH_BG ? (AUTH_BG.kind === "video" ? AUTH_BG.poster : AUTH_BG.src) : null;
  const cls = [className, styles.pane, rest ? null : styles.play, live ? styles.live : null, paused ? styles.paused : null].filter(Boolean).join(" ");

  return (
    <div ref={rootRef} className={cls}>
      {showVideo && AUTH_BG?.kind === "video" ? (
        <video ref={videoRef} className={styles.backdrop} src={AUTH_BG.src} poster={AUTH_BG.poster} muted playsInline loop preload="none" aria-hidden="true" />
      ) : (
        still && (
          // eslint-disable-next-line @next/next/no-img-element -- 장식 배경 한 장이라 크기 맞춤·최적화가 필요 없다
          <img className={styles.backdrop} src={still} alt="" aria-hidden="true" />
        )
      )}
      <div className={styles.sweep} aria-hidden="true">
        <div className={styles.sweepDots} />
      </div>
      <figure className={styles.scene} role="img" aria-label="대화로 설명하면 구성도가 그려지는 예시">
        <div className={styles.column} aria-hidden="true">
          <p className={`${chat.line} ${chat.user} ${styles.prompt}`}>{PROMPT}</p>
          <div className={styles.stage} style={{ width: SCENE_SIZE.width, height: SCENE_SIZE.height }}>
            {SCENE_ZONES.map((z) => {
              const { dashed, vars } = zoneVars(z.kind);
              return (
                <div key={z.id} className={`${styles.at} ${styles.zone}`} style={{ left: z.x, top: z.y, width: z.w, height: z.h, "--i": z.order } as CSSProperties}>
                  <div className={`group${dashed ? " group--dashed" : ""}`} style={vars as CSSProperties} data-inner={z.inner ? "true" : undefined} />
                </div>
              );
            })}
            <svg ref={svgRef} className={`edge-layer ${styles.edges}`} width={SCENE_SIZE.width} height={SCENE_SIZE.height} viewBox={`0 0 ${SCENE_SIZE.width} ${SCENE_SIZE.height}`}>
              {SCENE_EDGES.map((e) => (
                <g key={e.id} className="edge" style={{ "--i": e.order } as CSSProperties}>
                  <path className={`edge-line edge-line--request ${styles.line}`} d={toD(e.points)} pathLength={1} />
                  {e.junctions?.map(([x, y]) => <circle key={`${x},${y}`} className={`edge-junction ${styles.joint}`} cx={x} cy={y} r={2.5} />)}
                  {e.arrow && <path className={`edge-arrow edge-arrow--request ${styles.joint}`} d={arrowD(e.points)} />}
                </g>
              ))}
              {/* 흐름 빛: 처음엔 길 앞에 숨어 있다(dashoffset = 겹 길이). 스크립트가 켜지면 startComets 가 움직인다. */}
              {COMET_PATHS.map((pts, i) =>
                COMET_LAYERS.map((l) => (
                  <path
                    key={`${i}-${l.cls}`}
                    className={`motion-path motion-comet ${l.cls}`}
                    d={toD(pts)}
                    data-comet={i}
                    data-len={l.len}
                    strokeDasharray={`${l.len} ${COMET_LEN[i]! + 200}`}
                    strokeDashoffset={l.len}
                  />
                )),
              )}
            </svg>
            {/* 영역 이름 알약은 캔버스처럼 연결선 위 층에 둔다(머리 칸: 테두리 1 + 여백 10, 30px 머리 가운데). */}
            {SCENE_ZONES.map((z) => {
              const { vars } = zoneVars(z.kind);
              return (
                <div key={z.id} className={`${styles.at} ${styles.zone} ${styles.label}`} style={{ left: z.x + 11, top: z.y + 16, "--i": z.order } as CSSProperties}>
                  <span className={`group__name ${styles.name}`} style={vars as CSSProperties}>
                    {z.label}
                  </span>
                </div>
              );
            })}
            {SCENE_NODES.map((n) => (
              <div key={n.id} className={`${styles.at} ${styles.node}`} style={{ left: n.x, top: n.y, width: n.w, height: NODE_H, "--i": n.order } as CSSProperties}>
                <div className="node node--normal" data-category={n.category} style={{ "--cat": `var(--cat-${n.category})` } as CSSProperties}>
                  <span className="node__icon">
                    <CategoryIcon category={n.category} />
                  </span>
                  <span className="node__text">
                    <span className="node__label">{n.label}</span>
                    {n.sub && (
                      <span className="node__subrow">
                        <span className="node__sub">{n.sub}</span>
                      </span>
                    )}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </figure>
      {live && (
        <button type="button" className={styles.pause} onClick={() => setUserPaused((v) => !v)}>
          {userPaused ? "다시 재생" : "움직임 멈추기"}
        </button>
      )}
    </div>
  );
}
