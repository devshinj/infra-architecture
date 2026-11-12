import { expect, test } from "vitest";

import { euro, eulReul, eunNeun, gwaWa, iGa } from "@/domain/josa";

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
  // 대문자로 끝나는 약어는 글자 이름: R(알)은 ㄹ 받침.
  expect(iGa("MongoDB")).toBe("MongoDB가");
  expect(euro("ELB-R")).toBe("ELB-R로");
});
