"use client";

import Link from "next/link";
import { useActionState } from "react";

import { requestResetAction, type FormState } from "@/server/auth/actions";

import styles from "../auth.module.css";

export default function ResetRequestPage() {
  const [state, action, pending] = useActionState<FormState, FormData>(requestResetAction, {});
  return (
    <main className={styles.page}>
      <form action={action} className={styles.form}>
        <h1 className={styles.title}>비밀번호 찾기</h1>
        {state.done ? (
          <p className={styles.notice} role="status">
            입력한 이메일로 재설정 링크를 보냈습니다. 메일이 없다면 주소를 확인해 주세요.
          </p>
        ) : (
          <>
            <label className={styles.field}>
              이메일
              <input name="email" type="email" autoComplete="email" required className={styles.input} />
            </label>
            <button type="submit" disabled={pending} className={styles.button}>재설정 링크 보내기</button>
          </>
        )}
        <div className={styles.links}>
          <Link href="/login">로그인</Link>
        </div>
      </form>
    </main>
  );
}
