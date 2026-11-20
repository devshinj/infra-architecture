import type { GlossarySeedEntry } from "./glossary-seed";

// 용어 사전 초안: 학습 대본(src/domain/guides/)이 쓰는데 앞 묶음에 없던 말.
// 대본의 설명 탭은 정의를 비우면 이 기본 사전에서 읽는다(외부 서비스 영역 등).
// 규칙은 glossary-seed.ts 머리말과 같다(사전식 한 문장 120자, 개념 항목은 why·compare 를 채움, aliases 는 normalizeTerm 값).

export const GLOSSARY_SEED_GUIDE: GlossarySeedEntry[] = [
  {
    term: "외부 서비스",
    fullName: "외부 서비스(Third-party Service)",
    category: "외부 연동 / 영역",
    definition:
      "외부 서비스는 우리가 직접 운영하지 않고 다른 회사가 인터넷이나 전용 회선으로 제공하는 결제·인증·알림 같은 서비스입니다.",
    why: "직접 만들기 어려운 기능을 계약으로 빌려 빨리 붙이고, 그 운영은 제공 회사가 맡습니다.",
    compare: "외부 API는 그 서비스를 부르는 접점이고, 외부 서비스는 기능을 제공하는 회사와 시스템 전체를 말합니다.",
    aliases: ["externalservice", "thirdpartyservice", "서드파티서비스", "외부시스템"],
  },
  {
    term: "Multi-AZ",
    fullName: "다중 가용 영역 배포(Multi-AZ Deployment)",
    category: "클라우드 / 고가용성",
    definition:
      "Multi-AZ는 DB나 캐시의 대기 복제본을 같은 리전의 다른 가용 영역(AZ)에 두고 장애 때 자동으로 넘기는 클라우드 배포 방식입니다.",
    why: "가용 영역 하나의 전원·네트워크 장애가 나도 데이터를 계속 쓸 수 있습니다.",
    compare: "읽기 전용 복제본은 조회를 나누려고 두고, Multi-AZ의 대기 복제본은 장애에 대비해 둡니다.",
    aliases: ["multiazdeployment", "다중az", "멀티az", "다중가용영역"],
  },
  {
    term: "대상 그룹",
    fullName: "대상 그룹(Target Group)",
    category: "클라우드 / 로드밸런싱",
    definition:
      "대상 그룹은 로드밸런서가 요청을 나눠 보낼 서버들을 묶고 헬스 체크로 상태를 확인하는 AWS 로드밸런서의 등록 단위입니다.",
    why: "서버가 늘거나 바뀌어도 대상 그룹에 넣고 빼기만 하면 로드밸런서 설정을 고치지 않아도 됩니다.",
    compare: "Auto Scaling 그룹은 서버를 만들고 없애는 묶음이고, 대상 그룹은 그 서버들에 요청을 보내는 목록입니다.",
    aliases: ["targetgroup", "타깃그룹", "타겟그룹"],
  },
];
