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
}

export function NodeCard({ data }: Pick<NodeProps, "data"> & Partial<NodeProps>) {
  const d = data as NodeCardData;
  return (
    <div className={`node node--${d.state}`} title={d.fullLabel} data-category={d.category}>
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
      {d.badge && (
        <span className={`node__badge node__badge--${d.badge.kind}`}>{d.badge.kind === "missing" ? d.badge.count : "!"}</span>
      )}
      {d.state === "updated" && <span className="node__updated" />}
    </div>
  );
}
