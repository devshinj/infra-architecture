import { expect, test, type Page } from "@playwright/test";

const uid = () => Math.random().toString(36).slice(2, 8);
const PLACEHOLDER = "만들고 싶은 서비스나 바꾸고 싶은 점을 말해 주세요. 노드를 오른쪽 클릭하면 참조를 붙일 수 있어요.";
const SUMMARY = /노드 \d+ · 연결 \d+ · 적용 \d+ · 건너뜀 \d+/;

async function setup(page: Page) {
  const name = `wn${uid()}`;
  await page.goto("/signup");
  await page.getByLabel("아이디").fill(name);
  await page.getByLabel("이메일").fill(`${name}@b.co`);
  await page.getByLabel("비밀번호").fill("password1");
  await page.getByRole("button", { name: "가입하기" }).click();
  await page.getByRole("button", { name: "새 프로젝트" }).click();
  await page.getByRole("dialog").getByLabel("이름").fill("경고 테스트");
  await page.getByRole("dialog").getByRole("button", { name: "만들기" }).click();
  await page.waitForURL(/\/p\/[^/]+\/d\/[^/]+/);
  await page.getByRole("tab", { name: "대화" }).click();
}

const send = async (page: Page, text: string) => {
  await page.getByPlaceholder(PLACEHOLDER).fill(text);
  await page.getByRole("button", { name: "보내기" }).click();
};
const pubDb = (page: Page) => page.locator(".react-flow__node-infra").filter({ has: page.getByTitle("공개 DB") });
const warnBadge = (page: Page) => pubDb(page).getByRole("button", { name: /^경고 \d+개$/ });
// 대화에는 답변마다 `주의 N` 칩 하나만, 자세한 목록은 캔버스 구성 정보 카드의 주의 절에 있다.
const cautionChips = (page: Page) => page.getByRole("button", { name: /^주의 \d+$/ });
const cardToggle = (page: Page) => page.getByRole("button", { name: /^구성 정보 (펼치기|접기)$/ });
const cardWarnings = (page: Page) => page.getByRole("region", { name: "주의" });
const versionRows = (page: Page) => page.getByRole("listitem").filter({ has: page.getByRole("button", { name: /^v\d+/ }) });
const warnCount = async (page: Page) => Number(/(\d+)개/.exec((await warnBadge(page).getAttribute("aria-label")) ?? "")![1]);

test("warnings: chat chip, card list, badge, ignore, restore", async ({ page }) => {
  await setup(page);
  await send(page, "공개DB 붙은 서비스");
  // 점검 중 단계(위험 요소 점검)는 아주 짧게 지나갈 수 있어 관찰을 요구하지 않는다. 결과 줄만 본다.
  await expect(cautionChips(page).first()).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText(SUMMARY)).toBeVisible();

  await expect(warnBadge(page)).toBeVisible({ timeout: 15_000 });
  const n = await warnCount(page);
  expect(n).toBeGreaterThanOrEqual(1);
  // 숫자 배지는 기본 꺼짐이고 경고 배지는 그대로다. 켜면 함께 보인다(DB 의 필수 속성 미입력).
  await expect(pubDb(page).getByRole("button", { name: /^빠진 정보 \d+개$/ })).toHaveCount(0);
  await page.getByRole("button", { name: "빠진 정보 숫자" }).click();
  await expect(pubDb(page).getByRole("button", { name: /^빠진 정보 \d+개$/ })).toBeVisible();

  // 주의 N 칩 → 카드가 펼쳐져 주의 절이 보인다. 항목 클릭 → 설명 탭 주의할 점
  await page.getByRole("tab", { name: "대화" }).click();
  await cautionChips(page).first().click();
  await expect(cardToggle(page)).toHaveAttribute("aria-expanded", "true");
  await expect(cardWarnings(page).getByText("가짜 경고 문구").first()).toBeVisible();
  await cardWarnings(page).getByRole("button", { name: /가짜 경고 문구/ }).first().click();
  await expect(page.getByRole("tab", { name: "설명" })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("heading", { name: "주의할 점" })).toBeVisible();
  const cautions = page.locator("section").filter({ has: page.getByRole("heading", { name: "주의할 점" }) });
  await expect(cautions.getByText("가짜 경고 문구").first()).toBeVisible();
  await expect(cautions.getByText("경고", { exact: true }).first()).toBeVisible();
  await expect(cautions.getByText("DB·캐시는 내부 구역에 두고 WAS 를 거쳐서만 접근하게 하세요.")).toBeVisible();

  // 의도된 구성: 한 번에 한 경고씩 옮겨진다.
  await page.getByRole("button", { name: "의도된 구성", exact: true }).first().click();
  await expect(page.getByRole("heading", { name: "의도된 구성으로 표시함" })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("button", { name: "다시 경고" })).toBeVisible();
  if (n === 1) await expect(warnBadge(page)).toHaveCount(0);
  else await expect(warnBadge(page)).toHaveAccessibleName(`경고 ${n - 1}개`);

  await page.getByRole("tab", { name: "이력" }).click();
  await expect(versionRows(page).first()).toContainText("직접 입력", { timeout: 15_000 });

  // 같은 DB 를 고치는 요청(경고 점검이 실제로 돈다)에도 무시한 경고의 새 줄은 생기지 않는다.
  await page.getByRole("tab", { name: "대화" }).click();
  const before = await cautionChips(page).count();
  await send(page, "공개DB 다시");
  await expect(page.getByText(SUMMARY)).toHaveCount(2, { timeout: 30_000 });
  // 진행 카드가 접힌 한 줄이 되면(위험 요소 점검까지 끝나면) 진행 단계 목록이 없다.
  await expect(page.getByRole("list", { name: "진행 단계" })).toHaveCount(0, { timeout: 30_000 });
  await expect(cautionChips(page)).toHaveCount(before);

  // 무시 직전 버전으로 되돌리면 배지가 다시 보인다.
  await page.getByRole("tab", { name: "이력" }).click();
  const rows = versionRows(page);
  await expect(rows.first()).toBeVisible();
  const idx = await rows.evaluateAll((els) => els.findIndex((e) => e.textContent?.includes("직접 입력")));
  expect(idx).toBeGreaterThan(0);
  await rows.nth(idx + 1).getByRole("button").first().click();
  await rows.nth(idx + 1).getByRole("button", { name: "이 버전으로 되돌리기" }).click();
  await expect(rows.first()).toContainText("되돌리기", { timeout: 15_000 });
  await expect(warnBadge(page)).toHaveAccessibleName(`경고 ${n}개`, { timeout: 15_000 });

  // 새로고침 뒤에도 처음의 주의 칩이 남는다.
  await page.reload();
  await page.getByRole("tab", { name: "대화" }).click();
  await expect(cautionChips(page).first()).toBeVisible({ timeout: 15_000 });
});
