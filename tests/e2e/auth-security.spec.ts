import { expect, test, type Page } from "@playwright/test";
import postgres from "postgres";

import { E2E_DB_URL } from "./global-setup";

const uid = () => Math.random().toString(36).slice(2, 8);

async function signupAndLand(page: Page): Promise<string> {
  const name = `sec${uid()}`;
  await page.goto("/signup");
  await page.getByLabel("아이디").fill(name);
  await page.getByLabel("이메일").fill(`${name}@b.co`);
  await page.getByLabel("비밀번호").fill("password1");
  await page.getByRole("button", { name: "가입하기" }).click();
  await expect(page.getByRole("button", { name: "새 프로젝트" })).toBeVisible();
  return name;
}

test("비밀번호를 재설정해 세션 번호가 오르면 열려 있던 로그인이 끊긴다", async ({ page }) => {
  const name = await signupAndLand(page);
  const sql = postgres(E2E_DB_URL, { max: 1, onnotice: () => {} });
  try {
    await sql`UPDATE users SET session_version = session_version + 1 WHERE username = ${name}`;
  } finally {
    await sql.end();
  }
  await page.reload();
  await expect(page).toHaveURL(/\/login$/);
  // 다시 로그인하면 새 번호로 들어간다.
  await page.getByLabel("아이디").fill(name);
  await page.getByLabel("비밀번호").fill("password1");
  await page.getByRole("button", { name: "로그인", exact: true }).click();
  await expect(page.getByRole("button", { name: "새 프로젝트" })).toBeVisible();
});

test("같은 아이디로 10번 틀리면 맞는 비밀번호도 잠시 막힌다", async ({ browser }) => {
  const setup = await browser.newPage();
  const name = await signupAndLand(setup);
  await setup.close();

  const page = await browser.newPage();
  await page.goto("/login");
  const login = async (password: string) => {
    await page.getByLabel("아이디").fill(name);
    await page.getByLabel("비밀번호").fill(password);
    await page.getByRole("button", { name: "로그인", exact: true }).click();
  };
  for (let i = 0; i < 10; i++) {
    await login("wrong-pass");
    await expect(page.getByRole("alert").filter({ hasText: "아이디 또는 비밀번호가 맞지 않아요" })).toBeVisible();
  }
  await login("password1");
  await expect(page.getByRole("alert").filter({ hasText: "시도가 너무 많아요. 잠시 후에 다시 시도해 주세요" })).toBeVisible();
  await page.close();
});

test("같은 주소로 재설정 링크를 네 번째 요청하면 잠시 후에 다시 하라고 한다", async ({ page }) => {
  const email = `nobody${uid()}@x.co`;
  await page.goto("/reset");
  for (let i = 0; i < 3; i++) {
    await page.getByLabel("이메일").fill(email);
    await page.getByRole("button", { name: "재설정 링크 보내기" }).click();
    await expect(page.getByText("가입된 이메일이라면")).toBeVisible();
    await page.getByRole("button", { name: "다시 보내기" }).click();
  }
  await page.getByRole("button", { name: "재설정 링크 보내기" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "시도가 너무 많아요. 잠시 후에 다시 시도해 주세요" })).toBeVisible();
});
