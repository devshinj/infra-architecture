import { assume, edge, flow, group, node, zoneType, type Sample } from "./dsl";

const SERVER = { os: "Rocky Linux 9", cpu: "8 Core", ram: "32GB", disk: "1TB", hostname: null, ip: null };
const CROSS = { payload: "api", direction: "one_way" } as const;

/**
 * 현장 IoT·영상 관제. 센서는 기기 게이트웨이와 MQTT 로, 카메라는 NVR 로 모이고 관제 방화벽을 거쳐 통합관제망에 닿는다.
 * 관제 DB 가 1대라 경고가 남고, 사물인터넷망과 통합관제망을 잇는 구간은 기본 망 지식상 확인 필요로 남는다(의도된 경고).
 */
export const IOT_CONTROL: Sample = {
  id: "iot-control",
  title: "현장 IoT·영상 관제",
  commands: [
    assume("environment", "사내 IDC"),
    assume("scale", "센서 40대, 카메라 24대"),

    group("iot", "network_zone", "사물인터넷망"),
    group("video", "network_zone", "영상망"),
    group("ctrl", "network_zone", "통합관제망"),
    zoneType("iot", "iot-net"),
    zoneType("video", "video-net"),
    group("ctrl-vip", "redundancy_group", "관제 서버 VIP", "ctrl"),
    zoneType("ctrl", "control-center-net"),

    node("sensor", "iot_device", "환경 센서", "iot", "온도·가스", { count: 40, comm: "LoRa" }),
    node("gateway", "iot_gateway", "기기 게이트웨이", "iot", "LoRa → MQTT", { ip: null, comm: "LoRa 수신, MQTT 송신" }),
    node("camera", "camera", "CCTV 카메라", "video", undefined, { count: 24, resolution: "4MP" }),
    node("nvr", "video_recorder", "NVR", "video", "영상 저장", { channels: 32, retention: "30일", disk: "40TB", sw: null }),
    node("fw", "firewall", "관제 방화벽", "ctrl", undefined, { port: "8883, 554", rules: "게이트웨이 MQTT·NVR 영상만 허용", vip: null }),
    node("mqtt", "mqtt_broker", "MQTT 브로커", "ctrl", "EMQX 5", { sw: "EMQX 5", port: "8883" }),
    node("ctrl-1", "app_server", "관제 서버 #1", "ctrl-vip", "이상 감지", { ...SERVER, sw: "Spring Boot 3" }),
    node("ctrl-2", "app_server", "관제 서버 #2", "ctrl-vip", "이상 감지", { ...SERVER, sw: "Spring Boot 3" }),
    node("ctrl-db", "db_nosql", "관제 DB", "ctrl", "시계열 DB", { sw: "InfluxDB", version: "2.7", cpu: "8 Core", ram: "32GB", ip: null, replication: null }),
    node("display", "control_display", "관제 화면", "ctrl", "상황실 대형 화면"),

    edge("sensor", "gateway", "request", "LoRa", { medium: "wireless" }),
    edge("gateway", "fw", "request", "MQTT/TLS 8883", CROSS),
    edge("fw", "mqtt", "request", "MQTT/TLS 8883"),
    ...["ctrl-1", "ctrl-2"].flatMap((id) => [
      edge("mqtt", id, "async", "센서 값 공유 구독"),
      edge(id, "ctrl-db", "request", "HTTP 8086 쓰기"),
      edge(id, "display", "request", "관제 알림 WSS"),
    ]),
    edge("camera", "nvr", "request", "RTSP", { medium: "video" }),
    edge("nvr", "fw", "request", "RTSP 554", { ...CROSS, medium: "video" }),
    edge("fw", "display", "request", "RTSP 554", { medium: "video" }),

    flow("sensor-alert", "센서 이상 알림", "system", "센서 값이 기준을 넘으면 관제 화면에 알린다.", "관제 화면에 경보를 띄우고 값을 남긴다.", [
      ["sensor", "gateway", "측정값", "센서가 LoRa 로 기기 게이트웨이에 값을 보낸다."],
      ["gateway", "fw", "발행", "게이트웨이가 관제 방화벽으로 MQTT 메시지를 보낸다."],
      ["fw", "mqtt", "통과", "허용된 MQTT 만 브로커로 넘긴다."],
      ["mqtt", "ctrl-1", "구독", "관제 서버가 센서 값을 받아 기준과 비교한다."],
      ["ctrl-1", "ctrl-db", "기록", "측정값과 판정 결과를 관제 DB 에 남긴다."],
      ["ctrl-1", "display", "경보", "기준을 넘으면 관제 화면에 경보를 띄운다."],
    ]),
  ],
};
