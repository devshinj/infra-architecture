"use client";

import Link from "next/link";

import { resetPasswordAction } from "@/server/auth/actions";
import { checkNewPassword, HINTS, MESSAGES } from "@/server/auth/rules";
import { Logo } from "@/ui/brand/Logo";

import { AuthField, AuthSubmit } from "../../_components/AuthField";
import { useAuthForm, type FieldErrors } from "../../_components/useAuthForm";
import styles from "../../auth.module.css";

function validate(data: FormData): FieldErrors {
  const password = checkNewPassword(String(data.get("password") ?? ""));
  return password ? { password } : {};
}

/** usable: 페이지를 열 때 확인한 링크 상태. false 면 입력칸 대신 새 링크 받기 안내를 보여 준다. */
export function ResetPasswordForm({ token, usable }: { token: string; usable: boolean }) {
  const { state, errors, pending, formProps } = useAuthForm(resetPasswordAction, { validate });
  const expired = !usable || state.expired === true;

  return (
    <main className={styles.page}>
      <form {...formProps} className={styles.form}>
        <Logo className={styles.logo} />
        <h1 className={styles.title}>새 비밀번호 설정</h1>
        {expired ? (
          <>
            <p className={styles.alert} role="alert">
              {errors.form ?? MESSAGES.resetLinkExpired}
            </p>
            <Link href="/reset" className={styles.linkButton}>
              재설정 링크 다시 받기
            </Link>
          </>
        ) : (
          <>
            <input type="hidden" name="token" value={token} />
            <AuthField
              label="새 비밀번호"
              name="password"
              type="password"
              autoComplete="new-password"
              hint={HINTS.password}
              error={errors.password}
              autoFocus
            />
            <AuthSubmit pending={pending} label="비밀번호 바꾸기" pendingLabel="바꾸는 중…" />
          </>
        )}
        <p className={styles.linkLine}>
          <Link href="/login">로그인</Link>
        </p>
      </form>
    </main>
  );
}
