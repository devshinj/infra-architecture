"use client";

import Link from "next/link";

import { signupAction } from "@/server/auth/actions";
import { checkEmail, checkNewPassword, checkUsername, HINTS } from "@/server/auth/rules";
import { Logo } from "@/ui/brand/Logo";

import { AuthField, AuthSubmit } from "../_components/AuthField";
import { useAuthForm, type FieldErrors } from "../_components/useAuthForm";
import { AuthStage } from "../_components/AuthStage";
import styles from "../auth.module.css";

/** 서버(signup.ts)와 같은 규칙으로 미리 확인한다. */
function validate(data: FormData): FieldErrors {
  const errors: FieldErrors = {};
  const username = checkUsername(String(data.get("username") ?? ""));
  const email = checkEmail(String(data.get("email") ?? ""));
  const password = checkNewPassword(String(data.get("password") ?? ""));
  if (username) errors.username = username;
  if (email) errors.email = email;
  if (password) errors.password = password;
  return errors;
}

export default function SignupPage() {
  const { errors, pending, formProps } = useAuthForm(signupAction, { validate });
  return (
    <main className={styles.page}>
      <AuthStage />
      <form {...formProps} className={styles.form}>
        <Logo className={styles.logo} />
        <h1 className={styles.title}>회원가입</h1>
        <AuthField
          label="아이디"
          name="username"
          autoComplete="username"
          hint={HINTS.username}
          error={errors.username}
          autoFocus
        />
        <AuthField
          label="이메일"
          name="email"
          type="email"
          autoComplete="email"
          hint="비밀번호를 잊었을 때 재설정 링크를 받을 주소예요"
          error={errors.email}
        />
        <AuthField
          label="비밀번호"
          name="password"
          type="password"
          autoComplete="new-password"
          hint={HINTS.password}
          error={errors.password}
        />
        {errors.form && (
          <p className={styles.alert} role="alert">
            {errors.form}
          </p>
        )}
        <AuthSubmit pending={pending} label="가입하기" pendingLabel="가입하는 중…" />
        <p className={styles.linkLine}>
          이미 계정이 있나요? <Link href="/login">로그인</Link>
        </p>
      </form>
    </main>
  );
}
