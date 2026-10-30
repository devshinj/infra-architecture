import { expect, test, type Page } from "@playwright/test";

import { S1_NODE_COUNT } from "./fake-llm";

const uid = () => Math.random().toString(36).slice(2, 8);
const PLACEHOLDER = "만들고 싶은 서비스나 바꾸고 싶은 점을 말해 주세요. 노드를 오른쪽 클릭하면 참조를 붙일 수 있어요.";
const SEED_DEFINITION = /Redis\(Remote Dictionary Server\)는 데이터를 디스크가 아닌 메모리에 저장해/;

async function setup(page: Page) {
  const name = `ex${uid()}`;
  await page.goto("/signup");
  await page.getByLabel("아이디").fill(name);
  await page.getByLabel("이메일").fill(`${name}@b.co`);
  await page.getByLabel("비밀번호").fill("password1");
  await page.getByRole("button", { name: "가입하기" }).click();
  await page.getByRole("button", { name: "새 프로젝트" }).click();
  await page.getByRole("dialog").getByLabel("이름").fill("설명 테스트");
  await page.getByRole("dialog").getByRole("button", { name: "만들기" }).click();
  await page.waitForURL(/\/p\/[^/]+\/d\/[^/]+/);
  await page.getByRole("tab", { name: "대화" }).click();
}

const nodes = (page: Page) => page.locator(".react-flow__node-infra");
const redis = (page: Page) => nodes(page).filter({ has: page.getByTitle("Redis Cluster") });

async function selectRedis(page: Page) {
  await redis(page).click();
  await expect(page.getByRole("tab", { name: "설명" })).toHaveAttribute("aria-selected", "true");
}

test("explanations and glossary", async ({ page }) => {
  await setup(page);
  await page.getByPlaceholder(PLACEHOLDER).fill("결제랑 카카오 로그인 붙는 쇼핑몰");
  await page.getByRole("button", { name: "보내기" }).click();
  await expect(nodes(page)).toHaveCount(S1_NODE_COUNT, { timeout: 30_000 });
  await expect(page.getByText(/노드 \d+ · 연결 \d+ · 적용 \d+ · 건너뜀 \d+/)).toBeVisible({ timeout: 30_000 });

  // 사전에 있는 노드: 시드 정의 + 미검수, 가짜 역할
  await selectRedis(page);
  const definition = page.locator("section").filter({ has: page.getByRole("heading", { name: "정의", exact: true }) });
  await expect(definition.getByText(SEED_DEFINITION)).toBeVisible({ timeout: 30_000 });
  await expect(definition.getByText("미검수")).toBeVisible();
  const role = page.locator("section").filter({ has: page.getByRole("heading", { name: "이 구성에서의 역할" }) });
  await expect(role.getByText("가짜 역할")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole("heading", { name: "결정 기록(ADR)" })).toBeVisible();

  // 다시 쓰기
  await page.getByRole("button", { name: "다시 쓰기" }).click();
  await page.getByPlaceholder("어떻게 고칠까요? (예: 더 쉽게)").fill("더 쉽게");
  await page.getByRole("button", { name: "다시 만들기" }).click();
  await expect(role.getByText("다시 쓴 역할")).toBeVisible({ timeout: 30_000 });

  // 연결선
  await page.locator('[data-edge-id="e-was1-cache"] .edge-hit').dispatchEvent("click");
  await expect(page.getByRole("heading", { name: "무엇이 오가나" })).toBeVisible();
  await expect(page.getByText("가짜 요청과 응답")).toBeVisible({ timeout: 30_000 });

  // 용어 사전에서 검수 완료
  await page.getByRole("link", { name: "용어 사전" }).click();
  await page.waitForURL(/\/glossary/);
  await page.getByLabel("용어 검색").fill("Redis");
  await page.getByRole("button", { name: /^Redis/ }).first().click();
  await page.getByRole("button", { name: "검수 완료" }).click();
  await expect(page.getByRole("button", { name: "검수 취소" })).toBeVisible();

  // 구성도로 돌아가 같은 노드: 미검수 없음
  await page.goBack();
  await expect(nodes(page)).toHaveCount(S1_NODE_COUNT, { timeout: 30_000 });
  await selectRedis(page);
  await expect(definition.getByText(SEED_DEFINITION)).toBeVisible({ timeout: 30_000 });
  await expect(definition.getByText("미검수")).toHaveCount(0);
});

test("no page-level scroll", async ({ page }) => {
  await setup(page);
  const overflow = () => page.evaluate(() => ({ doc: document.scrollingElement!.scrollHeight - innerHeight, wide: document.scrollingElement!.scrollWidth - innerWidth }));
  const d = await overflow();
  expect(d.doc).toBeLessThanOrEqual(0);
  expect(d.wide).toBeLessThanOrEqual(0);
  // 구성도를 불러온 화면: 보기 팝오버를 연 채로, 구성 정보 카드를 펼친 채로도 문서가 넘치지 않는다.
  await page.getByPlaceholder(PLACEHOLDER).fill("결제랑 카카오 로그인 붙는 쇼핑몰");
  await page.getByRole("button", { name: "보내기" }).click();
  await expect(nodes(page)).toHaveCount(S1_NODE_COUNT, { timeout: 30_000 });
  await expect(page.getByText(/노드 \d+ · 연결 \d+ · 적용 \d+ · 건너뜀 \d+/)).toBeVisible({ timeout: 30_000 });
  expect((await overflow()).doc).toBeLessThanOrEqual(0);
  await page.getByRole("button", { name: "보기", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "보기 옵션" })).toBeVisible();
  expect((await overflow()).doc).toBeLessThanOrEqual(0);
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "구성 정보 펼치기" }).click();
  await expect(page.getByRole("button", { name: "구성 정보 접기" })).toBeVisible();
  expect((await overflow()).doc).toBeLessThanOrEqual(0);
  expect((await overflow()).wide).toBeLessThanOrEqual(0);
  await page.getByRole("link", { name: "용어 사전" }).first().click();
  await page.waitForURL(/\/glossary/);
  const g = await overflow();
  expect(g.doc).toBeLessThanOrEqual(0);
});
