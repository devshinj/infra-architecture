import { describe, expect, test } from "vitest";

import { parseCommand } from "@/domain/commands";
import { GRADE_LABELS, GRADE_RULES, METHOD_LABELS, type NetworkKnowledge } from "@/domain/network";
import { NETWORK_TYPE_SEED } from "@/domain/network-seed";
import { COMMAND_EXAMPLES, DRAW_RULES, GUIDE_ONLY_LINES, KIND_BLOCK, networkGuideText, patternBlock } from "@/server/drawing/rules";
import { ATTR_LIST, SYSTEM_PROMPT } from "@/server/chat/prompt";

describe("그리기 규칙 공용 모듈", () => {
  test("Qwen 전용 줄은 공용 글에 없다", () => {
    for (const text of [DRAW_RULES, COMMAND_EXAMPLES]) {
      expect(text).not.toContain('"op":"say"');
      expect(text).not.toContain("JSON Lines");
      expect(text).not.toContain("warn 과 report_missing");
      expect(text).not.toContain("질문이면 명령 없이");
    }
  });

  test("섞였던 규칙도 공용 글에 있고 say 는 없다", () => {
    expect(DRAW_RULES).toContain("영역(그룹)의 이름·상위 영역은 바꿀 수 없다");
    expect(DRAW_RULES).toContain("하나도 빠뜨리지 말고");
    expect(DRAW_RULES).toContain("단계 edge 는 현재 구성");
    expect(DRAW_RULES).toContain("요청대로 그리고");
    expect(DRAW_RULES).toContain("label, sub, set_assumption 의 value 는 모두 한국어로");
    expect(DRAW_RULES).not.toContain("say");
  });

  test("COMMAND_EXAMPLES 의 명령 줄은 모두 parseCommand 를 통과한다", () => {
    const lines = COMMAND_EXAMPLES.split("\n").filter((l) => l.startsWith('{"op":'));
    expect(lines.length).toBeGreaterThan(10);
    // 설명용 자리표시(<KIND>, "영문-소문자-id" 등)만 진짜 값으로 바꿔 모양을 확인한다. 명령 모양은 parseCommand 가 판정한다.
    const placeholders: [string, string][] = [
      ["<GROUP_KIND>", "vpc"],
      ["e-<from>-<to>", "e-a-b"],
      ["<KIND>", "was"],
      ["<EDGE_KIND>", "request"],
      ["environment|scale|redundancy|deploy|replication|external", "scale"],
      ['"영문-소문자-id"', '"x-1"'],
      ['"상위 그룹 id 또는 null"', "null"],
      ['"그룹 id 또는 null"', "null"],
      ['"노드 또는 그룹 id"', '"x-1"'],
      ['"기존 노드 id"', '"x-1"'],
      ['"기존 연결 id"', '"x-1"'],
      ['"기존 영역 id"', '"x-1"'],
      ['"기존 흐름 id"', '"x-1"'],
      ['"새 영역 id"', '"x-1"'],
      ['"망 영역 id"', '"x-1"'],
      ['"망 종류 key 또는 null"', "null"],
    ];
    const real = (line: string) => placeholders.reduce((t, [from, to]) => t.replaceAll(from, to), line);
    for (const line of lines) {
      const r = parseCommand(JSON.parse(real(line)));
      expect(r.ok, line).toBe(true);
    }
  });

  test("SYSTEM_PROMPT 가 공용 조각을 모두 포함한다", () => {
    expect(SYSTEM_PROMPT).toContain(COMMAND_EXAMPLES);
    expect(SYSTEM_PROMPT).toContain(KIND_BLOCK);
    expect(SYSTEM_PROMPT).toContain(patternBlock());
    expect(KIND_BLOCK).toContain(ATTR_LIST);
    // Qwen 전용 줄이 사이에 끼어 있어 DRAW_RULES 는 줄 단위로, 순서대로 들어 있다.
    let at = 0;
    const guideOnly: string[] = Object.values(GUIDE_ONLY_LINES);
    for (const line of DRAW_RULES.split("\n").filter((l) => !guideOnly.includes(l))) {
      const i = SYSTEM_PROMPT.indexOf(line, at);
      expect(i, line).toBeGreaterThanOrEqual(at);
      at = i + line.length;
    }
  });

  // 안내 전용 줄은 Qwen 원래 줄에서 say 부분만 뺀 글이다. 한쪽 규칙만 고치면 여기서 깨진다.
  test("안내 전용 줄은 Qwen 원래 줄과 say 부분만 다르다", () => {
    const promptLine = (start: string) => {
      const line = SYSTEM_PROMPT.split("\n").find((l) => l.startsWith(start));
      expect(line, start).toBeDefined();
      return line!;
    };

    const pairQwen = promptLine('- "망 짝 규칙"이 보통 잇지 않음인');
    const QWEN_TAIL = "say 로 한 줄 알린다.";
    const GUIDE_TAIL = "사용자에게 알린다.";
    expect(pairQwen.endsWith(QWEN_TAIL)).toBe(true);
    expect(GUIDE_ONLY_LINES.unlinkedPair.endsWith(GUIDE_TAIL)).toBe(true);
    expect(GUIDE_ONLY_LINES.unlinkedPair.slice(0, -GUIDE_TAIL.length)).toBe(pairQwen.slice(0, -QWEN_TAIL.length));

    const koreanQwen = promptLine("- label, sub, say, set_assumption 의 value");
    expect(GUIDE_ONLY_LINES.koreanText).toBe(koreanQwen.replace("label, sub, say, ", "label, sub, "));
  });

  test("networkGuideText 는 망 종류·등급 표를 담고 종류 설명은 담지 않는다", () => {
    const k: NetworkKnowledge = { types: Object.fromEntries(NETWORK_TYPE_SEED.map((t) => [t.key, t])), rules: [] };
    const text = networkGuideText(k);
    for (const t of NETWORK_TYPE_SEED) {
      expect(text).toContain(t.key);
      expect(text).toContain(t.name);
      expect(text).toContain(`등급=${GRADE_LABELS[t.grade]}`);
      expect(text).not.toContain(t.description);
    }
    expect(GRADE_RULES).toHaveLength(7);
    for (const r of GRADE_RULES) {
      const line = `${GRADE_LABELS[r.a]} -- ${r.b === "*" ? "모든 등급" : GRADE_LABELS[r.b]}: ${METHOD_LABELS[r.method]}`;
      expect(text).toContain(line);
    }
    expect(text).toContain("기관 규칙:\n없음");
  });
});
