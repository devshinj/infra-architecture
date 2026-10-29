import type { DiagramState } from "./types";

export const ASSUMPTION_LABELS: Record<string, string> = {
  environment: "환경",
  scale: "규모",
  redundancy: "이중화",
  deploy: "배포 방식",
  replication: "데이터 복제",
  external: "외부 연동",
};

export const ASSUMPTION_CHOICES: Record<string, string[]> = {
  environment: ["클라우드(AWS)", "클라우드(기타)", "사내 IDC", "하이브리드"],
  scale: ["소규모(일 1천 명 이하)", "중규모(일 1만 명)", "대규모(일 10만 명 이상)"],
  redundancy: ["이중화 없음", "핵심 구간 이중화", "전 구간 이중화"],
  deploy: ["VM", "컨테이너", "Kubernetes", "서버리스"],
  replication: ["복제 없음", "비동기 복제", "동기 복제"],
  external: ["외부 연동 없음", "외부 연동 있음"],
};

/** Marks an assumption confirmed (new keys allowed). Pure: the input state is not mutated. */
export function confirmAssumption(state: DiagramState, key: string, value: string): DiagramState {
  return { ...state, assumptions: { ...state.assumptions, [key]: { key, value, confirmed: true } } };
}
