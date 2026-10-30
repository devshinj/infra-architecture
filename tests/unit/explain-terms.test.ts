import { expect, test } from "vitest";

import { normalizeTerm, termCandidates } from "@/domain/explain";
import type { DNode } from "@/domain/types";

test("normalizeTerm examples", () => {
  expect(normalizeTerm("Tomcat 10")).toBe("tomcat");
  expect(normalizeTerm("L4 로드밸런서")).toBe("l4로드밸런서");
  expect(normalizeTerm("Redis 7.2")).toBe("redis");
  expect(normalizeTerm("CI/CD")).toBe("cicd");
  expect(normalizeTerm("Cache-aside")).toBe("cacheaside");
  expect(normalizeTerm("node_js")).toBe("nodejs");
  expect(normalizeTerm("Nginx-1.25.3")).toBe("nginx");
  expect(normalizeTerm("PostgreSQL 16.2")).toBe("postgresql");
  // 붙어 있는 숫자는 이름의 일부다(버전이 아님).
  expect(normalizeTerm("L4")).toBe("l4");
  expect(normalizeTerm("S3")).toBe("s3");
  expect(normalizeTerm("  ")).toBe("");
});

const node = (over: Partial<DNode>): DNode => ({
  id: "n1",
  kind: "cache",
  label: "캐시",
  parent: null,
  attrs: {},
  ...over,
});

test("candidates prefer sw then sub then kind name", () => {
  expect(termCandidates(node({ sub: "Redis", attrs: { sw: "Redis 7.2" } }))).toEqual([
    { key: "redis", display: "Redis 7.2", origin: "sw" },
    { key: "캐시", display: "캐시", origin: "kind" },
  ]);
  expect(termCandidates(node({ kind: "was", sub: "Tomcat", attrs: { sw: "Apache Tomcat 10" } }))).toEqual([
    { key: "apachetomcat", display: "Apache Tomcat 10", origin: "sw" },
    { key: "tomcat", display: "Tomcat", origin: "sub" },
    { key: "was", display: "WAS", origin: "kind" },
  ]);
  expect(termCandidates(node({ kind: "lb_l4", sub: "  ", attrs: { sw: null } }))).toEqual([
    { key: "l4로드밸런서", display: "L4 로드밸런서", origin: "kind" },
  ]);
});
