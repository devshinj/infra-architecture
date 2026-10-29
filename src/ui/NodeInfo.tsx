import { CategoryIcon } from "@/canvas/icons";
import { categoryOf, EDGE_KINDS, GROUP_KINDS, NODE_KINDS } from "@/domain/catalog";
import type { DiagramState, DNode } from "@/domain/types";

import styles from "./panel.module.css";

export interface NodeInfoProps {
  state: DiagramState;
  selectedId: string | null;
  onSelect(id: string): void;
  /** Attach this node/group to the chat input. Omit to hide the button. */
  onMention?(id: string): void;
  mentionDisabled?: boolean;
}

const SPEC_FIELDS: [string, string][] = [["sw", "SW"], ["cpu", "CPU"], ["ram", "RAM"], ["disk", "디스크"], ["os", "OS"]];
const SERVER_FIELDS: [string, string][] = [["hostname", "호스트명"], ["ip", "IP"], ["vip", "VIP"], ["az", "AZ"]];
const MISSING = "미입력";
const UNKNOWN = "모름";

const kindName = (kind: DNode["kind"]) => NODE_KINDS.find((k) => k.kind === kind)?.labelKo ?? kind;
const edgeKindName = (kind: string) => EDGE_KINDS.find((k) => k.kind === kind)?.label ?? kind;
const nameOf = (state: DiagramState, id: string) => state.nodes[id]?.label ?? state.groups[id]?.label ?? id;

function Fields({ title, fields, attrs, unknown }: { title: string; fields: [string, string][]; attrs: DNode["attrs"]; unknown: string[] }) {
  return (
    <section className={styles.section}>
      <h3 className={styles.heading}>{title}</h3>
      <dl className={styles.fields}>
        {fields.map(([key, label]) => {
          const v = attrs[key];
          const empty = v === undefined || v === null || v === "";
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

function LinkButton({ id, onMention, disabled }: { id: string; onMention?: (id: string) => void; disabled?: boolean }) {
  if (!onMention) return null;
  return (
    <button type="button" className={styles.linkBtn} disabled={disabled} onClick={() => onMention(id)}>
      노드 링크 복사
    </button>
  );
}

export function NodeInfo({ state, selectedId, onSelect, onMention, mentionDisabled }: NodeInfoProps) {
  if (selectedId === null) return <p className={styles.empty}>캔버스에서 노드를 선택하면 설명이 여기에 표시돼요.</p>;

  const edge = state.edges[selectedId];
  if (edge) {
    return (
      <div className={styles.info}>
        <h2 className={styles.title}>연결선</h2>
        <p className={styles.kind}>{edgeKindName(edge.edgeKind)}</p>
        <dl className={styles.fields}>
          <div className={styles.field}><dt>출발</dt><dd>{nameOf(state, edge.from)}</dd></div>
          <div className={styles.field}><dt>도착</dt><dd>{nameOf(state, edge.to)}</dd></div>
          <div className={styles.field}><dt>라벨</dt><dd className={edge.label ? undefined : styles.missing}>{edge.label || MISSING}</dd></div>
        </dl>
      </div>
    );
  }

  const group = state.groups[selectedId];
  if (group) {
    return (
      <div className={styles.info}>
        <h2 className={styles.title}>{group.label}</h2>
        <p className={styles.kind}>{GROUP_KINDS.find((k) => k.kind === group.groupKind)?.labelKo ?? group.groupKind}</p>
        <LinkButton id={group.id} onMention={onMention} disabled={mentionDisabled} />
      </div>
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
  const chips = [...new Set(relations.map((r) => r.otherId))].filter((id) => state.nodes[id]);

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
      </header>
      <LinkButton id={node.id} onMention={onMention} disabled={mentionDisabled} />
      <Fields title="스펙 · SW" fields={SPEC_FIELDS} attrs={node.attrs} unknown={node.unknown ?? []} />
      <Fields title="서버 정보" fields={SERVER_FIELDS} attrs={node.attrs} unknown={node.unknown ?? []} />
      <section className={styles.section}>
        <h3 className={styles.heading}>연관관계</h3>
        {relations.length === 0 ? (
          <p className={styles.missing}>연결된 노드가 없어요.</p>
        ) : (
          <ul className={styles.relations}>
            {relations.map((r) => (
              <li key={r.id}>
                <span>{nameOf(state, r.otherId)}</span> <span className={styles.relText}>{r.text}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
      {chips.length > 0 && (
        <section className={styles.section}>
          <h3 className={styles.heading}>연결된 노드</h3>
          <div className={styles.chips}>
            {chips.map((id) => (
              <button key={id} type="button" className={styles.chip} onClick={() => onSelect(id)}>
                {state.nodes[id].label}
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
