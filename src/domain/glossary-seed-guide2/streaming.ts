import type { GlossarySeedEntry } from "../glossary-seed";

// 동영상 스트리밍 학습 대본이 쓰는데 기본 사전에 없던 말. 규칙은 glossary-seed.ts 머리말과 같다.
export const TERMS: GlossarySeedEntry[] = [
  {
    term: "Presigned URL",
    fullName: "미리 서명한 URL(Presigned URL)",
    category: "클라우드 / 저장소 접근",
    definition:
      "Presigned URL은 권한을 가진 서버가 파일 하나와 동작·만료 시간을 정해 서명해 둔 오브젝트 스토리지 주소로, 받은 사람은 그 일만 할 수 있습니다.",
    why: "큰 파일을 서버를 거치지 않고 저장소에 바로 올리거나 받게 하면서도, 버킷을 공개하지 않을 수 있습니다.",
    compare: "CloudFront 서명 URL·쿠키는 엣지에서 내려받기 권한을 확인하고, S3 Presigned URL은 버킷에 바로 올리거나 받는 권한입니다.",
    aliases: ["presign", "presignedurl", "미리서명한url", "미리서명url", "사전서명url", "s3presignedurl"],
  },
  {
    term: "멀티파트 업로드",
    fullName: "멀티파트 업로드(Multipart Upload)",
    category: "클라우드 / 저장소 업로드",
    definition:
      "멀티파트 업로드는 큰 파일을 여러 조각으로 나눠 따로 올린 뒤 저장소에서 하나의 파일로 합치는 오브젝트 스토리지의 업로드 방식입니다.",
    why: "조각을 함께 올려 빨라지고, 중간에 끊겨도 실패한 조각만 다시 올리면 됩니다.",
    compare: "한 번에 올리기는 끊기면 처음부터 다시 올려야 하고, 멀티파트 업로드는 끝나지 않은 조각을 따로 지워 줘야 합니다.",
    aliases: ["multipartupload", "multipart", "멀티파트", "분할업로드"],
  },
  {
    term: "ABR",
    fullName: "적응형 비트레이트 스트리밍(Adaptive Bitrate Streaming)",
    category: "미디어 / 스트리밍",
    definition:
      "ABR(적응형 비트레이트)은 같은 영상을 여러 화질로 만들어 두고 플레이어가 회선 속도에 맞춰 조각마다 화질을 바꿔 받는 스트리밍 방식입니다.",
    why: "회선이 느려지면 화질을 낮춰 끊기지 않게 하고, 빨라지면 다시 높여 줍니다.",
    compare: "한 화질 내려받기는 회선이 느리면 멈추고, ABR은 화질을 낮춰서라도 재생을 이어 갑니다.",
    aliases: ["adaptivebitrate", "adaptivebitratestreaming", "적응형비트레이트", "적응형스트리밍"],
  },
  {
    term: "CloudFront 서명 쿠키",
    fullName: "CloudFront 서명 URL·서명 쿠키(Signed URL·Signed Cookie)",
    category: "클라우드 / CDN 접근 제어",
    definition:
      "CloudFront 서명 쿠키는 서비스가 개인 키로 서명해 준 쿠키로, CloudFront 엣지가 그 서명과 만료 시간을 확인해 정한 경로의 파일만 내주게 합니다.",
    why: "로그인과 결제를 확인한 시청자만 영상 조각을 받게 하면서도, 확인은 서버가 아닌 엣지에서 합니다.",
    compare: "서명 URL은 파일 하나의 주소에 서명하고, 서명 쿠키는 조각 수백 개처럼 여러 파일을 쿠키 하나로 허용합니다.",
    aliases: ["cloudfrontsignedcookie", "signedcookie", "서명쿠키", "서명된쿠키", "cloudfrontsignedurl", "signedurl", "서명url", "서명된url"],
  },
  {
    term: "OAC",
    fullName: "원본 접근 제어(Origin Access Control)",
    category: "클라우드 / CDN 접근 제어",
    definition:
      "OAC(Origin Access Control)는 CloudFront 가 S3 버킷에 보내는 요청에 서명해, 버킷 정책으로 그 CloudFront 배포만 읽게 하는 CloudFront 의 원본 보호 기능입니다.",
    why: "버킷을 공개하지 않고도 CloudFront 로만 파일을 내보내, 캐시와 서명 쿠키를 건너뛰는 접근을 막습니다.",
    compare: "OAC는 예전 방식인 OAI(원본 접근 ID)를 잇는 방식으로, 더 많은 리전과 암호화 방식(KMS)을 지원합니다.",
    aliases: ["originaccesscontrol", "원본접근제어"],
  },
  {
    term: "DLQ",
    fullName: "배달 못 한 메시지 대기열(Dead-Letter Queue)",
    category: "메시징 / 실패 처리",
    definition:
      "DLQ(Dead-Letter Queue)는 정해진 횟수만큼 처리에 실패한 메시지를 원래 대기열에서 옮겨 따로 모아 두는 실패 전용 대기열입니다.",
    why: "깨진 작업이 끝없이 다시 시도돼 다른 작업을 막는 일을 막고, 사람이 원인을 따로 볼 수 있습니다.",
    compare: "원래 대기열은 처리할 작업을 담고, DLQ는 처리하지 못한 작업을 보관해 살펴보거나 다시 넣게 합니다.",
    aliases: ["deadletterqueue", "실패대기열", "데드레터큐", "데드레터대기열"],
  },
];
