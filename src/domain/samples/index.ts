// 샘플 구성도. 손으로 쓴 변경 명령 목록이라 AI 없이 늘 같은 모습으로 불러온다.
// 처음부터 뜨는 경고·흐름 검사 결과는 tests/unit/samples.test.ts 가 고정한다.
import { applyCommands } from "../apply";
import { isFlowCommand, type Command, type FlowCommand } from "../commands";
import { judgeFlowOps, type Flow } from "../flows";
import { emptyState, type DiagramState } from "../types";
import { ACCESS_CONTROL } from "./access-control";
import { AWS_SHOP } from "./aws-shop";
import type { Sample } from "./dsl";
import { EKS_MSA } from "./eks-msa";
import { GOV_NETSEP } from "./gov-netsep";
import { IDC_3TIER } from "./idc-3tier";
import { IOT_CONTROL } from "./iot-control";
import { LLM_RAG } from "./llm-rag";
import { SERVERLESS } from "./serverless";

export type { Sample } from "./dsl";

export const SAMPLE_LIST: readonly Sample[] = [AWS_SHOP, EKS_MSA, SERVERLESS, IDC_3TIER, GOV_NETSEP, IOT_CONTROL, LLM_RAG, ACCESS_CONTROL];

/**
 * 샘플을 구성도 상태와 흐름으로 만든다. 명령이나 흐름이 하나라도 거절되면 throw 한다(샘플 오류는 테스트가 잡는다).
 * 망 종류는 사람이 고른 것이라 확정(source user)으로 둔다. 가정은 미확정으로 둬 대화에서 바꿀 수 있다.
 */
export function buildSample(sample: Sample): { state: DiagramState; flows: Flow[] } {
  const diagram: Command[] = [];
  const flowCmds: FlowCommand[] = [];
  for (const c of sample.commands) {
    if (isFlowCommand(c)) flowCmds.push(c);
    else diagram.push(c);
  }
  const { state, errors } = applyCommands(emptyState(), diagram);
  if (errors.length > 0) throw new Error(`샘플 ${sample.id} 명령 오류: ${errors.map((x) => `#${x.index} ${x.error}`).join("; ")}`);
  for (const g of Object.values(state.groups)) {
    if (g.netType) g.netType = { key: g.netType.key, source: "user", confirmed: true };
  }
  const outcomes = judgeFlowOps(state, [], flowCmds);
  const flows: Flow[] = [];
  outcomes.forEach((o, i) => {
    if (o.kind !== "saved") throw new Error(`샘플 ${sample.id} 흐름 ${flowCmds[i]!.id} 오류: ${o.kind === "rejected" ? o.reason : o.kind}`);
    flows.push(o.flow);
  });
  return { state, flows };
}
