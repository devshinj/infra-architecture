"use client";

import Link from "next/link";
import { useActionState } from "react";

import { loginAction, type FormState } from "@/server/auth/actions";

import styles from "../auth.module.css";

export default function LoginPage() {
  const [state, action, pending] = useActionState<FormState, FormData>(loginAction, {});
  return (
    <main className={styles.page}>
      <form action={action} className={styles.form}>
        <h1 className={styles.title}>로그인</h1>
        <label className={styles.field}>
          아이디
          <input name="username" autoComplete="username" required className={styles.input} />
        </label>
        <label className={styles.field}>
          비밀번호
          <input name="password" type="password" autoComplete="current-password" required className={styles.input} />
        </label>
        {state.errors?.form && <p className={styles.error} role="alert">{state.errors.form}</p>}
        <button type="submit" disabled={pending} className={styles.button}>로그인</button>
        <div className={styles.links}>
          <Link href="/signup">회원가입</Link>
          <Link href="/reset">비밀번호 찾기</Link>
        </div>
      </form>
    </main>
  );
}
