import type { NodeProps } from "@xyflow/react";

import type { Category } from "@/domain/catalog";

import "./canvas.css";
import { CategoryIcon } from "./icons";

export type NodeVisualState = "normal" | "selected" | "dimmed" | "appearing" | "updated";

export interface NodeCardData extends Record<string, unknown> {
  label: string;
  fullLabel: string;
  sub?: string;
  category: Category;
  state: NodeVisualState;
  badge?: { kind: "missing" | "warn"; count?: number };
  az?: string;
  /** Compare mode marker. */
  diff?: "added" | "removed" | "changed";
  /** Click on the missing badge; the click does not select the node. */
  onBadgeClick?: () => void;
}

export function NodeCard({ data }: Pick<NodeProps, "data"> & Partial<NodeProps>) {
  const d = data as NodeCardData;
  return (
    <div className={`node node--${d.state}${d.diff ? ` node--diff-${d.diff}` : ""}`} title={d.fullLabel} data-category={d.category}>
      <span className="node__icon" style={{ "--cat": `var(--cat-${d.category})` } as React.CSSProperties}>
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
      {d.badge?.kind === "missing" ? (
        <button
          type="button"
          className="node__badge node__badge--missing nodrag nopan nokey"
          aria-label={`빠진 정보 ${d.badge.count ?? 0}개`}
          onClick={(e) => {
            e.stopPropagation();
            d.onBadgeClick?.();
          }}
        >
          {d.badge.count}
        </button>
      ) : (
        d.badge && <span className={`node__badge node__badge--${d.badge.kind}`}>!</span>
      )}
      {d.state === "updated" && <span className="node__updated" />}
    </div>
  );
}
