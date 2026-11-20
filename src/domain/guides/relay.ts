// 외부 연계 중계시스템 학습 대본. 실제 회사의 구성이 아니라 이런 서비스를 만들 때 흔히 쓰는 구성이다. 값은 모두 예시다.
import { RELAY_ONPREM } from "./relay-onprem";
import type { Guide } from "./types";

export const RELAY: Guide = {
  id: "relay",
  title: "외부 연계 중계시스템",
  intro: "카드사·제휴사·정산 협력사처럼 연결 방식이 저마다 다른 외부 기관과 내부 업무 시스템을 잇는 중계시스템을 한 단계씩 만들어 봐요.",
  learns: ["연계 구간(대외계)과 방화벽 두 겹","기관별 연결 방식(전용 회선·VPN·SFTP)", "장애 격리와 거래 추적·재처리"],
  envIntro:
    "이 주제는 온프레미스(사내 IDC)로 만들어요. 망분리된 업무망과 바깥 기관 사이에 대외계를 따로 두고, 방화벽·전용 회선·VPN 같은 장비를 직접 그려요. 클라우드 대본은 아직 없어요.",
  variants: { onprem: RELAY_ONPREM },
};
