import { expect, test, type Page } from "@playwright/test";

import { S1_NODE_COUNT } from "./fake-llm";

const uid = () => Math.random().toString(36).slice(2, 8);
const PLACEHOLDER = "만들고 싶은 서비스나 바꾸고 싶은 점을 말해 주세요. 노드를 오른쪽 클릭하면 참조를 붙일 수 있어요.";
const DONE = /노드 \d+ · 연결 \d+ · 적용 \d+ · 건너뜀 \d+/;

async function setup(page: Page) {
  const name = `rd${uid()}`;
  await page.goto("/signup");
  await page.getByLabel("아이디").fill(name);
  await page.getByLabel("이메일").fill(`${name}@b.co`);
  await page.getByLabel("비밀번호").fill("password1");
  await page.getByRole("button", { name: "가입하기" }).click();
  await page.getByRole("button", { name: "새 프로젝트" }).click();
  await page.getByRole("dialog").getByLabel("이름").fill("읽기 테스트");
  await page.getByRole("dialog").getByRole("button", { name: "만들기" }).click();
  await page.waitForURL(/\/p\/[^/]+\/d\/[^/]+/);
  await page.getByRole("tab", { name: "대화" }).click();
}

const nodes = (page: Page) => page.locator(".react-flow__node-infra");
const was1 = (page: Page) => nodes(page).filter({ has: page.getByTitle("WAS #1") });
const cardToggle = (page: Page) => page.getByRole("button", { name: /^구성 정보 (펼치기|접기)$/ });

async function send(page: Page, text: string) {
  await page.getByPlaceholder(PLACEHOLDER).fill(text);
  await page.getByRole("button", { name: "보내기" }).click();
}

async function buildS1(page: Page) {
  await send(page, "결제랑 카카오 로그인 붙는 쇼핑몰");
  await expect(nodes(page)).toHaveCount(S1_NODE_COUNT, { timeout: 30_000 });
  await expect(page.getByText(DONE)).toBeVisible({ timeout: 30_000 });
}

/** 캔버스 오른쪽 위 구석(노드·카드·범례가 없는 곳)으로 마우스를 옮긴다. */
async function leaveToEmpty(page: Page) {
  const box = (await page.locator(".react-flow__pane").boundingBox())!;
  await page.mouse.move(box.x + box.width - 4, box.y + 4);
}

test("hover fades unrelated nodes and leaving restores", async ({ page }) => {
  await setup(page);
  await buildS1(page);
  await was1(page).hover();
  await expect(page.locator(".node--faded").first()).toBeVisible();
  await expect(was1(page).locator(".node--faded")).toHaveCount(0);
  await expect(page.locator(".edge--faded").first()).toBeAttached();
  await leaveToEmpty(page);
  await expect(page.locator(".node--faded")).toHaveCount(0);
  await expect(page.locator(".edge--faded")).toHaveCount(0);
});

test("selection wins over hover", async ({ page }) => {
  await setup(page);
  await buildS1(page);
  await was1(page).click();
  await expect(was1(page).locator(".node--selected")).toHaveCount(1);
  await expect(page.locator(".node--dimmed").first()).toBeVisible();
  // 다른 노드에 올려도 흐림 대신 선택의 어두움만 남는다. 150ms 이상 지켜본다(호버 지연 120ms).
  const other = nodes(page).filter({ hasNot: page.getByTitle("WAS #1") }).first();
  await other.hover();
  await expect.poll(() => page.locator(".node--faded").count(), { timeout: 1_000, intervals: [200] }).toBe(0);
  await expect(page.locator(".node--dimmed").first()).toBeVisible();
});

test("legend opens, lists kinds, and remembers state after reload", async ({ page }) => {
  await setup(page);
  await buildS1(page);
  const toggle = page.getByRole("button", { name: "범례" });
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("heading", { name: "연결 범례" })).toBeVisible();
  await expect(page.getByText("화살표: 연결이 향하는 쪽")).toBeVisible();

  await page.reload();
  await expect(was1(page)).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole("button", { name: "범례" })).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("heading", { name: "연결 범례" })).toBeVisible();

  await page.getByRole("button", { name: "범례" }).click();
  await page.reload();
  await expect(was1(page)).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole("button", { name: "범례" })).toHaveAttribute("aria-expanded", "false");
});

test("long name shows tooltip on hover", async ({ page }) => {
  await setup(page);
  await send(page, "긴이름 노드");
  const long = nodes(page).filter({ hasText: "결제승인처리배치서버" });
  await expect(long).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText(DONE)).toBeVisible({ timeout: 30_000 });
  await expect(long.getByRole("tooltip")).toHaveCount(0);
  await long.hover();
  await expect(long.getByRole("tooltip")).toHaveText(/결제승인처리배치서버클러스터/);
  await leaveToEmpty(page);
  await expect(long.getByRole("tooltip")).toHaveCount(0);
});

test("warning item moves to node and opens explanation", async ({ page }) => {
  await setup(page);
  await send(page, "공개DB 붙은 서비스");
  const pubDb = nodes(page).filter({ has: page.getByTitle("공개 DB") });
  await expect(pubDb.getByRole("button", { name: /^경고 \d+개$/ })).toBeVisible({ timeout: 30_000 });
  if ((await cardToggle(page).getAttribute("aria-expanded")) !== "true") await cardToggle(page).click();
  const item = page.getByRole("region", { name: "주의" }).getByRole("button", { name: /^공개 DB 위치로 가기: / }).first();
  await item.click();
  await expect(pubDb.locator(".node--selected")).toHaveCount(1);
  await expect(page.getByRole("tab", { name: "설명" })).toHaveAttribute("aria-selected", "true");

  // 카메라 이동이 끝나면 노드가 캔버스 안에 있고 구성 정보 카드·떠 있는 오른쪽 패널과 겹치지 않는다
  // (캔버스는 패널 밑까지 펼쳐져 있어, 패널 아래에 숨은 노드도 "캔버스 안" 이다).
  const pane = page.locator(".react-flow__pane");
  const card = page.getByRole("complementary", { name: "구성 정보" });
  const panel = page.getByRole("complementary", { name: "오른쪽 패널" });
  type Box = { x: number; y: number; width: number; height: number };
  const overlaps = (a: Box, b: Box) => a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
  await expect
    .poll(
      async () => {
        const n = await pubDb.boundingBox();
        const p = await pane.boundingBox();
        const c = await card.boundingBox();
        const r = await panel.boundingBox();
        if (!n || !p || !c || !r) return false;
        const inside = n.x >= p.x && n.y >= p.y && n.x + n.width <= p.x + p.width && n.y + n.height <= p.y + p.height;
        return inside && !overlaps(n, c) && !overlaps(n, r);
      },
      { timeout: 10_000 },
    )
    .toBe(true);
});
