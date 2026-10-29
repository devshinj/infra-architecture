"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

import { signIn } from "@/auth";

import { requestPasswordReset, resetPassword } from "./reset";
import { signup } from "./signup";

export type FormState = {
  errors?: Partial<Record<"username" | "email" | "password" | "form", string>>;
  done?: boolean;
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
      return { errors: { form: "아이디 또는 비밀번호가 올바르지 않습니다" } };
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
    if (e instanceof AuthError) redirect("/login");
    throw e;
  }
  return {};
}

export async function requestResetAction(_prev: FormState, data: FormData): Promise<FormState> {
  await requestPasswordReset(text(data, "email"));
  return { done: true };
}

export async function resetPasswordAction(_prev: FormState, data: FormData): Promise<FormState> {
  const result = await resetPassword(text(data, "token"), text(data, "password"));
  if (!result.ok) return { errors: { password: result.message } };
  redirect("/login");
}
