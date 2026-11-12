import { assume, edge, flow, group, node, type Sample } from "./dsl";

const SERVER = { os: "Windows Server 2022", cpu: "8 Core", ram: "16GB", disk: "500GB", hostname: null, ip: null };

/**
 * 건물 출입통제. 카드 리더기는 RS-485(OSDP) 선으로 출입 컨트롤러에 붙고, 컨트롤러가 출입통제 서버와 권한·이벤트를 주고받는다.
 * 출입 이벤트가 나면 NVR 에 그 시각 영상을 표시한다. 출입통제 서버가 1대라 경고가 남는다(의도된 경고).
 */
export const ACCESS_CONTROL: Sample = {
  id: "access-control",
  title: "건물 출입통제",
  commands: [
    assume("environment", "사내 IDC"),
    assume("scale", "출입문 48개, 카메라 16대"),

    group("site", "onprem_zone", "출입문 현장"),
    group("room", "onprem_zone", "보안 관제실"),
    group("db-ha", "redundancy_group", "DB VIP", "room"),
    group("hq", "onprem_zone", "본사 전산실"),
    group("hr-vip", "redundancy_group", "인사 시스템 VIP", "hq"),

    node("reader", "iot_device", "카드 리더기", "site", "출입문마다 1대", { count: 48, comm: "OSDP(RS-485)" }),
    node("controller", "iot_gateway", "출입 컨트롤러", "site", "4도어용 × 12대", { ip: null, comm: "OSDP 수신, TCP/IP 송신" }),
    node("camera", "camera", "출입문 CCTV", "site", undefined, { count: 16, resolution: "2MP" }),
    node("acs", "app_server", "출입통제 서버", "room", "권한·이력 관리", { ...SERVER, sw: null }),
    node("db-1", "db_rdb", "출입 DB #1", "db-ha", "SQL Server 2022", { sw: "SQL Server 2022", version: "2022", cpu: "8 Core", ram: "32GB", ip: null, replication: "Always On 동기(주)" }),
    node("db-2", "db_rdb", "출입 DB #2", "db-ha", "SQL Server 2022", { sw: "SQL Server 2022", version: "2022", cpu: "8 Core", ram: "32GB", ip: null, replication: "Always On 동기(보조)" }),
    node("nvr", "video_recorder", "NVR", "room", "출입문 영상", { channels: 16, retention: "30일", disk: "20TB", sw: null }),
    node("display", "control_display", "보안 관제 화면", "room"),
    node("hr-1", "app_server", "인사 시스템 #1", "hr-vip", undefined, { ...SERVER, sw: null }),
    node("hr-2", "app_server", "인사 시스템 #2", "hr-vip", undefined, { ...SERVER, sw: null }),

    edge("reader", "controller", "request", "OSDP(RS-485)", { medium: "serial" }),
    edge("controller", "acs", "async", "출입 이벤트 TCP"),
    edge("acs", "controller", "request", "출입 권한 내려받기 TCP"),
    edge("acs", "db-1", "request", "SQL Server 1433"),
    edge("db-1", "db-2", "replication", "Always On"),
    edge("acs", "nvr", "request", "이벤트 표시 API"),
    edge("acs", "display", "request", "출입 알림 WSS"),
    edge("camera", "nvr", "request", "RTSP", { medium: "video" }),
    edge("nvr", "display", "request", "RTSP", { medium: "video" }),
    edge("hr-1", "acs", "request", "인사 변동 동기화 API"),
    edge("hr-2", "acs", "request", "인사 변동 동기화 API"),

    flow("card-tag", "카드 출입", "user", "직원이 출입문에서 카드를 댄다.", "컨트롤러가 문을 열고, 출입 이력과 영상 표시가 남는다.", [
      ["reader", "controller", "카드 번호", "카드 리더기가 OSDP 로 카드 번호를 컨트롤러에 보낸다."],
      ["controller", "acs", "출입 이벤트", "컨트롤러가 내려받은 권한으로 판정해 문을 열고, 이벤트를 서버에 보낸다."],
      ["acs", "db-1", "이력 저장", "출입통제 서버가 출입 이력을 DB 에 남긴다."],
      ["acs", "nvr", "영상 표시", "같은 시각의 출입문 영상에 표시를 단다."],
      ["acs", "display", "관제 알림", "보안 관제 화면에 출입 기록을 띄운다."],
    ]),
    flow("permission-sync", "권한 동기화", "system", "인사 변동을 출입 권한에 반영한다.", "퇴사자 카드는 막히고 신규 입사자 권한이 컨트롤러에 내려간다.", [
      ["hr-1", "acs", "인사 변동", "인사 시스템이 입사·퇴사·부서 이동을 출입통제 서버에 알린다."],
      ["acs", "controller", "권한 배포", "출입통제 서버가 바뀐 권한을 컨트롤러에 내려보낸다."],
    ]),
  ],
};
