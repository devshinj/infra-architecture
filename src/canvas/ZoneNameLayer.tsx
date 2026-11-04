import { ViewportPortal } from "@xyflow/react";

import { GROUP_KINDS, type GroupKind } from "@/domain/catalog";

import "./canvas.css";
import { groupToggleWidth } from "./layout";
import { ZONE_NAME_IN_PORTAL_Z } from "./stacking";

/** 그리는 영역 하나의 이름표 자료(캔버스 좌표). */
export interface ZoneName {
  id: string;
  x: number;
  y: number;
  width: number;
  label: string;
  groupKind: GroupKind;
  collapsed: boolean;
  hiddenCount: number;
  dimmed?: boolean;
}

const BORDER = 1; // .group 테두리(box-sizing: border-box 라 머리 칸은 그 안쪽에서 시작한다)
const HEAD_H = 30; // .group__head 높이
const HEAD_PAD = 10; // .group__head 좌우 안쪽 여백
const HEAD_GAP = 8; // .group__head 의 이름 ↔ 접기 단추 사이

/** 이름 알약의 최대 폭: 테두리 안 머리 칸 폭에서 좌우 여백·사이·접기 단추 폭을 뺀다(알약이 단추를 덮지 않게). */
export function zoneNameMaxWidth(width: number, collapsed: boolean, hiddenCount: number): number {
  return Math.max(0, width - 2 * BORDER - 2 * HEAD_PAD - HEAD_GAP - groupToggleWidth(collapsed, hiddenCount));
}

/**
 * 알약 자리(캔버스 좌표): 왼쪽 끝은 테두리·머리 여백 안쪽, 세로는 30px 머리 칸 가운데.
 * left·top 대신 transform 으로 준다: 영역 래퍼(.react-flow__node)처럼 다시 배치될 때 같은 transform 전환으로 함께 미끄러진다.
 */
export function zoneNameTransform(x: number, y: number): string {
  return `translate(${x + BORDER + HEAD_PAD}px, ${y + BORDER + HEAD_H / 2}px) translateY(-50%)`;
}

export interface ZoneNameLayerProps {
  zones: ZoneName[];
  /** 알약을 눌렀을 때: 영역 머리를 누른 것과 같게 한다(Canvas 는 고른 것을 푼다). */
  onPillClick?: (id: string) => void;
  /** 알약에서 오른쪽 단추: 영역의 메뉴를 연다. */
  onPillContextMenu?: (id: string, e: React.MouseEvent) => void;
}

/**
 * 영역 이름 알약 층. 영역 상자(GroupBox) 안이 아니라 연결선 층 위에 따로 그려, 영역 머리를 지나는 선이 이름 뒤로 지나간다.
 * 알약은 GroupBox 머리에 있던 자리(테두리 1px + 왼쪽 여백 10px, 30px 머리 가운데) 그대로다.
 */
export function ZoneNameLayer({ zones, onPillClick, onPillContextMenu }: ZoneNameLayerProps) {
  return (
    <div className="zone-names" aria-hidden="true" style={{ position: "absolute", left: 0, top: 0, zIndex: ZONE_NAME_IN_PORTAL_Z }}>
      {zones.map((z) => {
        const def = GROUP_KINDS.find((g) => g.kind === z.groupKind)!;
        const style = {
          "--tint": `var(${def.tintToken})`,
          transform: zoneNameTransform(z.x, z.y),
          maxWidth: zoneNameMaxWidth(z.width, z.collapsed, z.hiddenCount),
        } as React.CSSProperties;
        return (
          <span
            key={z.id}
            className={`group__name${z.dimmed ? " group--dimmed" : ""}`}
            data-zone-id={z.id}
            title={z.label}
            style={style}
            onClick={onPillClick ? () => onPillClick(z.id) : undefined}
            onContextMenu={onPillContextMenu ? (e) => onPillContextMenu(z.id, e) : undefined}
          >
            {z.label}
          </span>
        );
      })}
    </div>
  );
}

/** ZoneNameLayer 를 React Flow 뷰포트 안(연결선 층과 같은 portal)에 둔다: 노드와 함께 옮겨지고 커진다. */
export function ZoneNameLayerPortal(props: ZoneNameLayerProps) {
  return (
    <ViewportPortal>
      <ZoneNameLayer {...props} />
    </ViewportPortal>
  );
}
