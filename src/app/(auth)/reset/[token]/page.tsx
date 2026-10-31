"use client";

import Link from "next/link";
import { use, useActionState } from "react";

import { resetPasswordAction, type FormState } from "@/server/auth/actions";
import { Logo } from "@/ui/brand/Logo";

import styles from "../../auth.module.css";

export default function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [state, action, pending] = useActionState<FormState, FormData>(resetPasswordAction, {});
  return (
    <main className={styles.page}>
      <form action={action} className={styles.form}>
        <Logo className={styles.logo} />
        <h1 className={styles.title}>새 비밀번호 설정</h1>
        <input type="hidden" name="token" value={token} />
        <label className={styles.field}>
          새 비밀번호
          <input name="password" type="password" autoComplete="new-password" required minLength={8} className={styles.input} />
          {state.errors?.password && <p className={styles.error} role="alert">{state.errors.password}</p>}
        </label>
        <button type="submit" disabled={pending} className={styles.button}>비밀번호 바꾸기</button>
        <div className={styles.links}>
          <Link href="/login">로그인</Link>
        </div>
      </form>
    </main>
  );
}
