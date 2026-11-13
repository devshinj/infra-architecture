import type { DNode } from "./types";

const YES = ["yes", "true", "y", "1", "예", "네"];
const NO = ["no", "false", "n", "0", "아니오", "아니요"];

/** 예/아니오 칸(managed·multi_az) 값 읽기. 모르거나 알아볼 수 없으면 null. */
export function yesNo(v: unknown): "yes" | "no" | null {
  if (v === undefined || v === null) return null;
  const s = String(v).trim().toLowerCase();
  return YES.includes(s) ? "yes" : NO.includes(s) ? "no" : null;
}

/**
 * 이름만으로 클라우드 사업자가 운영하는 관리형 서비스라고 알 수 있는 제품명.
 * 짧은 약어(ALB·RDS 등)는 영문·숫자에 붙지 않은 낱말일 때만 맞춘다("ALB로"는 맞고 "ALBUM"은 아니다).
 * Redis·MySQL·Nginx 처럼 직접 설치해도 같은 이름인 것과, SNS(소셜 로그인과 헷갈린다)처럼 뜻이 갈리는 약어는 넣지 않는다.
 */
const MANAGED_NAMES: readonly string[] = [
  // AWS
  "ALB", "NLB", "ELB", "GWLB", "Application Load Balancer", "Network Load Balancer", "Elastic Load Balancing",
  "RDS", "Aurora", "ElastiCache", "MemoryDB", "DynamoDB", "DocumentDB", "Neptune", "Keyspaces", "Redshift",
  "Amazon MQ", "MSK", "Amazon OpenSearch", "CloudFront", "S3", "EFS", "Lambda", "SQS", "Kinesis",
  // Google Cloud
  "Cloud SQL", "Spanner", "Bigtable", "Firestore", "Memorystore", "Cloud Load Balancing", "Cloud Storage", "Cloud Run", "Cloud Functions", "Pub/Sub",
  // Azure
  "Azure SQL", "Azure Database", "Cosmos DB", "Azure Cache", "Application Gateway", "Azure Load Balancer", "Front Door", "Blob Storage", "Service Bus", "Event Hubs", "Azure Functions",
  // 네이버 클라우드
  "Cloud DB for",
];

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
const MANAGED_RE = new RegExp(`(?<![A-Za-z0-9])(?:${MANAGED_NAMES.map(escape).join("|")})(?![A-Za-z0-9])`, "i");

/** 노드 이름·부제·SW 에 관리형 제품명이 있는지. */
const namedManaged = (n: DNode): boolean =>
  [n.label, n.sub, n.attrs.sw].some((v) => typeof v === "string" && MANAGED_RE.test(v));

/**
 * 관리형으로 보는 근거. managed 칸이 예면 "attr", 칸이 비어 있고 이름이 관리형 제품명이면 "name"(관리형 표시를 붙이기 전에
 * 저장한 구성도와, AI 가 표시를 빠뜨린 노드), 아니면 null. managed 칸이 아니오면 이름과 상관없이 직접 운영하는 서버다.
 */
export function managedBasis(n: DNode): "attr" | "name" | null {
  const v = yesNo(n.attrs.managed);
  if (v === "yes") return "attr";
  if (v === "no") return null;
  return namedManaged(n) ? "name" : null;
}

/** 클라우드 사업자가 운영하는 관리형 서비스인지(attrs.managed=yes, 칸이 비었으면 제품명으로). */
export const isManaged = (n: DNode): boolean => managedBasis(n) !== null;

/** 관리형이면 여러 AZ 복제를 따로 켜야 하는 종류(RDS·Aurora·ElastiCache 등). 나머지 관리형(ALB·NLB·RDS Proxy 등)은 사업자가 이중화한다. */
export const MULTI_AZ_KINDS: readonly string[] = ["db_rdb", "db_nosql", "cache"];

/** 관리형 서비스에는 없거나 사용자가 정하지 않는 서버 칸. 빠진 정보로 묻지 않는다. */
export const SERVER_ONLY_ATTRS: ReadonlySet<string> = new Set(["hostname", "cpu", "ram", "disk", "os", "ip", "vip", "brokers"]);
