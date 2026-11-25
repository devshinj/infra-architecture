// 메신저 학습 대본. 실제 회사의 구성이 아니라 이런 서비스를 만들 때 흔히 쓰는 구성이다. 값은 모두 예시다.
import { MESSENGER_CLOUD } from "./messenger-cloud";
import type { Guide } from "./types";

export const MESSENGER: Guide = {
  id: "messenger",
  title: "메신저",
  intro: "친구와 1:1·단체 대화를 주고받는 메신저를 한 단계씩 만들어 봐요.",
  learns: ["끊기지 않는 실시간 연결(WebSocket)", "서버 사이 메시지 전달·저장", "오프라인 사용자 푸시 알림"],
  envIntro:
    "메신저는 클라우드(AWS)로 만들어요. ALB·ElastiCache·DynamoDB·SQS 같은 관리형 서비스를 빌려 쓰고, 채팅 서버·API 서버·푸시 워커는 EC2 로 직접 운영해요. '클라우드로 할게'처럼 답하면 시작해요.",
  variants: { cloud: MESSENGER_CLOUD },
};
