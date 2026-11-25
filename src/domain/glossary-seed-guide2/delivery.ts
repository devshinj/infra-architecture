import type { GlossarySeedEntry } from "../glossary-seed";

// 배달앱 학습 대본이 쓰는데 기본 사전에 없던 말. 규칙은 glossary-seed.ts 머리말과 같다.
// FCM·APNs·Amazon SNS·지도 API 는 대본 설명 탭에 정의를 직접 썼다(메신저 등 다른 주제와 겹치지 않게 사전에는 넣지 않았다).
export const TERMS: GlossarySeedEntry[] = [
  {
    term: "Redis GEO",
    fullName: "Redis 위치 명령(Geospatial)",
    category: "캐시 / 위치 데이터",
    definition:
      "Redis GEO 는 경도·위도 좌표를 정렬 집합(Sorted Set)에 저장하고 한 지점에서 반경 안의 항목을 가까운 순으로 찾는 Redis 의 위치 명령 모음입니다.",
    why: "주변 라이더 찾기처럼 자주 바뀌는 최신 위치를 메모리에 두고 '이 지점에서 3km 안'을 DB 없이 빠르게 찾을 수 있습니다.",
    compare: "PostGIS 같은 공간 DB 는 이력 보관과 복잡한 공간 질의에 맞고, Redis GEO 는 최신 위치 덮어쓰기와 빠른 반경 조회에 맞습니다.",
    aliases: ["redisgeospatial", "geospatial", "geoadd", "geosearch", "레디스geo", "레디스지오"],
  },
  {
    term: "예약 조정",
    fullName: "예약 조정(Scheduled Scaling)",
    category: "클라우드 / 자동 확장",
    definition:
      "예약 조정은 정한 시각에 Auto Scaling 그룹의 최소·희망 대수를 미리 바꿔 서버를 늘리거나 줄이는 자동 확장 방식입니다.",
    why: "점심·저녁처럼 매일 같은 시각에 몰리는 부하는 지표가 오르기 전에 서버를 미리 띄워 둘 수 있습니다.",
    compare: "지표 기반 조정은 CPU 같은 지표가 오른 뒤에 늘려 서버가 뜨는 몇 분 동안 늦고, 예약 조정은 시각을 보고 미리 늘립니다.",
    aliases: ["scheduledscaling", "scheduledaction", "예약스케일링", "예약확장", "스케줄스케일링"],
  },
];
