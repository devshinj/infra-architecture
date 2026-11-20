// 배달앱 학습 대본. 실제 회사의 구성이 아니라 이런 서비스를 만들 때 흔히 쓰는 구성이다. 값은 모두 예시다.
import { DELIVERY_CLOUD } from "./delivery-cloud";
import type { Guide } from "./types";

export const DELIVERY: Guide = {
  id: "delivery",
  title: "배달앱",
  intro: "고객이 주문하고, 가게가 접수하고, 라이더가 배달하는 배달앱을 한 단계씩 만들어 봐요.",
  learns: ["세 앱이 함께 쓰는 백엔드와 역할별 서비스", "주문 상태 알림(이벤트·푸시·실시간 연결)", "라이더 위치 추적과 배차", "점심·저녁 몰림 대응"],
  envIntro:
    "이 주제는 클라우드(AWS)로 만들어요. ALB·RDS·ElastiCache·SNS·SQS 같은 관리형 서비스를 빌려 쓰고, 서버는 두 AZ 에 나눠 Auto Scaling 으로 늘리고 줄여요. 온프레미스라면 무엇이 달라지는지는 끝에 표로 보여 드려요.",
  variants: { cloud: DELIVERY_CLOUD },
};
