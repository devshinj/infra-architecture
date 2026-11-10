"use client";

import Link from "next/link";

import { loginAction } from "@/server/auth/actions";
import { MESSAGES, normalizeUsername } from "@/server/auth/rules";
import { Logo } from "@/ui/brand/Logo";

import { AuthField, AuthShowcase, AuthSubmit } from "../_components/AuthField";
import { useAuthForm, type FieldErrors } from "../_components/useAuthForm";
import styles from "../auth.module.css";

function validate(data: FormData): FieldErrors {
  const errors: FieldErrors = {};
  if (!normalizeUsername(String(data.get("username") ?? ""))) errors.username = MESSAGES.usernameRequired;
  if (!String(data.get("password") ?? "")) errors.password = MESSAGES.passwordRequired;
  return errors;
}

/** notice: 다른 화면에서 넘어온 안내(비밀번호를 바꿨다 등) */
export function LoginForm({ notice }: { notice?: string }) {
  const { state, errors, pending, formProps } = useAuthForm(loginAction, {
    validate,
    focusOnFormError: "password",
  });
  return (
    <main className={styles.page}>
      <form {...formProps} className={styles.form}>
        <Logo className={styles.logo} />
        <h1 className={styles.title}>로그인</h1>
        {notice && !state.errors && (
          <p className={styles.notice} role="status">
            {notice}
          </p>
        )}
        <AuthField label="아이디" name="username" autoComplete="username" error={errors.username} autoFocus />
        <AuthField
          label="비밀번호"
          name="password"
          type="password"
          autoComplete="current-password"
          error={errors.password}
        />
        {errors.form && (
          <p className={styles.alert} role="alert">
            {errors.form}
          </p>
        )}
        <AuthSubmit pending={pending} label="로그인" pendingLabel="로그인하는 중…" />
        <div className={styles.links}>
          <Link href="/signup">회원가입</Link>
          <Link href="/reset">비밀번호 찾기</Link>
        </div>
      </form>
      <AuthShowcase />
    </main>
  );
}
