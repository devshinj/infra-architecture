import { expect, test, type Page } from "@playwright/test";

import { S1_NODE_COUNT } from "./fake-llm";

const uid = () => Math.random().toString(36).slice(2, 8);
const PLACEHOLDER = "만들고 싶은 서비스나 바꾸고 싶은 점을 말해 주세요. 노드를 오른쪽 클릭하면 참조를 붙일 수 있어요.";
const DONE = /노드 \d+ · 연결 \d+ · 적용 \d+ · 건너뜀 \d+/;
const Q1 = "이 서버는 왜 두 대예요?";
const Q2 = "그럼 왜 하나면 안 돼요?";

async function setup(page: Page) {
  const name = `ask${uid()}`;
  await page.goto("/signup");
  await page.getByLabel("아이디").fill(name);
  await page.getByLabel("이메일").fill(`${name}@b.co`);
  await page.getByLabel("비밀번호").fill("password1");
  await page.getByRole("button", { name: "가입하기" }).click();
  await page.getByRole("button", { name: "새 프로젝트" }).click();
  await page.getByRole("dialog").getByLabel("이름").fill("질문 테스트");
  await page.getByRole("dialog").getByRole("button", { name: "만들기" }).click();
  await page.waitForURL(/\/p\/[^/]+\/d\/[^/]+/);
  await page.getByRole("tab", { name: "대화" }).click();
  await page.getByPlaceholder(PLACEHOLDER).fill("결제랑 카카오 로그인 붙는 쇼핑몰");
  await page.getByRole("button", { name: "보내기" }).click();
  await expect(nodes(page)).toHaveCount(S1_NODE_COUNT, { timeout: 30_000 });
  await expect(page.getByText(DONE)).toBeVisible({ timeout: 30_000 });
}

const nodes = (page: Page) => page.locator(".react-flow__node-infra");
const askInput = (page: Page) => page.getByPlaceholder("예: 이 서버는 왜 두 대예요?");
const picker = (page: Page) => page.getByRole("button", { name: /^구성도 대화$|WAS #1 · / });

async function askFromExplanation(page: Page, text: string) {
  await page.getByTitle("WAS #1").click();
  await askInput(page).fill(text);
  await page.getByRole("button", { name: "질문 보내기" }).click();
  await expect(page.getByRole("tab", { name: "대화" })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByText(`가짜 답이에요. ${text}`)).toBeVisible({ timeout: 15_000 });
}

test("ask from explanation creates a session and answers", async ({ page }) => {
  await setup(page);
  await askFromExplanation(page, Q1);
  await expect(page.getByRole("button", { name: `WAS #1 · ${Q1}` })).toBeVisible();
});

test("follow-up stays in the session and main chat is untouched", async ({ page }) => {
  await setup(page);
  await askFromExplanation(page, Q1);
  await page.getByPlaceholder("이 노드에 대해 더 물어보기").fill(Q2);
  await page.getByRole("button", { name: "보내기" }).click();
  await expect(page.getByText(`가짜 답이에요. ${Q2}`)).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(Q1, { exact: true }).first()).toBeVisible();

  await picker(page).click();
  await page.getByRole("menu", { name: "대화 고르기" }).getByRole("menuitem", { name: /^구성도 대화$/ }).click();
  await expect(page.getByPlaceholder(PLACEHOLDER)).toBeVisible();
  await expect(page.getByText(Q1)).toHaveCount(0);
  await expect(page.getByText(Q2)).toHaveCount(0);
});

test("change request hands off to main chat", async ({ page }) => {
  await setup(page);
  const req = "이 서버 이중화해 줘";
  await page.getByTitle("WAS #1").click();
  await askInput(page).fill(req);
  await page.getByRole("button", { name: "질문 보내기" }).click();
  await expect(page.getByText("구성을 바꾸려면 구성도 대화에서 말해 주세요.")).toBeVisible({ timeout: 15_000 });
  await page.getByRole("button", { name: "구성도 대화로 보내기" }).click();
  const input = page.getByPlaceholder(PLACEHOLDER);
  await expect(input).toBeVisible();
  await expect(input).toContainText(req);
  await expect(page.getByText("WAS #1").first()).toBeVisible();
  // 보내지는 않는다: 구성도 대화에 사용자 글이 쌓이지 않는다.
  await expect(page.getByRole("button", { name: "보내기" })).toBeEnabled();
});

test("menu ask focuses the ask input", async ({ page }) => {
  await setup(page);
  await page.getByTitle("WAS #1").click({ button: "right" });
  await page.getByRole("menuitem", { name: "이 노드에 대해 물어보기" }).click();
  await expect(page.getByRole("tab", { name: "설명" })).toHaveAttribute("aria-selected", "true");
  await expect(askInput(page)).toBeFocused();
});

test("sessions survive reload", async ({ page }) => {
  await setup(page);
  await askFromExplanation(page, Q1);
  await page.reload();
  await expect(nodes(page)).toHaveCount(S1_NODE_COUNT, { timeout: 30_000 });
  await page.getByRole("tab", { name: "대화" }).click();
  await expect(page.getByPlaceholder(PLACEHOLDER)).toBeVisible();
  await picker(page).click();
  await page.getByRole("menu", { name: "대화 고르기" }).getByRole("menuitem", { name: new RegExp(`WAS #1 · ${Q1.slice(0, 6)}`) }).click();
  await expect(page.getByText(`가짜 답이에요. ${Q1}`)).toBeVisible({ timeout: 15_000 });
});
