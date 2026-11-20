// 동영상 스트리밍 학습 대본. 실제 회사의 구성이 아니라 이런 서비스를 만들 때 흔히 쓰는 구성이다. 값은 모두 예시다.
import { STREAMING_CLOUD } from "./streaming-cloud";
import type { Guide } from "./types";

export const STREAMING: Guide = {
  id: "streaming",
  title: "동영상 스트리밍",
  intro: "업로더가 올린 영상을 화질별로 바꿔 시청자에게 내보내는 동영상 서비스를 한 단계씩 만들어 봐요.",
  learns: ["큰 파일은 서버를 거치지 않고 저장소로 바로 올리기", "변환은 대기열로 미뤄 화질별(HLS)로 만들기", "재생은 CDN 이 맡고 서명 쿠키로 권한 확인"],
  envIntro:
    "이 주제는 클라우드(AWS)로 만들어요. 영상 파일은 S3 에 두고, 재생은 CloudFront 가 전 세계 엣지에서 내보내요. 변환 서버는 쌓인 작업만큼 늘리고 줄여요.",
  variants: { cloud: STREAMING_CLOUD },
};
