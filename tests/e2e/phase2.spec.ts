import { expect, test, type Page } from "@playwright/test";

import { S1_NODE_COUNT } from "./fake-llm";

const uid = () => Math.random().toString(36).slice(2, 8);
const PLACEHOLDER = "만들고 싶은 서비스나 바꾸고 싶은 점을 말해 주세요. 노드를 오른쪽 클릭하면 참조를 붙일 수 있어요.";

async function setup(page: Page) {
  const name = `ai${uid()}`;
  await page.goto("/signup");
  await page.getByLabel("아이디").fill(name);
  await page.getByLabel("이메일").fill(`${name}@b.co`);
  await page.getByLabel("비밀번호").fill("password1");
  await page.getByRole("button", { name: "가입하기" }).click();
  await page.getByRole("button", { name: "새 프로젝트" }).click();
  await page.getByRole("dialog").getByLabel("이름").fill("AI 테스트");
  await page.getByRole("dialog").getByRole("button", { name: "만들기" }).click();
  await page.waitForURL(/\/p\/[^/]+\/d\/[^/]+/);
  await page.getByRole("tab", { name: "대화" }).click();
}

async function send(page: Page, text: string) {
  await page.getByPlaceholder(PLACEHOLDER).fill(text);
  await page.getByRole("button", { name: "보내기" }).click();
}

const nodes = (page: Page) => page.locator(".react-flow__node-infra");

async function buildS1(page: Page) {
  await send(page, "결제랑 카카오 로그인 붙는 쇼핑몰");
  await expect(nodes(page)).toHaveCount(S1_NODE_COUNT, { timeout: 30_000 });
  await expect(page.getByText(/노드 \d+ · 연결 \d+ · 적용 \d+ · 건너뜀 \d+/)).toBeVisible({ timeout: 30_000 });
}

test("대화로 구성도 생성 → 노드가 하나씩 나타남 → 요약·버전", async ({ page }) => {
  await setup(page);
  await send(page, "결제랑 카카오 로그인 붙는 쇼핑몰");

  const seen = new Set<number>();
  await expect
    .poll(
      async () => {
        const n = await nodes(page).count();
        if (n > 0 && n < S1_NODE_COUNT) seen.add(n);
        return n === S1_NODE_COUNT && seen.size >= 2;
      },
      { timeout: 30_000, intervals: [25] },
    )
    .toBe(true);
  expect(seen.size).toBeGreaterThanOrEqual(2);

  await expect(nodes(page)).toHaveCount(S1_NODE_COUNT);
  // 요약 칩과 접힌 완료 카드가 같은 노드 수를 보인다.
  await expect(page.getByText(new RegExp(`^노드 ${S1_NODE_COUNT} · 연결 \\d+ · 적용`))).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText(new RegExp(`^완료 · 노드 ${S1_NODE_COUNT} · 연결 \\d+$`))).toBeVisible();

  await page.getByRole("tab", { name: "이력" }).click();
  await expect(page.getByText("AI", { exact: true }).first()).toBeVisible();
});

test("노드 우클릭 참조 → 수정 반영", async ({ page }) => {
  await setup(page);
  await buildS1(page);

  await page.getByTitle("WAS #1").click({ button: "right" });
  await page.getByRole("menuitem", { name: "대화에 참조 붙이기" }).click();
  await expect(page.getByPlaceholder(PLACEHOLDER)).toBeVisible();
  await expect(page.getByRole("button", { name: /WAS #1/ }).first()).toBeVisible();

  await send(page, "RAM 을 32GB 로 올려줘");
  const was = nodes(page).filter({ has: page.getByTitle("WAS #1") });
  await expect(was.locator(".node__updated")).toBeVisible({ timeout: 15_000 });
  await page.getByTitle("WAS #1").click();
  await expect(page.getByText("32GB")).toBeVisible();
});

test("중단하면 '중단됨' 버전이 남고 바로 다시 보낼 수 있음", async ({ page }) => {
  await setup(page);
  await send(page, "천천히 결제랑 카카오 로그인 붙는 쇼핑몰");
  await expect(nodes(page)).not.toHaveCount(0, { timeout: 30_000 });
  await page.getByRole("button", { name: "중단" }).click();

  // 클라이언트가 스트림을 끊으면 done 요약은 오지 않고 "중단했어요."가 남는다. 서버는 중단된 버전을 저장한다.
  await expect(page.getByText("중단했어요.")).toBeVisible({ timeout: 15_000 });
  // 진행 카드도 중단됨 한 줄로 접힌다.
  await expect(page.getByRole("group", { name: "InfraSketch 메시지" }).getByText("중단됨", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "보내기" })).toBeVisible();
  expect(await nodes(page).count()).toBeLessThan(S1_NODE_COUNT);

  await page.getByRole("tab", { name: "이력" }).click();
  await expect(page.getByText("중단됨", { exact: true })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText("AI", { exact: true }).first()).toBeVisible();
  await page.getByRole("tab", { name: "대화" }).click();

  await send(page, "안녕");
  await expect(page.getByText("네, 알겠습니다.")).toBeVisible({ timeout: 15_000 });
});

test("가정 칩에서 대안을 고르면 확정되고 대화가 이어짐", async ({ page }) => {
  await setup(page);
  await buildS1(page);

  // 가정 칩은 캔버스 구성 정보 카드에 있다.
  await page.getByRole("button", { name: "구성 정보 펼치기" }).click();
  await page.getByRole("button", { name: /^규모: / }).click();
  await page.getByRole("group", { name: "규모 대안" }).getByRole("button", { name: "대규모(일 10만 명 이상)" }).click();

  await expect(page.getByRole("button", { name: /^규모: 대규모\(일 10만 명 이상\)\s*확정/ })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText("가정 변경: 규모 → 대규모(일 10만 명 이상)")).toBeVisible();
  await expect(page.getByText("네, 알겠습니다.")).toBeVisible({ timeout: 15_000 });
});
