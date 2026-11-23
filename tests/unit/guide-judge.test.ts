import { describe, expect, test } from "vitest";

import { decideStep, findConflict, keywordMatch, looksLikeQuestion, normalizeUtterance, readEnv } from "@/domain/guides/judge";
import type { GuideStep } from "@/domain/guides/types";

const step = {
  id: "was",
  goal: "WAS 두 대 이중화",
  example: "WAS 두 대를 이중화해서 넣어 줘",
  keywords: [["was", "앱서버"], ["두대", "2대", "이중화"]],
  conflicts: [{ pattern: ["was", "세대"], reply: "이번에는 두 대로 합니다." }],
  commands: [],
  say: "",
  miss: "이번 단계는 WAS 두 대입니다.",
  explains: {},
} satisfies GuideStep;

describe("guide judge", () => {
  test("normalizeUtterance drops spaces and punctuation", () => expect(normalizeUtterance("WAS 두 대!")).toBe("was두대"));
  test("keywordMatch needs one hit per group", () => {
    expect(keywordMatch("앱 서버 2대 넣어줘", step.keywords)).toBe(true);
    expect(keywordMatch("WAS 넣어줘", step.keywords)).toBe(false);
    expect(keywordMatch("WAS 두 대", [])).toBe(false);
  });
  test("findConflict returns the reply of the first full pattern", () => {
    expect(findConflict("WAS 세 대", step)).toBe("이번에는 두 대로 합니다.");
    expect(findConflict("WAS 두 대", step)).toBeNull();
  });
  test("looksLikeQuestion", () => {
    expect(looksLikeQuestion("L4 가 뭐야?")).toBe(true);
    expect(looksLikeQuestion("차이를 알려 줘")).toBe(true);
    expect(looksLikeQuestion("DB 넣어 줘")).toBe(false);
  });
  test("conflict wins over clef", () =>
    expect(decideStep("WAS 세 대 넣어 줘", step, { match: 0.9, question: 0.1 })).toEqual({ kind: "conflict", reply: "이번에는 두 대로 합니다." }));
  test("a confident question beats a match", () => {
    expect(decideStep("WAS 가 뭐야?", step, { match: 0.7, question: 0.95 })).toEqual({ kind: "question" });
    expect(decideStep("WAS 두 대 넣어 줘", step, { match: 0.7, question: 0.5 })).toEqual({ kind: "match" });
  });
  test("clef match decides when present", () => {
    expect(decideStep("앱 서버를 이중으로", step, { match: 0.8, question: 0.1 })).toEqual({ kind: "match" });
    expect(decideStep("DB 넣어 줘", step, { match: 0.3, question: 0.2 })).toEqual({ kind: "miss" });
    expect(decideStep("WAS 가 뭐야?", step, { match: 0.2, question: 0.9 })).toEqual({ kind: "question" });
  });
  test("keywords rescue a request clef was unsure about", () => {
    // 카드의 예시 문장을 그대로 넣어도 Clef 확신도가 기준에 못 미치는 단계가 있다.
    expect(decideStep("WAS 두 대를 이중화해서 넣어 줘", step, { match: 0.38, question: 0.02 })).toEqual({ kind: "match" });
    // 키워드가 일부만 들어 있으면 그대로 안 맞음이다.
    expect(decideStep("WAS 넣어 줘", step, { match: 0.38, question: 0.02 })).toEqual({ kind: "miss" });
    // 질문은 키워드가 다 들어 있어도 질문이다.
    expect(decideStep("WAS 두 대는 왜 둬?", step, { match: 0.3, question: 0.7 })).toEqual({ kind: "question" });
  });
  test("keywords decide when clef is absent", () => {
    expect(decideStep("WAS 두 대 넣어 줘", step, { match: null, question: null })).toEqual({ kind: "match" });
    expect(decideStep("L4 가 뭐야?", step, { match: null, question: null })).toEqual({ kind: "question" });
    expect(decideStep("DB 넣어 줘", step, { match: null, question: null })).toEqual({ kind: "miss" });
  });
  test("readEnv reads one env or none", () => {
    expect(readEnv("온프레미스로 할게", ["onprem", "cloud"])).toBe("onprem");
    expect(readEnv("AWS 로", ["onprem", "cloud"])).toBe("cloud");
    expect(readEnv("둘 다 좋아", ["onprem", "cloud"])).toBeNull();
    // 환경이 하나뿐인 주제: 두 환경 낱말이 함께 나와도 그 환경이 들어 있으면 그쪽이다.
    expect(readEnv("자체 서버 없이 클라우드로", ["cloud"])).toBe("cloud");
    expect(readEnv("사내 메신저니까 클라우드로 할게", ["cloud"])).toBe("cloud");
    expect(readEnv("사내 말고 클라우드로", ["onprem", "cloud"])).toBeNull();
    expect(readEnv("온프렘이랑 클라우드 둘 다", ["onprem", "cloud"])).toBeNull();
    expect(readEnv("클라우드", ["onprem"])).toBeNull();
    expect(readEnv("네 시작할게요", ["cloud"])).toBe("cloud");
    expect(readEnv("클라우드가 뭐야?", ["cloud"])).toBeNull();
  });
});
