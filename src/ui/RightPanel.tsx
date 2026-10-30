"use client";

import { useEffect, useRef, useState } from "react";

import type { DiagramState } from "@/domain/types";

import type { ExplanationProps } from "./explain/Explanation";
import styles from "./app.module.css";
import { ChatPanel, type ChatPanelProps } from "./chat/ChatPanel";
import { HistoryPanel, type HistoryPanelProps } from "./HistoryPanel";
import { NodeInfo, type NodeInfoProps } from "./NodeInfo";

export type Tab = "대화" | "설명" | "이력";
const TABS: Tab[] = ["대화", "설명", "이력"];

export interface RightPanelProps {
  state: DiagramState;
  selectedId: string | null;
  onSelect(id: string): void;
  /** 설명 tab "노드 링크 복사". */
  onMention?(id: string): void;
  mentionDisabled?: boolean;
  samples: { id: string; title: string }[];
  onImportSample(sampleId: string): void;
  importing?: boolean;
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
}

export function RightPanel({ state, selectedId, onSelect, onMention, mentionDisabled, samples, onImportSample, importing = false, history, chat, onHistoryOpen, tab: controlledTab, onTabChange, cautions, warningState, explain }: RightPanelProps) {
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

  return (
    <aside className={styles.panel} aria-label="오른쪽 패널">
      <div className={styles.tabs} role="tablist">
        {TABS.map((t) => (
          <button key={t} type="button" role="tab" id={`tab-${t}`} aria-selected={tab === t} aria-controls="right-panel-body" className={styles.tab} onClick={() => choose(t)}>
            {t}
          </button>
        ))}
      </div>
      <div className={styles.panelBody} role="tabpanel" id="right-panel-body" aria-labelledby={`tab-${tab}`}>
        {tab === "대화" && (
          <ChatPanel
            {...chat}
            footer={
              Object.keys(state.nodes).length === 0 && samples.length > 0 ? (
                <div className={styles.chatEmpty}>
                  <p>또는 샘플로 시작하기</p>
                  <ul className={styles.samples}>
                    {samples.map((s) => (
                      <li key={s.id} className={styles.sample}>
                        <span>{s.title}</span>
                        <button type="button" className={styles.btn} disabled={importing} aria-label={`${s.title} 불러오기`} onClick={() => onImportSample(s.id)}>
                          불러오기
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null
            }
          />
        )}
        {tab === "설명" && <NodeInfo state={state} selectedId={selectedId} onSelect={onSelect} {...(onMention ? { onMention } : {})} {...(mentionDisabled ? { mentionDisabled } : {})} {...cautions} {...(warningState ? { warningState } : {})} {...(explain ? { explain } : {})} />}
        {tab === "이력" && <HistoryPanel {...history} />}
      </div>
    </aside>
  );
}
