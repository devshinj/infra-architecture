// 영상 관리시스템(VMS) 학습 대본. 실제 회사의 구성이 아니라 이런 서비스를 만들 때 흔히 쓰는 구성이다. 값은 모두 예시다.
import type { Guide } from "./types";
import { VMS_ONPREM } from "./vms-onprem";

export const VMS: Guide = {
  id: "vms",
  title: "영상 관리시스템(VMS)",
  intro: "카메라 영상을 받아 녹화하고, 보여 주고, 찾아 주는 영상 관리시스템(VMS)을 부품 하나씩 조립해 봐요.",
  learns: ["VMS 를 이루는 서버(녹화·관리·미디어·이벤트)와 일을 나누는 까닭", "ONVIF·RTSP·스트림·비트레이트와 저장 용량 계산", "실시간 보기·검색 재생·이벤트 알람이 지나는 길과 장애 대비"],
  envIntro:
    "이 주제는 온프레미스(사내 전산실)로 만들어요. 카메라 영상은 양이 많고 쉬지 않고 흘러서, 카메라와 가까운 사내 전산실에 서버와 저장소를 두는 구성이 흔해요. 시작하려면 '온프레미스로 할게'처럼 답해 주세요.",
  variants: { onprem: VMS_ONPREM },
};
