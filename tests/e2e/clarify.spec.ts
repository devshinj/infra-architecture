import { expect, test, type Page } from "@playwright/test";

import { FAKE_PORT } from "./fake-config";
import { S1_NODE_COUNT } from "./fake-llm";

const uid = () => Math.random().toString(36).slice(2, 8);
const PLACEHOLDER = "만들고 싶은 서비스나 바꾸고 싶은 점을 말해 주세요. 노드를 오른쪽 클릭하면 참조를 붙일 수 있어요.";
const DONE = /노드 \d+ · 연결 \d+ · \d+곳 바꿨어요/;
const REQUEST = "쇼핑몰에 화상회의 붙여 줘";
const nodes = (page: Page) => page.locator(".react-flow__node-infra");

async function setup(page: Page) {
  const name = `clr${uid()}`;
  await page.goto("/signup");
  await page.getByLabel("아이디").fill(name);
  await page.getByLabel("이메일").fill(`${name}@b.co`);
  await page.getByLabel("비밀번호").fill("password1");
  await page.getByRole("button", { name: "가입하기" }).click();
  await page.getByRole("button", { name: "새 프로젝트" }).click();
  await page.getByRole("dialog").getByLabel("이름").fill("되묻기 테스트");
  await page.getByRole("dialog").getByRole("button", { name: "만들기" }).click();
  await page.waitForURL(/\/p\/[^/]+\/d\/[^/]+/);
  await page.getByRole("tab", { name: "대화" }).click();
}

test("그리기 전에 되묻고, 고른 답으로 그린 뒤 가정으로 남긴다", async ({ page, request }) => {
  await setup(page);
  await page.getByPlaceholder(PLACEHOLDER).fill(REQUEST);
  await page.getByRole("button", { name: "보내기" }).click();

  // 환경과 통화 방식을 묻는다. 구성도는 그대로 비어 있고 요약 칩도 없다.
  const env = page.getByRole("group", { name: "어디에 올리는 구성인가요?" });
  const call = page.getByRole("group", { name: "실시간 영상·음성은 어떤 방식인가요?" });
  await expect(env).toBeVisible({ timeout: 15_000 });
  await expect(call).toBeVisible();
  await expect(nodes(page)).toHaveCount(0);
  await expect(page.getByText("요청을 반영하지 못했어요. 다시 말해 주세요.")).toHaveCount(0);
  const go = page.getByRole("button", { name: "이대로 그리기" });
  await expect(go).toBeDisabled();
  if (process.env.CLARIFY_SHOT) await page.screenshot({ path: process.env.CLARIFY_SHOT });

  await env.getByRole("radio", { name: "클라우드(AWS)" }).check();
  await expect(go).toBeDisabled();
  await call.getByRole("radio", { name: "알아서 정해 줘" }).check();
  await go.click();

  // 내 말풍선에는 고른 답 한 줄이 남고, 원래 요청으로 그린다.
  await expect(page.getByText("환경: 클라우드(AWS) · 통화 방식: 알아서 정해 줘", { exact: true })).toBeVisible();
  await expect(page.getByText(DONE)).toBeVisible({ timeout: 30_000 });
  await expect(nodes(page)).toHaveCount(S1_NODE_COUNT, { timeout: 30_000 });
  // 답한 카드는 더 고를 수 없다.
  await expect(go).toBeDisabled();

  // AI 가 받은 요청: 원래 글 뒤에 고른 것과 맡긴 것이 붙는다.
  const res = await request.get(`http://127.0.0.1:${FAKE_PORT}/e2e/received`);
  const sent = ((await res.json()) as { messages: string[] }).messages.findLast((m) => m.includes(REQUEST)) ?? "";
  expect(sent).toContain(`요청: ${REQUEST}\n\n사용자가 고른 것(그대로 따른다): 환경 = 클라우드(AWS)`);
  expect(sent).toContain("사용자가 맡긴 것(알맞게 정하고 set_assumption 으로 밝힌다): 통화 방식(key call_mode)");

  // 새로 고쳐도 지난 질문은 답한 모습으로 남고, 같은 요청을 다시 해도 묻지 않는다.
  await page.reload();
  await page.getByRole("tab", { name: "대화" }).click();
  await expect(page.getByRole("button", { name: "이대로 그리기" })).toBeDisabled();
  await page.getByPlaceholder(PLACEHOLDER).fill(REQUEST);
  await page.getByRole("button", { name: "보내기" }).click();
  await expect(page.getByText(DONE).last()).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole("button", { name: "이대로 그리기" })).toHaveCount(1);
});
