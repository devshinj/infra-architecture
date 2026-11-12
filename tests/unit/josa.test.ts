import { expect, test } from "vitest";

import { euro, eulReul, eunNeun, fixLegacyJosa, gwaWa, iGa } from "@/domain/josa";

test("Korean names follow the final consonant", () => {
  expect(iGa("관리자 앱")).toBe("관리자 앱이");
  expect(iGa("웹 서버")).toBe("웹 서버가");
  expect(eulReul("방화벽")).toBe("방화벽을");
  expect(eulReul("NAT 게이트웨이")).toBe("NAT 게이트웨이를");
  expect(euro("방화벽")).toBe("방화벽으로");
  expect(euro("서울")).toBe("서울로");
  expect(euro("오른쪽")).toBe("오른쪽으로");
  expect(euro("위")).toBe("위로");
  expect(eunNeun("이름")).toBe("이름은");
});

test("digits are read aloud (일·이·삼…, 10 십)", () => {
  expect(gwaWa("v2")).toBe("v2와");
  expect(gwaWa("v3")).toBe("v3과");
  expect(gwaWa("v10")).toBe("v10과");
  expect(iGa("API #1")).toBe("API #1이");
  expect(iGa("WAS #2")).toBe("WAS #2가");
  expect(euro("WAS #1")).toBe("WAS #1로");
  expect(euro("WAS #3")).toBe("WAS #3으로");
  expect(euro("v20")).toBe("v20으로");
  // 되돌리기 기록 줄: "v10으로 되돌림", "v6으로", "v8로"(팔), "v2로"(이).
  expect(euro("v10")).toBe("v10으로");
  expect(euro("v6")).toBe("v6으로");
  expect(euro("v8")).toBe("v8로");
  expect(euro("v2")).toBe("v2로");
});

test("Latin names: L·M·N ends take the consonant form, others the vowel form", () => {
  expect(iGa("ALB")).toBe("ALB가");
  expect(iGa("RDS MySQL")).toBe("RDS MySQL이");
  expect(euro("RDS MySQL")).toBe("RDS MySQL로");
  expect(iGa("Redis")).toBe("Redis가");
  expect(iGa("Kafka Stream")).toBe("Kafka Stream이");
  expect(iGa("DB (주)")).toBe("DB (주)가");
  // 낱말로 끝나면 소리로: 앱·웹·언은 받침, 스·트·서는 받침 없음.
  expect(iGa("Admin App")).toBe("Admin App이");
  expect(iGa("Web")).toBe("Web이");
  expect(iGa("Bastion")).toBe("Bastion이");
  expect(iGa("Load Balancer")).toBe("Load Balancer가");
  expect(iGa("API Client")).toBe("API Client가");
  expect(euro("Ingress Controlling")).toBe("Ingress Controlling으로");
  // 짧은 모음 뒤 p·b·k·c·t 는 받침, 앞이 자음이거나 긴 모음(t)이면 받침 없음.
  expect(iGa("Tomcat")).toBe("Tomcat이");
  expect(iGa("Slack Bot")).toBe("Slack Bot이");
  expect(iGa("Network")).toBe("Network가");
  expect(iGa("Spring Boot")).toBe("Spring Boot가");
  expect(iGa("Disk")).toBe("Disk가");
  expect(iGa("Mac")).toBe("Mac이");
  expect(iGa("Webhook")).toBe("Webhook이");
  expect(iGa("Log")).toBe("Log가");
  // 대문자로 끝나는 약어는 글자 이름: R(알)은 ㄹ 받침.
  expect(iGa("MongoDB")).toBe("MongoDB가");
  expect(euro("ELB-R")).toBe("ELB-R로");
});

test("fixLegacyJosa: 예전에 저장된 '이(가)'류와 되돌리기 기록을 보일 때 고친다", () => {
  expect(fixLegacyJosa("웹 서버이(가) 인터넷에 바로 열려 있어요")).toBe("웹 서버가 인터넷에 바로 열려 있어요");
  expect(fixLegacyJosa("관리자 앱이(가) DB을(를) 직접 불러요")).toBe("관리자 앱이 DB를 직접 불러요");
  expect(fixLegacyJosa("노드 API #1 이(가) 없어요")).toBe("노드 API #1이 없어요");
  expect(fixLegacyJosa("방화벽(으)로 가요, 서울(으)로 가요")).toBe("방화벽으로 가요, 서울로 가요");
  expect(fixLegacyJosa("Redis은(는) 캐시, v2과(와) 비교")).toBe("Redis는 캐시, v2와 비교");
  expect(fixLegacyJosa("v6로 되돌림 (새 버전 v9)")).toBe("v6으로 되돌림 (새 버전 v9)");
  expect(fixLegacyJosa("v8로 되돌림 (새 버전 v9)")).toBe("v8로 되돌림 (새 버전 v9)");
  expect(fixLegacyJosa("이미 맞는 문장이에요")).toBe("이미 맞는 문장이에요");
});
