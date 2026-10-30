import { expect, test, type Page } from "@playwright/test";

const uid = () => Math.random().toString(36).slice(2, 8);

async function signup(page: Page, name: string) {
  await page.goto("/signup");
  await page.getByLabel("아이디").fill(name);
  await page.getByLabel("이메일").fill(`${name}@b.co`);
  await page.getByLabel("비밀번호").fill("password1");
  await page.getByRole("button", { name: "가입하기" }).click();
  await expect(page.getByRole("button", { name: "새 프로젝트" })).toBeVisible();
}

async function newProject(page: Page, name: string) {
  await page.getByRole("button", { name: "새 프로젝트" }).click();
  await page.getByRole("dialog").getByLabel("이름").fill(name);
  await page.getByRole("dialog").getByRole("button", { name: "만들기" }).click();
  await page.waitForURL(/\/p\/[^/]+\/d\/[^/]+/);
}

async function importSample(page: Page, title: string) {
  await page.getByRole("button", { name: "샘플 불러오기" }).click();
  await page.getByRole("menuitem", { name: title }).click();
}

test("가입 → 프로젝트·구성도 → 샘플 → 선택 → 편집 이동 → 되돌리기", async ({ page }) => {
  await signup(page, `jae${uid()}`);
  await newProject(page, "쇼핑몰");

  // 프로젝트 메뉴 → 새 구성도 "운영"
  await page.getByRole("button", { name: "쇼핑몰 메뉴" }).click();
  await page.getByRole("menuitem", { name: "새 구성도" }).click();
  await page.getByRole("dialog").getByLabel("이름").fill("운영");
  await page.getByRole("dialog").getByRole("button", { name: "만들기" }).click();
  await expect(page.getByRole("button", { name: "운영", exact: true })).toHaveAttribute("aria-current", "page");

  await importSample(page, "IDC WEB-WAS-DB 이중화");
  const nodes = page.locator(".react-flow__node-infra");
  await expect(nodes).toHaveCount(9);

  await page.getByTitle("WAS#1").click();
  await expect(page.getByRole("tab", { name: "설명", selected: true })).toBeVisible();
  await expect(page.locator(".edge--dim").first()).toBeVisible();

  // 편집 모드에서 드래그 → 새로고침 후 위치 유지
  await page.getByRole("button", { name: "편집 모드" }).click();
  const was = page.locator(".react-flow__node-infra", { has: page.getByTitle("WAS#1") });
  const before = (await was.boundingBox())!;
  const cx = before.x + before.width / 2;
  const cy = before.y + before.height / 2;
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx + 60, cy + 60, { steps: 8 });
  await page.mouse.move(cx + 120, cy + 120, { steps: 8 });
  const saved = page.waitForResponse((r) => r.request().method() === "POST" && r.request().headers()["next-action"] !== undefined);
  await page.mouse.up();
  await saved; // savePinnedAction 응답을 기다린다
  await page.reload();
  await expect(nodes).toHaveCount(9);
  const after = (await page.locator(".react-flow__node-infra", { has: page.getByTitle("WAS#1") }).boundingBox())!;
  expect(Math.hypot(after.x - before.x, after.y - before.y)).toBeGreaterThan(40);

  // 샘플 하나 더 → 이력 v3 → v2 로 되돌리기 → v4
  // 2단계부터 샘플 불러오기는 빈 구성도에서만 보인다. 두 번째 버전은 (가짜 AI 서버로) 대화 생성으로 만든다.
  await page.getByRole("tab", { name: "대화" }).click();
  await page.getByPlaceholder(/만들고 싶은 서비스/).fill("쇼핑몰 구성도 그려줘");
  await page.getByRole("button", { name: "보내기" }).click();
  await expect(page.getByText(/노드 \d+ · 연결 \d+ · 적용 \d+ · 건너뜀 \d+/)).toBeVisible({ timeout: 30_000 });
  await expect(nodes).not.toHaveCount(9);
  await page.getByRole("tab", { name: "이력" }).click();
  await expect(page.getByText("v3", { exact: true })).toBeVisible();
  await page.getByText("v2", { exact: true }).click();
  await page.getByRole("button", { name: "이 버전으로 되돌리기" }).click();
  await expect(page.getByText("v4", { exact: true })).toBeVisible();
  await expect(nodes).toHaveCount(9);
});

test("다른 사용자는 남의 구성도 URL 에서 404", async ({ browser }) => {
  const baseURL = test.info().project.use.baseURL;
  const a = await (await browser.newContext({ baseURL })).newPage();
  await signup(a, `ua${uid()}`);
  await newProject(a, "비공개");
  const url = a.url();

  const b = await (await browser.newContext({ baseURL })).newPage();
  await signup(b, `ub${uid()}`);
  const res = await b.goto(url);
  expect(res?.status()).toBe(404);
  await expect(b.locator(".react-flow")).toHaveCount(0);
});
