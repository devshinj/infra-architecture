"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

import type { DiagramState } from "@/domain/types";

import type { ExplanationProps } from "./explain/Explanation";
import styles from "./app.module.css";
import { ChatPanel, type ChatPanelProps } from "./chat/ChatPanel";
import { FlowPanel, type FlowPanelProps } from "./flows/FlowPanel";
import { HistoryPanel, type HistoryPanelProps } from "./HistoryPanel";
import { NodeInfo, type NodeInfoProps } from "./NodeInfo";
import { TABS, type Tab } from "./panelTabs";

export { TABS, type Tab };
export const RIGHT_PANEL_BODY_ID = "right-panel-body";

export interface RightPanelProps {
  state: DiagramState;
  selectedId: string | null;
  onSelect(id: string): void;
  /** 설명 tab "노드 링크 복사". */
  onMention?(id: string): void;
  mentionDisabled?: boolean;
  history: HistoryPanelProps;
  chat: ChatPanelProps;
  /** Fired when the 이력 tab becomes active so the parent can (re)load versions. */
  onHistoryOpen?(): void;
  /** Optional controlled tab (e.g. the chat switches to 이력 on `open_history`). Uncontrolled when omitted. */
  tab?: Tab;
  onTabChange?(tab: Tab): void;
  /** 설명 탭 주의할 점의 의도된 구성 / 다시 경고. 없으면 버튼을 숨긴다. */
  cautions?: Pick<NodeInfoProps, "onIgnoreWarning" | "ignoreDisabled" | "ignoreError">;
  /** 주의할 점을 계산할 상태(비교 모드는 합친 그림이 아니라 현재 상태). 없으면 state. */
  warningState?: DiagramState;
  /** 선택한 노드·연결의 설명. 없으면 설명 절을 그리지 않는다. */
  explain?: ExplanationProps;
  /** 설명 탭 맨 아래 "이 노드에 대해 물어보기". 없으면 숨긴다. */
  ask?: NodeInfoProps["ask"];
  /** 현재 판을 보고 있음(기본 true). 이전 버전 보기·비교에서는 대화를 못 하므로 빈 구성도 인사말을 숨긴다. */
  live?: boolean;
  /**
   * 바깥 탭 막대(좁은 화면의 아래 탭)가 탭을 고른다: 패널 안 탭 줄을 숨기고, 본문은 tabIdOf(tab) 로 이름 붙인다.
   * 없으면 패널 안 탭 줄을 그린다.
   */
  externalTabs?: { tabIdOf(tab: Tab): string; request: { tab: Tab; token: number } | null };
  /** 흐름 탭. 설명 탭의 "지나는 흐름" 칩도 이것으로 흐름을 켠다. 없으면 흐름 탭은 빈 안내만 보인다. */
  flows?: FlowPanelProps;
  /** 설명 탭: AI 추정 망연계의 맞아요·아니에요. 없으면(이력 보기 등) 추정 표시만 보인다. */
  linkGuess?: NodeInfoProps["linkGuess"];
}

export function RightPanel({ state, selectedId, onSelect, onMention, mentionDisabled, history, chat, onHistoryOpen, tab: controlledTab, onTabChange, cautions, warningState, explain, ask, live = true, externalTabs, flows, linkGuess }: RightPanelProps) {
  const [innerTab, setInnerTab] = useState<Tab>("대화");
  const tab = controlledTab ?? innerTab;
  const setTab = (t: Tab) => {
    setInnerTab(t);
    onTabChange?.(t);
  };
  const [before, setBefore] = useState<Tab | null>(null); // tab to return to when the selection clears
  const seenSelected = useRef<string | null>(selectedId);

  // Any new selection switches to 설명 (remembering the tab we left); clearing it returns there.
  // Runs in an effect: setTab may notify the parent, which must not happen during render.
  useEffect(() => {
    if (seenSelected.current === selectedId) return;
    seenSelected.current = selectedId;
    if (selectedId !== null) {
      if (tab !== "설명") {
        if (before === null) setBefore(tab);
        setTab("설명");
      }
    } else if (before !== null) {
      setTab(before);
      setBefore(null);
    }
  });

  const choose = (t: Tab) => {
    setBefore(null); // 직접 고른 탭이 우선이다. 선택이 풀려도 그 탭에 남는다.
    setTab(t);
    if (t === "이력") onHistoryOpen?.();
  };
  // 설명 탭의 흐름 칩: 흐름 탭을 직접 고른 것처럼 연다(흐름을 켜면 선택이 풀려도 흐름 탭에 남는다).
  const openFlow = (key: string) => {
    choose("흐름");
    flows?.onActivate(key);
  };

  // 바깥 탭 막대에서 고른 탭: 패널 안 탭을 누른 것과 같다. 그리기 전에 바꿔 옛 탭이 한 번 비치지 않게.
  const request = externalTabs?.request ?? null;
  const handled = useRef(request?.token ?? 0);
  useLayoutEffect(() => {
    if (!request || request.token === handled.current) return;
    handled.current = request.token;
    choose(request.tab);
  });

  return (
    <aside className={styles.panel} aria-label="오른쪽 패널">
      {!externalTabs && (
        <div className={styles.tabs} role="tablist">
          {TABS.map((t) => (
            <button key={t} type="button" role="tab" id={`tab-${t}`} aria-selected={tab === t} aria-controls={RIGHT_PANEL_BODY_ID} className={styles.tab} onClick={() => choose(t)}>
              {t}
            </button>
          ))}
        </div>
      )}
      <div className={styles.panelBody} role="tabpanel" id={RIGHT_PANEL_BODY_ID} aria-labelledby={externalTabs ? externalTabs.tabIdOf(tab) : `tab-${tab}`}>
        {tab === "대화" && (
          <ChatPanel
            {...chat}
            emptyDiagram={live && Object.keys(state.nodes).length === 0}
          />
        )}
        {tab === "설명" && <NodeInfo state={state} selectedId={selectedId} onSelect={onSelect} {...(onMention ? { onMention } : {})} {...(mentionDisabled ? { mentionDisabled } : {})} {...cautions} {...(warningState ? { warningState } : {})} {...(explain ? { explain } : {})} {...(ask ? { ask } : {})} {...(flows ? { flows: { list: flows.flows, onOpen: openFlow } } : {})} {...(linkGuess ? { linkGuess } : {})} />}
        {tab === "이력" && <HistoryPanel {...history} />}
        {tab === "흐름" && flows && <FlowPanel {...flows} />}
      </div>
    </aside>
  );
}
