import type { GlossarySeedEntry } from "../glossary-seed";

// 메신저 학습 대본이 쓰는데 기본 사전에 없던 말. 규칙은 glossary-seed.ts 머리말과 같다.
export const TERMS: GlossarySeedEntry[] = [
  {
    term: "Presence",
    fullName: "접속 상태 정보(Presence)",
    category: "메신저 / 실시간 통신",
    definition: "Presence는 메신저에서 사용자가 지금 접속해 있는지와 어느 서버에 연결돼 있는지를 나타내는 접속 상태 정보입니다.",
    why: "친구 목록의 접속 표시와, 메시지를 연결로 바로 보낼지 푸시 알림으로 보낼지 정하는 데 씁니다.",
    compare: "Presence는 지금 접속해 있는지를 말하고, 마지막 접속 시각은 연결이 끊긴 뒤에 남기는 기록입니다.",
    aliases: ["접속상태", "온라인상태", "프레즌스"],
  },
  {
    term: "유휴 시간 제한",
    fullName: "유휴 시간 제한(Idle Timeout)",
    category: "네트워크 / 연결 관리",
    definition: "유휴 시간 제한은 연결에서 정해 둔 시간 동안 오가는 데이터가 없으면 로드밸런서나 방화벽이 그 연결을 끊는 설정입니다.",
    why: "쓰지 않는 연결이 장비 자원을 계속 차지하지 않게 정리합니다.",
    compare: "유휴 시간 제한은 조용한 연결을 끊고, 요청 시간 제한은 응답이 너무 늦은 요청 하나를 끊습니다.",
    aliases: ["idletimeout", "유휴타임아웃", "아이들타임아웃"],
  },
  {
    term: "읽음 표시",
    fullName: "읽음 표시(Read Receipt)",
    category: "메신저 / 메시지 상태",
    definition: "읽음 표시는 받는 사람이 메시지를 읽었다는 사실을 보낸 사람에게 알려 주는 메신저의 메시지 상태 기능입니다.",
    why: "보낸 사람이 상대가 확인했는지 알고, 단체방에서는 아직 읽지 않은 사람 수를 보여 줍니다.",
    compare: "읽음 표시는 사람이 화면에서 확인한 것이고, 전달 완료는 메시지가 기기에 도착한 것까지입니다.",
    aliases: ["readreceipt", "읽음확인"],
  },
];
