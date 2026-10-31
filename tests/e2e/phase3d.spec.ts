import { expect, test, type Page } from "@playwright/test";

import { S1_NODE_COUNT } from "./fake-llm";

const uid = () => Math.random().toString(36).slice(2, 8);
const PLACEHOLDER = "만들고 싶은 서비스나 바꾸고 싶은 점을 말해 주세요. 노드를 오른쪽 클릭하면 참조를 붙일 수 있어요.";
const DONE = /노드 \d+ · 연결 \d+ · 적용 \d+ · 건너뜀 \d+/;

async function setup(page: Page) {
  const name = `ux${uid()}`;
  await page.goto("/signup");
  await page.getByLabel("아이디").fill(name);
  await page.getByLabel("이메일").fill(`${name}@b.co`);
  await page.getByLabel("비밀번호").fill("password1");
  await page.getByRole("button", { name: "가입하기" }).click();
  await page.getByRole("button", { name: "새 프로젝트" }).click();
  await page.getByRole("dialog").getByLabel("이름").fill("3D 테스트");
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

async function buildS1(page: Page, text = "결제랑 카카오 로그인 붙는 쇼핑몰") {
  await send(page, text);
  await expect(nodes(page)).toHaveCount(S1_NODE_COUNT, { timeout: 30_000 });
  await expect(page.getByText(DONE)).toBeVisible({ timeout: 30_000 });
}

test("structural assumption change leaves no old zones", async ({ page }) => {
  await setup(page);
  await buildS1(page);
  await expect(page.locator('[data-group-kind="cloud_region"]')).toHaveCount(1);
  await expect(page.locator('[data-group-kind="vpc"]')).toHaveCount(1);
  await expect(page.locator('[data-group-kind="idc"]')).toHaveCount(0);

  if ((await cardToggle(page).getAttribute("aria-expanded")) !== "true") await cardToggle(page).click();
  const chips = page.getByRole("list", { name: "AI가 세운 가정" });
  await chips.getByRole("button", { name: /^환경:/ }).click();
  await page.getByRole("group", { name: "환경 대안" }).getByRole("button", { name: "사내 IDC" }).click();

  // 차례가 끝나면 AWS 리전·VPC 상자는 없고 IDC 상자가 있다.
  await expect(page.locator('[data-group-kind="idc"]')).toHaveCount(1, { timeout: 30_000 });
  await expect(page.locator('[data-group-kind="cloud_region"]')).toHaveCount(0);
  await expect(page.locator('[data-group-kind="vpc"]')).toHaveCount(0);
  await expect(page.getByText("사내 IDC 구성으로 바꿨어요.")).toBeVisible({ timeout: 30_000 });
  // 남는 노드: 클라이언트 2 + 외부 서비스 2 + 옮긴 WAS·DB 2.
  await expect(nodes(page)).toHaveCount(6, { timeout: 15_000 });
  await expect(page.locator('[data-group-kind="redundancy_pair"]')).toHaveCount(0);
});

test("re-click deselects", async ({ page }) => {
  await setup(page);
  await buildS1(page);
  await expect(page.getByRole("tab", { name: "대화" })).toHaveAttribute("aria-selected", "true");
  await was1(page).click();
  await expect(page.getByRole("tab", { name: "설명" })).toHaveAttribute("aria-selected", "true");
  await expect(was1(page).locator(".node--selected")).toHaveCount(1);
  await was1(page).click();
  await expect(was1(page).locator(".node--selected")).toHaveCount(0);
  await expect(page.getByRole("tab", { name: "대화" })).toHaveAttribute("aria-selected", "true");
});

test("missing badges toggle", async ({ page }) => {
  await setup(page);
  await buildS1(page);
  const badge = was1(page).getByRole("button", { name: /^빠진 정보 \d+개$/ });
  await expect(was1(page)).toBeVisible();
  await expect(badge).toHaveCount(0);
  await page.getByRole("button", { name: "보기", exact: true }).click();
  await page.getByRole("checkbox", { name: "빠진 정보 숫자" }).click();
  await page.keyboard.press("Escape");
  await expect(badge).toBeVisible({ timeout: 15_000 });

  await page.reload();
  await expect(was1(page)).toBeVisible({ timeout: 30_000 });
  await expect(badge).toBeVisible({ timeout: 15_000 });
});

test("sidebar collapses and stays collapsed after reload", async ({ page }) => {
  await setup(page);
  await page.getByRole("button", { name: "프로젝트 영역 접기" }).click();
  await expect(page.getByRole("button", { name: "프로젝트 영역 펼치기" })).toBeVisible();
  await expect(page.getByRole("button", { name: "프로젝트 영역 접기" })).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("button", { name: "프로젝트 영역 펼치기" })).toBeVisible();
  await expect(page.getByRole("button", { name: "프로젝트 영역 접기" })).toHaveCount(0);
  await page.getByRole("button", { name: "프로젝트 영역 펼치기" }).click();
  await expect(page.getByRole("button", { name: "프로젝트 영역 접기" })).toBeVisible();
});

test("progress card shows steps and own bubble appears immediately", async ({ page }) => {
  await setup(page);
  const text = "천천히 결제랑 카카오 로그인 붙는 쇼핑몰";
  await send(page, text);
  // 내 말풍선은 서버 응답을 기다리지 않고 바로 보이고, 진행 카드가 단계를 보여 준다.
  await expect(page.getByText(text, { exact: true })).toBeVisible();
  const steps = page.getByRole("list", { name: "진행 단계" });
  await expect(steps).toBeVisible({ timeout: 15_000 });
  await expect(steps.getByText("구성 검토")).toBeVisible();
  await expect(steps.getByText(/^그리는 중 \(변경 \d+개\)$/)).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText(/^완료 · 노드 \d+ · 연결 \d+$/)).toBeVisible({ timeout: 60_000 });
  await expect(page.getByText("InfraSketch", { exact: true }).first()).toBeVisible();
});

test("checklist title focuses node without selecting", async ({ page }) => {
  await setup(page);
  await buildS1(page);
  await page.getByRole("tab", { name: "설명" }).click();
  if ((await cardToggle(page).getAttribute("aria-expanded")) !== "true") await cardToggle(page).click();
  const block = page.getByRole("group", { name: "WAS #1", exact: true }); // 노드 래퍼도 "WAS #1 · …" 이름의 group 이다
  await expect(block).toBeVisible({ timeout: 15_000 });
  await block.getByRole("button", { name: "WAS #1 위치 보기" }).click();
  await expect(was1(page).locator(".node--pulse")).toBeVisible();
  await expect(was1(page).locator(".node--selected")).toHaveCount(0);
  await expect(page.getByRole("tab", { name: "설명" })).toHaveAttribute("aria-selected", "true");
});
