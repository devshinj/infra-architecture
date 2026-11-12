import { describe, expect, test } from "vitest";

import { normalizeTerm } from "@/domain/explain";
import { glossaryBlock, GLOSSARY_MATCH_MAX, matchGlossaryTerms, type MatchEntry } from "@/domain/glossaryMatch";
import { GLOSSARY_SEED } from "@/domain/glossary-seed";
import { emptyState } from "@/domain/types";
import { buildAskMessages, buildMessages } from "@/server/chat/prompt";

const entry = (term: string, aliases: string[] = [], definition = `${term} 정의.`): MatchEntry => ({ key: normalizeTerm(term), aliases: aliases.map(normalizeTerm), term, definition });
const SEED: MatchEntry[] = GLOSSARY_SEED.map((e) => ({ key: normalizeTerm(e.term), aliases: e.aliases, term: e.term, definition: e.definition }));
const terms = (text: string, entries: MatchEntry[] = SEED) => matchGlossaryTerms(text, entries).map((t) => t.term);

describe("matchGlossaryTerms", () => {
  test("표제어와 별칭을 찾고, 조사가 붙어도 찾는다", () => {
    const es = [entry("SFU", ["선택적 전달 장치"]), entry("TURN")];
    expect(terms("SFU가 뭐야?", es)).toEqual(["SFU"]);
    expect(terms("선택적 전달 장치랑 turn 차이 알려 줘", es)).toEqual(["SFU", "TURN"]);
  });

  test("공백·하이픈을 무시하고 찾는다", () => {
    const es = [entry("API 게이트웨이"), entry("Active/Standby")];
    expect(terms("api게이트웨이 앞에 뭐가 있어?", es)).toEqual(["API 게이트웨이"]);
    expect(terms("active-standby 로 묶어 줘", es)).toEqual(["Active/Standby"]);
  });

  test("영문·숫자 이름은 다른 영문·숫자에 붙어 있으면 치지 않는다", () => {
    const es = [entry("WAS"), entry("S3"), entry("NAT")];
    expect(terms("wasabi 스토리지와 s3x 를 native 로 붙여 줘", es)).toEqual([]);
    expect(terms("WAS 2대와 S3, NAT를 넣어 줘", es)).toEqual(["WAS", "S3", "NAT"]);
  });

  test("긴 이름을 먼저 잡고 그 안의 짧은 이름은 버린다", () => {
    const es = [entry("게이트웨이"), entry("API 게이트웨이"), entry("LLM 게이트웨이")];
    expect(terms("API 게이트웨이 뒤에 LLM 게이트웨이를 둬", es)).toEqual(["API 게이트웨이", "LLM 게이트웨이"]);
    expect(terms("게이트웨이가 뭐야", es)).toEqual(["게이트웨이"]);
  });

  test("한 글자 이름은 찾지 않고, 나온 차례로 최대 개수만 준다", () => {
    expect(terms("큐", [entry("큐")])).toEqual([]);
    const many = Array.from({ length: 10 }, (_, i) => entry(`용어${String.fromCharCode(0xac00 + i)}`));
    const text = many.map((e) => e.term).reverse().join(" ");
    const got = terms(text, many);
    expect(got).toHaveLength(GLOSSARY_MATCH_MAX);
    expect(got[0]).toBe(many[9].term);
  });

  test("기본 제공 사전으로: 새 분야 용어를 찾고, 용어가 없는 말에는 아무것도 붙지 않는다", () => {
    expect(terms("SFU랑 TURN 서버 차이가 뭐야?")).toEqual(expect.arrayContaining(["SFU", "TURN"]));
    expect(terms("카메라 영상을 RTSP 로 받아서 VLM 으로 분석하고 싶어")).toEqual(expect.arrayContaining(["RTSP", "VLM"]));
    expect(terms("앱이랑 밴드를 BLE로 연결해 줘")).toContain("BLE");
    expect(terms("안녕하세요, 오늘 뭐 하면 좋을까요?")).toEqual([]);
    expect(terms("이거 왼쪽으로 옮겨 줘")).toEqual([]);
  });
});

describe("프롬프트에 붙는 용어 사전 글", () => {
  const found = [{ term: "SFU", definition: "SFU는 받은 미디어를 그대로 나눠 주는 서버입니다." }];

  test("용어가 없으면 빈 문자열", () => {
    expect(glossaryBlock([])).toBe("");
  });

  test("구성도 대화: 참조 노드 앞에 들어가고, 없으면 프롬프트가 그대로다", () => {
    const base = { intent: "question" as const, text: "SFU가 뭐야?", state: emptyState(), mentions: [], history: [] };
    const withTerms = buildMessages({ ...base, terms: found }).at(-1)!.content;
    expect(withTerms).toContain("용어 사전(요청에 나온 말의 뜻. 이 말을 설명할 때는 이 뜻을 따른다):\n- SFU: SFU는 받은 미디어를 그대로 나눠 주는 서버입니다.\n\n참조 노드:");
    const without = buildMessages(base).at(-1)!.content;
    expect(without).not.toContain("용어 사전(");
    expect(buildMessages({ ...base, terms: [] }).at(-1)!.content).toBe(without);
  });

  test("노드 질문: 질문 앞에 들어간다", () => {
    const state = emptyState();
    state.nodes.sfu = { id: "sfu", kind: "media_server", label: "SFU", parent: null, attrs: {} };
    const msg = buildAskMessages({ state, nodeId: "sfu", history: [], text: "TURN이랑 뭐가 달라?", terms: found }).at(-1)!.content;
    expect(msg).toContain("- SFU: SFU는 받은 미디어를 그대로 나눠 주는 서버입니다.\n\n질문: TURN이랑 뭐가 달라?");
    expect(buildAskMessages({ state, nodeId: "sfu", history: [], text: "TURN이랑 뭐가 달라?" }).at(-1)!.content).not.toContain("용어 사전(");
  });
});
