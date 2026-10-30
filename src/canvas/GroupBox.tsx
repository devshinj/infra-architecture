import type { NodeProps } from "@xyflow/react";

import { GROUP_KINDS, type GroupKind } from "@/domain/catalog";

import "./canvas.css";

export interface GroupBoxData extends Record<string, unknown> {
  label: string;
  groupKind: GroupKind;
  collapsed: boolean;
  hiddenCount: number;
  selected?: boolean;
  onToggle: () => void;
}

export function GroupBox({ data }: Pick<NodeProps, "data"> & Partial<NodeProps>) {
  const d = data as GroupBoxData;
  const def = GROUP_KINDS.find((g) => g.kind === d.groupKind)!;
  const style = { "--zone": `var(${def.zoneToken})`, "--tint": `var(${def.tintToken})` } as React.CSSProperties;
  const cls = `group${def.dashed ? " group--dashed" : ""}${d.collapsed ? " group--collapsed" : ""}${d.selected ? " group--selected" : ""}`;
  const toggleLabel = d.collapsed ? `펼치기 · 노드 ${d.hiddenCount}개` : "접기";
  return (
    <div className={cls} style={style} data-group-kind={d.groupKind} data-inner={def.kind === "redundancy_group" || def.kind === "k8s_cluster" ? "true" : undefined}>
      <div className="group__head">
        <span className="group__name" title={d.label}>{d.label}</span>
        <button type="button" className="group__toggle nodrag nopan" onClick={(e) => {
            e.stopPropagation();
            d.onToggle();
          }}>
          {toggleLabel}
        </button>
      </div>
      {d.collapsed && <div className="group__count">노드 {d.hiddenCount}개</div>}
    </div>
  );
}
