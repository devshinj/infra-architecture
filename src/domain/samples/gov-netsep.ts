import { assume, edge, flow, group, node, zoneType, type Sample } from "./dsl";

const SERVER = { os: "Rocky Linux 9", cpu: "8 Core", ram: "16GB", disk: "200GB", hostname: null, ip: null };
const DB = { sw: "Tibero 7", version: "7", cpu: "16 Core", ram: "64GB", ip: null };
const API = { payload: "api", direction: "two_way" } as const;

/**
 * 공공기관 망분리. 민원은 DMZ 포털에서 망연계 솔루션을 거쳐 업무망으로 들어가고,
 * 인터넷 PC 와 업무 PC 사이 자료는 망연계로만 옮긴다.
 * 업무 WAS 가 문자 발송 API 로 망을 바로 넘는 연결이 있어 경고가 남는다(의도된 경고).
 */
export const GOV_NETSEP: Sample = {
  id: "gov-netsep",
  title: "공공기관 망분리",
  commands: [
    assume("environment", "사내 IDC"),
    assume("redundancy", "포털 WEB·업무 WAS 는 2대, DB 는 Active-Standby"),

    group("inet", "network_zone", "인터넷망"),
    group("dmz", "network_zone", "DMZ"),
    group("web-vip", "redundancy_group", "포털 WEB VIP", "dmz"),
    group("biz", "network_zone", "업무망"),
    group("was-vip", "redundancy_group", "업무 WAS VIP", "biz"),
    group("db-ha", "redundancy_group", "DB VIP", "biz"),
    group("ext", "external_service", "외부 서비스"),
    zoneType("inet", "agency-internet"),
    zoneType("dmz", "dmz"),
    zoneType("biz", "business-net"),

    node("citizen", "client_web", "민원인", null),
    node("inet-pc", "client_web", "인터넷 PC", "inet", "직원 인터넷용"),
    node("fw-ext", "firewall", "외부 방화벽", "dmz", undefined, { port: "443", rules: "인터넷 → 포털 443 만 허용", vip: null }),
    node("web-1", "web_server", "포털 WEB #1", "web-vip", "Nginx", { ...SERVER, sw: "Nginx 1.26" }),
    node("web-2", "web_server", "포털 WEB #2", "web-vip", "Nginx", { ...SERVER, sw: "Nginx 1.26" }),
    node("link", "network_link", "망연계 솔루션", "dmz", "자료 전송·API 중계", { sw: null }),
    node("biz-pc", "client_web", "업무 PC", "biz", "직원 업무용"),
    node("fw-int", "firewall", "업무망 방화벽", "biz", undefined, { port: "8080", rules: "업무 PC → 업무 WAS 만 허용", vip: null }),
    node("was-1", "was", "업무 WAS #1", "was-vip", "JEUS 8", { ...SERVER, sw: "JEUS 8" }),
    node("was-2", "was", "업무 WAS #2", "was-vip", "JEUS 8", { ...SERVER, sw: "JEUS 8" }),
    node("db-active", "db_rdb", "업무 DB Active", "db-ha", "Tibero 7", { ...DB, replication: "TSC 동기(주)" }),
    node("db-standby", "db_rdb", "업무 DB Standby", "db-ha", "Tibero 7", { ...DB, replication: "TSC 동기(대기)" }),
    node("sms", "external_api", "문자 발송 API", "ext", undefined, { integration: "REST API" }),

    edge("citizen", "fw-ext", "request", "HTTPS 443", API),
    edge("fw-ext", "web-1", "request", "HTTPS 443"),
    edge("fw-ext", "web-2", "request", "HTTPS 443"),
    edge("web-1", "link", "request", "민원 전달 API"),
    edge("web-2", "link", "request", "민원 전달 API"),
    edge("link", "was-1", "request", "민원 전달 API", API),
    edge("link", "was-2", "request", "민원 전달 API", API),
    edge("inet-pc", "link", "request", "자료 반입", { payload: "file", direction: "one_way" }),
    edge("link", "biz-pc", "request", "자료 반입", { payload: "file", direction: "one_way" }),
    edge("biz-pc", "fw-int", "request", "HTTPS 8080"),
    edge("fw-int", "was-1", "request", "HTTP 8080"),
    edge("fw-int", "was-2", "request", "HTTP 8080"),
    edge("was-1", "db-active", "request", "Tibero 8629"),
    edge("was-2", "db-active", "request", "Tibero 8629"),
    edge("db-active", "db-standby", "replication", "TSC 동기 복제"),
    edge("was-1", "sms", "request", "처리 결과 문자 HTTPS", API),

    flow("civil-apply", "민원 신청", "user", "민원인이 포털에서 민원을 신청한다.", "접수 번호를 민원인에게 돌려준다.", [
      ["citizen", "fw-ext", "신청", "민원인이 외부 방화벽을 거쳐 포털로 들어온다."],
      ["fw-ext", "web-1", "포털", "포털 WEB 이 신청서를 받는다."],
      ["web-1", "link", "망연계", "포털이 민원 내용을 망연계 솔루션에 넘긴다."],
      ["link", "was-1", "업무망 전달", "망연계 솔루션이 검사한 민원을 업무 WAS 로 전달한다."],
      ["was-1", "db-active", "접수 저장", "업무 WAS 가 민원을 업무 DB 에 저장한다."],
    ]),
    flow("file-in", "자료 반입", "user", "직원이 인터넷 PC 의 파일을 업무 PC 로 옮긴다.", "검사를 통과한 파일만 업무 PC 에 도착한다.", [
      ["inet-pc", "link", "반입 신청", "인터넷 PC 에서 망연계 솔루션으로 파일을 올린다."],
      ["link", "biz-pc", "반입", "악성코드 검사를 통과한 파일을 업무 PC 로 보낸다."],
    ]),
  ],
};
