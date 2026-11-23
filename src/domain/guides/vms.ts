// 영상 관리시스템(VMS) 학습 대본. 실제 회사의 구성이 아니라 이런 서비스를 만들 때 흔히 쓰는 구성이다. 값은 모두 예시다.
import type { Guide } from "./types";
import { VMS_ONPREM } from "./vms-onprem";

export const VMS: Guide = {
  id: "vms",
  title: "영상 관리시스템(VMS)",
  intro: "영상을 저장하고 관리하며, 내려받게 해 주고 실시간 영상을 RTSP 로 여러 곳에 내주는(브로드캐스팅) 영상 관리시스템(VMS)을 부품 하나씩 조립해 봐요.",
  learns: ["VMS 의 네 가지 일(저장·관리·내려받기·브로드캐스팅)과 그 일을 맡는 서버", "ONVIF·RTSP·WebRTC·HLS 의 쓰임과 지연, 스트림·비트레이트와 저장 용량 계산", "채널마다 RTSP 주소로 실시간 영상을 내주는 브로드캐스팅과, 녹화본을 찾아 승인받고 내려받는 길"],
  envIntro:
    "이 주제는 온프레미스(사내 전산실)로 만들어요. 카메라 영상은 양이 많고 쉬지 않고 흘러서, 카메라와 가까운 사내 전산실에 서버와 저장소를 두는 구성이 흔해요. 시작하려면 '온프레미스로 할게'처럼 답해 주세요.",
  variants: { onprem: VMS_ONPREM },
};
