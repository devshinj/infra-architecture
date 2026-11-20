// 대형 쇼핑몰 학습 대본. 실제 회사의 구성이 아니라 이런 서비스를 만들 때 흔히 쓰는 구성이다. 값은 모두 예시다.
import { SHOP_CLOUD } from "./shop-cloud";
import { SHOP_ONPREM } from "./shop-onprem";
import type { Guide } from "./types";

export const SHOP: Guide = {
  id: "shop",
  title: "대형 쇼핑몰",
  intro: "고객이 상품을 보고 결제하는 대형 쇼핑몰을 한 단계씩 만들어 봐요.",
  learns: ["3계층·이중화", "결제 외부 연동", "세일 때 트래픽 몰림 대응(캐시·대기열)"],
  envIntro:
    "어느 환경으로 만들까요? 온프레미스는 우리 IDC 에 방화벽·L4·서버를 직접 두고 이중화도 직접 꾸며요. 클라우드(AWS)는 ALB·RDS 같은 관리형 서비스를 빌려 쓰고, 이중화의 많은 부분을 AWS 가 맡아요.",
  variants: { onprem: SHOP_ONPREM, cloud: SHOP_CLOUD },
};
