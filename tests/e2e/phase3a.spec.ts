import { expect, test, type Page } from "@playwright/test";

import { S1_NODE_COUNT } from "./fake-llm";

const uid = () => Math.random().toString(36).slice(2, 8);
const PLACEHOLDER = "만들고 싶은 서비스나 바꾸고 싶은 점을 말해 주세요. 노드를 오른쪽 클릭하면 참조를 붙일 수 있어요.";
const REMINDER = /빠진 정보 (\d+)개가 있어요/;

async function setup(page: Page) {
  const name = `mi${uid()}`;
  await page.goto("/signup");
  await page.getByLabel("아이디").fill(name);
  await page.getByLabel("이메일").fill(`${name}@b.co`);
  await page.getByLabel("비밀번호").fill("password1");
  await page.getByRole("button", { name: "가입하기" }).click();
  await page.getByRole("button", { name: "새 프로젝트" }).click();
  await page.getByRole("dialog").getByLabel("이름").fill("빠진 정보 테스트");
  await page.getByRole("dialog").getByRole("button", { name: "만들기" }).click();
  await page.waitForURL(/\/p\/[^/]+\/d\/[^/]+/);
  await page.getByRole("tab", { name: "대화" }).click();
}

const nodes = (page: Page) => page.locator(".react-flow__node-infra");

async function buildS1(page: Page) {
  await page.getByPlaceholder(PLACEHOLDER).fill("결제랑 카카오 로그인 붙는 쇼핑몰");
  await page.getByRole("button", { name: "보내기" }).click();
  await expect(nodes(page)).toHaveCount(S1_NODE_COUNT, { timeout: 30_000 });
  await expect(page.getByText(/노드 \d+ · 연결 \d+ · 적용 \d+ · 건너뜀 \d+/)).toBeVisible({ timeout: 30_000 });
}

const was1 = (page: Page) => nodes(page).filter({ has: page.getByTitle("WAS #1") });
const was1Badge = (page: Page) => was1(page).getByRole("button", { name: /^빠진 정보 \d+개$/ });
const headCount = async (page: Page) => {
  const t = await page.getByRole("button", { name: /^채워야 할 정보 \(\d+\)/ }).innerText();
  return Number(/\((\d+)\)/.exec(t)![1]);
};
const badgeCount = async (page: Page) => Number(/(\d+)개/.exec((await was1Badge(page).getAttribute("aria-label")) ?? "")![1]);

const versionRows = (page: Page) => page.getByRole("listitem").filter({ has: page.getByRole("button", { name: /^v\d+/ }) });

/** 구성을 만들고 WAS #1 의 RAM 입력 + IP 모름을 저장한다. 저장 전 값(k, N)을 돌려준다. */
async function buildAndSave(page: Page) {
  await setup(page);
  await buildS1(page);

  await expect(page.getByText(REMINDER)).toBeVisible({ timeout: 15_000 });
  const total = Number(REMINDER.exec(await page.getByText(REMINDER).innerText())![1]);
  expect(total).toBeGreaterThan(2);

  // 빠진 정보 숫자는 기본으로 꺼져 있다: 먼저 켠다.
  await expect(was1(page)).toBeVisible();
  await expect(was1Badge(page)).toHaveCount(0);
  await page.getByRole("button", { name: "빠진 정보 숫자" }).click();
  await expect(was1Badge(page)).toBeVisible();
  const k = await badgeCount(page);
  expect(k).toBeGreaterThanOrEqual(2);

  await page.getByRole("tab", { name: "설명" }).click();
  await was1Badge(page).click();
  await expect(page.getByRole("tab", { name: "대화" })).toHaveAttribute("aria-selected", "true");

  const head = page.getByRole("button", { name: /^채워야 할 정보 \(\d+\)/ });
  await expect(head).toHaveAttribute("aria-expanded", "true");
  const block = page.getByRole("group", { name: "WAS #1" });
  await expect(block.locator('input[type="text"]').first()).toBeFocused();
  expect(await headCount(page)).toBe(total);

  await block.getByLabel("RAM", { exact: true }).fill("16GB");
  await block.getByRole("checkbox", { name: "IP 모름" }).check();
  await block.getByRole("button", { name: "저장" }).click();

  return { total, k };
}

test("missing info: badge, checklist, form save, unknown", async ({ page }) => {
  const { total, k } = await buildAndSave(page);

  await expect(was1Badge(page)).toHaveAccessibleName(`빠진 정보 ${k - 2}개`, { timeout: 15_000 });
  await expect(page.getByRole("button", { name: `채워야 할 정보 (${total - 2})` })).toBeVisible();

  await page.getByRole("tab", { name: "이력" }).click();
  await expect(page.getByText("직접 입력", { exact: true }).first()).toBeVisible({ timeout: 15_000 });
  // 최신 버전(목록 첫 줄)이 직접 입력이다.
  await expect(versionRows(page).first()).toContainText("직접 입력");

  await page.getByTitle("WAS #1").click();
  await page.getByRole("tab", { name: "설명" }).click();
  await expect(page.locator("dt", { hasText: /^IP$/ }).locator("xpath=following-sibling::dd")).toHaveText("모름");
  await expect(page.locator("dt", { hasText: /^RAM$/ }).locator("xpath=following-sibling::dd")).toHaveText("16GB");
});

test("restore brings back missing count", async ({ page }) => {
  const { k } = await buildAndSave(page);
  await expect(was1Badge(page)).toHaveAccessibleName(`빠진 정보 ${k - 2}개`, { timeout: 15_000 });

  await page.getByRole("tab", { name: "이력" }).click();
  const rows = versionRows(page);
  await expect(rows.first()).toContainText("직접 입력", { timeout: 15_000 });
  // 저장 직전(두 번째 줄) 버전으로 되돌린다.
  await rows.nth(1).getByRole("button").first().click();
  await rows.nth(1).getByRole("button", { name: "이 버전으로 되돌리기" }).click();

  await expect(rows.first()).toContainText("되돌리기", { timeout: 15_000 });
  await expect(was1Badge(page)).toHaveAccessibleName(`빠진 정보 ${k}개`, { timeout: 15_000 });
});

test("reload keeps the reminder line", async ({ page }) => {
  await setup(page);
  await buildS1(page);
  await expect(page.getByText(REMINDER)).toBeVisible({ timeout: 15_000 });
  await page.getByRole("button", { name: "빠진 정보 숫자" }).click();
  await expect(was1Badge(page)).toBeVisible();

  await page.reload();
  await page.getByRole("tab", { name: "대화" }).click();
  await expect(page.getByText(REMINDER)).toBeVisible({ timeout: 15_000 });
  // 켠 설정은 브라우저에 기억된다.
  await expect(was1Badge(page)).toBeVisible({ timeout: 15_000 });
});
