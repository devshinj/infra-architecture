"use client";

import { useEffect, useState, type CSSProperties } from "react";

import { CategoryIcon } from "@/canvas/icons";
import type { Category } from "@/domain/catalog";

import styles from "../auth.module.css";

/**
 * 로그인·가입·비밀번호 화면 왼쪽: 이 도구가 하는 일을 한 장면으로 보여 준다(DESIGN.md · Auth Stage).
 * 1) 말 한 줄 → AI 가 구성도를 그린다(노드가 하나씩 나타나고 선이 이어진다). 처음 한 번만.
 * 2) 그다음엔 대화가 "접속 흐름"과 "결제 흐름"을 번갈아 묻고, 그 흐름이 같은 구성도 위를 연두 점·연두 길로 지나간다.
 *    구성도는 지우지 않는다 — 빈 화면이 생기지 않고, 흐름 밖 노드는 앱처럼 흐려진다.
 * 동작 줄이기 설정이면 다 그려지고 접속 흐름이 켜진 장면으로 멈춘다. 탭이 가려지면 재생을 멈춘다.
 * 그림은 장식이라 보조기기에 숨기고, 화면 제목(h1)은 양식의 것 하나만 둔다.
 */

type NodeId = "user" | "l4" | "was1" | "was2" | "db1" | "db2" | "pg";
type FlowKey = "A" | "B";

/** 그려지는 묶음(1부터): 사용자 → L4 → WAS → DB → 결제 PG. */
const BUILT = { USER: 1, L4: 2, WAS: 3, DB: 4, PG: 5 } as const;

const FLOWS: Record<FlowKey, { name: string; ask: string; reply: string; path: string; stops: number[]; nodes: NodeId[]; steps: string[] }> = {
  A: {
    name: "접속 흐름",
    ask: "접속 흐름 보여줘",
    reply: "사용자 요청이 DB 까지 이렇게 가요.",
    path: "M205 20V160H91V320",
    // 길 위의 거리(%): 사용자 · L4 · WAS#1 · DB Primary 가운데
    stops: [0, 23.2, 74.9, 100],
    nodes: ["user", "l4", "was1", "db1"],
    steps: ["접속", "분산", "처리", "저장"],
  },
  B: {
    name: "결제 흐름",
    ask: "결제 흐름은?",
    reply: "주문은 WAS#2 를 거쳐 결제 PG 로 가요.",
    path: "M205 20V160H239V216H415",
    stops: [0, 23.6, 56.7, 100],
    nodes: ["user", "l4", "was2", "pg"],
    steps: ["주문", "분산", "처리", "결제"],
  },
};

type Chat = { k: string; ask: string; reply: string | null; flow: FlowKey | null };
type Scene = { built: number; chat: Chat | null; chatOut: boolean; flow: FlowKey | null; at: number; flowOut: boolean };

const BUILD_ASK = "쇼핑몰이야. WAS 두 대에 DB 복제하고 결제 PG 붙여줘";
const EMPTY: Scene = { built: 0, chat: null, chatOut: false, flow: null, at: -1, flowOut: false };
/** 동작 줄이기·첫 그림 대신 보일 마지막 장면. */
const STILL: Scene = { built: BUILT.PG, chat: { k: "A", ask: FLOWS.A.ask, reply: FLOWS.A.reply, flow: "A" }, chatOut: false, flow: "A", at: 3, flowOut: false };

type Action = [wait: number, update: (s: Scene) => Scene];

/** 처음 한 번: 요청 → 그리는 중 → 노드가 600ms 간격으로 나타난다 → 다 그렸다. */
const BUILD: Action[] = [
  [300, (s) => ({ ...s, chat: { k: "build", ask: BUILD_ASK, reply: null, flow: null } })],
  [800, (s) => ({ ...s, chat: { k: "build", ask: BUILD_ASK, reply: "그리는 중…", flow: null } })],
  [500, (s) => ({ ...s, built: BUILT.USER })],
  [600, (s) => ({ ...s, built: BUILT.L4 })],
  [600, (s) => ({ ...s, built: BUILT.WAS })],
  [600, (s) => ({ ...s, built: BUILT.DB })],
  [600, (s) => ({ ...s, built: BUILT.PG })],
  [700, (s) => ({ ...s, chat: { k: "build", ask: BUILD_ASK, reply: "노드 7개와 연결 7개를 그렸어요.", flow: null } })],
];

/**
 * 흐름 한 바퀴(약 11초): 대화가 바뀌고 → 점이 단계마다 1100ms 움직이고 500ms 머문다(CSS 와 같은 값)
 * → 다 지난 길을 잠시 보여 준 뒤 천천히 흐려진다(900ms) → 다음 흐름.
 */
const flowRound = (key: FlowKey, firstWait: number): Action[] => {
  const f = FLOWS[key];
  return [
    [firstWait, (s) => ({ ...s, chatOut: true })],
    [240, (s) => ({ ...s, chatOut: false, chat: { k: key, ask: f.ask, reply: "찾는 중…", flow: null } })],
    [900, (s) => ({ ...s, chat: { k: key, ask: f.ask, reply: f.reply, flow: key }, flow: key, at: 0, flowOut: false })],
    [1000, (s) => ({ ...s, at: 1 })],
    [1600, (s) => ({ ...s, at: 2 })],
    [1600, (s) => ({ ...s, at: 3 })],
    [3000, (s) => ({ ...s, flowOut: true })],
    [1100, (s) => ({ ...s, flow: null, at: -1, flowOut: false })],
  ];
};
const LOOP: Action[] = [...flowRound("A", 600), ...flowRound("B", 400)];

function useScene(): Scene {
  const [scene, setScene] = useState<Scene>(EMPTY);
  useEffect(() => {
    const reduce = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setScene(STILL);
      return;
    }
    // 처음엔 BUILD 를 한 번, 그 뒤 LOOP 를 끝없이. 탭이 가려지면 다음 동작을 미루고, 돌아오면 이어 간다.
    let list = BUILD;
    let i = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const run = () => {
      const [wait, update] = list[i];
      timer = setTimeout(() => {
        timer = undefined;
        setScene(update);
        i += 1;
        if (i >= list.length) {
          list = LOOP;
          i = 0;
        }
        if (document.visibilityState !== "hidden") run();
      }, wait);
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        clearTimeout(timer);
        timer = undefined;
      } else if (timer === undefined) run();
    };
    document.addEventListener("visibilitychange", onVisibility);
    run();
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);
  return scene;
}

type Box = { x: number; y: number; w?: number; h?: number };
const at = ({ x, y, w, h }: Box): CSSProperties => ({ left: x, top: y, ...(w !== undefined ? { width: w } : {}), ...(h !== undefined ? { height: h } : {}) });
const flag = (on: boolean) => (on ? "" : undefined);

export function AuthStage() {
  const scene = useScene();
  const { built } = scene;
  const flow = scene.flow ? FLOWS[scene.flow] : null;
  const flowing = flow !== null && !scene.flowOut;

  const node = (id: NodeId, step: number, x: number, y: number, label: string, sub: string, category: Category) => {
    const inFlow = flowing && flow.nodes.includes(id);
    const state = !flowing ? undefined : !inFlow ? "dim" : flow.nodes.indexOf(id) === scene.at ? "now" : undefined;
    return (
      <div
        className={styles.stageNode}
        data-on={flag(built >= step)}
        data-flow={state}
        style={{ ...at({ x, y }), "--cat": `var(--cat-${category})` } as CSSProperties}
      >
        <span className={styles.stageCoin}>
          <CategoryIcon category={category} />
        </span>
        <span>
          <b>{label}</b>
          <small>{sub}</small>
        </span>
      </div>
    );
  };
  const zone = (step: number, name: string, tint: string, box: Box) => (
    <div className={styles.stageZone} data-on={flag(built >= step)} style={{ ...at(box), "--tint": `var(--zone-tint-${tint})` } as CSSProperties}>
      <span className={styles.stageZoneName}>{name}</span>
    </div>
  );
  const label = (step: number, x: number, y: number, text: string) => (
    <span className={styles.stageLabel} data-on={flag(built >= step)} data-dim={flag(flowing)} style={at({ x, y })}>
      {text}
    </span>
  );
  // 요청선은 그어지듯 나타나고(pathLength 1 로 길이를 맞춘다), 점선·겹선은 제 무늬를 지키려 흐려졌다 나타난다.
  const edge = (step: number, d: string, kind?: "async" | "replication") => (
    <path d={d} pathLength={kind ? undefined : 1} data-kind={kind} data-on={flag(built >= step)} data-dim={flag(flowing)} />
  );

  return (
    <section className={styles.stage} aria-label="InfraSketch 소개">
      <p className={styles.stageTitle}>말로 그리는 인프라 구성도</p>
      <div className={styles.stageScene} data-auth-diagram="" aria-hidden="true">
        <div className={styles.stageDiagram}>
          <svg className={styles.stageEdges} width="480" height="364" viewBox="0 0 480 364">
            {edge(BUILT.L4, "M205 40V96")}
            {edge(BUILT.WAS, "M205 136V160H91V196M205 160H239V196")}
            {edge(BUILT.DB, "M91 236V300M239 236V272H91")}
            {edge(BUILT.DB, "M146 317.5H200M146 322.5H200", "replication")}
            {edge(BUILT.PG, "M294 216H360", "async")}
            {(Object.keys(FLOWS) as FlowKey[]).map((k) => {
              const on = scene.flow === k && !scene.flowOut;
              const reach = on ? FLOWS[k].stops[scene.at] / 100 : 0;
              return (
                <path
                  key={k}
                  className={styles.stageFlowLine}
                  d={FLOWS[k].path}
                  pathLength={1}
                  data-on={flag(on)}
                  style={{ strokeDashoffset: 1 - reach }}
                />
              );
            })}
          </svg>
          {zone(BUILT.L4, "사내 IDC", "onprem", { x: 0, y: 72, w: 330, h: 292 })}
          {zone(BUILT.WAS, "WAS VIP", "redundancy", { x: 16, y: 176, w: 298, h: 76 })}
          {zone(BUILT.PG, "외부 서비스", "external", { x: 350, y: 170, w: 130, h: 84 })}
          {(Object.keys(FLOWS) as FlowKey[]).map((k) => {
            const on = scene.flow === k && !scene.flowOut;
            return (
              <span
                key={k}
                className={styles.stageFlowDot}
                data-on={flag(on)}
                style={{ offsetPath: `path("${FLOWS[k].path}")`, offsetDistance: `${on ? FLOWS[k].stops[scene.at] : 0}%` }}
              />
            );
          })}
          {node("user", BUILT.USER, 150, 0, "사용자", "Web", "client")}
          {node("l4", BUILT.L4, 150, 96, "L4", "VIP", "network")}
          {node("was1", BUILT.WAS, 36, 196, "WAS#1", "Tomcat", "compute")}
          {node("was2", BUILT.WAS, 184, 196, "WAS#2", "Tomcat", "compute")}
          {node("db1", BUILT.DB, 36, 300, "DB", "Primary", "data")}
          {node("db2", BUILT.DB, 200, 300, "DB", "Standby", "data")}
          {node("pg", BUILT.PG, 360, 196, "결제 PG", "Webhook", "external")}
          {label(BUILT.L4, 213, 56, "HTTPS 443")}
          {label(BUILT.DB, 99, 278, "TCP 1521")}
          {label(BUILT.DB, 156, 296, "복제")}
          {label(BUILT.PG, 314, 192, "웹훅")}
        </div>
        <div className={styles.stageChat} data-out={flag(scene.chatOut)}>
          {scene.chat && (
            <div key={scene.chat.k} className={styles.stageChatBody}>
              <p className={styles.stageAsk}>{scene.chat.ask}</p>
              <p key={scene.chat.reply ?? ""} className={styles.stageReply} data-on={flag(scene.chat.reply !== null)}>
                {scene.chat.reply}
              </p>
              <FlowSteps flow={scene.chat.flow} at={scene.chat.flow === scene.flow && !scene.flowOut ? scene.at : -1} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function FlowSteps({ flow, at }: { flow: FlowKey | null; at: number }) {
  const f = flow ? FLOWS[flow] : null;
  return (
    <div className={styles.stageFlow} data-on={flag(f !== null)}>
      <span className={styles.stageFlowName}>{f?.name}</span>
      <ol className={styles.stageSteps}>
        {(f?.steps ?? FLOWS.A.steps).map((name, i) => (
          <li key={name} data-state={i === at ? "now" : i < at ? "done" : undefined}>
            <span>{i + 1}</span>
            {name}
          </li>
        ))}
      </ol>
    </div>
  );
}
