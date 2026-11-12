import { expect, test } from "vitest";

import { isManaged, managedBasis } from "@/domain/managed";
import type { DNode } from "@/domain/types";

const n = (label: string, attrs: DNode["attrs"] = {}, sub?: string): DNode => ({ id: "x", kind: "lb_l7", label, parent: null, attrs, ...(sub ? { sub } : {}) });

test("managed 칸이 예면 attr, 아니오면 이름과 상관없이 직접 운영", () => {
  expect(managedBasis(n("사내 LB", { managed: "yes" }))).toBe("attr");
  expect(managedBasis(n("ALB", { managed: "예" }))).toBe("attr");
  expect(managedBasis(n("ALB", { managed: "no" }))).toBeNull();
});

test("칸이 비면 이름·부제·SW 의 관리형 제품명으로 알아본다", () => {
  for (const label of ["ALB", "ALB로", "외부 NLB", "RDS MySQL", "Aurora PostgreSQL", "ElastiCache", "Amazon DynamoDB", "Cloud SQL", "Azure SQL Database", "Cosmos DB", "Cloud DB for MySQL", "S3"]) {
    expect(managedBasis(n(label)), label).toBe("name");
  }
  expect(managedBasis(n("세션 캐시", {}, "Amazon ElastiCache"))).toBe("name");
  expect(managedBasis(n("주문 DB", { sw: "Amazon RDS for MySQL" }))).toBe("name");
});

test("직접 설치해도 같은 이름이거나 뜻이 갈리는 이름은 관리형으로 보지 않는다", () => {
  for (const label of ["Redis", "MySQL", "Nginx", "L4", "ALBUM 서버", "RDSX", "SNS 로그인", "사내 LB", "Kafka"]) {
    expect(isManaged(n(label)), label).toBe(false);
  }
});
