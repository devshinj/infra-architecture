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
