import { expect, test, type Page } from "@playwright/test";

import { S1_NODE_COUNT } from "./fake-llm";

const uid = () => Math.random().toString(36).slice(2, 8);
const PLACEHOLDER = "만들고 싶은 서비스나 바꾸고 싶은 점을 말해 주세요. 노드를 오른쪽 클릭하면 참조를 붙일 수 있어요.";
const PLACEHOLDER_NARROW = "만들고 싶은 서비스나 바꾸고 싶은 점을 말해 주세요.";
const DONE = /노드 \d+ · 연결 \d+ · (?:\d+곳 바꿨어요|바꾼 곳이 없어요)/;
const FIRST = "AWS 에 결제랑 카카오 로그인 붙는 쇼핑몰";
const SECOND = "긴이름 노드 하나 그려 줘";
const SECOND_REPLY = "긴 이름 노드를 그렸어요.";
const HINT = /^새 대화예요\./;

const nodes = (page: Page) => page.locator(".react-flow__node-infra");
/** 대화 탭 맨 위 고르기 버튼(지금 대화 이름). */
const picker = (page: Page) => page.locator("button[data-session-picker]");
/** `새 대화` 버튼(고르기 버튼이 아닌 쪽). */
const newChat = (page: Page) => page.locator("button:not([data-session-picker])", { hasText: /^새 대화$/ });
const list = (page: Page) => page.getByRole("dialog", { name: "대화 고르기" });
const row = (page: Page, text: string | RegExp) => list(page).locator("[data-session-item]").filter({ hasText: text });

async function setup(page: Page) {
  const name = `ses${uid()}`;
  await page.goto("/signup");
  await page.getByLabel("아이디").fill(name);
  await page.getByLabel("이메일").fill(`${name}@b.co`);
  await page.getByLabel("비밀번호").fill("password1");
  await page.getByRole("button", { name: "가입하기" }).click();
  await page.getByRole("button", { name: "새 프로젝트" }).click();
  await page.getByRole("dialog").getByLabel("이름").fill("대화 세션 테스트");
  await page.getByRole("dialog").getByRole("button", { name: "만들기" }).click();
  await page.waitForURL(/\/p\/[^/]+\/d\/[^/]+/);
  await page.getByRole("tab", { name: "대화" }).click();
  await page.getByPlaceholder(PLACEHOLDER).fill(FIRST);
  await page.getByRole("button", { name: "보내기" }).click();
  await expect(page.getByText(DONE)).toBeVisible({ timeout: 30_000 });
  await expect(nodes(page)).toHaveCount(S1_NODE_COUNT, { timeout: 30_000 });
}

test("a new diagram chat has its own history, shares the diagram, and can be renamed and deleted", async ({ page }) => {
  await setup(page);
  await expect(picker(page)).toHaveText("기본 대화");

  // 새 대화: 빈 대화가 열리고 기본 대화 글은 보이지 않는다.
  await newChat(page).click();
  await expect(picker(page)).toHaveText("새 대화");
  await expect(page.getByText(HINT)).toBeVisible();
  await expect(page.getByText(FIRST, { exact: true })).toHaveCount(0);
  await expect(page.getByPlaceholder(PLACEHOLDER)).toBeFocused();

  // 첫 메시지로 세션이 생기고 이름이 그 글이 된다. 구성도는 하나라 같은 캔버스에 더해진다.
  await page.getByPlaceholder(PLACEHOLDER).fill(SECOND);
  await page.getByRole("button", { name: "보내기" }).click();
  await expect(page.getByText(SECOND_REPLY)).toBeVisible({ timeout: 15_000 });
  // 차례가 끝날 때까지(버전 저장) 기다린다: 안내 글은 저장보다 먼저 온다.
  await expect(page.getByText(DONE)).toBeVisible({ timeout: 15_000 });
  await expect(nodes(page)).toHaveCount(S1_NODE_COUNT + 1, { timeout: 15_000 });
  await expect(picker(page)).toHaveText(SECOND);

  // 기본 대화로 돌아가면 그 기록만 보인다.
  await picker(page).click();
  await expect(list(page).getByRole("region", { name: "구성도 대화" })).toBeVisible();
  await row(page, /^기본 대화$/).click();
  await expect(page.getByText(FIRST, { exact: true })).toBeVisible();
  await expect(page.getByText(SECOND_REPLY)).toHaveCount(0);

  // 새로고침해도 세션과 그 기록이 남는다.
  await page.reload();
  await page.getByRole("tab", { name: "대화" }).click();
  await picker(page).click();
  await row(page, SECOND).click();
  await expect(page.getByText(SECOND_REPLY)).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(FIRST, { exact: true })).toHaveCount(0);
  await expect(nodes(page)).toHaveCount(S1_NODE_COUNT + 1, { timeout: 15_000 });

  // 이름 바꾸기(행 ⋯ 메뉴).
  await picker(page).click();
  await list(page).getByRole("button", { name: `${SECOND} 메뉴` }).click();
  await page.getByRole("menuitem", { name: "이름 바꾸기" }).click();
  const nameDialog = page.getByRole("dialog", { name: "대화 이름 바꾸기" });
  await nameDialog.getByLabel("이름").fill("긴 이름 실험");
  await nameDialog.getByRole("button", { name: "바꾸기" }).click();
  await expect(nameDialog).toHaveCount(0);
  await expect(picker(page)).toHaveText("긴 이름 실험");
  await expect(picker(page)).toBeFocused();
  await expect(nodes(page)).toHaveCount(S1_NODE_COUNT + 1);

  // 삭제: 확인 후 기본 대화로 돌아가고, 구성도는 그대로다.
  await picker(page).click();
  await list(page).getByRole("button", { name: "긴 이름 실험 메뉴" }).click();
  await page.getByRole("menuitem", { name: "삭제" }).click();
  const confirm = page.getByRole("alertdialog", { name: "대화 삭제" });
  await expect(confirm).toContainText("구성도와 버전 이력은 그대로예요");
  await confirm.getByRole("button", { name: "삭제" }).click();
  await expect(confirm).toHaveCount(0);
  await expect(picker(page)).toHaveText("기본 대화");
  await expect(page.getByText(FIRST, { exact: true })).toBeVisible();
  await expect(nodes(page)).toHaveCount(S1_NODE_COUNT + 1);

  await page.reload();
  await page.getByRole("tab", { name: "대화" }).click();
  await expect(picker(page)).toBeDisabled(); // 남은 세션이 없다
});

test.describe("phone layout", () => {
  test("새 대화 works from the 대화 tab with finger-sized controls", async ({ page }) => {
    await setup(page);
    // 휴대폰 너비(≤640px): 아래 탭 막대의 대화 화면에서 쓴다.
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole("tablist", { name: "작업 화면" }).getByRole("tab", { name: "대화" }).click();
    const btn = newChat(page);
    await expect(btn).toBeVisible();
    expect((await btn.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await btn.click();
    await page.getByPlaceholder(PLACEHOLDER_NARROW).fill(SECOND);
    await page.getByRole("button", { name: "보내기" }).click();
    await expect(page.getByText(SECOND_REPLY)).toBeVisible({ timeout: 15_000 });
    await expect(picker(page)).toHaveText(SECOND);

    await picker(page).click();
    const rows = list(page).locator("[data-session-item]");
    expect((await rows.first().boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await row(page, /^기본 대화$/).click();
    await expect(page.getByText(FIRST, { exact: true })).toBeVisible();
  });
});
