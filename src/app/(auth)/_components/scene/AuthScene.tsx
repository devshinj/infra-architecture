"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

import styles from "./AuthScene.module.css";
import { AUTH_BG } from "./background";
import { COMET_PATHS, SCENE_CURVES, SCENE_POINTS, SCENE_SIZE, SCENE_ZONES, zonePath } from "./layout";

/** 장면의 주인공: 사용자가 하는 말 한 줄. */
const PROMPT = "사내 IDC에 WEB·WAS를 두 대씩 이중화해 줘";
const PROMPT_CHARS = Array.from(PROMPT);
/** 영역 이름 글자 크기(px). 등고선의 틈 폭을 이 크기로 어림한다. */
const ZONE_LABEL_PX = 11;

/**
 * 한 번 그렸으면 이 탭에서는 다시 그리지 않는다(로그인 ↔ 가입을 오가도 다 그린 장면으로 둔다).
 * 서버 렌더와 첫 화면은 늘 "그리는" 상태라 하이드레이션이 어긋나지 않는다. 이후 클라이언트 이동에서만 쉰 상태로 그린다.
 */
let playedInThisTab = false;

/** 흐름 빛: 꼬리 · 가운데 · 머리 세 겹. 캔버스 혜성(34px)보다 길게 해 멀리서도 읽힌다. 번짐은 없다. */
const COMET_LAYERS = [
  { len: 64, cls: styles.cometTail },
  { len: 30, cls: styles.cometMid },
  { len: 8, cls: styles.cometHead },
] as const;
const COMET_LEAD = COMET_LAYERS[0].len;
/** 혜성 속도(px/s)와 한 번 지난 뒤 쉬는 시간. 왼쪽 길과 오른쪽 길을 번갈아, 한 번에 하나만 지난다. */
const COMET = { speed: 130, restMs: 2500 } as const;
/** 혜성이 처음 출발하는 때: 처음 그리는 장면이면 다 그린 뒤(약 3.3초), 이미 그린 장면이면 곧바로. */
const COMET_START = { afterBuild: 3700, atRest: 600 } as const;

function startComets(svg: SVGSVGElement, startMs: number): Animation[] {
  const paths = [...svg.querySelectorAll<SVGPathElement>("[data-comet]")];
  const lengths = COMET_PATHS.map((_, i) => paths.find((p) => p.dataset.comet === String(i))!.getTotalLength());
  const travel = lengths.map((L) => ((L + COMET_LEAD) / COMET.speed) * 1000);
  const half = Math.max(...travel) + COMET.restMs;
  const cycle = half * COMET_PATHS.length;
  return paths.map((p) => {
    const i = Number(p.dataset.comet);
    const len = Number(p.dataset.len);
    const L = lengths[i]!;
    p.setAttribute("stroke-dasharray", `${len} ${L + 400}`);
    // 세 겹의 앞 끝이 함께 가도록 모두 같은 거리(길 + 가장 긴 겹)를 같은 시간에 간다.
    const end = len - (L + COMET_LEAD);
    p.style.visibility = "visible";
    return p.animate(
      [
        { offset: 0, strokeDashoffset: len },
        { offset: travel[i]! / cycle, strokeDashoffset: end },
        { offset: 1, strokeDashoffset: end },
      ],
      { duration: cycle, delay: startMs + i * half, iterations: Infinity, fill: "backwards" },
    );
  });
}

function saveData(): boolean {
  return (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;
}

/**
 * 로그인·가입·비밀번호 화면 옆 판: 말 한 줄이 쳐지고, 그 말대로 구성도가 별자리처럼 켜진다.
 * 문장과 그림은 서버에서 다 그린 채로 오고(스크립트가 꺼져도 다 보인다), 치기·켜기·긋기는 CSS 로 덧입힌다.
 * 그 뒤로 흐름 빛·점 격자 훑기·배경 그림 떠돎이 조용히 돈다. 모서리 단추로 멈출 수 있고, 탭이 숨거나 판이 화면 밖이면 저절로 멈춘다.
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
    // matchMedia 가 없는 환경(jsdom 등)에서는 움직이지 않는 장면으로 둔다.
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

  // 배경 그림: 실제로 불러지면 그때 깐다. 파일이 없으면 아무것도 그리지 않는다.
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
  const lastChar = PROMPT_CHARS.length - 1;

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
          <p className={styles.prompt}>
            {PROMPT_CHARS.map((ch, i) => (
              <span key={i} className={`${styles.char}${i === lastChar ? ` ${styles.charLast}` : ""}`} style={{ "--c": i } as CSSProperties}>
                {ch}
              </span>
            ))}
          </p>
          <svg ref={svgRef} className={styles.map} width={SCENE_SIZE.width} height={SCENE_SIZE.height} viewBox={`0 0 ${SCENE_SIZE.width} ${SCENE_SIZE.height}`}>
            {SCENE_ZONES.map((z) => {
              const { d, labelX } = zonePath(z, ZONE_LABEL_PX);
              return (
                <g key={z.id} style={{ "--i": z.order } as CSSProperties}>
                  <path className={styles.contour} d={d} pathLength={1} />
                  <text className={styles.zoneName} x={labelX} y={z.y}>
                    {z.label}
                  </text>
                </g>
              );
            })}
            {SCENE_CURVES.map((c) => (
              <path key={c.id} className={styles.curve} d={c.d} pathLength={1} style={{ "--i": c.order } as CSSProperties} />
            ))}
            {live &&
              COMET_PATHS.map((d, i) =>
                COMET_LAYERS.map((l) => <path key={`${i}-${l.len}`} className={`${styles.comet} ${l.cls}`} d={d} data-comet={i} data-len={l.len} />),
              )}
            {SCENE_POINTS.map((p) => {
              const r = p.shape === "ring" ? 5 : 3;
              const lx = p.x + r + 9;
              return (
                <g key={p.id} className={styles.point} style={{ "--i": p.order } as CSSProperties}>
                  <circle className={styles.halo} cx={p.x} cy={p.y} r={r} />
                  {p.shape === "ring" ? (
                    <>
                      <circle className={styles.ring} cx={p.x} cy={p.y} r={4.5} />
                      <circle className={styles.dot} cx={p.x} cy={p.y} r={1.5} />
                    </>
                  ) : (
                    <circle className={styles.dot} cx={p.x} cy={p.y} r={3} />
                  )}
                  <text className={styles.label} x={lx} y={p.y}>
                    {p.label}
                  </text>
                </g>
              );
            })}
          </svg>
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
