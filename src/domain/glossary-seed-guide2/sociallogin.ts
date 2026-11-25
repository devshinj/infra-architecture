import type { GlossarySeedEntry } from "../glossary-seed";

// SNS 로그인 연동 앱 학습 대본이 쓰는데 기본 사전에 없던 말. 규칙은 glossary-seed.ts 머리말과 같다.
export const TERMS: GlossarySeedEntry[] = [
  {
    term: "Secrets Manager",
    fullName: "AWS Secrets Manager",
    category: "클라우드 / 보안",
    definition:
      "AWS Secrets Manager는 DB 비밀번호·API 키·클라이언트 시크릿 같은 비밀 값을 암호화해 보관하고 권한 있는 서버만 꺼내 쓰게 하는 AWS 관리형 서비스입니다.",
    why: "",
    compare: "",
    aliases: ["awssecretsmanager", "시크릿매니저"],
  },
  {
    term: "인가 코드",
    fullName: "인가 코드(Authorization Code)",
    category: "인증 / OAuth",
    definition:
      "인가 코드는 OAuth 인가 코드 방식에서 사용자가 로그인·동의한 뒤 제공자가 등록된 리디렉트 주소로 돌려주는 일회용 값으로, 서버가 이를 토큰으로 바꿉니다.",
    why: "토큰을 브라우저 주소로 직접 넘기지 않고, 짧게 쓰고 버리는 코드만 브라우저를 거치게 합니다.",
    compare: "인가 코드는 한 번 쓰고 버리는 교환권이고, 액세스 토큰은 실제로 API를 부를 때 내는 증표입니다.",
    aliases: ["authorizationcode", "authcode", "authorizationcodegrant", "인가코드방식"],
  },
  {
    term: "PKCE",
    fullName: "Proof Key for Code Exchange",
    category: "인증 / OAuth 보안",
    definition:
      "PKCE(Proof Key for Code Exchange)는 로그인 시작 때 만든 임의 값의 해시를 보내고 토큰 교환 때 원래 값을 내게 해, 가로챈 인가 코드를 못 쓰게 하는 OAuth 확장입니다.",
    why: "클라이언트 시크릿을 숨길 수 없는 앱에서도 인가 코드를 안전하게 토큰으로 바꿉니다.",
    compare: "state는 우리가 시작하지 않은 로그인 응답을 걸러 내고, PKCE는 가로챈 인가 코드의 토큰 교환을 막습니다.",
    aliases: ["proofkeyforcodeexchange", "픽시"],
  },
  {
    term: "JWT",
    fullName: "JSON Web Token",
    category: "인증 / 토큰 형식",
    definition:
      "JWT(JSON Web Token)는 사용자 ID·만료 시각 같은 정보를 JSON으로 담고 발급자가 서명해, 받는 쪽이 위조 여부를 직접 확인할 수 있게 만든 토큰 형식입니다.",
    why: "API 서버가 요청마다 인증 서버에 묻지 않고 서명만 확인해 사용자를 알아봅니다.",
    compare: "세션은 서버 저장소를 찾아봐야 하고, JWT는 서명으로 바로 확인하는 대신 만료 전에 무효로 하려면 폐기 목록이 따로 필요합니다.",
    aliases: ["jsonwebtoken", "제이더블유티"],
  },
  {
    term: "JWKS",
    fullName: "JSON Web Key Set",
    category: "인증 / 키 배포",
    definition:
      "JWKS(JSON Web Key Set)는 토큰 발급자가 서명 확인용 공개 키 목록을 JSON으로 공개한 것으로, 받는 쪽이 이 키로 JWT 서명을 검증합니다.",
    why: "받는 쪽이 목록을 다시 받기만 하면 되어 발급자가 서명 키를 안전하게 바꿀 수 있습니다.",
    compare: "서명에 쓰는 개인 키는 발급자만 가지고, JWKS에는 누구나 봐도 되는 공개 키만 담깁니다.",
    aliases: ["jsonwebkeyset", "jwksuri", "공개키목록"],
  },
  {
    term: "리프레시 토큰",
    fullName: "리프레시 토큰(Refresh Token)",
    category: "인증 / 토큰",
    definition:
      "리프레시 토큰은 액세스 토큰이 만료됐을 때 다시 로그인하지 않고 새 액세스 토큰을 받는 데 쓰는, 수명이 긴 토큰입니다.",
    why: "액세스 토큰을 짧게 두어 도난 피해를 줄이면서도 사용자가 자주 다시 로그인하지 않게 합니다.",
    compare: "액세스 토큰은 API를 부를 때마다 내는 짧은 증표이고, 리프레시 토큰은 인증 서버에만 내는 재발급용 증표입니다.",
    aliases: ["refreshtoken", "갱신토큰", "재발급토큰"],
  },
  {
    term: "웹훅",
    fullName: "웹훅(Webhook)",
    category: "연동 / 이벤트 통보",
    definition: "웹훅은 어떤 일이 생겼을 때 서비스가 미리 등록된 주소로 HTTP 요청을 보내 알려 주는 연동 방식입니다.",
    why: "받는 쪽이 계속 물어보지 않아도 변화가 생기면 바로 알 수 있습니다.",
    compare: "폴링은 받는 쪽이 주기적으로 묻고, 웹훅은 보내는 쪽이 일이 생길 때 먼저 알립니다.",
    aliases: ["webhook", "웹후크"],
  },
];
