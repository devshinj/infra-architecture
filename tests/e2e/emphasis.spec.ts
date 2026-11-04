import { expect, test, type Page } from "@playwright/test";

const uid = () => Math.random().toString(36).slice(2, 8);
const S4_TITLE = "대규모 멀티 AZ 커머스";
const S4_NODE_COUNT = 33;
// s4 의 API #1 은 연결 9개에 닿는다(web-1·bastion 에서 들어오고 DB·캐시·검색·S3·SQS·PG·문자로 나간다).
const API1_EDGES = 9;

async function openS4(page: Page) {
  const name = `em${uid()}`;
  await page.goto("/signup");
  await page.getByLabel("아이디").fill(name);
  await page.getByLabel("이메일").fill(`${name}@b.co`);
  await page.getByLabel("비밀번호").fill("password1");
  await page.getByRole("button", { name: "가입하기" }).click();
  await page.getByRole("button", { name: "새 프로젝트" }).click();
  await page.getByRole("dialog").getByLabel("이름").fill("강조 테스트");
  await page.getByRole("dialog").getByRole("button", { name: "만들기" }).click();
  await page.waitForURL(/\/p\/[^/]+\/d\/[^/]+/);
  await page.getByRole("button", { name: "샘플 불러오기" }).click();
  await page.getByRole("menuitem", { name: S4_TITLE }).click();
  await expect(page.locator(".react-flow__node-infra")).toHaveCount(S4_NODE_COUNT, { timeout: 30_000 });
  await expect(page.locator("g.edge[data-edge-id]").first()).toBeAttached();
}

/** 뷰포트 transform 의 scale(현재 배율). */
async function zoomOf(page: Page): Promise<number> {
  const t = await page.locator(".react-flow__viewport").evaluate((el) => (el as HTMLElement).style.transform);
  const m = /scale\(([-\d.e]+)\)/.exec(t);
  return m ? Number(m[1]) : NaN;
}

test("selecting API node overlays its edges and dims unrelated zones", async ({ page }) => {
  await openS4(page);
  const api1 = page.locator(".react-flow__node-infra").filter({ has: page.getByTitle("API #1", { exact: true }) });
  await api1.click();
  await expect(api1.locator(".node--selected")).toHaveCount(1);

  const emph = page.locator('.edge-emph[data-mode="select"] [data-emph-edge]');
  await expect(emph).toHaveCount(API1_EDGES);
  // 겹선 수는 흐리지 않은(= 이어진) 연결 수와 같다.
  const incident = await page.locator("g.edge[data-edge-id]:not(.edge--dim)").count();
  expect(incident).toBe(API1_EDGES);

  await expect(page.locator(".group--dimmed").first()).toBeAttached();
});

test("zone names are at least 10px on screen at default view", async ({ page }) => {
  await openS4(page);
  // 기본 맞춤이 끝날 때까지(배율을 0.3초 사이 두 번 읽어 같을 때까지) 기다린다.
  await expect
    .poll(
      async () => {
        const a = await zoomOf(page);
        await page.evaluate(() => new Promise((r) => setTimeout(r, 300)));
        const b = await zoomOf(page);
        return a === b ? a : NaN;
      },
      { timeout: 10_000 },
    )
    .toBeGreaterThanOrEqual(0.5);

  const names = page.locator(".group__name");
  expect(await names.count()).toBeGreaterThan(0);
  const px = await names.evaluateAll((els) => els.map((el) => ({ text: el.textContent, px: el.getBoundingClientRect().height / 1.5 })));
  for (const n of px) expect(n.px, `${n.text} 의 화면 글자 크기`).toBeGreaterThanOrEqual(10 - 0.05); // 소수 계산 오차만 봐준다
});
