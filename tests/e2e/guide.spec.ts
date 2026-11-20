import { expect, test, type Page } from "@playwright/test";

const uid = () => Math.random().toString(36).slice(2, 8);
const LOCKED = "학습 중에는 바꿀 수 없어요. 학습을 그만두면 바꿀 수 있어요.";
const REWRITE_NOTE = "학습을 그만두면 다시 쓸 수 있어요.";
// SHOP 온프레미스 대본의 1·2단계(src/domain/guides/shop-onprem.ts).
const STEP1_EXAMPLE = "고객이 웹과 앱으로 들어오고 앞에 방화벽을 둬 줘";
const STEP1_SAY = /^IDC 안에 DMZ 를 나누고 맨 앞에 외부 방화벽을 뒀어요\./;
const STEP1_NODES = 3; // 고객 브라우저 · 고객 앱 · 외부 방화벽
const STEP2_GOAL = "L4 두 대 이중화(VIP)";
const STEP2_MISS = "이번 단계는 L4 를 두 대로 이중화하는 거예요. 'L4 두 대로 이중화해 줘'처럼 말해 보세요.";
const FW_ROLE = /^인터넷과 DMZ 사이의 문지기예요\./;

const nodes = (page: Page) => page.locator(".react-flow__node-infra");
const card = (page: Page) => page.getByRole("region", { name: "학습 단계" });
const input = (page: Page) => page.getByRole("textbox", { name: "메시지 입력" });

async function signup(page: Page) {
  const name = `gd${uid()}`;
  await page.goto("/signup");
  await page.getByLabel("아이디").fill(name);
  await page.getByLabel("이메일").fill(`${name}@b.co`);
  await page.getByLabel("비밀번호").fill("password1");
  await page.getByRole("button", { name: "가입하기" }).click();
}

/** 차례가 끝날 때까지: 차례 동안만 보이는 중단 버튼이 사라지고 입력칸이 다시 열린다. */
const turnEnded = async (page: Page) => {
  await expect(page.getByRole("button", { name: "중단", exact: true })).toHaveCount(0, { timeout: 30_000 });
  await expect(input(page)).toBeEnabled({ timeout: 30_000 });
};

test("학습 모드 한 바퀴: 주제 고르기 → 환경 → 1단계 → 안 맞는 말 → 이어서 하기 → 막힘 → 그만두기", async ({ page }) => {
  await signup(page);

  // 사이드바 "학습 모드" → 주제 고르기 → 쇼핑몰 시작.
  await page.getByRole("link", { name: "학습 모드" }).first().click();
  await page.waitForURL(/\/learn$/);
  await expect(page.getByRole("heading", { name: "학습 모드", level: 1 })).toBeVisible();
  await page.getByRole("article", { name: "대형 쇼핑몰" }).getByRole("button", { name: "시작" }).click();
  await page.waitForURL(/\/p\/[^/]+\/d\/[^/]+/, { timeout: 30_000 });
  await page.getByRole("tab", { name: "대화" }).click();

  // 환경 고르기 전: 환경 칩. 새 대화 버튼은 없다.
  await expect(card(page)).toContainText("학습: 대형 쇼핑몰", { timeout: 15_000 });
  await expect(page.getByRole("button", { name: "새 대화" })).toHaveCount(0);
  await card(page).getByRole("list", { name: "환경" }).getByRole("button", { name: "온프레미스" }).click();
  await expect(card(page)).toContainText("학습: 대형 쇼핑몰 (온프레미스)", { timeout: 30_000 });
  await expect(card(page)).toContainText("1 / 12");
  await expect(card(page)).toContainText(STEP1_EXAMPLE);
  await turnEnded(page);

  // 1단계 예시를 입력창에 넣어 보낸다 → 노드가 그려지고 카드가 2 / 12.
  await card(page).getByRole("button", { name: "입력창에 넣기" }).click();
  const box = input(page);
  await expect(box).toHaveValue(STEP1_EXAMPLE);
  await expect(box).toBeFocused();
  await page.getByRole("button", { name: "보내기" }).click();
  await expect(nodes(page)).toHaveCount(STEP1_NODES, { timeout: 30_000 });
  await expect(card(page)).toContainText("2 / 12", { timeout: 30_000 });
  await expect(card(page)).toContainText(STEP2_GOAL);
  await expect(page.getByText(STEP1_SAY)).toBeVisible();
  await turnEnded(page);
  // 새로 그린 서버 글로 바뀌면 해설 칩이 붙는다.
  await expect(page.getByRole("list", { name: "해설" }).first()).toBeVisible({ timeout: 15_000 });

  // 다른 말: 안내 문구만, 카드와 그림은 그대로.
  await box.fill("DB 넣어 줘");
  await page.getByRole("button", { name: "보내기" }).click();
  await expect(page.getByText(STEP2_MISS)).toBeVisible({ timeout: 30_000 });
  await turnEnded(page);
  await expect(card(page)).toContainText("2 / 12");
  await expect(card(page)).toContainText(STEP2_GOAL);
  await expect(nodes(page)).toHaveCount(STEP1_NODES);

  // 새로 고침: 같은 카드에서 이어서 한다.
  await page.reload();
  await page.getByRole("tab", { name: "대화" }).click();
  await expect(card(page)).toContainText("2 / 12", { timeout: 15_000 });
  await expect(card(page)).toContainText(STEP2_GOAL);
  await expect(nodes(page)).toHaveCount(STEP1_NODES, { timeout: 15_000 });
  await expect(page.getByText(STEP2_MISS)).toBeVisible();

  // 노드를 누르면 설명 탭에 대본 글.
  await page.getByTitle("외부 방화벽").click();
  await page.getByRole("tab", { name: "설명" }).click();
  await expect(page.getByText(FW_ROLE)).toBeVisible({ timeout: 15_000 });

  // 설명 고치기(다시 쓰기)는 학습 중이라 막혀 있다: 버튼은 보이되 눌리지 않고 옆에 이유가 있다. 대본 글은 그대로.
  const rewrite = page.getByRole("button", { name: "다시 쓰기" });
  await expect(rewrite).toBeVisible();
  await expect(rewrite).toBeDisabled();
  await expect(rewrite).toHaveAccessibleDescription(REWRITE_NOTE);
  await expect(page.getByText(REWRITE_NOTE)).toBeVisible();
  await expect(page.getByText(FW_ROLE)).toBeVisible();

  // 학습 그만두기 → 확인 → 카드가 사라지고 새 대화가 돌아온다.
  await page.getByRole("tab", { name: "대화" }).click();
  await card(page).getByRole("button", { name: "학습 그만두기" }).click();
  const confirm = page.getByRole("alertdialog", { name: "학습 그만두기" });
  await expect(confirm).toContainText("이 학습은 이어서 할 수 없어요.");
  await confirm.getByRole("button", { name: "그만두기" }).click();
  await expect(confirm).toHaveCount(0, { timeout: 15_000 });
  await expect(card(page)).toHaveCount(0, { timeout: 15_000 });
  await expect(page.getByRole("button", { name: "새 대화" })).toBeVisible({ timeout: 15_000 });
  await expect(nodes(page)).toHaveCount(STEP1_NODES);

  // 같은 고치기가 이제 된다(새로 고치지 않아도). 외부 방화벽은 아직 골라져 있다(다시 누르면 선택이 풀린다).
  await page.getByRole("tab", { name: "설명" }).click();
  await expect(page.getByText(FW_ROLE)).toBeVisible();
  await expect(page.getByText(REWRITE_NOTE)).toHaveCount(0, { timeout: 15_000 });
  await expect(rewrite).toBeEnabled();
  await rewrite.click();
  await page.getByLabel("다시 쓰기 지시").fill("더 쉽게");
  await page.getByRole("button", { name: "다시 만들기" }).click();
  await expect(page.getByText("다시 쓴 역할")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(LOCKED)).toHaveCount(0);
});
