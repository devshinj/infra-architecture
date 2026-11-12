"use client";

import { useEffect, useRef, useState, useTransition } from "react";

import { createMcpKeyAction, deleteMcpKeyAction, type McpKeyRow } from "@/app/(app)/actions";
import { Button } from "@/ui/Button";

import { type Dialog, DialogView, GENERIC_ERROR } from "../dialogs";
import styles from "./McpKeysPage.module.css";

const COPY_FAILED = "직접 선택해 복사해 주세요";

/** 날짜만(서버와 브라우저의 시간대가 달라도 같은 글자가 나오게 UTC 날짜를 그대로 쓴다). */
const day = (iso: string) => iso.slice(0, 10);

/** 방금 만든 키. 원문은 이 화면의 상태에만 있고, 닫거나 떠나면 사라진다. */
type Fresh = { id: string; key: string; name: string };

/** 키 자리 글자: 키를 만들기 전 연결 방법에 보인다. */
const KEY_SLOT = "<키>";
const endpointOf = (origin: string) => `${origin}/api/mcp`;
const claudeCommand = (origin: string, key: string) => `claude mcp add --transport http infrasketch ${endpointOf(origin)} --header "Authorization: Bearer ${key}"`;
const jsonConfig = (origin: string, key: string) =>
  JSON.stringify({ mcpServers: { infrasketch: { url: endpointOf(origin), headers: { Authorization: `Bearer ${key}` } } } }, null, 2);

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
  // 이 서버 주소: 첫 렌더(서버)는 자리 글자, 마운트 뒤 브라우저 주소로 바꾼다(하이드레이션 일치).
  const [origin, setOrigin] = useState("https://(이 서버 주소)");
  useEffect(() => setOrigin(window.location.origin), []);
  // 연결 방법 판의 명령·설정에 넣을 키: 방금 만든 키가 있으면 그 키, 없으면 자리 글자.
  const shownKey = fresh?.key ?? KEY_SLOT;

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
      message: "이 키를 쓰는 도구는 더 이상 연결되지 않아요. 지울까요?",
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
      <h1 className={styles.title}>MCP 연결</h1>
      <p className={styles.lead}>
        키를 만들어 MCP 를 쓰는 도구(Claude Code·Cursor 등)에 등록하면, 그 도구가 내 구성도를 읽고 고칠 수 있어요. 키는 만들 때 한 번만 보여요.
      </p>
      <p className={styles.srOnly} role="status" aria-live="polite">{announce}</p>

      <div className={styles.body}>
      <div className={styles.mainCol}>
      {error && <p id="mcp-name-error" className={styles.error} role="alert">{error}</p>}

      <section className={styles.section} aria-labelledby="mcp-new">
        <h2 id="mcp-new">새 키 만들기</h2>
        <form className={styles.form} aria-label="키 만들기" onSubmit={(e) => { e.preventDefault(); create(); }}>
          <label>
            키 이름
            <input ref={nameInput} value={name} maxLength={40} aria-invalid={error ? true : undefined} aria-describedby={error ? "mcp-name-error" : undefined} placeholder="예: 내 노트북" onChange={(e) => { setName(e.target.value); setError(null); }} />
          </label>
          <div className={styles.actions}>
            <Button type="submit" variant="primary" disabled={pending}>키 만들기</Button>
          </div>
        </form>
      </section>

      {fresh && (
        <section className={styles.fresh} aria-labelledby="mcp-fresh">
          <h2 id="mcp-fresh" ref={freshHeading} tabIndex={-1}>{fresh.name} 키를 만들었어요</h2>
          <p className={styles.warn}>이 창을 닫으면 다시 볼 수 없어요. 지금 복사해 두세요.</p>
          <code className={styles.code}>{fresh.key}</code>
          <div className={styles.actions}>
            <Button onClick={() => copy(fresh.key)}>키 복사</Button>
            <Button onClick={() => { focusAfter.current = "name"; setFresh(null); setCopyNote(null); setAnnounce(""); }}>닫기</Button>
          </div>
          <p className={styles.meta}>연결 방법의 명령·설정에 이 키가 들어가 있어요. 그대로 복사해 쓰면 돼요.</p>
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
                    <Button ref={(el) => { if (el) deleteBtns.current.set(k.id, el); else deleteBtns.current.delete(k.id); }} variant="danger" aria-label={`${k.name} 지우기`} onClick={() => askDelete(k)}>
                      지우기
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
      </div>

      {/* 연결 방법(주기 판): 키가 없어도 순서가 보인다. 방금 만든 키가 있으면 명령·설정에 그 키를 넣는다. */}
      <aside className={styles.notesCol} aria-labelledby="mcp-howto">
        <div className={`${styles.notes} ticks`}>
          <h2 id="mcp-howto" className={styles.notesTitle}>연결 방법</h2>
          <ol className={styles.steps}>
            <li>
              <b>키 만들기</b>
              <span>왼쪽에서 키 이름을 적고 만든다. 키는 그때 한 번만 보인다.</span>
            </li>
            <li>
              <b>도구에 서버 등록</b>
              <span>MCP 를 쓰는 도구에 아래 주소와 헤더를 넣는다(전송 방식 HTTP).</span>
              <dl className={styles.kv}>
                <div><dt>주소</dt><dd><code>{endpointOf(origin)}</code></dd></div>
                <div><dt>헤더</dt><dd><code>Authorization: Bearer {shownKey}</code></dd></div>
              </dl>
            </li>
            <li>
              <b>Claude Code 예</b>
              <span>터미널에서 실행한다.</span>
              <code className={styles.code}>{claudeCommand(origin, shownKey)}</code>
              <div className={styles.actions}>
                <Button size="sm" onClick={() => copy(claudeCommand(origin, shownKey))}>명령 복사</Button>
              </div>
            </li>
            <li>
              <b>설정 파일을 쓰는 도구 예</b>
              <span>mcpServers 설정(예: Cursor 의 mcp.json)에 넣는다. 형식은 도구마다 조금 다를 수 있다.</span>
              <pre className={styles.code}>{jsonConfig(origin, shownKey)}</pre>
              <div className={styles.actions}>
                <Button size="sm" onClick={() => copy(jsonConfig(origin, shownKey))}>설정 복사</Button>
              </div>
            </li>
            <li>
              <b>확인</b>
              <span>도구에서 &quot;infrasketch 구성도 목록 보여 줘&quot;처럼 물어 본다. &apos;키가 맞지 않아요&apos;가 나오면 새 키를 만들어 다시 등록한다(Claude Code 는 claude mcp remove infrasketch 뒤 다시 add).</span>
            </li>
          </ol>
          {!fresh && <p className={styles.meta}>키를 만들면 위 명령·설정의 {KEY_SLOT} 자리에 키가 들어가요.</p>}
          {!fresh && <p className={styles.meta} role="status">{copyNote ?? ""}</p>}
        </div>
      </aside>
      </div>
      {dialog && <DialogView dialog={dialog} onClose={() => setDialog(null)} />}
    </div>
  );
}
