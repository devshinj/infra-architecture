"use client";

import { useEffect, type CSSProperties } from "react";

// 캔버스의 노드·영역·연결선 모양을 그대로 쓴다. 이 둘은 CSS 와 아이콘뿐이라 React Flow·ELK 를 끌고 오지 않는다.
import "@/canvas/canvas.css";
import "@/canvas/edges.css";
import { CategoryIcon } from "@/canvas/icons";
import { GROUP_KINDS } from "@/domain/catalog";
import chat from "@/ui/chat/chat.module.css";

import { NODE_H, SCENE_EDGES, SCENE_NODES, SCENE_SIZE, SCENE_ZONES, type SceneEdge } from "./layout";
import styles from "./AuthScene.module.css";

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

/**
 * 로그인·가입·비밀번호 화면 옆 장면: 대화 한 줄이 뜨고, 그 말대로 구성도가 한 번 그려진 뒤 멈춘다.
 * 그림은 서버에서 다 그린 채로 오고(스크립트가 꺼져도 보인다), 움직임은 CSS 만으로 덧입힌다.
 * 보조기기에는 그림 전체를 한 문장으로만 알린다.
 */
export function AuthScene() {
  const rest = playedInThisTab;
  useEffect(() => {
    playedInThisTab = true;
  }, []);
  return (
    <figure className={`${styles.scene}${rest ? "" : ` ${styles.play}`}`} role="img" aria-label="대화로 설명하면 구성도가 그려지는 예시">
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
          <svg className={`edge-layer ${styles.edges}`} width={SCENE_SIZE.width} height={SCENE_SIZE.height} viewBox={`0 0 ${SCENE_SIZE.width} ${SCENE_SIZE.height}`}>
            {SCENE_EDGES.map((e) => (
              <g key={e.id} className="edge" style={{ "--i": e.order } as CSSProperties}>
                <path className={`edge-line edge-line--request ${styles.line}`} d={toD(e.points)} pathLength={1} />
                {e.junctions?.map(([x, y]) => <circle key={`${x},${y}`} className={`edge-junction ${styles.joint}`} cx={x} cy={y} r={2.5} />)}
                {e.arrow && <path className={`edge-arrow edge-arrow--request ${styles.joint}`} d={arrowD(e.points)} />}
              </g>
            ))}
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
  );
}
