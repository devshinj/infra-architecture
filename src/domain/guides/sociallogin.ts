// SNS 로그인 연동 앱 학습 대본. 실제 회사의 구성이 아니라 이런 서비스를 만들 때 흔히 쓰는 구성이다. 값은 모두 예시다.
import { SOCIAL_LOGIN_CLOUD } from "./sociallogin-cloud";
import type { Guide } from "./types";

export const SOCIAL_LOGIN: Guide = {
  id: "sociallogin",
  title: "SNS 로그인 연동 앱",
  intro: "카카오·네이버·구글 계정으로 로그인하는 앱을 한 단계씩 만들어 봐요.",
  learns: ["소셜 로그인이 실제로 도는 길(인가 코드·토큰 교환)", "인증 서버·시크릿·계정 연결", "우리 토큰 발급과 검증(JWT·JWKS)"],
  envIntro:
    "이 주제는 클라우드(AWS)로 준비돼 있어요. 인증 서버·회원 DB·토큰 저장소는 AWS 서비스로 두고, 카카오·네이버·구글 같은 로그인 제공자는 인터넷 너머의 외부 서비스로 붙여요. 클라우드로 시작할까요?",
  variants: { cloud: SOCIAL_LOGIN_CLOUD },
};
