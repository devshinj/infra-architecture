import type { NodeProps } from "@xyflow/react";

import type { Category } from "@/domain/catalog";

import "./canvas.css";
import { CategoryIcon } from "./icons";

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
  /** 위치 보기 강조 토큰. 있으면 은빛 링이 두 번 돈다(바뀌면 처음부터). */
  pulse?: number;
  /** Compare mode marker. */
  diff?: "added" | "removed" | "changed";
  /** Click on the missing badge; the click does not select the node. */
  onBadgeClick?: () => void;
  /** Click on the warning badge (selects the node: 설명 탭의 주의할 점). */
  onWarnBadgeClick?: () => void;
}

export function NodeCard({ data }: Pick<NodeProps, "data"> & Partial<NodeProps>) {
  const d = data as NodeCardData;
  const missing = d.badges?.missing ?? 0;
  const warn = d.badges?.warn ?? 0;
  return (
    <div className={`node node--${d.state}${d.diff ? ` node--diff-${d.diff}` : ""}${d.pulse !== undefined ? " node--pulse" : ""}`} title={d.fullLabel} data-category={d.category} style={{ "--cat": `var(--cat-${d.category})` } as React.CSSProperties}>
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
      {d.state === "updated" && <span className="node__updated" />}
      {d.pulse !== undefined && <span key={d.pulse} className="node__pulse" aria-hidden="true" />}
    </div>
  );
}
