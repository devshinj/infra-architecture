import { expect, test, type Page } from "@playwright/test";

import { NET_NODE_COUNT, S1_FLOW_START_LABEL, S1_NODE_COUNT } from "./fake-llm";

const uid = () => Math.random().toString(36).slice(2, 8);
const PLACEHOLDER = "만들고 싶은 서비스나 바꾸고 싶은 점을 말해 주세요. 노드를 오른쪽 클릭하면 참조를 붙일 수 있어요.";
const SUMMARY = /노드 \d+ · 연결 \d+ · (?:\d+곳 바꿨어요|바꾼 곳이 없어요)/;
// 가짜 LLM 흐름 제안(s1): 사용자 행동 둘 · 시스템·네트워크 하나.
const SUGGESTED = ["상품 보기", "주문하기", "정산 배치"];
const NET_GUIDE = "서로 다른 망 사이 통신은 방화벽·망연계 솔루션·VPN 을 거치게 그리세요.";

async function setup(page: Page) {
  const name = `fl${uid()}`;
  await page.goto("/signup");
  await page.getByLabel("아이디").fill(name);
  await page.getByLabel("이메일").fill(`${name}@b.co`);
  await page.getByLabel("비밀번호").fill("password1");
  await page.getByRole("button", { name: "가입하기" }).click();
  await page.getByRole("button", { name: "새 프로젝트" }).click();
  await page.getByRole("dialog").getByLabel("이름").fill("흐름 테스트");
  await page.getByRole("dialog").getByRole("button", { name: "만들기" }).click();
  await page.waitForURL(/\/p\/[^/]+\/d\/[^/]+/);
  await page.getByRole("tab", { name: "대화" }).click();
}

const nodes = (page: Page) => page.locator(".react-flow__node-infra");
const nodeByTitle = (page: Page, title: string) => nodes(page).filter({ has: page.getByTitle(title, { exact: true }) });

async function send(page: Page, text: string) {
  await page.getByRole("tab", { name: "대화" }).click();
  await page.getByPlaceholder(PLACEHOLDER).fill(text);
  await page.getByRole("button", { name: "보내기" }).click();
}

/** 흐름 탭의 흐름 행 버튼(이름으로 시작하고 ⋯ 메뉴 버튼이 아닌 것). */
const flowRow = (page: Page, name: string) => page.getByRole("region", { name: /사용자 행동|시스템·네트워크/ }).getByRole("button", { name: new RegExp(`^${name}(?! 메뉴$)`) });
const flowItems = (page: Page) => page.getByRole("region", { name: /사용자 행동|시스템·네트워크/ }).getByRole("listitem").filter({ has: page.getByRole("button", { name: / 메뉴$/ }) });

/** 쇼핑몰(s1)을 그리고 첫 그림 뒤 자동 제안된 흐름 3개가 흐름 탭에 들어올 때까지 기다린다. */
async function drawS1WithSuggestions(page: Page) {
  await setup(page);
  await send(page, "AWS 에 결제랑 카카오 로그인 붙는 쇼핑몰");
  await expect(nodes(page)).toHaveCount(S1_NODE_COUNT, { timeout: 30_000 });
  await expect(page.getByText(SUMMARY)).toBeVisible({ timeout: 30_000 });
  await page.getByRole("tab", { name: "흐름" }).click();
  await expect(flowItems(page)).toHaveCount(SUGGESTED.length, { timeout: 30_000 });
}

test("after first draw, flows tab lists suggested flows with AI 제안", async ({ page }) => {
  await drawS1WithSuggestions(page);
  const user = page.getByRole("region", { name: "사용자 행동" });
  const system = page.getByRole("region", { name: "시스템·네트워크" });
  await expect(user.getByRole("listitem").filter({ has: page.getByRole("button", { name: / 메뉴$/ }) })).toHaveCount(2);
  await expect(system.getByRole("listitem").filter({ has: page.getByRole("button", { name: / 메뉴$/ }) })).toHaveCount(1);
  for (const name of SUGGESTED) await expect(flowRow(page, name)).toContainText("AI 제안");
  await expect(system.getByRole("button", { name: /^정산 배치(?! 메뉴$)/ })).toBeVisible();
});

test('selecting a flow shows step labels "1." on canvas and dims others', async ({ page }) => {
  await drawS1WithSuggestions(page);
  await expect(page.locator(".edge-step-label")).toHaveCount(0);
  await flowRow(page, "상품 보기").click();
  await expect(flowRow(page, "상품 보기")).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("list", { name: "상품 보기 단계" }).getByRole("listitem").first()).toBeVisible();

  const labels = page.locator(".edge-step-label");
  await expect(labels.first()).toBeAttached();
  await expect(labels.first()).toHaveText(/^1\. /);
  // 단계가 아닌 연결과 노드는 흐린다.
  await expect(page.locator("g.edge.edge--dim").first()).toBeAttached();
  await expect(page.locator(".node--dimmed").first()).toBeAttached();
  const stepEdges = await labels.evaluateAll((els) => els.map((el) => el.getAttribute("data-step-edge")));
  for (const id of stepEdges) await expect(page.locator(`g.edge[data-edge-id="${id}"]`)).not.toHaveClass(/edge--dim/);

  // Esc 로 흐름 보기를 끈다.
  await page.keyboard.press("Escape");
  await expect(labels).toHaveCount(0);
  await expect(page.locator("g.edge.edge--dim")).toHaveCount(0);
});

test("맞아요 removes badge", async ({ page }) => {
  await drawS1WithSuggestions(page);
  await expect(flowRow(page, "주문하기")).toContainText("AI 제안");
  await page.getByRole("button", { name: "주문하기 메뉴" }).click();
  await page.getByRole("menuitem", { name: "맞아요" }).click();
  await expect(flowRow(page, "주문하기")).not.toContainText("AI 제안", { timeout: 15_000 });
  await expect(flowRow(page, "상품 보기")).toContainText("AI 제안");

  // 새로 고쳐도 확인한 흐름은 배지가 없고, 메뉴에 맞아요도 없다.
  await page.reload();
  await page.getByRole("tab", { name: "흐름" }).click();
  await expect(flowItems(page)).toHaveCount(SUGGESTED.length, { timeout: 15_000 });
  await expect(flowRow(page, "주문하기")).not.toContainText("AI 제안");
  await page.getByRole("button", { name: "주문하기 메뉴" }).click();
  await expect(page.getByRole("menuitem", { name: "이름 바꾸기" })).toBeVisible();
  await expect(page.getByRole("menuitem", { name: "맞아요" })).toHaveCount(0);
});

test('chat "흐름" request adds a flow', async ({ page }) => {
  await drawS1WithSuggestions(page);
  await send(page, "주문 흐름 그려 줘");
  await expect(page.getByText("주문 흐름을 그렸어요.")).toBeVisible({ timeout: 30_000 });
  await page.getByRole("tab", { name: "흐름" }).click();
  await expect(flowItems(page)).toHaveCount(SUGGESTED.length + 1, { timeout: 15_000 });
  // 제안 흐름과 같은 이름 "주문하기" 가 하나 더 생긴다(사용자 행동 묶음).
  await expect(page.getByRole("region", { name: "사용자 행동" }).getByRole("button", { name: /^주문하기(?! 메뉴$)/ })).toHaveCount(2);
  // 흐름 명령은 구성도를 바꾸지 않는다.
  await expect(nodes(page)).toHaveCount(S1_NODE_COUNT);
});

test("node info lists flows through node", async ({ page }) => {
  await drawS1WithSuggestions(page);
  // 첫 연결에서 시작하는 "상품 보기" 제안 흐름이 이 노드를 지난다.
  await nodeByTitle(page, S1_FLOW_START_LABEL).click();
  await expect(page.getByRole("tab", { name: "설명" })).toHaveAttribute("aria-selected", "true");
  const through = page.getByRole("region", { name: "이 노드를 지나는 흐름" });
  await expect(through).toBeVisible();
  await expect(through.getByRole("button", { name: "상품 보기" })).toBeVisible();

  // 칩을 누르면 흐름 탭으로 가서 그 흐름을 켠다.
  await through.getByRole("button", { name: "상품 보기" }).click();
  await expect(page.getByRole("tab", { name: "흐름" })).toHaveAttribute("aria-selected", "true");
  await expect(flowRow(page, "상품 보기")).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator(".edge-step-label").first()).toHaveText(/^1\. /);
});

test("망 경계 sample: crossing dot visible, tag on select, network_direct warning shown", async ({ page }) => {
  await setup(page);
  await send(page, "업무망과 인터넷망 망분리 구성");
  await expect(nodes(page)).toHaveCount(NET_NODE_COUNT, { timeout: 30_000 });
  await expect(page.getByText(SUMMARY)).toBeVisible({ timeout: 30_000 });

  // 평소: 망을 넘는 연결 셋(망연계 앞뒤 둘 + 바로 넘는 하나)에 점만, "망 넘음" 표시는 없다.
  await expect(page.locator(".edge-boundary-dot")).toHaveCount(3);
  await expect(page.locator(".edge-boundary-tag")).toHaveCount(0);

  // 망연계를 고르면 닿은 두 연결에 "망 넘음 · API" + 양방향 화살표(선으로 그림) 표시가 붙는다.
  await nodeByTitle(page, "망연계").click();
  const tags = page.locator(".edge-boundary-tag");
  await expect(tags).toHaveCount(2);
  for (let i = 0; i < 2; i++) {
    await expect(tags.nth(i)).toContainText("망 넘음");
    await expect(tags.nth(i).locator(".edge-boundary-tag__detail")).toHaveText("API");
    await expect(tags.nth(i).locator(".edge-boundary-tag__dir")).toHaveAttribute("data-direction", "two_way");
  }
  await page.keyboard.press("Escape");

  // 바로 넘는 연결: 인터넷 서버에 경고, 설명 탭 주의할 점에 network_direct 안내가 보인다.
  const inet = nodeByTitle(page, "인터넷 서버");
  await expect(inet.getByRole("button", { name: /^경고 \d+개$/ })).toBeVisible({ timeout: 15_000 });
  await inet.click();
  await expect(page.getByRole("tab", { name: "설명" })).toHaveAttribute("aria-selected", "true");
  const cautions = page.locator("section").filter({ has: page.getByRole("heading", { name: "주의할 점" }) });
  await expect(cautions.getByText(NET_GUIDE)).toBeVisible();
  // 인터넷 서버에 닿은 경계 연결 둘: 망연계에서 오는 것(API·양방향)과 바로 넘어오는 것(파일·한 방향).
  await expect(tags).toHaveCount(2);
  const fileTag = tags.filter({ hasText: "파일" });
  await expect(fileTag).toHaveCount(1);
  await expect(fileTag.locator(".edge-boundary-tag__dir")).toHaveAttribute("data-direction", "one_way");
  await page.keyboard.press("Escape");

  // 망연계를 거치는 제안 흐름을 켜면 경계를 넘는 단계 둘에 표시가 붙고 단계 글자가 셋이다.
  await page.getByRole("tab", { name: "흐름" }).click();
  await expect(flowRow(page, "자료 보내기")).toBeVisible({ timeout: 30_000 });
  await flowRow(page, "자료 보내기").click();
  await expect(page.locator(".edge-step-label")).toHaveCount(3);
  await expect(tags).toHaveCount(2);
  await expect(page.getByRole("list", { name: "자료 보내기 단계" })).toContainText("업무망에서 망 밖으로 넘어가요(망연계 거침)");
});
