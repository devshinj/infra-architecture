import type { Rect } from "./layout";

type Pt = { x: number; y: number };

// Three-segment orthogonal route between two rects: vertical when one sits fully above the other,
// otherwise out of the facing sides.
export function elbowRoute(a: Rect, b: Rect): Pt[] {
  const acx = a.x + a.width / 2;
  const bcx = b.x + b.width / 2;
  if (b.y >= a.y + a.height || b.y + b.height <= a.y) {
    const down = b.y >= a.y + a.height;
    const y1 = down ? a.y + a.height : a.y;
    const y2 = down ? b.y : b.y + b.height;
    const mid = (y1 + y2) / 2;
    return [{ x: acx, y: y1 }, { x: acx, y: mid }, { x: bcx, y: mid }, { x: bcx, y: y2 }];
  }
  const acy = a.y + a.height / 2;
  const bcy = b.y + b.height / 2;
  const right = bcx >= acx;
  const x1 = right ? a.x + a.width : a.x;
  const x2 = right ? b.x : b.x + b.width;
  const mid = (x1 + x2) / 2;
  return [{ x: x1, y: acy }, { x: mid, y: acy }, { x: mid, y: bcy }, { x: x2, y: bcy }];
}
