import type { CSSProperties } from "react";

import { CategoryIcon } from "@/canvas/icons";
import type { Category } from "@/domain/catalog";

import styles from "../auth.module.css";

/**
 * 로그인·가입·비밀번호 화면 왼쪽: 무엇을 하는 도구인지 보이는 작은 구성도(DESIGN.md · The Living Blueprint).
 * 캔버스와 같은 문법(점 격자, 영역 이름 알약, 노드 아이콘 원, 연결선 종류, 프로토콜 라벨)으로 그린 정지 그림이다.
 * 그림은 장식이라 보조기기에 숨기고, 소개 글만 읽힌다. 화면 제목(h1)은 양식의 것 하나만 둔다.
 */

type Box = { x: number; y: number; w?: number; h?: number };
const at = ({ x, y, w, h }: Box): CSSProperties => ({ left: x, top: y, ...(w !== undefined ? { width: w } : {}), ...(h !== undefined ? { height: h } : {}) });

function Node({ x, y, label, sub, category, selected = false }: { x: number; y: number; label: string; sub: string; category: Category; selected?: boolean }) {
  return (
    <div className={styles.stageNode} data-selected={selected || undefined} style={{ ...at({ x, y }), "--cat": `var(--cat-${category})` } as CSSProperties}>
      <span className={styles.stageCoin}>
        <CategoryIcon category={category} />
      </span>
      <span>
        <b>{label}</b>
        <small>{sub}</small>
      </span>
    </div>
  );
}

function Zone({ name, tint, dashed = false, ...box }: Box & { name: string; tint: string; dashed?: boolean }) {
  return (
    <div className={styles.stageZone} data-dashed={dashed || undefined} style={{ ...at(box), "--tint": `var(--zone-tint-${tint})` } as CSSProperties}>
      <span className={styles.stageZoneName}>{name}</span>
    </div>
  );
}

const Label = ({ x, y, children }: { x: number; y: number; children: string }) => (
  <span className={styles.stageLabel} style={at({ x, y })}>
    {children}
  </span>
);

export function AuthStage() {
  return (
    <section className={styles.stage} aria-label="InfraSketch 소개">
      <div className={styles.stageSay}>
        <p className={styles.stageTitle}>말하면 구성도가 그려져요</p>
        <p className={styles.stageText}>서비스를 대화로 설명하면 서버·DB·외부 연동이 영역과 연결선으로 정리되고, 빠진 정보와 이상한 구성을 먼저 짚어 줘요.</p>
      </div>
      <div className={styles.stageDiagram} data-auth-diagram="" aria-hidden="true">
        <svg className={styles.stageEdges} width="640" height="440" viewBox="0 0 640 440">
          <path data-kind="lit" d="M260 40V104" />
          <path data-kind="lit" d="M260 144V180H155V214M260 180H310V214" />
          <path d="M155 254V334M310 254V294H155" />
          <path data-kind="replication" d="M210 351.5H280M210 356.5H280" />
          <path data-kind="async" d="M365 234H420V242H490" />
        </svg>
        <Zone name="사내 IDC" tint="onprem" dashed x={40} y={80} w={400} h={340} />
        <Zone name="WAS VIP" tint="redundancy" dashed x={84} y={196} w={296} h={76} />
        <Zone name="외부 서비스" tint="external" dashed x={470} y={196} w={150} h={92} />
        <Node x={205} y={0} label="사용자" sub="Web" category="client" />
        <Node x={205} y={104} label="L4" sub="VIP" category="network" />
        <Node x={100} y={214} label="WAS#1" sub="Tomcat" category="compute" selected />
        <Node x={255} y={214} label="WAS#2" sub="Tomcat" category="compute" />
        <Node x={100} y={334} label="DB" sub="Primary" category="data" />
        <Node x={280} y={334} label="DB" sub="Standby" category="data" />
        <Node x={490} y={222} label="결제 PG" sub="Webhook" category="external" />
        <Label x={268} y={64}>HTTPS 443</Label>
        <Label x={163} y={300}>TCP 1521</Label>
        <Label x={222} y={334}>복제</Label>
        <Label x={410} y={214}>웹훅</Label>
      </div>
      <p className={styles.stageAsk} aria-hidden="true">
        결제 PG 붙이고 <span>@WAS#1</span> 메모리 32GB로 올려줘
      </p>
    </section>
  );
}
