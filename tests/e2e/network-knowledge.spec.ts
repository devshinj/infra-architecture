import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

import { FAKE_PORT } from "./fake-config";
import { ADMIN, ADMIN_NODE_COUNT, WORK_NODE_COUNT } from "./fake-llm";

const uid = () => Math.random().toString(36).slice(2, 8);
const PLACEHOLDER = "만들고 싶은 서비스나 바꾸고 싶은 점을 말해 주세요. 노드를 오른쪽 클릭하면 참조를 붙일 수 있어요.";
const SUMMARY = /노드 \d+ · 연결 \d+ · (?:\d+곳 바꿨어요|바꾼 곳이 없어요)/;
const LINK_EXPECTED = "사이는 망연계가 필요해요";

async function signup(page: Page) {
  const name = `nk${uid()}`;
  await page.goto("/signup");
  await page.getByLabel("아이디").fill(name);
  await page.getByLabel("이메일").fill(`${name}@b.co`);
  await page.getByLabel("비밀번호").fill("password1");
  await page.getByRole("button", { name: "가입하기" }).click();
}

async function newProject(page: Page, name: string) {
  await page.getByRole("button", { name: "새 프로젝트" }).click();
  await page.getByRole("dialog").getByLabel("이름").fill(name);
  await page.getByRole("dialog").getByRole("button", { name: "만들기" }).click();
  await page.waitForURL(/\/p\/[^/]+\/d\/[^/]+/);
}

async function send(page: Page, text: string) {
  await page.getByRole("tab", { name: "대화" }).click();
  await page.getByPlaceholder(PLACEHOLDER).fill(text);
  await page.getByRole("button", { name: "보내기" }).click();
}

const nodes = (page: Page) => page.locator(".react-flow__node-infra");
const nodeByTitle = (page: Page, title: string) => nodes(page).filter({ has: page.getByTitle(title, { exact: true }) });
const cardToggle = (page: Page) => page.getByRole("button", { name: /^구성 정보 (펼치기|접기)$/ });
const cardWarnings = (page: Page) => page.getByRole("region", { name: "주의" });

async function openCard(page: Page) {
  if ((await cardToggle(page).getAttribute("aria-expanded")) !== "true") await cardToggle(page).click();
  await expect(cardToggle(page)).toHaveAttribute("aria-expanded", "true");
}

/** 가짜 LLM 이 받은 대화 요청의 마지막 사용자 글들. */
async function received(request: APIRequestContext): Promise<string[]> {
  const res = await request.get(`http://127.0.0.1:${FAKE_PORT}/e2e/received`);
  return ((await res.json()) as { messages: string[] }).messages;
}

test("행정망 사례: AI 추정 망연계, 아니에요로 되돌리기, 다음 프롬프트에 no_link 가정", async ({ page, request }) => {
  await signup(page);
  await newProject(page, "행정망 사례");
  await send(page, "행정망 PC가 GCloud 인터넷망 WAS에 접속해");
  await expect(nodes(page)).toHaveCount(ADMIN_NODE_COUNT, { timeout: 30_000 });
  await expect(page.getByText(SUMMARY)).toBeVisible({ timeout: 30_000 });

  // 망연계 노드를 고르면 설명 탭에 AI 추정 표시와 맞아요·아니에요가 있다.
  await nodeByTitle(page, "망연계 솔루션").click();
  await expect(page.getByRole("tab", { name: "설명" })).toHaveAttribute("aria-selected", "true");
  const guess = page.getByRole("group", { name: "AI 추정 망연계" });
  await expect(guess.getByText("AI 추정", { exact: true })).toBeVisible();
  await expect(guess.getByRole("button", { name: "맞아요" })).toBeVisible();

  // 아니에요: 망연계만 빠지고 방화벽 → WAS 가 바로 이어진다.
  await guess.getByRole("button", { name: "아니에요" }).click();
  await expect(nodes(page)).toHaveCount(ADMIN_NODE_COUNT - 1, { timeout: 15_000 });
  await expect(nodeByTitle(page, "망연계 솔루션")).toHaveCount(0);
  await nodeByTitle(page, "행정망 방화벽").click();
  const linked = page.locator("section").filter({ has: page.getByRole("heading", { name: "연결된 노드" }) });
  await expect(linked.getByRole("button", { name: "GCloud WAS" })).toBeVisible();
  await expect(linked.getByRole("button", { name: "행정망 PC" })).toBeVisible();
  await page.keyboard.press("Escape");

  // 방화벽만 남은 길이지만 거절한 망 짝이라 "망연계 필요 예상" 안내는 꺼져 있다. 가정에는 남는다.
  await openCard(page);
  await expect(page.getByRole("region", { name: "가정" })).toContainText("망연계 없음: 행정망 ↔ GCloud 인터넷망");
  await expect(cardWarnings(page)).toBeVisible();
  await expect(cardWarnings(page).getByText(LINK_EXPECTED, { exact: false })).toHaveCount(0);

  // 다음 대화 차례의 프롬프트에 그 망 짝의 no_link 가정이 들어간다.
  const marker = `확인-${uid()}`;
  await send(page, `고마워요 ${marker}`);
  // 구성을 바꾸지 않는 답이라 요약 줄은 없고 답만 온다.
  await expect(page.getByText("네, 알겠습니다.")).toBeVisible({ timeout: 30_000 });
  const prompt = (await received(request)).filter((m) => m.includes(`요청: 고마워요 ${marker}`)).pop();
  expect(prompt).toBeDefined();
  expect(prompt).toContain(`가정 "no_link:${ADMIN.zoneAdmin}--${ADMIN.zoneGcloud}"`);
});

test("기관 규칙이 다른 프로젝트에도: 망 지식에 넣은 규칙의 근거가 안내에 보인다", async ({ page }) => {
  await signup(page);
  await newProject(page, "첫 프로젝트");

  // 망 지식 화면에서 기관 규칙을 더한다.
  await page.getByRole("link", { name: "망 지식" }).first().click();
  await page.waitForURL(/\/network$/);
  await expect(page.getByRole("heading", { name: "망 지식", level: 1 })).toBeVisible();
  await page.getByRole("button", { name: "기관 규칙 추가" }).click();
  const form = page.getByRole("form", { name: "기관 규칙 추가" });
  await form.getByLabel("종류 하나").selectOption({ label: "행정망" });
  await form.getByLabel("다른 종류").selectOption({ label: "공공 클라우드 내부 영역" });
  await form.getByLabel("연결 방식").selectOption({ label: "망연계 필요" });
  await form.getByLabel("근거").fill("○○ 지침");
  await form.getByRole("button", { name: "저장" }).click();
  await expect(page.getByText("행정망 ↔ 공공 클라우드 내부 영역")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText("망연계 필요 · 근거: ○○ 지침")).toBeVisible();

  // 다른 프로젝트의 구성도: 두 망을 방화벽만으로 이은 그림에 기관 규칙 근거가 든 안내가 뜬다.
  await newProject(page, "다른 프로젝트");
  await send(page, "행정망 PC가 G-클라우드 업무존 WAS에 접속해");
  await expect(nodes(page)).toHaveCount(WORK_NODE_COUNT, { timeout: 30_000 });
  await expect(page.getByText(SUMMARY)).toBeVisible({ timeout: 30_000 });
  await openCard(page);
  const warning = cardWarnings(page).getByRole("button", { name: /등록한 기관 규칙\(○○ 지침\)에 따르면/ });
  await expect(warning).toBeVisible({ timeout: 15_000 });
  await expect(warning).toContainText(LINK_EXPECTED);
});
