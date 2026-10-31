"use client";

import Link from "next/link";
import { useActionState } from "react";

import { signupAction, type FormState } from "@/server/auth/actions";
import { Logo } from "@/ui/brand/Logo";

import styles from "../auth.module.css";

export default function SignupPage() {
  const [state, action, pending] = useActionState<FormState, FormData>(signupAction, {});
  const errors = state.errors ?? {};
  return (
    <main className={styles.page}>
      <form action={action} className={styles.form}>
        <Logo className={styles.logo} />
        <h1 className={styles.title}>회원가입</h1>
        <label className={styles.field}>
          아이디
          <input name="username" autoComplete="username" required className={styles.input} />
          {errors.username && <p className={styles.error} role="alert">{errors.username}</p>}
        </label>
        <label className={styles.field}>
          이메일
          <input name="email" type="email" autoComplete="email" required className={styles.input} />
          {errors.email && <p className={styles.error} role="alert">{errors.email}</p>}
        </label>
        <label className={styles.field}>
          비밀번호
          <input name="password" type="password" autoComplete="new-password" required minLength={8} className={styles.input} />
          {errors.password && <p className={styles.error} role="alert">{errors.password}</p>}
        </label>
        <button type="submit" disabled={pending} className={styles.button}>가입하기</button>
        <div className={styles.links}>
          <Link href="/login">로그인</Link>
        </div>
      </form>
    </main>
  );
}
