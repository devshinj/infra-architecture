"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { quitGuideAction, startGuideAction } from "@/app/(app)/actions";
import type { GuideEnv } from "@/domain/guides/types";
import type { GuideView } from "@/domain/guides/view";

import type { ChatLine } from "../chat/useChatTurn";
import { GENERIC_ERROR } from "../dialogs";

export interface UseGuideArgs {
  diagramId: string;
  /** 서버가 그린 진행 상태(page 의 liveGuideView). 서버가 다시 그릴 때마다 새 값이 온다. */
  initial: GuideView | null;
  /** 서버가 그린 기본 대화 줄(page 의 messagesToLines). 서버가 다시 그릴 때마다 새 배열이 온다. */
  serverLines: ChatLine[];
  /** 대화 차례가 도는 중(그동안은 대화 줄을 바꾸지 않는다). */
  busy: boolean;
  /** 기본 대화 줄을 통째로 바꾼다(useChatTurn.replaceLines). */
  replaceLines?(lines: ChatLine[]): void;
}

/**
 * 구성도 화면의 학습 상태. 단계 카드가 쓰는 진행 상태(view)를 서버 값·`guide` 이벤트·되돌리기 결과로 맞추고,
 * 그만두기·다른 환경으로 다시 만들기를 한다.
 *
 * 해설 칩(notes)·완료 판(outro·otherEnv·rebuild)은 저장된 메시지의 meta.guide 에만 있다(`guide` 이벤트는 진행 상태만 싣는다).
 * 그래서 학습 차례가 끝나면(그리고 그만두면) 다음 서버 그리기(차례 끝 router.refresh)가 가져온 저장된 대화 줄로
 * 기본 대화를 한 번 바꾼다. 새로 고친 화면과 같은 줄이 된다.
 */
export function useGuide({ diagramId, initial, serverLines, busy, replaceLines }: UseGuideArgs) {
  const router = useRouter();
  const [view, setView] = useState<GuideView | null>(initial);
  // 서버가 새 진행 상태를 그리면 그것을 따른다(새로 고침·다른 탭·되돌리기 뒤 router.refresh).
  const [prevInitial, setPrevInitial] = useState(initial);
  if (initial !== prevInitial) {
    setPrevInitial(initial);
    setView(initial);
  }

  // 대화 줄을 바꿀 차례: 그때의 서버 줄(이 배열과 다른 새 배열이 오면 바꾼다). null 이면 기다리지 않는다.
  const reloadFrom = useRef<ChatLine[] | null>(null);
  const serverLinesRef = useRef(serverLines);
  useEffect(() => {
    serverLinesRef.current = serverLines;
  });
  const reloadChat = useCallback(() => {
    reloadFrom.current = serverLinesRef.current;
  }, []);
  useEffect(() => {
    const from = reloadFrom.current;
    if (from === null || busy || serverLines === from) return;
    reloadFrom.current = null;
    replaceLines?.(serverLines);
  }, [serverLines, busy, replaceLines]);

  /** `guide` 이벤트: 카드를 곧바로 다음 단계로, 대화는 서버 그리기 뒤 저장된 줄로. */
  const onEvent = useCallback(
    (v: GuideView) => {
      setView(v);
      reloadChat();
    },
    [reloadChat],
  );

  /** 되돌리기 결과(restoreVersionAction().guide): 그 버전의 단계로 카드를 맞춘다. */
  const onRestored = useCallback((v: GuideView | undefined) => {
    if (v) setView(v);
  }, []);

  /** 학습 그만두기. 성공하면 카드를 내리고, 서버가 남긴 안내 줄을 보이게 대화를 다시 그린다. */
  const quit = useCallback(async (): Promise<string | void> => {
    reloadChat();
    try {
      const r = await quitGuideAction(diagramId);
      if (!r.ok) {
        reloadFrom.current = null;
        return r.error;
      }
    } catch {
      reloadFrom.current = null;
      return GENERIC_ERROR;
    }
    setView((v) => (v ? { ...v, status: "quit", current: null } : v));
    router.refresh();
  }, [diagramId, reloadChat, router]);

  /** 완료 판의 「<환경>으로 다시 만들기」: 같은 주제를 그 환경으로 새 구성도에 시작하고 연다. */
  const guideId = view?.guideId ?? null;
  const rebuild = useCallback(
    async (env: GuideEnv): Promise<string | void> => {
      if (!guideId) return GENERIC_ERROR;
      try {
        const r = await startGuideAction(guideId, env);
        if (!r.ok) return r.error;
        router.push(`/p/${r.projectId}/d/${r.diagramId}`);
      } catch {
        return GENERIC_ERROR;
      }
    },
    [guideId, router],
  );

  return { view, learning: view?.status === "active", onEvent, onRestored, quit, rebuild };
}
