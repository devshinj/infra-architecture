"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

import { signIn } from "@/auth";

import { requestPasswordReset, resetPassword } from "./reset";
import { checkEmail, MESSAGES, normalizeEmail } from "./rules";
import { signup } from "./signup";

export type FormState = {
  errors?: Partial<Record<"username" | "email" | "password" | "form", string>>;
  done?: boolean;
  /** 재설정 링크를 보낸 주소(사용자가 입력한 값을 맞춘 것 — 계정이 있는지는 담지 않는다) */
  email?: string;
  /** 재설정 링크가 만료됐거나 이미 쓰였다 — 새 링크를 받아야 한다. */
  expired?: boolean;
};

const text = (data: FormData, key: string) => String(data.get(key) ?? "");

export async function loginAction(_prev: FormState, data: FormData): Promise<FormState> {
  try {
    await signIn("credentials", {
      username: text(data, "username"),
      password: text(data, "password"),
      redirectTo: "/",
    });
  } catch (e) {
    if (e instanceof AuthError) {
      return { errors: { form: MESSAGES.loginFailed } };
    }
    throw e; // signIn 성공 시의 redirect 도 여기로 온다.
  }
  return {};
}

export async function signupAction(_prev: FormState, data: FormData): Promise<FormState> {
  const username = text(data, "username");
  const password = text(data, "password");
  const result = await signup({ username, password, email: text(data, "email") });
  if (!result.ok) return { errors: { [result.field]: result.message } };
  try {
    await signIn("credentials", { username, password, redirectTo: "/" });
  } catch (e) {
    // 가입은 끝났으니 로그인 화면에서 그렇다고 알려 준다.
    if (e instanceof AuthError) redirect("/login?notice=signup");
    throw e;
  }
  return {};
}

export async function requestResetAction(_prev: FormState, data: FormData): Promise<FormState> {
  // 형식 오류는 계정 유무와 상관없으므로 칸 오류로 돌려줘도 된다.
  const emailError = checkEmail(text(data, "email"));
  if (emailError) return { errors: { email: emailError } };
  const email = normalizeEmail(text(data, "email"));
  await requestPasswordReset(email);
  return { done: true, email };
}

export async function resetPasswordAction(_prev: FormState, data: FormData): Promise<FormState> {
  const result = await resetPassword(text(data, "token"), text(data, "password"));
  if (!result.ok) {
    return result.reason === "token"
      ? { errors: { form: result.message }, expired: true }
      : { errors: { password: result.message } };
  }
  redirect("/login?notice=reset");
}
