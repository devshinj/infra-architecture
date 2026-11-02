"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { requestResetAction } from "@/server/auth/actions";
import { checkEmail, RESET_TTL_HOURS } from "@/server/auth/rules";
import { Logo } from "@/ui/brand/Logo";

import { AuthField, AuthSubmit } from "../_components/AuthField";
import { useAuthForm, type FieldErrors } from "../_components/useAuthForm";
import styles from "../auth.module.css";

function validate(data: FormData): FieldErrors {
  const email = checkEmail(String(data.get("email") ?? ""));
  return email ? { email } : {};
}

export default function ResetRequestPage() {
  const { state, errors, pending, formProps } = useAuthForm(requestResetAction, { validate });
  // "다시 보내기" 를 누르면 입력 폼으로 돌아간다. 새 응답이 오면 다시 결과를 보여 준다.
  const [retryFor, setRetryFor] = useState<typeof state | null>(null);
  const done = state.done === true && retryFor !== state;
  const doneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 입력칸·버튼이 사라지므로 포커스를 결과 안내로 옮긴다.
    if (done) doneRef.current?.focus();
  }, [done]);

  return (
    <main className={styles.page}>
      <form {...formProps} className={styles.form}>
        <Logo className={styles.logo} />
        <h1 className={styles.title}>비밀번호 찾기</h1>
        {done ? (
          <div ref={doneRef} tabIndex={-1} role="status" className={styles.doneBox}>
            <p className={styles.notice}>
              가입된 이메일이라면 비밀번호 재설정 링크를 보냈습니다. 링크는 {RESET_TTL_HOURS}시간 동안 쓸 수 있습니다.
            </p>
            <p className={styles.hint}>
              메일이 오지 않으면 스팸함을 확인하거나, 이메일 주소를 확인한 뒤 다시 보내 주세요.
            </p>
            <button type="button" className={styles.button} onClick={() => setRetryFor(state)}>
              다시 보내기
            </button>
          </div>
        ) : (
          <>
            <p className={styles.notice}>가입할 때 쓴 이메일을 입력하면 비밀번호를 다시 정할 수 있는 링크를 보내 드립니다.</p>
            <AuthField
              label="이메일"
              name="email"
              type="email"
              autoComplete="email"
              error={errors.email}
              autoFocus
            />
            <AuthSubmit pending={pending} label="재설정 링크 보내기" pendingLabel="보내는 중…" />
          </>
        )}
        <p className={styles.linkLine}>
          비밀번호가 생각났나요? <Link href="/login">로그인</Link>
        </p>
      </form>
    </main>
  );
}
