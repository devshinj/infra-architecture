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

/** Keys whose change reshapes the zones (not just node counts or links). */
const STRUCTURAL_KEYS: ReadonlySet<string> = new Set(["environment", "deploy"]);

const ASSUMPTION_CHANGE_PREFIX = "가정 변경:";

/** The chat message sent after choosing another value on an assumption chip. */
export function assumptionChangeMessage(key: string, value: string): string {
  const head = `${ASSUMPTION_CHANGE_PREFIX} ${ASSUMPTION_LABELS[key] ?? key} → ${value}.`;
  return STRUCTURAL_KEYS.has(key)
    ? `${head} 새 가정에 맞는 영역을 먼저 만들고, 계속 쓰는 노드는 새 영역으로 옮긴 뒤, 남은 맞지 않는 노드·영역을 지워 구성을 다시 맞춰 줘.`
    : `${head} 이 가정에 맞게 구성을 조정해 줘.`;
}

/** True for a message made by assumptionChangeMessage (it always asks for a structure change). */
export function isAssumptionChangeMessage(text: string): boolean {
  return text.trimStart().startsWith(ASSUMPTION_CHANGE_PREFIX);
}
