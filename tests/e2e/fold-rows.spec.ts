import { expect, test, type Page } from "@playwright/test";

import { S1_NODE_COUNT } from "./fake-llm";

const uid = () => Math.random().toString(36).slice(2, 8);
const PLACEHOLDER = "만들고 싶은 서비스나 바꾸고 싶은 점을 말해 주세요. 노드를 오른쪽 클릭하면 참조를 붙일 수 있어요.";
const nodes = (page: Page) => page.locator(".react-flow__node-infra");

test("「묶음 접기」로 이중화 묶음을 한 번에 접고 다시 편다", async ({ page }) => {
  const name = `fold${uid()}`;
  await page.goto("/signup");
  await page.getByLabel("아이디").fill(name);
  await page.getByLabel("이메일").fill(`${name}@b.co`);
  await page.getByLabel("비밀번호").fill("password1");
  await page.getByRole("button", { name: "가입하기" }).click();
  await page.getByRole("button", { name: "새 프로젝트" }).click();
  await page.getByRole("dialog").getByLabel("이름").fill("묶음 접기");
  await page.getByRole("dialog").getByRole("button", { name: "만들기" }).click();
  await page.waitForURL(/\/p\/[^/]+\/d\/[^/]+/);
  await page.getByRole("tab", { name: "대화" }).click();
  await page.getByPlaceholder(PLACEHOLDER).fill("AWS 에 결제랑 카카오 로그인 붙는 쇼핑몰");
  await page.getByRole("button", { name: "보내기" }).click();
  await expect(nodes(page)).toHaveCount(S1_NODE_COUNT, { timeout: 30_000 });
  await expect(page.getByText(/^(?:\d+곳 바꿨어요|바꾼 곳이 없어요)/)).toBeVisible({ timeout: 30_000 });

  await page.getByRole("button", { name: "묶음 접기", exact: true }).click();
  await expect(page.getByRole("button", { name: "묶음 펼치기", exact: true })).toBeVisible();
  await expect.poll(() => nodes(page).count()).toBeLessThan(S1_NODE_COUNT);

  await page.getByRole("button", { name: "묶음 펼치기", exact: true }).click();
  await expect(page.getByRole("button", { name: "묶음 접기", exact: true })).toBeVisible();
  await expect(nodes(page)).toHaveCount(S1_NODE_COUNT);
});
