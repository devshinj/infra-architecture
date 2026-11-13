import { expect, test, type Page } from "@playwright/test";

const uid = () => Math.random().toString(36).slice(2, 8);
const PLACEHOLDER = "만들고 싶은 서비스나 바꾸고 싶은 점을 말해 주세요. 노드를 오른쪽 클릭하면 참조를 붙일 수 있어요.";
const SUMMARY = /^완료 · 노드 \d+ · 연결 \d+/;
const cardToggle = (page: Page) => page.getByRole("button", { name: /^구성 정보 (펼치기|접기)$/ });
const cardBody = (page: Page) => page.locator("#info-card-body");
const versionRows = (page: Page) => page.getByRole("listitem").filter({ has: page.getByRole("button", { name: /^v\d+/ }) });

async function setup(page: Page) {
  const name = `rs${uid()}`;
  await page.goto("/signup");
  await page.getByLabel("아이디").fill(name);
  await page.getByLabel("이메일").fill(`${name}@b.co`);
  await page.getByLabel("비밀번호").fill("password1");
  await page.getByRole("button", { name: "가입하기" }).click();
  await page.getByRole("button", { name: "새 프로젝트" }).click();
  await page.getByRole("dialog").getByLabel("이름").fill("되돌리기 테스트");
  await page.getByRole("dialog").getByRole("button", { name: "만들기" }).click();
  await page.waitForURL(/\/p\/[^/]+\/d\/[^/]+/);
  await page.getByRole("tab", { name: "대화" }).click();
}

const send = async (page: Page, text: string, turns: number) => {
  await page.getByPlaceholder(PLACEHOLDER).fill(text);
  await page.getByRole("button", { name: "보내기" }).click();
  await expect(page.getByText(SUMMARY)).toHaveCount(turns, { timeout: 30_000 });
  await expect(page.getByRole("list", { name: "진행 단계" })).toHaveCount(0, { timeout: 30_000 });
};

/** 카드를 펼친 채 접힌 줄(개수)과 본문(가정·채워야 할 정보·주의)을 읽는다. */
const readCard = async (page: Page) => {
  if ((await cardToggle(page).getAttribute("aria-expanded")) !== "true") await cardToggle(page).click();
  return { line: await cardToggle(page).innerText(), body: await cardBody(page).innerText() };
};

test("이력에서 되돌리면 구성 정보 카드(가정·주의)도 그 버전으로 돌아가고, 안내에 숫자 변화가 붙는다", async ({ page }) => {
  await setup(page);
  await send(page, "AWS 쇼핑몰 구성도 그려줘", 1);
  const v1 = await readCard(page);

  await send(page, "AWS 에 공개DB 붙은 서비스", 2);
  const v2 = await readCard(page);
  expect(v2).not.toEqual(v1);

  await page.getByRole("tab", { name: "이력" }).click();
  const rows = versionRows(page);
  // v1 빈 구성도(가져오기) · v2 첫 차례 · v3 둘째 차례. v2 로 되돌린다.
  await expect(rows).toHaveCount(3, { timeout: 15_000 });
  await rows.nth(1).getByRole("button").first().click();
  await rows.nth(1).getByRole("button", { name: "이 버전으로 되돌리기" }).click();
  await expect(rows.first()).toContainText("되돌리기", { timeout: 15_000 });

  await expect.poll(() => readCard(page), { timeout: 15_000 }).toEqual(v1);

  // 대화에 되돌림 안내가 바로 뜨고, 둘째 줄에 카드 숫자의 변화가 붙는다(카드 접힌 줄의 숫자와 맞는다).
  const nums = (line: string) => [...line.matchAll(/(채워야 할 정보|주의|미확정 가정)\s*(\d+)/g)].map((m) => [m[1]!, m[2]!] as const);
  const was = new Map(nums(v2.line));
  const now = new Map(nums(v1.line));
  const expected = [...now.keys()].filter((k) => was.get(k) !== now.get(k)).map((k) => `${k} ${was.get(k)} → ${now.get(k)}`).join(" · ") || "구성 정보 숫자는 그대로예요";
  await page.getByRole("tab", { name: "대화" }).click();
  const notice = page.getByText(/^v2로 되돌림 \(새 버전 v4\)/);
  await expect(notice).toBeVisible({ timeout: 15_000 });
  await expect(notice).toHaveText(`v2로 되돌림 (새 버전 v4)\n${expected}`);

  // 새로 고쳐도 같다(안내는 저장된 줄로).
  await page.reload();
  await expect.poll(() => readCard(page), { timeout: 15_000 }).toEqual(v1);
  await page.getByRole("tab", { name: "대화" }).click();
  await expect(page.getByText(/^v2로 되돌림 \(새 버전 v4\)/)).toHaveText(`v2로 되돌림 (새 버전 v4)\n${expected}`);
});
