import type { GlossarySeedEntry } from "../glossary-seed";

// 영상관제시스템 학습 대본이 쓰는데 기본 사전에 없던 말. 규칙은 glossary-seed.ts 머리말과 같다.
export const TERMS: GlossarySeedEntry[] = [
  {
    term: "영상 월",
    fullName: "영상 월(Video Wall, 비디오 월)",
    category: "영상 관제 / 관제실",
    definition:
      "영상 월은 모니터 여러 대를 이어 붙여 많은 카메라 영상이나 큰 화면 하나를 함께 띄우는 대형 표시 장치입니다.",
    why: "관제실 전체가 같은 화면을 함께 보며 상황을 나누고, 사건 현장 영상을 크게 띄우려고 씁니다.",
    compare: "영상 월은 여럿이 함께 보는 벽면 화면이고, 관제 PC 는 관제요원 한 사람이 카메라를 골라 보는 자리입니다.",
    aliases: ["videowall", "비디오월", "멀티비전", "영상월컨트롤러"],
  },
  {
    term: "영상 반출",
    fullName: "개인영상정보 반출(Video Export)",
    category: "영상 관제 / 규정·제도",
    definition:
      "영상 반출은 녹화된 영상 가운데 필요한 구간을 승인 절차를 거쳐 파일로 꺼내 관제 시스템 밖으로 내보내는 일입니다.",
    why: "정보주체 열람이나 수사기관 제공처럼 꼭 필요한 경우에만, 누가 왜 내보냈는지 남기며 영상을 건네려고 절차를 둡니다.",
    compare: "반출은 녹화본을 파일로 내보내는 것이고, 실시간 영상 제공은 협약한 기관에 라이브 영상을 계속 보내 주는 것입니다.",
    aliases: ["영상반출", "cctv반출", "videoexport", "반출절차"],
  },
  {
    term: "접속기록",
    fullName: "개인정보처리시스템 접속기록(Access Log)",
    category: "보안 / 개인정보",
    definition:
      "접속기록은 개인정보를 다루는 시스템에 누가 언제 어디서 접속해 어떤 정보를 열람·처리했는지 남긴 기록입니다.",
    why: "개인정보가 새거나 목적 밖으로 쓰였을 때 누가 했는지 찾아내고, 평소에는 점검으로 오남용을 막으려고 남깁니다.",
    compare: "접속기록은 사람의 열람·처리 행위를 남긴 것이고, 시스템 로그는 서버와 프로그램의 동작을 남긴 것입니다.",
    aliases: ["접근기록", "접속로그", "열람기록", "감사로그", "auditlog"],
  },
  {
    term: "NMS",
    fullName: "네트워크 관리 시스템(Network Management System)",
    category: "운영 / 장비 감시",
    definition:
      "NMS(Network Management System)는 네트워크 장비와 서버의 상태를 모아 감시하고 이상이 생기면 알리는 관리 시스템입니다.",
    why: "장비가 많은 망에서 끊기거나 느려진 곳을 사람이 돌아보지 않고 바로 찾아내려고 씁니다.",
    compare: "NMS는 장비가 살아 있는지와 회선 상태를 주로 보고, APM은 애플리케이션 안의 응답 시간과 오류를 봅니다.",
    aliases: ["networkmanagementsystem", "네트워크관리시스템", "망관리시스템"],
  },
  {
    term: "N+1 이중화",
    fullName: "N+1 이중화(N+1 Redundancy)",
    category: "고가용성 / 이중화",
    definition:
      "N+1 이중화는 일하는 장비 N대에 예비 장비 1대를 더 두어, 어느 한 대가 멈추면 예비 장비가 그 일을 넘겨받게 하는 구성입니다.",
    why: "장비마다 짝을 두는 것(1+1)보다 적은 장비로 한 대의 고장을 견디려고 씁니다.",
    compare: "N+1은 예비 한 대가 여러 대를 함께 지키고, 1+1(Active-Standby)은 장비마다 전담 예비를 하나씩 둡니다.",
    aliases: ["n+1", "n+1redundancy", "엔플러스원", "엔플러스원이중화"],
  },
];
