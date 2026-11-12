import type { EdgeMedium } from "@/domain/types";

/** 표지를 다는 통신 수단("ip" 는 보통의 통신이라 표지가 없다). */
export type MarkedMedium = Exclude<EdgeMedium, "ip">;

export const MEDIUM_LABELS: Record<MarkedMedium, string> = {
  wireless: "근거리 무선",
  video: "영상 스트림",
  media: "실시간 미디어",
  serial: "유선 직렬",
};

/** 표지 원의 반지름(px). */
export const MEDIUM_R = 7;

type Pt = { x: number; y: number };

/** 꺾은선의 처음부터 전체 길이의 frac 만큼 간 자리. 점이 둘 미만이면 null. */
export function pointAlong(points: Pt[], frac: number): Pt | null {
  if (points.length < 2) return null;
  const lens = points.slice(1).map((p, i) => Math.hypot(p.x - points[i].x, p.y - points[i].y));
  const total = lens.reduce((a, b) => a + b, 0);
  if (total === 0) return null;
  let rest = total * frac;
  for (let i = 0; i < lens.length; i++) {
    if (rest <= lens[i] || i === lens.length - 1) {
      const t = lens[i] === 0 ? 0 : Math.min(1, rest / lens[i]);
      const a = points[i];
      const b = points[i + 1];
      return { x: Math.round((a.x + (b.x - a.x) * t) * 100) / 100, y: Math.round((a.y + (b.y - a.y) * t) * 100) / 100 };
    }
    rest -= lens[i];
  }
  return null;
}

// 반지름 7 원 안에 들어가는 기호. 무선: 점과 퍼지는 호 두 줄, 영상: 재생 세모, 미디어: 소리 막대 셋, 직렬: 네모 펄스.
const GLYPH: Record<MarkedMedium, React.ReactNode> = {
  wireless: (
    <>
      <circle className="edge-medium__fill" cx={0} cy={3} r={1} />
      <path className="edge-medium__stroke" d="M-2.4,0.9 A3.4,3.4 0 0 1 2.4,0.9 M-4.2,-1.2 A6,6 0 0 1 4.2,-1.2" />
    </>
  ),
  video: <path className="edge-medium__fill" d="M-2,-3.2 L3.4,0 L-2,3.2 Z" />,
  media: <path className="edge-medium__stroke" d="M-3,-1.5 V1.5 M0,-3.5 V3.5 M3,-1.5 V1.5" />,
  serial: <path className="edge-medium__stroke" d="M-4.4,1.6 H-2.2 V-1.6 H0 V1.6 H2.2 V-1.6 H4.4" />,
};

/** 선 위에 다는 통신 수단 표지: 바탕색 원 위에 기호. 내보낸 그림에도 남는다. */
export function MediumMark({ medium, x, y }: { medium: MarkedMedium; x: number; y: number }) {
  return (
    <g className="edge-medium" data-medium={medium} transform={`translate(${x} ${y})`}>
      <circle className="edge-medium__bg" r={MEDIUM_R} />
      {GLYPH[medium]}
    </g>
  );
}
