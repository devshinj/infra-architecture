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
  // 단추 이름은 "{영역 이름} 접기/펼치기 …": 화면 글자 앞에 보조기기용 영역 이름을 붙인다(보이는 글자가 이름 안에 그대로 있다).
  // 따로 Tab 칸이 아니다: 키보드로는 영역에 포커스를 두고 Space(Canvas.tsx). 마우스·터치·보조기기 가상 커서로는 그대로 누른다.
  return (
    <div className={cls} style={style} data-group-kind={d.groupKind} data-inner={def.kind === "redundancy_group" || def.kind === "k8s_cluster" ? "true" : undefined}>
      <div className="group__head">
        <span className="group__name" title={d.label}>{d.label}</span>
        <button type="button" className="group__toggle nodrag nopan" tabIndex={-1} aria-expanded={!d.collapsed} onClick={(e) => {
            e.stopPropagation();
            d.onToggle();
          }}>
          <span className="group__toggle-name">{d.label}</span> {toggleLabel}
        </button>
      </div>
      {d.collapsed && <div className="group__count">노드 {d.hiddenCount}개</div>}
    </div>
  );
}
