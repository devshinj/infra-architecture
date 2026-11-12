import { describe, expect, test } from "vitest";

import { applyCommands } from "@/domain/apply";
import { ASSUMPTION_CHOICES, ASSUMPTION_LABELS } from "@/domain/assumptions";
import { choiceValue, choicesNote, choicesSummary, CLARIFY_AUTO, CLARIFY_AUTO_VALUE, CLARIFY_MAX, detectForks, validChoices } from "@/domain/clarify";
import type { Command } from "@/domain/commands";
import { emptyState } from "@/domain/types";

const keys = (text: string, state = emptyState()) => detectForks(text, state).map((q) => q.key);
const build = (cmds: Command[]) => applyCommands(emptyState(), cmds).state;
const drawn = () => build([{ op: "add_node", id: "was", kind: "was", label: "WAS", parent: null }]);

describe("detectForks", () => {
  test("환경: 빈 구성도에 서비스 전체를 그릴 때만, 환경을 말하지 않았을 때 묻는다", () => {
    expect(keys("쇼핑몰 서비스 구성도 그려 줘")).toEqual(["environment"]);
    expect(keys("AWS 에 쇼핑몰 서비스 구성도 그려 줘")).toEqual([]);
    expect(keys("사내 IDC 에 올릴 인사 시스템 그려 줘")).toEqual([]);
    // 노드 하나 넣는 요청, 이미 그린 구성도에는 묻지 않는다.
    expect(keys("웹서버 하나 그려 줘")).toEqual([]);
    expect(keys("쇼핑몰 서비스 구성도 그려 줘", drawn())).toEqual([]);
  });

  test("통화 방식: 화상·음성 통화가 나왔는데 방식이 없을 때", () => {
    expect(keys("화상회의 기능을 붙여 줘", drawn())).toEqual(["call_mode"]);
    expect(keys("WebRTC 로 상담 통화를 넣어 줘", drawn())).toEqual(["call_mode"]);
    expect(keys("1:1 화상 상담을 넣어 줘", drawn())).toEqual([]);
    expect(keys("100명이 들어오는 화상회의를 넣어 줘", drawn())).toEqual([]);
    expect(keys("SFU 로 화상회의를 넣어 줘", drawn())).toEqual([]);
  });

  test("LLM 위치: LLM·챗봇·에이전트가 나왔는데 외부/사내가 없을 때", () => {
    expect(keys("챗봇을 붙여 줘", drawn())).toEqual(["llm_serving"]);
    expect(keys("AI 에이전트가 주문 DB 를 조회하게 해 줘", drawn())).toEqual(["llm_serving"]);
    expect(keys("OpenAI 로 챗봇을 붙여 줘", drawn())).toEqual([]);
    expect(keys("사내 GPU 서버에 vLLM 을 띄워 챗봇을 붙여 줘", drawn())).toEqual([]);
  });

  test("관제 대상·기기 연결·망분리", () => {
    expect(keys("CCTV 20대를 관제 화면까지 이어 줘", drawn())).toEqual(["video_site"]);
    expect(keys("공장 CCTV 20대를 관제 화면까지 이어 줘", drawn())).toEqual([]);
    expect(keys("온도 센서 데이터를 서버로 모아 줘", drawn())).toEqual(["iot_link"]);
    expect(keys("온도 센서 데이터를 게이트웨이로 모아 줘", drawn())).toEqual([]);
    expect(keys("앱이랑 디바이스를 블루투스로 연결해 줘", drawn())).toEqual([]);
    expect(keys("업무망이랑 인터넷망을 나눠 그려 줘", drawn())).toEqual(["net_separation"]);
    expect(keys("은행 업무망이랑 인터넷망을 나눠 그려 줘", drawn())).toEqual([]);
    expect(keys("업무망이랑 인터넷망 사이에 망연계 넣어 줘", drawn())).toEqual([]);
  });

  test("이미 가정이 있거나 구성도에 그 종류가 있으면 다시 묻지 않는다", () => {
    const assumed = build([{ op: "set_assumption", key: "llm_serving", value: "외부 LLM API" }]);
    expect(keys("챗봇을 붙여 줘", assumed)).toEqual([]);
    const hasModel = build([{ op: "add_node", id: "m", kind: "model_server", label: "모델 서버", parent: null }]);
    expect(keys("챗봇을 하나 더 붙여 줘", hasModel)).toEqual([]);
    const hasCamera = build([{ op: "add_node", id: "c", kind: "camera", label: "카메라", parent: null }]);
    expect(keys("CCTV 를 10대 더 넣어 줘", hasCamera)).toEqual([]);
    const zoned = build([{ op: "add_group", id: "biz", group_kind: "network_zone", label: "업무망", parent: null }]);
    expect(keys("업무망에서 인터넷으로 나가는 길을 그려 줘", zoned)).toEqual([]);
  });

  test("한 번에 최대 개수까지만, 정해 둔 차례로 묻고 이름·선택지는 가정 목록에서 온다", () => {
    const qs = detectForks("화상회의랑 챗봇이랑 CCTV 관제랑 센서까지 있는 서비스 구성도 그려 줘", emptyState());
    expect(qs).toHaveLength(CLARIFY_MAX);
    expect(qs.map((q) => q.key)).toEqual(["environment", "call_mode", "llm_serving"]);
    for (const q of qs) {
      expect(q.label).toBe(ASSUMPTION_LABELS[q.key]);
      expect(q.choices).toEqual(ASSUMPTION_CHOICES[q.key]);
      expect(q.choices.length).toBeGreaterThanOrEqual(2);
      expect(q.choices).not.toContain(CLARIFY_AUTO);
    }
  });

  test("갈림길과 관계없는 요청에는 아무것도 묻지 않는다", () => {
    expect(keys("WAS 를 2대로 이중화해 줘", drawn())).toEqual([]);
    expect(keys("DB 앞에 방화벽 넣어 줘", drawn())).toEqual([]);
  });
});

describe("고른 답 다루기", () => {
  test("validChoices 는 아는 key·아는 값만 남긴다", () => {
    expect(
      validChoices({ call_mode: "다자간(미디어 서버 경유)", llm_serving: CLARIFY_AUTO, video_site: "우주 정거장", hacked: "x", iot_link: 3 }),
    ).toEqual({ call_mode: "다자간(미디어 서버 경유)", llm_serving: CLARIFY_AUTO });
    for (const bad of [undefined, null, "x", ["call_mode"], 3]) expect(validChoices(bad)).toEqual({});
  });

  test("맡긴 답은 가정에 '알아서 정함'으로 남고, 요약·AI 안내 글에 구분해 적힌다", () => {
    const choices = { call_mode: "다자간(미디어 서버 경유)", llm_serving: CLARIFY_AUTO };
    expect(choiceValue(choices.call_mode)).toBe("다자간(미디어 서버 경유)");
    expect(choiceValue(CLARIFY_AUTO)).toBe(CLARIFY_AUTO_VALUE);
    expect(choicesSummary(choices)).toBe("통화 방식: 다자간(미디어 서버 경유) · LLM 위치: 알아서 정해 줘");
    expect(choicesNote(choices)).toBe(
      "사용자가 고른 것(그대로 따른다): 통화 방식 = 다자간(미디어 서버 경유)\n사용자가 맡긴 것(알맞게 정하고 set_assumption 으로 밝힌다): LLM 위치(key llm_serving)",
    );
    expect(choicesNote({ llm_serving: "외부 LLM API" })).toBe("사용자가 고른 것(그대로 따른다): LLM 위치 = 외부 LLM API");
  });
});
