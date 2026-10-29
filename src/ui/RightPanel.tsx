"use client";

import { useState } from "react";

import type { DiagramState } from "@/domain/types";

import styles from "./app.module.css";
import { HistoryPanel, type HistoryPanelProps } from "./HistoryPanel";
import { NodeInfo } from "./NodeInfo";

export type Tab = "대화" | "설명" | "이력";
const TABS: Tab[] = ["대화", "설명", "이력"];

export interface RightPanelProps {
  state: DiagramState;
  selectedId: string | null;
  onSelect(id: string): void;
  samples: { id: string; title: string }[];
  onImportSample(sampleId: string): void;
  importing?: boolean;
  history: HistoryPanelProps;
  /** Fired when the 이력 tab becomes active so the parent can (re)load versions. */
  onHistoryOpen?(): void;
}

export function RightPanel({ state, selectedId, onSelect, samples, onImportSample, importing = false, history, onHistoryOpen }: RightPanelProps) {
  const [tab, setTab] = useState<Tab>("대화");
  const [before, setBefore] = useState<Tab | null>(null); // tab to return to when the selection clears
  const [seenSelected, setSeenSelected] = useState<string | null>(selectedId);

  // Selecting a node/edge switches to 설명; clearing the selection restores the previous tab.
  if (seenSelected !== selectedId) {
    setSeenSelected(selectedId);
    if (selectedId !== null && seenSelected === null) {
      setBefore(tab);
      setTab("설명");
    } else if (selectedId === null && before !== null) {
      setTab(before);
      setBefore(null);
    }
  }

  const choose = (t: Tab) => {
    setTab(t);
    setBefore(null);
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
          <div className={styles.chatEmpty}>
            <p>AI 대화는 곧 연결됩니다. 지금은 샘플을 불러와 화면을 확인할 수 있어요.</p>
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
        )}
        {tab === "설명" && <NodeInfo state={state} selectedId={selectedId} onSelect={onSelect} />}
        {tab === "이력" && <HistoryPanel {...history} />}
      </div>
    </aside>
  );
}
