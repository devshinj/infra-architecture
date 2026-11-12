import type { DNode } from "./types";

const YES = ["yes", "true", "y", "1", "예", "네"];
const NO = ["no", "false", "n", "0", "아니오", "아니요"];

/** 예/아니오 칸(managed·multi_az) 값 읽기. 모르거나 알아볼 수 없으면 null. */
export function yesNo(v: unknown): "yes" | "no" | null {
  if (v === undefined || v === null) return null;
  const s = String(v).trim().toLowerCase();
  return YES.includes(s) ? "yes" : NO.includes(s) ? "no" : null;
}

/** 클라우드 사업자가 운영하는 관리형 서비스(attrs.managed=yes)인지. */
export const isManaged = (n: DNode): boolean => yesNo(n.attrs.managed) === "yes";

/** 관리형 서비스에는 없거나 사용자가 정하지 않는 서버 칸. 빠진 정보로 묻지 않는다. */
export const SERVER_ONLY_ATTRS: ReadonlySet<string> = new Set(["hostname", "cpu", "ram", "disk", "os", "ip", "vip", "brokers"]);
