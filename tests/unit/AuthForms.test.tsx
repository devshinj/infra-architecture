import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import type { FormState } from "@/server/auth/actions";
import { MESSAGES } from "@/server/auth/rules";

const actions = vi.hoisted(() => ({
  loginAction: vi.fn<(prev: FormState, data: FormData) => Promise<FormState>>(),
  signupAction: vi.fn<(prev: FormState, data: FormData) => Promise<FormState>>(),
  requestResetAction: vi.fn<(prev: FormState, data: FormData) => Promise<FormState>>(),
  resetPasswordAction: vi.fn<(prev: FormState, data: FormData) => Promise<FormState>>(),
}));
vi.mock("@/server/auth/actions", () => actions);

import { LoginForm } from "@/app/(auth)/login/LoginForm";
import ResetRequestPage from "@/app/(auth)/reset/page";
import { ResetPasswordForm } from "@/app/(auth)/reset/[token]/ResetPasswordForm";
import SignupPage from "@/app/(auth)/signup/page";

beforeEach(() => {
  for (const fn of Object.values(actions)) fn.mockReset();
});
afterEach(cleanup);

async function fillSignup(user: ReturnType<typeof userEvent.setup>, name: string, email: string, password: string) {
  await user.type(screen.getByLabelText("아이디"), name);
  await user.type(screen.getByLabelText("이메일"), email);
  await user.type(screen.getByLabelText("비밀번호"), password);
}

describe("signup", () => {
  test("rules are shown before submit and linked to the inputs", () => {
    render(<SignupPage />);
    expect(screen.getByLabelText("아이디")).toHaveAccessibleDescription(/3~32자/);
    expect(screen.getByLabelText("비밀번호")).toHaveAccessibleDescription("8자 이상");
    expect(screen.getByLabelText("아이디")).toHaveFocus();
  });

  test("label lookups stay unambiguous with the show-password button (e2e uses substring getByLabel)", () => {
    render(<SignupPage />);
    expect(screen.getAllByLabelText("비밀번호", { exact: false })).toHaveLength(1);
    expect(screen.getAllByLabelText("아이디", { exact: false })).toHaveLength(1);
    expect(screen.getAllByLabelText("이메일", { exact: false })).toHaveLength(1);
    expect(screen.getByRole("button", { name: "가입하기" })).toBeInTheDocument();
  });

  test("client check matches server rules: blocks submit, marks the field, focuses it, keeps values", async () => {
    const user = userEvent.setup();
    render(<SignupPage />);
    await fillSignup(user, "j!", "a@b.co", "password1");
    await user.click(screen.getByRole("button", { name: "가입하기" }));

    const name = screen.getByLabelText("아이디");
    expect(actions.signupAction).not.toHaveBeenCalled();
    expect(name).toHaveAttribute("aria-invalid", "true");
    expect(name).toHaveAccessibleDescription(/3~32자/);
    expect(name).toHaveFocus();
    expect(screen.getByLabelText("이메일")).toHaveValue("a@b.co");
    expect(screen.getByLabelText("비밀번호")).toHaveValue("password1");
  });

  test("typing in a field clears its error", async () => {
    const user = userEvent.setup();
    render(<SignupPage />);
    await fillSignup(user, "jae", "a@b.co", "short");
    await user.click(screen.getByRole("button", { name: "가입하기" }));
    const pw = screen.getByLabelText("비밀번호");
    expect(pw).toHaveAttribute("aria-invalid", "true");
    await user.type(pw, "er1");
    expect(pw).not.toHaveAttribute("aria-invalid");
  });

  test("server error keeps every typed value and focuses the field", async () => {
    actions.signupAction.mockResolvedValue({ errors: { username: MESSAGES.usernameTaken } });
    const user = userEvent.setup();
    render(<SignupPage />);
    await fillSignup(user, "jae", "a@b.co", "password1");
    await user.click(screen.getByRole("button", { name: "가입하기" }));

    await screen.findByText(MESSAGES.usernameTaken);
    expect(actions.signupAction).toHaveBeenCalledTimes(1);
    const sent = actions.signupAction.mock.calls[0][1];
    expect(Object.fromEntries(sent)).toEqual({ username: "jae", email: "a@b.co", password: "password1" });
    await waitFor(() => expect(screen.getByLabelText("아이디")).toHaveFocus());
    expect(screen.getByLabelText("아이디")).toHaveValue("jae");
    expect(screen.getByLabelText("이메일")).toHaveValue("a@b.co");
    expect(screen.getByLabelText("비밀번호")).toHaveValue("password1");
  });

  test("button says it is working while the request is pending", async () => {
    // 끝나지 않는 액션을 남기면 React 가 뒤 테스트의 전환까지 묶어 둔다 — 마지막에 끝낸다.
    let finish!: (s: FormState) => void;
    actions.signupAction.mockReturnValue(new Promise((resolve) => (finish = resolve)));
    const user = userEvent.setup();
    render(<SignupPage />);
    await fillSignup(user, "jae", "a@b.co", "password1");
    await user.click(screen.getByRole("button", { name: "가입하기" }));
    const busy = await screen.findByRole("button", { name: "가입하는 중…" });
    expect(busy).toBeDisabled();
    expect(busy).toHaveAttribute("aria-busy", "true");
    finish({});
    expect(await screen.findByRole("button", { name: "가입하기" })).toBeEnabled();
  });

  test("show-password button toggles the input type", async () => {
    const user = userEvent.setup();
    render(<SignupPage />);
    const pw = screen.getByLabelText("비밀번호");
    expect(pw).toHaveAttribute("type", "password");
    await user.click(screen.getByRole("button", { name: "보기" }));
    expect(pw).toHaveAttribute("type", "text");
    await user.click(screen.getByRole("button", { name: "숨기기" }));
    expect(pw).toHaveAttribute("type", "password");
  });

  test("links back to login", () => {
    render(<SignupPage />);
    expect(screen.getByRole("link", { name: "로그인" })).toHaveAttribute("href", "/login");
  });
});

describe("login", () => {
  test("empty fields are caught before submit", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);
    await user.click(screen.getByRole("button", { name: "로그인" }));
    expect(actions.loginAction).not.toHaveBeenCalled();
    expect(screen.getByLabelText("아이디")).toHaveAccessibleDescription("아이디를 입력해 주세요");
    expect(screen.getByLabelText("아이디")).toHaveFocus();
  });

  test("failed login keeps the username and focuses the password", async () => {
    actions.loginAction.mockResolvedValue({ errors: { form: MESSAGES.loginFailed } });
    const user = userEvent.setup();
    render(<LoginForm />);
    await user.type(screen.getByLabelText("아이디"), "jae");
    await user.type(screen.getByLabelText("비밀번호"), "wrongpass");
    await user.click(screen.getByRole("button", { name: "로그인" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(MESSAGES.loginFailed);
    expect(screen.getByLabelText("아이디")).toHaveValue("jae");
    await waitFor(() => expect(screen.getByLabelText("비밀번호")).toHaveFocus());
  });

  test("shows a notice passed from another screen and keeps the links", () => {
    render(<LoginForm notice="비밀번호를 바꿨어요. 새 비밀번호로 로그인해 주세요." />);
    expect(screen.getByRole("status")).toHaveTextContent("비밀번호를 바꿨어요");
    expect(screen.getByRole("link", { name: "회원가입" })).toHaveAttribute("href", "/signup");
    expect(screen.getByRole("link", { name: "비밀번호 찾기" })).toHaveAttribute("href", "/reset");
  });
});

describe("reset request", () => {
  test("bad email is caught before submit", async () => {
    const user = userEvent.setup();
    render(<ResetRequestPage />);
    await user.type(screen.getByLabelText("이메일"), "nope");
    await user.click(screen.getByRole("button", { name: "재설정 링크 보내기" }));
    expect(actions.requestResetAction).not.toHaveBeenCalled();
    expect(screen.getByLabelText("이메일")).toHaveAttribute("aria-invalid", "true");
  });

  test("done state explains what happens, takes focus, and can go back to the form", async () => {
    actions.requestResetAction.mockResolvedValue({ done: true, email: "a@b.co" });
    const user = userEvent.setup();
    render(<ResetRequestPage />);
    await user.type(screen.getByLabelText("이메일"), "a@b.co");
    await user.click(screen.getByRole("button", { name: "재설정 링크 보내기" }));

    const status = await screen.findByRole("status");
    expect(status).toHaveTextContent("가입된 이메일이라면");
    expect(status).toHaveTextContent("1시간");
    expect(status).toHaveTextContent("a@b.co");
    await waitFor(() => expect(status).toHaveFocus());

    await user.click(screen.getByRole("button", { name: "다시 보내기" }));
    expect(screen.getByLabelText("이메일")).toHaveValue("a@b.co");
  });

  test("a server-side email error is shown on the field", async () => {
    actions.requestResetAction.mockResolvedValue({ errors: { email: MESSAGES.emailInvalid } });
    const user = userEvent.setup();
    render(<ResetRequestPage />);
    await user.type(screen.getByLabelText("이메일"), "a@b.co");
    await user.click(screen.getByRole("button", { name: "재설정 링크 보내기" }));
    await waitFor(() => expect(screen.getByLabelText("이메일")).toHaveAttribute("aria-invalid", "true"));
    expect(screen.getByLabelText("이메일")).toHaveValue("a@b.co");
  });
});

describe("reset with token", () => {
  test("an expired link shows how to get a new one instead of a password field", () => {
    render(<ResetPasswordForm token="t" usable={false} />);
    expect(screen.getByRole("alert")).toHaveTextContent(MESSAGES.resetLinkExpired);
    expect(screen.getByRole("link", { name: "재설정 링크 다시 받기" })).toHaveAttribute("href", "/reset");
    expect(screen.queryByLabelText("새 비밀번호")).not.toBeInTheDocument();
  });

  test("a link that expires while typing switches to the same guidance", async () => {
    actions.resetPasswordAction.mockResolvedValue({
      errors: { form: MESSAGES.resetLinkExpired },
      expired: true,
    });
    const user = userEvent.setup();
    render(<ResetPasswordForm token="t" usable />);
    expect(screen.getByLabelText("새 비밀번호")).toHaveAccessibleDescription("8자 이상");
    await user.type(screen.getByLabelText("새 비밀번호"), "newpass12");
    await user.click(screen.getByRole("button", { name: "비밀번호 바꾸기" }));

    const renew = await screen.findByRole("link", { name: "재설정 링크 다시 받기" });
    await waitFor(() => expect(renew).toHaveFocus());
    expect(Object.fromEntries(actions.resetPasswordAction.mock.calls[0][1])).toEqual({ token: "t", password: "newpass12" });
  });

  test("a too-short password is caught before submit", async () => {
    const user = userEvent.setup();
    render(<ResetPasswordForm token="t" usable />);
    await user.type(screen.getByLabelText("새 비밀번호"), "short");
    await user.click(screen.getByRole("button", { name: "비밀번호 바꾸기" }));
    expect(actions.resetPasswordAction).not.toHaveBeenCalled();
    expect(screen.getByLabelText("새 비밀번호")).toHaveAccessibleDescription(expect.stringContaining(MESSAGES.passwordShort));
  });
});

describe("auth stage (DESIGN.md: the canvas grammar outside the canvas)", () => {
  test.each([
    ["login", () => <LoginForm />],
    ["signup", () => <SignupPage />],
    ["reset request", () => <ResetRequestPage />],
    ["new password", () => <ResetPasswordForm token="t" usable />],
  ])("%s shows the product line and a decorative diagram, keeping one h1 (the form's)", (_, ui) => {
    render(ui());
    expect(screen.getByText("말로 그리는 인프라 구성도")).toBeInTheDocument();
    const diagram = document.querySelector("[data-auth-diagram]");
    expect(diagram).toHaveAttribute("aria-hidden", "true");
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });

  test("the sign-in screens no longer paint the constellation picture", async () => {
    const { readFileSync } = await import("node:fs");
    expect(readFileSync("src/app/(auth)/auth.module.css", "utf8")).not.toContain("auth-bg");
  });
});
