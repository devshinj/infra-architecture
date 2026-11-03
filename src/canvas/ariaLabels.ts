import type { AriaLabelConfig } from "@xyflow/react";

// React Flow 화살표 방향(up·down·left·right) → 읽어 줄 말.
const DIRECTION: Record<string, string> = { up: "위", down: "아래", left: "왼쪽", right: "오른쪽" };

const SELECT = "Enter 나 Space 로 노드를 선택하거나 선택을 풀고, Esc 로 선택을 풉니다.";

/**
 * React Flow 가 읽어 주는 안내(기본은 영어)를 이 캔버스의 실제 동작에 맞춘 한국어로 바꾼다.
 * 지우기 키는 꺼 두었고(deleteKeyCode=null), 화살표로 옮기기는 편집 모드에서만 된다(nodesDraggable=editMode).
 * React Flow 는 키보드 조작이 켜져 있으면 `keyboardDisabled` 문구를 노드 설명으로 쓴다(이름과 반대).
 */
export function canvasAriaLabels(editMode: boolean): Partial<AriaLabelConfig> {
  const node = editMode ? `${SELECT} 편집 모드에서는 선택한 노드를 화살표 키로 옮길 수 있습니다(Shift 와 함께 누르면 더 크게).` : SELECT;
  return {
    "node.a11yDescription.default": node,
    "node.a11yDescription.keyboardDisabled": node,
    "node.a11yDescription.ariaLiveMessage": ({ direction, x, y }) => `선택한 노드를 ${DIRECTION[direction] ?? direction}(으)로 옮겼습니다. 새 위치 x ${x}, y ${y}.`,
    // 연결선은 React Flow 가 아니라 EdgeLayer 가 그린다(React Flow 연결선 0개). 영어 안내가 남지 않게 비운다.
    "edge.a11yDescription.default": "",
    "controls.ariaLabel": "화면 조절",
    "controls.zoomIn.ariaLabel": "확대",
    "controls.zoomOut.ariaLabel": "축소",
    "controls.fitView.ariaLabel": "화면에 맞추기",
    "controls.interactive.ariaLabel": "조작 잠금 전환",
    "minimap.ariaLabel": "미니맵",
    "handle.ariaLabel": "연결점",
  };
}
