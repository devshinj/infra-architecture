"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

import { resetPasswordAction } from "@/server/auth/actions";
import { checkNewPassword, HINTS, MESSAGES } from "@/server/auth/rules";
import { Logo } from "@/ui/brand/Logo";
import { buttonClassName } from "@/ui/Button";

import { AuthField, AuthSubmit } from "../../_components/AuthField";
import { useAuthForm, type FieldErrors } from "../../_components/useAuthForm";
import { AuthStage } from "../../_components/AuthStage";
import styles from "../../auth.module.css";

function validate(data: FormData): FieldErrors {
  const password = checkNewPassword(String(data.get("password") ?? ""));
  return password ? { password } : {};
}

/** usable: 페이지를 열 때 확인한 링크 상태. false 면 입력칸 대신 새 링크 받기 안내를 보여 준다. */
export function ResetPasswordForm({ token, usable }: { token: string; usable: boolean }) {
  const { state, errors, pending, formProps } = useAuthForm(resetPasswordAction, { validate });
  const expired = !usable || state.expired === true;
  const renewRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    // 제출 중에 만료되면 입력칸·버튼이 사라진다 — 포커스가 문서 처음으로 떨어지지 않게 다음 할 일로 옮긴다.
    if (state.expired) renewRef.current?.focus();
  }, [state]);

  return (
    <main className={styles.page}>
      <AuthStage />
      <form {...formProps} className={styles.form}>
        <Logo className={styles.logo} />
        <h1 className={styles.title}>새 비밀번호 설정</h1>
        {expired ? (
          <>
            <p className={styles.alert} role="alert">
              {errors.form ?? MESSAGES.resetLinkExpired}
            </p>
            <Link href="/reset" ref={renewRef} {...buttonClassName({ variant: "primary", size: "lg", block: true, className: styles.submit })}>
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
