/** 용어 사전 화면이 쓰는 한 항목. 서버 행에서 화면에 필요한 칸만 뽑는다. */
export interface GlossaryItem {
  id: string;
  key: string;
  term: string;
  fullName: string;
  category: string;
  definition: string;
  why: string;
  compare: string;
  source: "seed" | "ai";
  reviewed: boolean;
}

export const toGlossaryItem = (r: GlossaryItem): GlossaryItem => ({
  id: r.id,
  key: r.key,
  term: r.term,
  fullName: r.fullName,
  category: r.category,
  definition: r.definition,
  why: r.why,
  compare: r.compare,
  source: r.source,
  reviewed: r.reviewed,
});
