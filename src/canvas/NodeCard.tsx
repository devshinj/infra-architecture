import { useEffect, useId, useRef } from "react";
import type { NodeProps } from "@xyflow/react";

import type { Category } from "@/domain/catalog";

import "./canvas.css";
import { CategoryIcon } from "./icons";
import { NameTooltip, isKeyboardFocus, useNameTooltip } from "./NameTooltip";

export type NodeVisualState = "normal" | "selected" | "dimmed" | "faded" | "appearing" | "updated";

export interface NodeCardData extends Record<string, unknown> {
  label: string;
  fullLabel: string;
  sub?: string;
  category: Category;
  state: NodeVisualState;
  /** 빠진 정보 수와 경고 수. 둘 다 있으면 경고 "!" 가 빠진 정보 배지 왼쪽에 나란히 놓인다. */
  badges?: { missing?: number; warn?: number };
  az?: string;
  /** 이름이나 보조 글자가 줄임표로 잘렸는가. 참이면 title 대신 말풍선으로 전체를 보여 준다. */
  truncated?: boolean;
  /** 잘리지 않은 전체 보조 글자(말풍선용). */
  fullSub?: string;
  /** 위치 보기 강조 토큰. 있으면 은빛 링이 두 번 돈다(바뀌면 처음부터). */
  pulse?: number;
  /** Compare mode marker. */
  diff?: "added" | "removed" | "changed";
  /** Click on the missing badge; the click does not select the node. */
  onBadgeClick?: () => void;
  /** Click on the warning badge (selects the node: 설명 탭의 주의할 점). */
  onWarnBadgeClick?: () => void;
}

export function NodeCard({ data, dragging }: Pick<NodeProps, "data"> & Partial<NodeProps>) {
  const d = data as NodeCardData;
  const tipId = useId();
  const ref = useRef<HTMLDivElement>(null);
  const truncated = d.truncated === true;
  // 끄는 중이거나 흐려진 노드(불투명도를 물려받아 안 보인다)에는 말풍선을 띄우지 않는다.
  const tip = useNameTooltip(truncated && !dragging && d.state !== "dimmed" && d.state !== "faded");
  const setTip = tip.set;
  // 키보드 포커스는 카드가 아니라 React Flow 노드 래퍼가 받는다.
  useEffect(() => {
    const wrapper = ref.current?.closest<HTMLElement>(".react-flow__node");
    if (!wrapper || !truncated) return;
    // 마우스 클릭으로 받은 포커스는 치지 않는다(마우스를 떠나도 남아 있게 되므로).
    const on = () => {
      if (isKeyboardFocus(wrapper)) setTip("focus", true);
    };
    const off = () => setTip("focus", false);
    wrapper.addEventListener("focusin", on);
    wrapper.addEventListener("focusout", off);
    return () => {
      wrapper.removeEventListener("focusin", on);
      wrapper.removeEventListener("focusout", off);
    };
  }, [truncated, setTip]);
  const missing = d.badges?.missing ?? 0;
  const warn = d.badges?.warn ?? 0;
  return (
    <div ref={ref} onMouseEnter={truncated ? () => setTip("hover", true) : undefined} onMouseLeave={truncated ? () => setTip("hover", false) : undefined} aria-describedby={tip.open ? tipId : undefined} className={`node node--${d.state}${d.diff ? ` node--diff-${d.diff}` : ""}${d.pulse !== undefined ? " node--pulse" : ""}`} title={truncated ? undefined : d.fullLabel} data-category={d.category} style={{ "--cat": `var(--cat-${d.category})` } as React.CSSProperties}>
      <span className="node__icon">
        <CategoryIcon category={d.category} />
      </span>
      <span className="node__text">
        <span className="node__label">{d.label}</span>
        {(d.sub || d.az) && (
          <span className="node__subrow">
            {d.sub && <span className="node__sub">{d.sub}</span>}
            {d.az && <span className="node__az">AZ {d.az}</span>}
          </span>
        )}
      </span>
      {warn > 0 && (
        <button
          type="button"
          className={`node__badge node__badge--warn${missing > 0 ? " node__badge--pair" : ""} nodrag nopan nokey`}
          aria-label={`경고 ${warn}개`}
          onClick={(e) => {
            e.stopPropagation();
            d.onWarnBadgeClick?.();
          }}
        >
          !
        </button>
      )}
      {missing > 0 && (
        <button
          type="button"
          className="node__badge node__badge--missing nodrag nopan nokey"
          aria-label={`빠진 정보 ${missing}개`}
          onClick={(e) => {
            e.stopPropagation();
            d.onBadgeClick?.();
          }}
        >
          {missing}
        </button>
      )}
      {tip.open && <NameTooltip id={tipId} label={d.fullLabel} sub={d.fullSub} />}
      {d.state === "updated" && <span className="node__updated" />}
      {d.pulse !== undefined && <span key={d.pulse} className="node__pulse" aria-hidden="true" />}
    </div>
  );
}
