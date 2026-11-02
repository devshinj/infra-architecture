import { expect, test } from "vitest";

import { copyName } from "@/server/projects";

test("복제 이름은 프로젝트 안에서 겹치지 않는 첫 ‘사본’ 번호를 쓴다", () => {
  expect(copyName("운영", ["운영"])).toBe("운영 사본");
  expect(copyName("운영", ["운영", "운영 사본"])).toBe("운영 사본 2");
  expect(copyName("운영", ["운영", "운영 사본", "운영 사본 2"])).toBe("운영 사본 3");
  // 대소문자만 다른 이름도 겹치는 것으로 본다.
  expect(copyName("Prod", ["prod 사본"])).toBe("Prod 사본 2");
});

test("복제 이름은 60자를 넘지 않게 원래 이름 쪽을 줄인다", () => {
  const long = "가".repeat(60);
  const first = copyName(long, [long]);
  expect(first).toHaveLength(60);
  expect(first.endsWith(" 사본")).toBe(true);
  const second = copyName(long, [long, first]);
  expect(second).toHaveLength(60);
  expect(second.endsWith(" 사본 2")).toBe(true);
});

const lone = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/;

test("줄일 때 이모지·결합 문자(ZWJ 묶음)를 반으로 쪼개지 않는다", () => {
  // 원래 이름 몫은 57칸(UTF-16). 56자 + 이모지(2칸)는 넘치므로 이모지를 통째로 뺀다.
  const a = copyName("가".repeat(56) + "\u{1F600}\u{1F600}", []);
  expect(a).toBe(`${"가".repeat(56)} 사본`);
  expect(lone.test(a)).toBe(false);
  // 가족 이모지(8칸)는 50자 뒤에 들어가지 않으므로 통째로 빠진다(코드 포인트로 자르면 일부만 남는다).
  const family = "\u{1F468}\u200D\u{1F469}\u200D\u{1F467}";
  const b = copyName("나".repeat(50) + family + family, []);
  expect(b).toBe(`${"나".repeat(50)} 사본`);
  // 들어갈 자리가 있으면 그대로 둔다.
  const c = copyName("다".repeat(40) + family + "라".repeat(20), []);
  expect(c.startsWith("다".repeat(40) + family)).toBe(true);
  expect(c.length).toBeLessThanOrEqual(60);
  expect(lone.test(c)).toBe(false);
});
