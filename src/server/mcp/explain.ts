import { FLOW_LIMITS } from "@/domain/flows";

/** MCP 가 apply.ts·parseCommand 밖에서 거절할 때 쓰는 오류 글. */
export const REJECT = {
  unknownOp: "unknown op",
  say: "say not accepted",
  serverOnly: "server only op",
  unknownNetType: "unknown net type",
  noKnowledge: "network knowledge unavailable",
} as const;

/** 흐름 거절은 저장소 판정 이유(not_found·exists…·검사 문제 종류) 앞에 이 글을 붙인다. */
export const FLOW_REJECT_PREFIX = "flow ";

const OP_MAX = 40;

const field = (cmd: unknown, key: string): string | undefined => {
  if (!cmd || typeof cmd !== "object") return undefined;
  const v = (cmd as Record<string, unknown>)[key];
  return typeof v === "string" ? v.slice(0, OP_MAX) : undefined;
};

/** apply.ts 오류 글 → 쉬운 말. */
const APPLY_RULES: [RegExp, (id: string) => string][] = [
  [/^parent (\S+) not found$/, (id) => `parent 영역 ${id} 이 없어요`],
  [/^id (\S+) already exists$/, (id) => `id ${id} 은(는) 이미 있어요. 다른 id 를 쓰거나 update_node 로 고쳐 주세요`],
  [/^endpoint (\S+) not found$/, (id) => `연결 끝 ${id} 이(가) 없어요(노드나 영역 id 여야 해요)`],
  [/^node (\S+) not found$/, (id) => `노드 ${id} 이(가) 없어요`],
  [/^edge (\S+) not found$/, (id) => `연결 ${id} 이(가) 없어요`],
  [/^group (\S+) not found$/, (id) => `영역 ${id} 이(가) 없어요`],
  [/^assumption (.+) is confirmed$/, (key) => `가정 ${key} 은(는) 사용자가 확정해서 바꿀 수 없어요`],
  [/^group (\S+) is not a network zone$/, (id) => `영역 ${id} 은(는) 망 영역(network_zone)이 아니라 망 종류를 붙일 수 없어요`],
  [/^zone type (\S+) is confirmed$/, (id) => `영역 ${id} 의 망 종류는 사용자가 확정해서 바꿀 수 없어요`],
];

const FLOW_PROBLEMS: Record<string, string> = {
  missing_edge: "단계가 없는 연결을 가리켜요",
  bad_start: "단계의 from 이 그 연결의 끝 노드가 아니에요",
  disconnected: "앞 단계에서 닿지 않은 노드에서 시작하는 단계가 있어요",
  against_direction: "한 방향 연결을 거꾸로 지나요",
};

function flowReason(cmd: unknown, reason: string): string | null {
  const id = field(cmd, "id") ?? "?";
  switch (reason) {
    case "not_found":
      return `흐름 ${id} 이(가) 없어요`;
    case "exists":
      return `흐름 ${id} 은(는) 이미 있어요. update_flow 로 고쳐 주세요`;
    case "too_many_flows":
      return `흐름은 구성도마다 ${FLOW_LIMITS.flows}개까지예요`;
    case "no_steps":
      return `흐름 ${id} 에 단계가 없어요`;
    case "too_many_steps":
      return `흐름 ${id} 의 단계는 ${FLOW_LIMITS.steps}개까지예요`;
  }
  const parts = reason.split(",").map((k) => FLOW_PROBLEMS[k]);
  if (parts.length === 0 || parts.some((p) => p === undefined)) return null;
  return `흐름 ${id} — ${parts.join(", ")}`;
}

function explainBody(cmd: unknown, error: string): string | null {
  const op = field(cmd, "op");
  switch (error) {
    case REJECT.unknownOp:
      return op ? `모르는 명령 ${op} 이에요. get_guide 의 명령 목록을 봐 주세요` : "명령 이름(op)이 없어요";
    case REJECT.say:
      return "say 는 받지 않아요. 바꾼 내용은 summary 에 적어 주세요";
    case REJECT.serverOnly:
      return `${op ?? "set_link_guess"} 는 서버만 쓰는 명령이에요. 망연계를 추정으로 넣으려면 add_node 에 guess: true 를 주세요`;
    case REJECT.noKnowledge:
      return "지금 망 지식을 읽지 못해 망 종류를 붙일 수 없어요. 잠시 뒤 다시 시도해 주세요.";
    case REJECT.unknownNetType:
      return `알 수 없는 망 종류 ${field(cmd, "type") ?? "?"} 이에요. get_guide 의 망 종류 key 를 써 주세요`;
  }
  if (error.startsWith(FLOW_REJECT_PREFIX)) return flowReason(cmd, error.slice(FLOW_REJECT_PREFIX.length));
  for (const [re, say] of APPLY_RULES) {
    const m = re.exec(error);
    if (m) return say(m[1]!);
  }
  // parseCommand 오류: "칸: 문구; 칸: 문구"
  if (/^[^\s:;]+: /.test(error)) return `${op ?? "이"} 명령의 형식이 맞지 않아요(${error})`;
  return null;
}

/**
 * 거절한 명령 하나를 Claude 가 고칠 수 있게 쉬운 말로 적는다. index 는 0부터, 글의 번호는 1부터다.
 * 예: "3번: parent 영역 vpc-1 이 없어요". 모르는 글은 "N번: 적용할 수 없어요(<원문>)".
 */
export function explainRejection(index: number, cmd: unknown, error: string): string {
  const n = `${index + 1}번: `;
  return n + (explainBody(cmd, error) ?? `적용할 수 없어요(${error})`);
}
