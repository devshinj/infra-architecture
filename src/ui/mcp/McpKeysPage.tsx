"use client";

import { useEffect, useRef, useState, useTransition } from "react";

import { createMcpKeyAction, deleteMcpKeyAction, type McpKeyRow } from "@/app/(app)/actions";

import { type Dialog, DialogView, GENERIC_ERROR } from "../dialogs";
import styles from "./McpKeysPage.module.css";

const COPY_FAILED = "직접 선택해 복사해 주세요";

/** 날짜만(서버와 브라우저의 시간대가 달라도 같은 글자가 나오게 UTC 날짜를 그대로 쓴다). */
const day = (iso: string) => iso.slice(0, 10);

/** 방금 만든 키. 원문은 이 화면의 상태에만 있고, 닫거나 떠나면 사라진다. */
type Fresh = { id: string; key: string; name: string };

const commandFor = (key: string) =>
  `claude mcp add --transport http infrasketch ${window.location.origin}/api/mcp --header "Authorization: Bearer ${key}"`;

export function McpKeysPage({ initialKeys }: { initialKeys: McpKeyRow[] }) {
  const [keys, setKeys] = useState(initialKeys);
  const [name, setName] = useState("");
  const [fresh, setFresh] = useState<Fresh | null>(null);
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copyNote, setCopyNote] = useState<string | null>(null);
  const [announce, setAnnounce] = useState("");
  const [pending, start] = useTransition();
  const nameInput = useRef<HTMLInputElement>(null);
  const freshHeading = useRef<HTMLHeadingElement>(null);
  const deleteBtns = useRef(new Map<string, HTMLButtonElement>());
  const focusAfter = useRef<"fresh" | "name" | { id: string } | null>(null);

  // 상태가 바뀌어 새 요소가 그려진 뒤에 포커스를 옮긴다.
  useEffect(() => {
    const f = focusAfter.current;
    if (!f) return;
    focusAfter.current = null;
    if (f === "fresh") freshHeading.current?.focus();
    else if (f === "name") nameInput.current?.focus();
    else (deleteBtns.current.get(f.id) ?? nameInput.current)?.focus();
  });

  const create = () => {
    const trimmed = name.trim();
    if (trimmed === "") {
      setError("키 이름을 적어 주세요.");
      return nameInput.current?.focus();
    }
    setError(null);
    start(async () => {
      try {
        const r = await createMcpKeyAction(trimmed);
        if (!r.ok) return setError(r.error);
        setFresh({ id: r.id, key: r.key, name: trimmed });
        setAnnounce("키를 만들었어요. 이 창을 닫으면 다시 볼 수 없어요.");
        focusAfter.current = "fresh";
        setCopyNote(null);
        setKeys((all) => [{ id: r.id, name: trimmed, prefix: r.prefix, createdAt: new Date().toISOString(), lastUsedAt: null }, ...all]);
        setName("");
      } catch {
        setError(GENERIC_ERROR);
      }
    });
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyNote("복사했어요");
    } catch {
      setCopyNote(COPY_FAILED);
    }
  };

  const askDelete = (k: McpKeyRow) =>
    setDialog({
      kind: "delete",
      title: `${k.name} 키 지우기`,
      message: "이 키를 쓰는 Claude Code는 더 이상 연결되지 않아요. 지울까요?",
      run: async () => {
        const d = await deleteMcpKeyAction(k.id);
        if (!d.ok) return d.error;
        const i = keys.findIndex((x) => x.id === k.id);
        const next = keys[i + 1] ?? keys[i - 1];
        focusAfter.current = next ? { id: next.id } : "name";
        setKeys((all) => all.filter((x) => x.id !== k.id));
        setFresh((f) => (f?.id === k.id ? null : f));
      },
    });

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Claude Code 연결</h1>
      <p className={styles.lead}>
        키를 만들어 Claude Code에 연결하면, Claude Code가 내 구성도를 읽고 고칠 수 있어요. 키는 만들 때 한 번만 보여요.
      </p>
      <p className={styles.srOnly} role="status" aria-live="polite">{announce}</p>
      {error && <p id="mcp-name-error" className={styles.error} role="alert">{error}</p>}

      <section className={styles.section} aria-labelledby="mcp-new">
        <h2 id="mcp-new">새 키 만들기</h2>
        <form className={styles.form} aria-label="키 만들기" onSubmit={(e) => { e.preventDefault(); create(); }}>
          <label>
            키 이름
            <input ref={nameInput} value={name} maxLength={40} aria-invalid={error ? true : undefined} aria-describedby={error ? "mcp-name-error" : undefined} placeholder="예: 내 노트북" onChange={(e) => { setName(e.target.value); setError(null); }} />
          </label>
          <div className={styles.actions}>
            <button type="submit" className={styles.btn} disabled={pending}>키 만들기</button>
          </div>
        </form>
      </section>

      {fresh && (
        <section className={styles.fresh} aria-labelledby="mcp-fresh">
          <h2 id="mcp-fresh" ref={freshHeading} tabIndex={-1}>{fresh.name} 키를 만들었어요</h2>
          <p className={styles.warn}>이 창을 닫으면 다시 볼 수 없어요. 지금 복사해 두세요.</p>
          <code className={styles.code}>{fresh.key}</code>
          <div className={styles.actions}>
            <button type="button" className={styles.btn} onClick={() => copy(fresh.key)}>키 복사</button>
          </div>
          <p className={styles.meta}>Claude Code 터미널에서 아래 명령을 실행하면 연결돼요.</p>
          <code className={styles.code}>{commandFor(fresh.key)}</code>
          <div className={styles.actions}>
            <button type="button" className={styles.btn} onClick={() => copy(commandFor(fresh.key))}>설정 예 복사</button>
            <button type="button" className={styles.btn} onClick={() => { focusAfter.current = "name"; setFresh(null); setCopyNote(null); setAnnounce(""); }}>닫기</button>
          </div>
          <p className={styles.meta} role="status">{copyNote ?? ""}</p>
        </section>
      )}

      <section className={styles.section} aria-labelledby="mcp-list">
        <h2 id="mcp-list">내 키</h2>
        {keys.length === 0 ? (
          <p className={styles.empty}>만든 키가 없어요.</p>
        ) : (
          <table className={styles.table} aria-label="키 목록">
            <thead>
              <tr>
                <th scope="col">이름</th>
                <th scope="col">앞 8글자</th>
                <th scope="col">만든 날</th>
                <th scope="col">마지막 사용</th>
                <th scope="col"><span className={styles.srOnly}>지우기</span></th>
              </tr>
            </thead>
            <tbody>
              {keys.map((k) => (
                <tr key={k.id}>
                  <td>{k.name}</td>
                  <td><code>{k.prefix}</code></td>
                  <td>{day(k.createdAt)}</td>
                  <td>{k.lastUsedAt ? day(k.lastUsedAt) : "아직 안 씀"}</td>
                  <td>
                    <button type="button" ref={(el) => { if (el) deleteBtns.current.set(k.id, el); else deleteBtns.current.delete(k.id); }} className={`${styles.btn} ${styles.danger}`} aria-label={`${k.name} 지우기`} onClick={() => askDelete(k)}>
                      지우기
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
      {dialog && <DialogView dialog={dialog} onClose={() => setDialog(null)} />}
    </div>
  );
}
