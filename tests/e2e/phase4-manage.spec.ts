import { expect, test, type Page } from "@playwright/test";

const uid = () => Math.random().toString(36).slice(2, 8);

async function newProject(page: Page, name: string) {
  await page.getByRole("button", { name: "새 프로젝트" }).click();
  await page.getByRole("dialog").getByLabel("이름").fill(name);
  await page.getByRole("dialog").getByRole("button", { name: "만들기" }).click();
  await page.waitForURL(/\/p\/[^/]+\/d\/[^/]+/);
}

/** 404 화면이 한 순간이라도 그려지면 표시해 둔다. */
async function watch404(page: Page) {
  await page.evaluate(() => {
    const w = window as unknown as { __saw404?: boolean };
    w.__saw404 = false;
    const check = () => {
      if (/could not be found|404/.test(document.body.innerText)) w.__saw404 = true;
    };
    new MutationObserver(check).observe(document.body, { childList: true, subtree: true, characterData: true });
  });
}
const saw404 = (page: Page) => page.evaluate(() => (window as unknown as { __saw404?: boolean }).__saw404);

test("대문자 아이디로 가입해도 소문자로 저장되어 로그인된다", async ({ page }) => {
  const name = `Jae${uid()}`;
  await page.goto("/signup");
  await page.getByLabel("아이디").fill(`  ${name} `);
  await page.getByLabel("이메일").fill(`${name.toLowerCase()}@b.co`);
  await page.getByLabel("비밀번호").fill("password1");
  await page.getByRole("button", { name: "가입하기" }).click();
  await expect(page.getByRole("button", { name: "새 프로젝트" })).toBeVisible();
  await expect(page.getByRole("button", { name: "첫 프로젝트 만들기" })).toBeVisible();

  await page.context().clearCookies();
  await page.goto("/login");
  await page.getByLabel("아이디").fill(name.toUpperCase());
  await page.getByLabel("비밀번호").fill("password1");
  await page.getByRole("button", { name: "로그인" }).click();
  await expect(page.getByRole("button", { name: "새 프로젝트" })).toBeVisible();
});

test("로그인 실패 뒤에도 입력값이 남고 안내가 보인다", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("아이디").fill("nobody_here");
  await page.getByLabel("비밀번호").fill("wrongpass1");
  await page.getByRole("button", { name: "로그인" }).click();
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page.getByLabel("아이디")).toHaveValue("nobody_here");
  await expect(page.getByLabel("비밀번호")).toHaveValue("wrongpass1");
});

test("보던 구성도·프로젝트를 지우면 404 없이 다음 화면으로 간다", async ({ page }) => {
  const name = `del${uid()}`;
  await page.goto("/signup");
  await page.getByLabel("아이디").fill(name);
  await page.getByLabel("이메일").fill(`${name}@b.co`);
  await page.getByLabel("비밀번호").fill("password1");
  await page.getByRole("button", { name: "가입하기" }).click();
  await newProject(page, "삭제용");
  const firstUrl = page.url();

  await page.getByRole("button", { name: "삭제용 메뉴" }).click();
  await page.getByRole("menuitem", { name: "새 구성도" }).click();
  await page.getByRole("dialog").getByLabel("이름").fill("운영");
  await page.getByRole("dialog").getByRole("button", { name: "만들기" }).click();
  await expect(page.getByRole("button", { name: "운영", exact: true })).toHaveAttribute("aria-current", "page");

  // 보던 구성도 삭제 → 같은 프로젝트의 남은 구성도로
  await watch404(page);
  await page.getByRole("button", { name: "운영 메뉴" }).click();
  await page.getByRole("menuitem", { name: "삭제" }).click();
  await expect(page.getByRole("alertdialog")).toContainText("‘운영’ 구성도를 삭제할까요?");
  await page.getByRole("alertdialog").getByRole("button", { name: "삭제" }).click();
  await page.waitForURL(firstUrl);
  await expect(page.getByRole("button", { name: "운영", exact: true })).toHaveCount(0);
  expect(await saw404(page)).toBe(false);

  // 보던 프로젝트 삭제 → 홈의 빈 상태로
  await watch404(page);
  await page.getByRole("button", { name: "삭제용 메뉴" }).click();
  await page.getByRole("menuitem", { name: "삭제" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "삭제" }).click();
  await expect(page.getByRole("button", { name: "첫 프로젝트 만들기" })).toBeVisible();
  expect(new URL(page.url()).pathname).toBe("/");
  expect(await saw404(page)).toBe(false);
});
