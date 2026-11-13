"use client";

import { useEffect, useState } from "react";

import { confirmLinkGuessAction, rejectLinkGuessAction } from "@/app/(app)/actions";
import { CategoryIcon } from "@/canvas/icons";
import { MEDIUM_LABELS } from "@/canvas/mediumMark";
import { categoryOf, EDGE_KINDS, GROUP_KINDS, NODE_KINDS } from "@/domain/catalog";
import { flowsThrough, type Flow } from "@/domain/flows";
import { crossingEdges, groupMembers } from "@/domain/groupInfo";
import { managedBasis, MULTI_AZ_KINDS, SERVER_ONLY_ATTRS, yesNo } from "@/domain/managed";
import { FIELD_LABELS, isEmpty, requiredKeysFor } from "@/domain/missing";
import { GRADE_LABELS } from "@/domain/network";
import type { DiagramState, DNode, Group, Warning } from "@/domain/types";
import { mergeWarnings } from "@/domain/warnings";

import { Button } from "./Button";
import { AskNode, type AskNodeProps } from "./explain/AskNode";
import { Explanation, type ExplanationProps } from "./explain/Explanation";
import { AI_BADGE_SR, AI_GUESS_BADGE } from "./glossary/aiBadge";
import { useNetworkKnowledge } from "./network/NetworkKnowledgeContext";
import netStyles from "./network/network.module.css";

import styles from "./panel.module.css";

export interface NodeInfoProps {
  state: DiagramState;
  selectedId: string | null;
  onSelect(id: string): void;
  /** Attach this node/group to the chat input. Omit to hide the button. */
  onMention?(id: string): void;
  mentionDisabled?: boolean;
  /** 경고를 의도된 구성으로 표시(true)·다시 경고(false). 없으면(이력 보기 등) 버튼을 숨긴다. */
  onIgnoreWarning?(id: string, ignored: boolean): void;
  /** 대화 차례 중·저장 중에는 버튼을 막는다. */
  ignoreDisabled?: boolean;
  /** 마지막 저장 실패 문구. */
  ignoreError?: string | null;
  /** 경고를 계산할 상태. 비교 모드는 합친 그림 대신 현재 상태를 준다. 없으면 state. */
  warningState?: DiagramState;
  /** 설명 패널 데이터. 없으면 설명 절을 그리지 않는다. */
  explain?: ExplanationProps;
  /** 노드·영역에 대해 물어보기 입력(연결선에는 두지 않는다). 없으면 숨긴다. */
  ask?: Omit<AskNodeProps, "nodeId" | "nodeLabel" | "noun">;
  /** 구성도의 흐름과, 흐름 이름 칩을 눌렀을 때(그 흐름을 켜고 흐름 탭으로). 없으면 지나는 흐름 절을 그리지 않는다. */
  flows?: { list: Flow[]; onOpen(key: string): void };
  /** AI 가 스스로 넣은 망연계 노드의 맞아요·아니에요. 없으면(이력 보기 등) 추정 표시만 보인다. */
  linkGuess?: LinkGuessSave;
}

/** 저장 대상 구성도, 차례 중 막기, 저장 뒤 최신 버전 다시 불러오기(partial: 일부만 되돌렸다). */
export interface LinkGuessSave {
  diagramId: string;
  disabled?: boolean;
  onSaved(number: number | null, partial: boolean): void;
}

type CautionProps = Pick<NodeInfoProps, "onIgnoreWarning" | "ignoreDisabled" | "ignoreError">;

const SPEC_FIELDS: [string, string][] = [["sw", "SW"], ["cpu", "CPU"], ["ram", "RAM"], ["disk", "디스크"], ["os", "OS"]];
const SERVER_FIELDS: [string, string][] = [["hostname", "호스트명"], ["ip", "IP"], ["vip", "VIP"], ["az", "AZ"]];
const MISSING = "미입력";
const UNKNOWN = "모름";
/** Multi-AZ 칸 값: 예/아니오로 읽히면 한국어로, 아니면 적힌 그대로(비었으면 그대로 비워 미입력으로 보인다). */
const multiAzText = (v: unknown) => {
  const yn = yesNo(v);
  return yn === "yes" ? "예" : yn === "no" ? "아니오" : (v as DNode["attrs"][string]);
};

const kindName = (kind: DNode["kind"]) => NODE_KINDS.find((k) => k.kind === kind)?.labelKo ?? kind;
const edgeKindName = (kind: string) => EDGE_KINDS.find((k) => k.kind === kind)?.label ?? kind;
const nameOf = (state: DiagramState, id: string) => state.nodes[id]?.label ?? state.groups[id]?.label ?? id;

/**
 * 칸 목록 절. `hideEmpty` 칸은 비어 있으면 줄째 뺀다(관리형 서비스의 서버 칸: 사업자가 운영해 정할 수 없거나 없는 값).
 * `lead` 는 칸 앞에 붙는 고정 줄(관리형 표시). 보일 줄이 하나도 없으면 절이 없다.
 */
function Fields({ title, fields, attrs, unknown, hideEmpty, lead }: { title: string; fields: [string, string][]; attrs: DNode["attrs"]; unknown: string[]; hideEmpty?: ReadonlySet<string>; lead?: React.ReactNode }) {
  const shown = hideEmpty ? fields.filter(([key]) => !(hideEmpty.has(key) && isEmpty(attrs[key]) && !unknown.includes(key))) : fields;
  if (shown.length === 0 && !lead) return null;
  return (
    <section className={styles.section}>
      <h3 className={styles.heading}>{title}</h3>
      <dl className={styles.fields}>
        {lead}
        {shown.map(([key, label]) => {
          const v = attrs[key];
          const empty = isEmpty(v);
          return (
            <div key={key} className={styles.field}>
              <dt>{label}</dt>
              <dd className={empty ? styles.missing : undefined}>{empty ? (unknown.includes(key) ? UNKNOWN : MISSING) : String(v)}</dd>
            </div>
          );
        })}
      </dl>
    </section>
  );
}

/** 노드 링크 복사: 이름 줄 오른쪽 조용한 글자 단추. 설명이 이름 바로 아래에서 시작하게 둔다. */
function LinkButton({ id, onMention, disabled }: { id: string; onMention?: (id: string) => void; disabled?: boolean }) {
  if (!onMention) return null;
  return (
    <Button size="sm" variant="quiet" className={styles.headAction} disabled={disabled} onClick={() => onMention(id)}>
      노드 링크 복사
    </Button>
  );
}

const LEVEL_LABEL: Record<Warning["level"], string> = { warn: "경고", check: "확인 필요" };

/** 주의할 점: 지금 걸린 경고와, 의도된 구성으로 표시한 경고. 둘 다 없으면 절이 없다. */
function Cautions({ active, ignored, onIgnoreWarning, ignoreDisabled, ignoreError }: { active: Warning[]; ignored: Warning[] } & CautionProps) {
  if (active.length === 0 && ignored.length === 0) return null;
  return (
    <section className={styles.section}>
      <h3 className={styles.heading}>주의할 점</h3>
      {ignoreError && onIgnoreWarning && (
        <p className={styles.cautionError} role="alert">
          {ignoreError}
        </p>
      )}
      {active.length > 0 && (
        <ul className={styles.cautions}>
          {active.map((w) => (
            <li key={w.id} className={styles.caution}>
              <span className={styles.level} data-level={w.level}>
                {LEVEL_LABEL[w.level]}
              </span>
              <p className={styles.cautionText}>{w.text}</p>
              <p className={styles.cautionGuide}>{w.guide}</p>
              {onIgnoreWarning && (
                <Button size="sm" className={styles.start} disabled={ignoreDisabled} onClick={() => onIgnoreWarning(w.id, true)}>
                  의도된 구성
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
      {ignored.length > 0 && (
        <>
          <h4 className={styles.subheading}>의도된 구성으로 표시함</h4>
          <ul className={styles.cautions}>
            {ignored.map((w) => (
              <li key={w.id} className={`${styles.caution} ${styles.cautionIgnored}`}>
                <p className={styles.cautionText}>{w.text}</p>
                {onIgnoreWarning && (
                  <Button size="sm" className={styles.start} disabled={ignoreDisabled} onClick={() => onIgnoreWarning(w.id, false)}>
                    다시 경고
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

/** 이 노드·연결을 지나는 흐름 이름 칩. 끊긴 단계만 걸친 흐름은 치지 않는다. 하나도 없으면 절이 없다. */
function FlowChips({ state, id, title, flows }: { state: DiagramState; id: string; title: string; flows?: NodeInfoProps["flows"] }) {
  if (!flows) return null;
  const through = flowsThrough(state, flows.list, id);
  if (through.length === 0) return null;
  const headId = `flows-through-${id}`;
  return (
    <section className={styles.section} aria-labelledby={headId}>
      <h3 id={headId} className={styles.heading}>{title}</h3>
      <div className={styles.chips}>
        {through.map((f) => (
          <button key={f.id} type="button" className={styles.chip} onClick={() => flows.onOpen(f.id)}>
            {f.name}
          </button>
        ))}
      </div>
    </section>
  );
}

export const PARTIAL_UNDO = "주변 연결이 바뀌어 일부만 되돌렸어요.";
const SAVE_FAILED = "저장하지 못했어요. 다시 시도해 주세요.";

/** AI 추정 망연계: 표시와 맞아요(일반 노드로)·아니에요(넣기 전으로 되돌리기). */
function LinkGuessPart({ nodeId, save }: { nodeId: string; save?: LinkGuessSave }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [partial, setPartial] = useState(false);
  useEffect(() => {
    setError(null);
    setPartial(false);
  }, [nodeId]);

  const run = async (reject: boolean) => {
    if (!save) return;
    setSaving(true);
    setError(null);
    setPartial(false);
    try {
      const r = reject
        ? await rejectLinkGuessAction(save.diagramId, nodeId)
        : await confirmLinkGuessAction(save.diagramId, nodeId).then((x) => (x.ok ? { ...x, partial: false } : x));
      if (!r.ok) return setError(r.error);
      setPartial(r.partial);
      save.onSaved(r.number, r.partial);
    } catch {
      setError(SAVE_FAILED);
    } finally {
      setSaving(false);
    }
  };

  const off = !!save?.disabled || saving;
  return (
    <section className={styles.section} role="group" aria-label="AI 추정 망연계">
      <p className={netStyles.notice}>
        <span className={netStyles.badge}>{AI_GUESS_BADGE}</span>
        <span className={netStyles.srOnly}>{AI_BADGE_SR}</span> 두 망 사이에 망연계가 필요할 것 같아 AI 가 넣었어요.
      </p>
      {save && (
        <div className={netStyles.row}>
          <Button size="sm" disabled={off} onClick={() => void run(false)}>
            맞아요
          </Button>
          <Button size="sm" disabled={off} onClick={() => void run(true)}>
            아니에요
          </Button>
        </div>
      )}
      {partial && (
        <p className={netStyles.notice} role="status">
          {PARTIAL_UNDO}
        </p>
      )}
      {error && (
        <p className={netStyles.error} role="alert">
          {error}
        </p>
      )}
    </section>
  );
}

/** 망 영역에 붙은 망 종류: 이름·등급·망 지식 설명 한 줄. AI 가 붙이고 확인 전이면 AI 추정 표시. 바꾸기·확인은 채워야 할 정보에서 한다. */
function NetTypePart({ group }: { group: Group }) {
  const knowledge = useNetworkKnowledge();
  const t = group.netType;
  if (!t) return null;
  const type = knowledge?.types[t.key];
  const headId = `zone-net-${group.id}`;
  return (
    <section className={styles.section} aria-labelledby={headId}>
      <h3 id={headId} className={styles.heading}>망 종류</h3>
      <p className={styles.explainText}>
        {type ? `${type.name} · ${GRADE_LABELS[type.grade]}` : t.key}
        {t.source === "ai" && !t.confirmed && (
          <>
            {" "}
            <span className={netStyles.badge}>{AI_GUESS_BADGE}</span>
            <span className={netStyles.srOnly}>{AI_BADGE_SR}</span>
          </>
        )}
      </p>
      {type?.description && <p className={styles.relText}>{type.description}</p>}
    </section>
  );
}

/** 영역 설명 탭: 망 종류 → 설명 → 안에 든 것 → 경계를 넘는 연결 → 물어보기. */
function GroupInfo({ state, group, onSelect, onMention, mentionDisabled, explain, ask }: { group: Group } & Pick<NodeInfoProps, "state" | "onSelect" | "onMention" | "mentionDisabled" | "explain" | "ask">) {
  const members = groupMembers(state, group.id);
  const crossing = crossingEdges(state, group.id);
  const membersId = `zone-members-${group.id}`;
  const crossingId = `zone-crossing-${group.id}`;
  return (
    <div className={styles.info}>
      <header className={styles.head}>
        <div>
          <h2 className={styles.title}>{group.label}</h2>
          <p className={styles.kind}>{GROUP_KINDS.find((k) => k.kind === group.groupKind)?.labelKo ?? group.groupKind}</p>
        </div>
        <LinkButton id={group.id} onMention={onMention} disabled={mentionDisabled} />
      </header>
      <NetTypePart group={group} />
      {explain && <Explanation key={group.id} target="group" {...explain} />}
      <section className={styles.section} aria-labelledby={membersId}>
        <h3 id={membersId} className={styles.heading}>안에 든 것</h3>
        {members.length === 0 ? (
          <p className={styles.missing}>안에 든 것이 없어요.</p>
        ) : (
          <div className={styles.chips}>
            {members.map((m) => (
              <button key={m.id} type="button" className={styles.chip} onClick={() => onSelect(m.id)}>
                {m.label}
              </button>
            ))}
          </div>
        )}
      </section>
      {/* 줄마다 연결 방향대로 "보내는 쪽 → 받는 쪽"(누르면 그 연결을 고른다) + 들어옴/나감·종류·라벨. */}
      <section className={styles.section} aria-labelledby={crossingId}>
        <h3 id={crossingId} className={styles.heading}>경계를 넘는 연결</h3>
        {crossing.length === 0 ? (
          <p className={styles.missing}>영역 밖과 이어진 연결이 없어요.</p>
        ) : (
          <ul className={styles.relations}>
            {crossing.map((c) => {
              const e = state.edges[c.edgeId]!;
              return (
                <li key={c.edgeId} className={styles.relation}>
                  <button type="button" className={styles.chip} onClick={() => onSelect(c.edgeId)}>
                    {nameOf(state, e.from)} → {nameOf(state, e.to)}
                  </button>
                  <span className={styles.relText}>{`${c.dir === "in" ? "← 들어옴" : "→ 나감"} · ${edgeKindName(e.edgeKind)}${e.label ? ` · ${e.label}` : ""}`}</span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
      {ask && <AskNode nodeId={group.id} nodeLabel={group.label} noun="영역" {...ask} />}
    </div>
  );
}

const PAYLOAD_NAME = { api: "API", file: "파일" } as const;
const DIRECTION_NAME = { one_way: "단방향", two_way: "양방향" } as const;

export function NodeInfo({ state, selectedId, onSelect, onMention, mentionDisabled, warningState, explain, ask, flows, linkGuess, ...caution }: NodeInfoProps) {
  const knowledge = useNetworkKnowledge();
  if (selectedId === null) return <p className={styles.empty}>캔버스에서 노드나 영역 이름을 선택하면 설명이 여기에 표시돼요.</p>;

  const warnings = mergeWarnings(warningState ?? state, knowledge ?? undefined);
  const pick = (f: (w: Warning) => boolean) => ({ active: warnings.active.filter(f), ignored: warnings.ignored.filter(f) });

  const edge = state.edges[selectedId];
  if (edge) {
    return (
      <div className={styles.info}>
        <h2 className={styles.title}>연결선</h2>
        <p className={styles.kind}>{edgeKindName(edge.edgeKind)}</p>
        <dl className={styles.fields}>
          <div className={styles.field}><dt>출발</dt><dd>{nameOf(state, edge.from)}</dd></div>
          <div className={styles.field}><dt>도착</dt><dd>{nameOf(state, edge.to)}</dd></div>
          <div className={styles.field}><dt>라벨</dt><dd className={isEmpty(edge.label) ? styles.missing : undefined}>{isEmpty(edge.label) ? (edge.unknown?.includes("label") ? UNKNOWN : MISSING) : edge.label}</dd></div>
          {edge.payload && <div className={styles.field}><dt>전달물</dt><dd>{PAYLOAD_NAME[edge.payload]}</dd></div>}
          {edge.direction && <div className={styles.field}><dt>방향</dt><dd>{DIRECTION_NAME[edge.direction]}</dd></div>}
          {edge.medium && edge.medium !== "ip" && <div className={styles.field}><dt>통신 수단</dt><dd>{MEDIUM_LABELS[edge.medium]}</dd></div>}
        </dl>
        {explain && <Explanation key={edge.id} target="edge" {...explain} />}
        <Cautions {...pick((w) => w.edgeId === edge.id)} {...caution} />
        <FlowChips state={state} id={edge.id} title="이 연결이 들어간 흐름" flows={flows} />
      </div>
    );
  }

  const group = state.groups[selectedId];
  if (group) {
    return (
      <GroupInfo
        state={state}
        group={group}
        onSelect={onSelect}
        {...(onMention ? { onMention } : {})}
        {...(mentionDisabled ? { mentionDisabled } : {})}
        {...(explain ? { explain } : {})}
        {...(ask ? { ask } : {})}
      />
    );
  }

  const node = state.nodes[selectedId];
  if (!node) return <p className={styles.empty}>선택한 항목을 찾을 수 없어요.</p>;

  const relations = Object.values(state.edges)
    .filter((e) => e.from === node.id || e.to === node.id)
    .map((e) => {
      const incoming = e.to === node.id;
      const otherId = incoming ? e.from : e.to;
      return { id: e.id, otherId, text: `${incoming ? "←" : "→"} ${edgeKindName(e.edgeKind)}${e.label ? ` · ${e.label}` : ""}` };
    });
  // 관리형 서비스(ALB·RDS 등): 서버 칸(CPU·RAM·IP 등)과 AZ 는 비어 있으면 줄째 빼고, 서버 정보 대신 운영 정보로 보인다.
  const managed = managedBasis(node);
  const serverFields: [string, string][] = managed && MULTI_AZ_KINDS.includes(node.kind) ? [...SERVER_FIELDS, ["multi_az", "Multi-AZ"]] : SERVER_FIELDS;
  // 관리형은 채워야 할 정보가 묻는 칸만 비어 있어도 보인다(ALB 의 SW·CPU 처럼 묻지 않는 칸은 비면 뺀다). Multi-AZ 는 주의가 묻는 칸이라 늘 보인다.
  const required = new Set(requiredKeysFor(state, "node", node.id) ?? []);
  const hideEmpty = managed
    ? new Set([...SPEC_FIELDS, ...SERVER_FIELDS].map(([k]) => k).filter((k) => !required.has(k)).concat([...SERVER_ONLY_ATTRS]))
    : undefined;
  // 서버·스펙 두 구역에 없는 필수 칸은 따로 모아 보여 준다.
  const shown = new Set([...SPEC_FIELDS, ...serverFields].map(([k]) => k));
  const otherFields: [string, string][] = (NODE_KINDS.find((k) => k.kind === node.kind)?.requiredAttrs ?? [])
    .filter((k) => !shown.has(k))
    .map((k) => [k, FIELD_LABELS[k] ?? k]);
  const managedRow = managed && (
    <div className={styles.field}>
      <dt>운영</dt>
      <dd>
        클라우드 관리형{managed === "name" && <span className={styles.relText}> · 이름으로 판단</span>}
      </dd>
    </div>
  );
  const attrsShown = managed ? { ...node.attrs, multi_az: multiAzText(node.attrs.multi_az) } : node.attrs;

  return (
    <div className={styles.info}>
      <header className={styles.head}>
        <span className={styles.icon} style={{ "--cat": `var(--cat-${categoryOf(node.kind)})` } as React.CSSProperties}>
          <CategoryIcon category={categoryOf(node.kind)} />
        </span>
        <div>
          <h2 className={styles.title}>{node.label}</h2>
          <p className={styles.kind} data-testid="kind">{kindName(node.kind)}</p>
        </div>
        <LinkButton id={node.id} onMention={onMention} disabled={mentionDisabled} />
      </header>
      {node.guess && <LinkGuessPart nodeId={node.id} {...(linkGuess ? { save: linkGuess } : {})} />}
      {explain && <Explanation key={node.id} {...explain} />}
      <Cautions {...pick((w) => w.nodeId === node.id)} {...caution} />
      <Fields title="스펙 · SW" fields={SPEC_FIELDS} attrs={node.attrs} unknown={node.unknown ?? []} {...(hideEmpty ? { hideEmpty } : {})} />
      <Fields
        title={managed ? "운영 정보" : "서버 정보"}
        fields={serverFields}
        attrs={attrsShown}
        unknown={node.unknown ?? []}
        {...(hideEmpty ? { hideEmpty, lead: managedRow } : {})}
      />
      {otherFields.length > 0 && <Fields title="기타 정보" fields={otherFields} attrs={node.attrs} unknown={node.unknown ?? []} {...(hideEmpty ? { hideEmpty } : {})} />}
      {/* 연결: 줄마다 상대(노드면 누르면 고르는 칩) + 방향·종류·이름. 예전의 연관관계 글 목록과 연결된 노드 칩을 합쳤다. */}
      <section className={styles.section}>
        <h3 className={styles.heading}>연결</h3>
        {relations.length === 0 ? (
          <p className={styles.missing}>연결된 노드가 없어요.</p>
        ) : (
          <ul className={styles.relations}>
            {relations.map((r) => (
              <li key={r.id} className={styles.relation}>
                {state.nodes[r.otherId] ? (
                  <button type="button" className={styles.chip} onClick={() => onSelect(r.otherId)}>
                    {state.nodes[r.otherId]!.label}
                  </button>
                ) : (
                  <span>{nameOf(state, r.otherId)}</span>
                )}
                <span className={styles.relText}>{r.text}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
      <FlowChips state={state} id={node.id} title="이 노드를 지나는 흐름" flows={flows} />
      {ask && <AskNode nodeId={node.id} nodeLabel={node.label} {...ask} />}
    </div>
  );
}
