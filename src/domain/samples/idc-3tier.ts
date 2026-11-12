import { assume, edge, flow, group, node, type Sample } from "./dsl";

const SERVER = { os: "Rocky Linux 9", cpu: "8 Core", ram: "16GB", disk: "200GB", hostname: null, ip: null };
const DB = { sw: "Oracle 19c", version: "19c", cpu: "16 Core", ram: "64GB", ip: null };

/** 사내 IDC 의 WEB-WAS-DB 이중화. DB 중계 서버만 1대라 경고가 남는다(의도된 경고). */
export const IDC_3TIER: Sample = {
  id: "idc-3tier",
  title: "IDC WEB-WAS-DB 이중화",
  commands: [
    assume("environment", "사내 IDC"),
    assume("redundancy", "WEB·WAS 는 Active-Active, DB 는 Active-Standby"),
    assume("replication", "Oracle Data Guard 동기 복제"),

    group("idc", "idc", "본사 IDC"),
    group("dmz", "dmz", "DMZ", "idc"),
    group("l4-vip", "redundancy_group", "L4 VIP", "dmz"),
    group("web-vip", "redundancy_group", "WEB VIP", "dmz"),
    group("inner", "onprem_zone", "내부 구역", "idc"),
    group("was-vip", "redundancy_group", "WAS VIP", "inner"),
    group("db-ha", "redundancy_group", "DB VIP", "inner"),

    node("user", "client_web", "사용자", null),
    node("fw-ext", "firewall", "외부 방화벽", "dmz", undefined, { port: "443", rules: "인터넷 → L4 VIP 443 만 허용", vip: null }),
    node("l4-1", "lb_l4", "L4 #1", "l4-vip", "Active", { port: "443", rules: "WEB 묶음으로 분산", vip: null }),
    node("l4-2", "lb_l4", "L4 #2", "l4-vip", "Standby", { port: "443", rules: "WEB 묶음으로 분산", vip: null }),
    node("web-1", "web_server", "WEB #1", "web-vip", "Apache 2.4", { ...SERVER, sw: "Apache 2.4" }),
    node("web-2", "web_server", "WEB #2", "web-vip", "Apache 2.4", { ...SERVER, sw: "Apache 2.4" }),
    node("fw-int", "firewall", "내부 방화벽", "inner", undefined, { port: "8009", rules: "WEB → WAS AJP 만 허용", vip: null }),
    node("was-1", "was", "WAS #1", "was-vip", "Tomcat 10", { ...SERVER, sw: "Tomcat 10" }),
    node("was-2", "was", "WAS #2", "was-vip", "Tomcat 10", { ...SERVER, sw: "Tomcat 10" }),
    node("db-proxy", "db_proxy", "DB 중계 서버", "inner", "DB 접근 제어", { sw: null, version: null, cpu: "4 Core", ram: "8GB", ip: null, replication: null }),
    node("db-active", "db_rdb", "DB Active", "db-ha", "Oracle 19c", { ...DB, replication: "Data Guard 동기(주)" }),
    node("db-standby", "db_rdb", "DB Standby", "db-ha", "Oracle 19c", { ...DB, replication: "Data Guard 동기(대기)" }),

    edge("user", "fw-ext", "request", "HTTPS 443"),
    edge("fw-ext", "l4-1", "request", "HTTPS 443"),
    edge("fw-ext", "l4-2", "request", "HTTPS 443"),
    edge("l4-1", "web-1", "request", "HTTP 80"),
    edge("l4-1", "web-2", "request", "HTTP 80"),
    edge("l4-2", "web-1", "request", "HTTP 80"),
    edge("l4-2", "web-2", "request", "HTTP 80"),
    edge("web-1", "fw-int", "request", "AJP 8009"),
    edge("web-2", "fw-int", "request", "AJP 8009"),
    edge("fw-int", "was-1", "request", "AJP 8009"),
    edge("fw-int", "was-2", "request", "AJP 8009"),
    edge("was-1", "db-proxy", "request", "Oracle 1521"),
    edge("was-2", "db-proxy", "request", "Oracle 1521"),
    edge("db-proxy", "db-active", "request", "Oracle 1521"),
    edge("db-active", "db-standby", "replication", "Data Guard"),

    flow("login", "로그인", "user", "사용자가 아이디와 비밀번호로 로그인한다.", "로그인 결과를 화면에 돌려준다.", [
      ["user", "fw-ext", "로그인 요청", "사용자가 외부 방화벽으로 로그인 요청을 보낸다."],
      ["fw-ext", "l4-1", "통과", "허용된 443 요청만 L4 로 넘긴다."],
      ["l4-1", "web-1", "분산", "L4 가 WEB 묶음 가운데 한 대로 보낸다."],
      ["web-1", "fw-int", "WAS 호출", "WEB 이 내부 방화벽을 거쳐 WAS 를 부른다."],
      ["fw-int", "was-1", "통과", "허용된 AJP 요청만 WAS 로 넘긴다."],
      ["was-1", "db-proxy", "회원 조회", "WAS 가 DB 중계 서버로 회원 정보를 묻는다."],
      ["db-proxy", "db-active", "DB 조회", "DB 중계 서버가 Active DB 에서 회원을 확인한다."],
    ]),
  ],
};
