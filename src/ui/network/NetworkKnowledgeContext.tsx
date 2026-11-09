"use client";

import { createContext, type ReactNode, useContext } from "react";

import type { NetworkKnowledge } from "@/domain/network";

// 계정 공통 망 지식을 구성도 화면 안 어디서나 읽게 한다. 없으면(못 읽었거나 감싸지 않았으면) null 이고,
// 그때 화면은 망 지식이 생기기 전과 똑같다.
const Ctx = createContext<NetworkKnowledge | null>(null);

export function NetworkKnowledgeProvider({ value, children }: { value: NetworkKnowledge | null; children: ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useNetworkKnowledge(): NetworkKnowledge | null {
  return useContext(Ctx);
}
