import { readFile } from "node:fs/promises";

import { expect, test, type Page } from "@playwright/test";

const uid = () => Math.random().toString(36).slice(2, 8);
const SHOP_TITLE = "AWS 쇼핑몰";
const SHOP_NODE_COUNT = 15;
const EXPORT = "이미지 저장";

async function openShop(page: Page) {
  const name = `tr${uid()}`;
  await page.goto("/signup");
  await page.getByLabel("아이디").fill(name);
  await page.getByLabel("이메일").fill(`${name}@b.co`);
  await page.getByLabel("비밀번호").fill("password1");
  await page.getByRole("button", { name: "가입하기" }).click();
  await page.getByRole("button", { name: "새 프로젝트" }).click();
  await page.getByRole("dialog").getByLabel("이름").fill("줄기 테스트");
  await page.getByRole("dialog").getByRole("button", { name: "만들기" }).click();
  await page.waitForURL(/\/p\/[^/]+\/d\/[^/]+/);
  await page.getByRole("button", { name: "샘플 불러오기" }).click();
  await page.getByRole("menuitem", { name: SHOP_TITLE }).click();
  await expect(page.locator(".react-flow__node-infra")).toHaveCount(SHOP_NODE_COUNT, { timeout: 30_000 });
  await expect(page.locator("g.edge[data-edge-id]").first()).toBeAttached();
}

/**
 * 공유 조각 누르는 자리 하나를 누르고, 그 조각이 지나는 선 id 를 (화면의 펼침이 아니라 조각 자신의 data-edge-ids 에서) 돌려준다.
 * 누르는 자리는 가는 선이라 확대해 좌표로 누르는 대신 이벤트를 직접 보낸다(좌표 의존 없이 같은 핸들러를 탄다).
 */
async function clickSharedSegment(page: Page): Promise<string[]> {
  const hit = page.locator(".edge-seg-hit").first();
  await expect(hit).toBeAttached();
  const ids = ((await hit.getAttribute("data-edge-ids")) ?? "").split(" ").filter(Boolean);
  await hit.dispatchEvent("click");
  return ids;
}

test("공유 조각을 누르면 줄기가 펼쳐지고 가지·Esc 로 풀린다", async ({ page }) => {
  await openShop(page);
  await page.getByRole("button", { name: "프로젝트 영역 접기" }).click();

  // 공유 조각이 있다(없으면 이 시험이 의미가 없다).
  await expect(page.locator('[data-seg-shared="true"]').first()).toBeAttached();
  await expect(page.locator(".edge-trunk")).toHaveCount(0);

  const ids = await clickSharedSegment(page);
  const n = ids.length;
  expect(n).toBeGreaterThan(1);
  // 조각이 지나는 선 수와 겹선·꼬리표·제목의 수가 모두 같다.
  await expect(page.locator(".edge-trunk > g[data-trunk-edge]")).toHaveCount(n);
  await expect(page.locator(".edge-trunk-tag")).toHaveCount(n);
  await expect(page.getByRole("heading", { name: `이 줄기의 선 ${n}개` })).toBeVisible();
  const shown = await page.locator(".edge-trunk > g[data-trunk-edge]").evaluateAll((els) => els.map((e) => e.getAttribute("data-trunk-edge")!));
  expect([...shown].sort()).toEqual([...ids].sort());

  // 설명 탭 목록에서 선 하나를 고르면 줄기가 걷히고 그 연결 하나만 고른 상태가 된다.
  await expect(page.locator("g.edge.edge--selected")).toHaveCount(0);
  await page.locator("button:has([data-trunk-color])").first().click();
  await expect(page.locator(".edge-trunk")).toHaveCount(0);
  await expect(page.locator(".edge-trunk-tag")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: /이 줄기의 선/ })).toHaveCount(0);
  await expect(page.locator("g.edge.edge--selected")).toHaveCount(1);
  const picked = await page.locator("g.edge.edge--selected").getAttribute("data-edge-id");
  expect(ids).toContain(picked);

  // Esc 로 풀린다.
  await clickSharedSegment(page);
  await expect(page.locator(".edge-trunk-tag").first()).toBeAttached();
  await page.keyboard.press("Escape");
  await expect(page.locator(".edge-trunk")).toHaveCount(0);
  await expect(page.locator(".edge-trunk-tag")).toHaveCount(0);
});

test("펼친 채 내보낸 SVG 에는 줄기 겹선이 남지 않는다", async ({ page }) => {
  await openShop(page);
  await page.getByRole("button", { name: "프로젝트 영역 접기" }).click();
  await clickSharedSegment(page);
  await expect(page.locator(".edge-trunk-tag").first()).toBeAttached();

  const trigger = page.getByRole("button", { name: EXPORT, exact: true });
  await trigger.click();
  const menu = page.getByRole("menu", { name: EXPORT });
  await expect(menu).toBeVisible();
  const download = page.waitForEvent("download", { timeout: 60_000 });
  await menu.getByRole("menuitem", { name: "SVG 흰 바탕(문서용)" }).click();
  const body = (await readFile(await (await download).path())).toString("utf8");
  await expect(page.locator(".canvas__export-note[role=status]")).toHaveText("이미지를 저장했어요.");

  expect(body).toContain("<svg");
  // 색 토큰(--edge-trunk-N)은 스타일에 남아도 된다. 겹선·꼬리표·누르는 자리 요소가 없어야 한다.
  expect(body).not.toMatch(/class=\\?"[^"]*edge-trunk/);
  expect(body).not.toMatch(/class=\\?"[^"]*edge-seg-hit/);
  expect(body).not.toContain("data-trunk-");
  expect(body).not.toContain("data-seg-key");
  // 화면은 펼친 그대로다.
  await expect(page.locator(".edge-trunk-tag").first()).toBeAttached();
});
