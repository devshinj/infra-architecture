import { expect, test } from "vitest";

import { NODE_KINDS } from "@/domain/catalog";
import { normalizeTerm } from "@/domain/explain";
import { GLOSSARY_SEED } from "@/domain/glossary-seed";

const REQUIRED = [
  "Redis", "Nginx", "Apache", "Tomcat", "MySQL", "PostgreSQL", "Oracle", "MongoDB", "Elasticsearch", "Kafka",
  "RabbitMQ", "SQS", "S3", "CDN", "WAF", "DNS", "NAT", "VPN", "VIP", "DMZ",
  "L4 로드밸런서", "L7 로드밸런서", "ALB", "NLB", "API 게이트웨이", "방화벽", "배스천", "VPC", "서브넷", "가용 영역(AZ)",
  "오토스케일링", "쿠버네티스", "인그레스", "파드", "서비스(K8s)", "컨테이너", "서버리스 함수", "Lambda", "캐시", "세션",
  "Cache-aside", "DB 복제", "Active/Standby", "DB 중계(Proxy)", "모니터링", "로깅", "CI/CD", "OAuth", "PG(결제대행)",
];

const cp = (s: string) => [...s].length;

test("fifty entries with required terms", () => {
  expect(GLOSSARY_SEED).toHaveLength(50);
  const terms = GLOSSARY_SEED.map((e) => e.term);
  for (const t of REQUIRED) expect(terms).toContain(t);
});

test("definitions within 120 chars", () => {
  for (const e of GLOSSARY_SEED) {
    expect(cp(e.definition), e.term).toBeGreaterThan(0);
    expect(cp(e.definition), e.term).toBeLessThanOrEqual(120);
    expect(cp(e.why), e.term).toBeLessThanOrEqual(120);
    expect(cp(e.compare), e.term).toBeLessThanOrEqual(120);
    expect(cp(e.term), e.term).toBeLessThanOrEqual(40);
    expect(cp(e.fullName), e.term).toBeLessThanOrEqual(80);
    expect(cp(e.category), e.term).toBeGreaterThan(0);
    expect(cp(e.category), e.term).toBeLessThanOrEqual(80);
    // 사전식 한 문장: 마침표로 끝나고 중간에 문장이 끊기지 않는다.
    expect(e.definition.endsWith("."), e.term).toBe(true);
    expect(e.definition.slice(0, -1).includes(". "), e.term).toBe(false);
  }
});

test("aliases are normalized", () => {
  for (const e of GLOSSARY_SEED) {
    for (const a of e.aliases) {
      expect(a, e.term).toBe(normalizeTerm(a));
      expect(a, e.term).not.toBe("");
    }
  }
  // 사전 개념이 있는 노드 종류는 한국어 이름으로 바로 찾을 수 있다.
  const reachable = new Set(GLOSSARY_SEED.flatMap((e) => [normalizeTerm(e.term), ...e.aliases]));
  const mapped = [
    "dns", "cdn", "waf", "firewall", "lb_l4", "lb_l7", "api_gateway", "nat", "vpn", "was", "bastion",
    "k8s_cluster", "k8s_ingress", "k8s_service", "k8s_pod", "function", "cache", "db_proxy",
    "monitoring", "logging", "ci_cd", "external_pg",
  ];
  for (const kind of mapped) {
    const label = NODE_KINDS.find((k) => k.kind === kind)!.labelKo;
    expect(reachable.has(normalizeTerm(label)), label).toBe(true);
  }
});

test("no duplicate keys", () => {
  const seen = new Map<string, string>();
  for (const e of GLOSSARY_SEED) {
    for (const k of new Set([normalizeTerm(e.term), ...e.aliases])) {
      expect(seen.get(k), `${k} in ${e.term}`).toBeUndefined();
      seen.set(k, e.term);
    }
  }
});
