"use client";

import { startTransition, useActionState, useEffect, useRef, useState, type FormEvent } from "react";

import type { FormState } from "@/server/auth/actions";

export type FieldErrors = NonNullable<FormState["errors"]>;

type Options = {
  /** 제출 전에 화면에서 먼저 확인한다. 서버도 같은 규칙으로 다시 확인한다. */
  validate?: (data: FormData) => FieldErrors;
  /** 칸이 아닌 폼 전체 오류(예: 로그인 실패)일 때 포커스를 줄 칸 이름 */
  focusOnFormError?: string;
};

/**
 * 인증 폼 공통 동작.
 * - form action 을 그대로 넘기면 React 19 가 제출 뒤 입력값을 비운다. 그래서 onSubmit 에서 직접 dispatch 해
 *   실패해도 입력한 값이 남게 한다(자바스크립트가 없으면 form action 으로 그대로 제출된다).
 * - 오류가 생기면 오류가 난 첫 칸으로 포커스를 옮기고, 고치기 시작한 칸의 오류는 지운다.
 */
export function useAuthForm(
  serverAction: (prev: FormState, data: FormData) => Promise<FormState>,
  { validate, focusOnFormError }: Options = {},
) {
  const [state, dispatch, pending] = useActionState<FormState, FormData>(serverAction, {});
  const formRef = useRef<HTMLFormElement>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [focusTick, setFocusTick] = useState(0);

  // 서버 응답이 바뀌면 그 오류를 보여 준다(렌더 중 이전 값과 비교 — effect 없이 동기화).
  const [seen, setSeen] = useState(state);
  if (seen !== state) {
    setSeen(state);
    setErrors(state.errors ?? {});
    if (state.errors) setFocusTick((t) => t + 1);
  }

  useEffect(() => {
    if (focusTick === 0) return;
    const form = formRef.current;
    if (!form) return;
    const invalid = form.querySelector<HTMLInputElement>('input[aria-invalid="true"]');
    const target =
      invalid ??
      (errors.form && focusOnFormError
        ? form.querySelector<HTMLInputElement>(`input[name="${focusOnFormError}"]`)
        : null);
    target?.focus();
    target?.select();
    // focusTick 이 바뀔 때만 옮긴다 — 입력 중에 포커스를 뺏지 않는다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusTick]);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;
    const data = new FormData(event.currentTarget);
    const found = validate?.(data) ?? {};
    if (Object.keys(found).length > 0) {
      setErrors(found);
      setFocusTick((t) => t + 1);
      return;
    }
    setErrors({});
    startTransition(() => dispatch(data));
  };

  /** 입력을 고치기 시작하면 그 칸의 오류를 지운다. */
  const onInput = (event: FormEvent<HTMLFormElement>) => {
    const name = (event.target as HTMLInputElement).name as keyof FieldErrors;
    if (!errors[name]) return;
    setErrors((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  return {
    state,
    errors,
    pending,
    formProps: { ref: formRef, action: dispatch, onSubmit, onInput, noValidate: true },
  };
}
