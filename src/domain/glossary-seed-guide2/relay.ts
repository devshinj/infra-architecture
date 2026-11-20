import type { GlossarySeedEntry } from "../glossary-seed";

// 외부 연계 중계시스템 학습 대본이 쓰는데 기본 사전에 없던 말. 규칙은 glossary-seed.ts 머리말과 같다.
export const TERMS: GlossarySeedEntry[] = [
  {
    term: "대외계",
    fullName: "대외계(對外系)",
    category: "연계 / 망 구역",
    definition: "대외계는 다른 기관과 전문·파일을 주고받는 서버를 내부 업무 시스템과 떼어 따로 모아 둔 연계 구역입니다.",
    why: "바깥 기관과 맞닿는 서버를 한곳에 모아 내부 업무 시스템이 바깥에 직접 드러나지 않게 합니다.",
    compare: "DMZ는 인터넷 사용자에게 서비스를 여는 구역이고, 대외계는 정해진 기관과 연계하는 구역입니다.",
    aliases: ["대외계망", "대외연계구간", "대외접속구간"],
  },
  {
    term: "FEP",
    fullName: "Front-End Processor(대외계 중계 서버)",
    category: "연계 / 중계 서버",
    definition: "FEP(Front-End Processor)는 내부 업무 시스템과 외부 기관 사이에서 전문을 받아 기관별 형식과 통신 방식으로 바꿔 중계하는 대외계 서버입니다.",
    why: "기관마다 다른 통신 방식을 FEP가 맡아 내부 업무 시스템은 한 가지 방식만 쓰면 됩니다.",
    compare: "EAI는 회사 안 시스템끼리 잇는 통합이고, FEP는 회사 밖 기관과의 연계를 맡습니다.",
    aliases: ["frontendprocessor", "대외계서버", "대외중계서버", "대외계중계서버"],
  },
  {
    term: "전문",
    fullName: "전문(電文)",
    category: "연계 / 메시지 형식",
    definition: "전문은 기관 사이에 거래를 주고받으려고 약속한 형식의 메시지로, 흔히 항목마다 길이와 자리가 정해진 고정 길이 형식을 씁니다.",
    why: "항목의 자리와 길이를 미리 약속해 서로 다른 시스템도 같은 거래 내용을 정확히 읽습니다.",
    compare: "JSON은 항목 이름을 함께 보내 길이가 자유롭고, 고정 길이 전문은 자리와 길이로 항목을 구분합니다.",
    aliases: ["電文", "고정길이전문", "전문통신", "전문메시지"],
  },
  {
    term: "전용 회선",
    fullName: "전용 회선(Leased Line)",
    category: "네트워크 / 회선",
    definition: "전용 회선은 통신사가 두 지점 사이를 한 고객만 쓰도록 빌려주는 통신 회선으로, 인터넷을 거치지 않고 정해진 상대와만 이어집니다.",
    why: "정해진 상대와만 이어져 품질이 고르고 바깥에서 끼어들기 어렵습니다.",
    compare: "인터넷 VPN은 공용 망 위에 암호 터널을 만들고, 전용 회선은 회선 자체를 따로 씁니다.",
    aliases: ["전용회선", "전용선", "leasedline", "임대회선"],
  },
  {
    term: "대사",
    fullName: "대사(對査, Reconciliation)",
    category: "연계 / 운영 절차",
    definition: "대사는 두 기관이나 시스템이 각자 남긴 거래 기록을 건별·합계로 맞춰 보고 서로 어긋난 거래를 찾아내는 확인 작업입니다.",
    why: "통신 장애나 중복 처리로 생긴 어긋남을 빨리 찾아 바로잡을 수 있습니다.",
    compare: "재처리는 실패한 거래를 다시 처리하는 일이고, 대사는 양쪽 기록이 서로 맞는지 확인하는 일입니다.",
    aliases: ["reconciliation", "거래대사", "정산대사"],
  },
  {
    term: "망취소",
    fullName: "망취소(Network Reversal)",
    category: "연계 / 거래 처리",
    definition: "망취소는 거래 요청 뒤 응답을 받지 못해 결과를 알 수 없을 때 그 거래를 취소하는 전문을 보내 양쪽 상태를 맞추는 처리입니다.",
    why: "상대 기관에서는 처리됐는데 우리는 실패로 아는 어긋남을 막습니다.",
    compare: "일반 취소는 고객이 요청하는 취소이고, 망취소는 통신 문제로 결과를 모를 때 시스템이 보내는 취소입니다.",
    aliases: ["망상취소", "networkreversal"],
  },
];
