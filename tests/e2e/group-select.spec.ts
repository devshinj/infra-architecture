import { expect, test, type Page } from "@playwright/test";

import { S1_NODE_COUNT } from "./fake-llm";

const uid = () => Math.random().toString(36).slice(2, 8);
const PLACEHOLDER = "만들고 싶은 서비스나 바꾸고 싶은 점을 말해 주세요. 노드를 오른쪽 클릭하면 참조를 붙일 수 있어요.";

async function setup(page: Page) {
  const name = `gs${uid()}`;
  await page.goto("/signup");
  await page.getByLabel("아이디").fill(name);
  await page.getByLabel("이메일").fill(`${name}@b.co`);
  await page.getByLabel("비밀번호").fill("password1");
  await page.getByRole("button", { name: "가입하기" }).click();
  await page.getByRole("button", { name: "새 프로젝트" }).click();
  await page.getByRole("dialog").getByLabel("이름").fill("영역 선택");
  await page.getByRole("dialog").getByRole("button", { name: "만들기" }).click();
  await page.waitForURL(/\/p\/[^/]+\/d\/[^/]+/);
  await page.getByRole("tab", { name: "대화" }).click();
}

test("a zone is selected from its name pill, explained with its boundary, and can be asked about", async ({ page }) => {
  await setup(page);
  await page.getByPlaceholder(PLACEHOLDER).fill("AWS 에 결제랑 카카오 로그인 붙는 쇼핑몰");
  await page.getByRole("button", { name: "보내기" }).click();
  await expect(page.locator(".react-flow__node-infra")).toHaveCount(S1_NODE_COUNT, { timeout: 30_000 });
  await expect(page.getByText(/완료 · 노드 \d+ · 연결 \d+/)).toBeVisible({ timeout: 30_000 });
  await page.getByRole("button", { name: "전체 보기" }).click();

  // 가장 바깥 영역의 이름 알약을 누른다.
  const pill = page.locator(".zone-names .group__name").first();
  const zoneId = (await pill.getAttribute("data-zone-id"))!;
  const zoneName = (await pill.textContent())!.trim();
  await pill.click();
  await expect(page.getByRole("tab", { name: "설명" })).toHaveAttribute("aria-selected", "true");
  await expect(page.locator(`.react-flow__node-zone[data-id="${zoneId}"] .group`)).toHaveClass(/group--selected/);
  await expect(page.getByRole("heading", { level: 2, name: zoneName })).toBeVisible();

  const boundary = page.locator("section").filter({ has: page.getByRole("heading", { name: "경계에서 드나드는 것" }) });
  await expect(boundary.getByText("가짜 경계 설명")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole("region", { name: "안에 든 것" }).getByRole("button").first()).toBeVisible();
  await expect(page.getByRole("region", { name: "경계를 넘는 연결" })).toBeVisible();

  // 이 영역에 대해 물어보기: 대화 탭으로 가서 가짜 답이 온다.
  await page.getByLabel("이 영역에 대해 물어보기").fill("이 영역은 왜 있어?");
  await page.getByRole("button", { name: "질문 보내기" }).click();
  await expect(page.getByRole("tab", { name: "대화" })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByText("가짜 답이에요. 이 영역은 왜 있어?")).toBeVisible({ timeout: 30_000 });

  // 고른 영역의 알약을 다시 누르면 선택이 풀린다.
  await page.getByRole("tab", { name: "설명" }).click();
  await pill.click();
  await expect(page.locator(`.react-flow__node-zone[data-id="${zoneId}"] .group`)).not.toHaveClass(/group--selected/);
});
