import type { CSSProperties } from "react";

import { Loading, SkeletonBlock, SkeletonLines, skeletonStyles as s } from "./Skeleton";

interface PageSkeletonProps {
  /** 화면 제목은 이미 아는 글이라 그대로 보인다. */
  title: string;
  /** 제목 아래 안내 문단 자리. */
  lead?: boolean;
  /** 검색칸 같은 도구 줄 자리. */
  tools?: boolean;
  /** 범례표 열 너비(grid-template-columns)와 열 개수, 있으면 열 이름. */
  columns: string;
  cells: number;
  head?: string[];
  /** 오른쪽 주기 판 자리. */
  notes?: boolean;
  rows?: number;
}

/** 줄마다 열 너비를 조금씩 달리해 실제 목록처럼 보이게 한다. */
const CELL_WIDTHS = [
  ["72%", "56%", "92%", "40px"],
  ["58%", "48%", "78%", "40px"],
  ["80%", "62%", "86%", "40px"],
  ["64%", "44%", "70%", "40px"],
];

/** 보조 페이지(용어 사전·망 지식·Claude Code 연결)를 불러오는 동안: 같은 머리 여백과 제목, 범례표 줄 자리, 주기 판 자리. */
export function PageSkeleton({ title, lead = false, tools = false, columns, cells, head, notes = false, rows = 8 }: PageSkeletonProps) {
  const table = (
    <div className={s.table} style={{ "--cols": columns } as CSSProperties}>
      {head && (
        <div className={s.tableHead}>
          {head.map((h) => (
            <span key={h}>{h}</span>
          ))}
        </div>
      )}
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} className={s.tableRow}>
          {Array.from({ length: cells }, (_, c) => (
            <SkeletonLines key={c} widths={[CELL_WIDTHS[r % CELL_WIDTHS.length][c % 4]]} start={r + c} className={s.cell} />
          ))}
        </div>
      ))}
    </div>
  );
  return (
    <Loading label={`${title} 불러오는 중`} className={s.page}>
      <h1 className={s.title}>{title}</h1>
      {lead && <SkeletonLines widths={["100%", "72%"]} className={s.lead} />}
      {tools && <SkeletonBlock shape="control" className={s.tools} />}
      {notes ? (
        <div className={s.body}>
          {table}
          <SkeletonBlock className={s.notes} i={2} />
        </div>
      ) : (
        table
      )}
    </Loading>
  );
}
