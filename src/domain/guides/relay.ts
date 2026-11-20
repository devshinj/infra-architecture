// 외부 연계 중계시스템 학습 대본. 실제 기관의 구성이 아니라 이런 시스템을 만들 때 흔히 쓰는 구성이다. 값은 모두 예시다.
import { RELAY_ONPREM } from "./relay-onprem";
import type { Guide } from "./types";

export const RELAY: Guide = {
  id: "relay",
  title: "외부 연계 중계시스템",
  intro: "시·군·구마다 따로 운영하는 업무 시스템을 하나의 통합 시스템으로 연계·취합하고, 실시간 조회와 지시도 내려보내는 중계시스템을 한 단계씩 만들어 봐요.",
  learns: ["연계 구간과 방화벽 두 겹, 행정 전용망", "지자체별 연결 방식(REST API·연계 에이전트·SFTP)", "취합 검증·재수집과 장애 격리·추적"],
  envIntro:
    "이 주제는 온프레미스(사내 IDC)로 만들어요. 내부 업무망과 지자체 사이에 연계 구간을 따로 두고, 방화벽·행정망 전용 회선 같은 장비를 직접 그려요. 클라우드 대본은 아직 없어요.",
  variants: { onprem: RELAY_ONPREM },
};
