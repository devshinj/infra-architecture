import { readFile } from "node:fs/promises";

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

/** `이미지로 내보내기` 메뉴에서 한 항목을 골라 내려받은 파일을 돌려준다. */
async function exportAs(page: Page, item: string) {
  await page.getByRole("button", { name: "이미지로 내보내기" }).click();
  const menu = page.getByRole("menu", { name: "이미지로 내보내기" });
  await expect(menu).toBeVisible();
  const download = page.waitForEvent("download", { timeout: 60_000 });
  await menu.getByRole("menuitem", { name: item }).click();
  const d = await download;
  const path = await d.path();
  const body = await readFile(path);
  await expect(page.getByRole("status").filter({ hasText: "이미지를 저장했어요." })).toBeVisible();
  return { name: d.suggestedFilename(), body };
}

const pngSize = (b: Buffer) => ({ width: b.readUInt32BE(16), height: b.readUInt32BE(20) });

test("구성도를 PNG·SVG, 어두운·흰 바탕으로 내보낸다", async ({ page }) => {
  await signup(page, `exp${uid()}`);
  await newProject(page, "쇼핑몰");

  // 빈 구성도: 내보내기는 막혀 있고 까닭을 알려 준다.
  const trigger = page.getByRole("button", { name: "이미지로 내보내기" });
  await expect(trigger).toBeDisabled();
  await expect(trigger).toHaveAttribute("title", /비어 있어/);

  await importSample(page, "IDC WEB-WAS-DB 이중화");
  await expect(page.locator(".react-flow__node-infra")).toHaveCount(9);
  await expect(trigger).toBeEnabled();
  // 노드를 골라 흐림·강조가 있는 화면에서 내보내도 그림은 평상시 모습이다(화면은 그대로 남는다).
  await page.getByTitle("WAS#1").click();
  await expect(page.locator(".edge--dim").first()).toBeAttached();

  // Esc 로 닫힌다.
  await trigger.click();
  await expect(page.getByRole("menu", { name: "이미지로 내보내기" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("menu", { name: "이미지로 내보내기" })).toHaveCount(0);
  await expect(trigger).toBeFocused();

  const darkPng = await exportAs(page, "PNG 어두운 바탕(화면과 같음)");
  expect(darkPng.name).toBe("쇼핑몰-새 구성도.png");
  expect(darkPng.body.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
  expect(darkPng.body.length).toBeGreaterThan(20_000);
  // 구성도 전체(화면 크기와 상관없음)를 2배 해상도로 담는다.
  expect(pngSize(darkPng.body).width).toBeGreaterThan(600);

  const lightPng = await exportAs(page, "PNG 흰 바탕(문서용)");
  expect(lightPng.name).toBe("쇼핑몰-새 구성도.png");
  expect(lightPng.body.length).toBeGreaterThan(20_000);
  expect(pngSize(lightPng.body)).toEqual(pngSize(darkPng.body));
  expect(lightPng.body.equals(darkPng.body)).toBe(false);

  const darkSvg = await exportAs(page, "SVG 어두운 바탕(화면과 같음)");
  expect(darkSvg.name).toBe("쇼핑몰-새 구성도.svg");
  const darkText = darkSvg.body.toString("utf8");
  expect(darkText.startsWith("<svg")).toBe(true);
  expect(darkText).toContain("WAS#1");
  expect(darkText).toContain("@font-face");
  expect(darkText).toContain("rgb(27, 38, 56)");

  const lightSvg = await exportAs(page, "SVG 흰 바탕(문서용)");
  expect(lightSvg.name).toBe("쇼핑몰-새 구성도.svg");
  const lightText = lightSvg.body.toString("utf8");
  expect(lightText).toContain("WAS#1");
  expect(lightText).toContain("rgb(255, 255, 255)");
  // 화면 장치(배지·접기 버튼·말풍선)와 움직임 겹선은 그림에 없다.
  for (const t of [lightText, darkText]) {
    expect(t).not.toContain("node__badge");
    expect(t).not.toContain("group__toggle");
    expect(t).not.toContain("motion-path");
  }

  // 화면은 흰 바탕으로 바뀌지 않았고 선택도 그대로다.
  const bg = await page.locator(".canvas").evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(bg).toBe("rgb(27, 38, 56)");
  await expect(page.locator(".node--selected")).toHaveCount(1);
  await expect(page.locator(".export-stage")).toHaveCount(0);
});
