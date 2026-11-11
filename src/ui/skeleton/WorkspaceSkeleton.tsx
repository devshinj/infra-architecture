import { TABS } from "@/ui/panelTabs";

import app from "@/ui/app.module.css";

import { ChatSkeleton, Loading, SkeletonBlock, SkeletonLines, skeletonStyles as s } from "./Skeleton";

/**
 * 사이드바에서 다른 구성도로 넘어가는 동안(ShellMain 이 덮는다). 작업 화면과 같은 틀(점 격자 캔버스 + 떠 있는 오른쪽 패널)에
 * 빈 도면 한 장(영역 윤곽과 노드 자리)과 대화 줄 자리를 점선으로 그린다. 좁은 화면에서는 캔버스만 보인다(data-mview).
 */
export function WorkspaceSkeleton() {
  return (
    <Loading label="구성도를 불러오는 중" className={app.workspace} data-mview="canvas">
      <div className={`${app.center} dot-grid`}>
        <div className={s.stage}>
          <div className={s.sheet}>
            <SkeletonBlock shape="control" className={s.node} i={0} />
            <SkeletonBlock className={s.zone} i={1}>
              <SkeletonLines widths={["56px"]} start={1} className={s.zoneLabel} />
              <SkeletonBlock shape="control" className={s.node} i={2} />
              <span className={s.zoneRow}>
                <SkeletonBlock className={s.zone} i={3}>
                  <SkeletonLines widths={["48px"]} start={3} className={s.zoneLabel} />
                  <SkeletonBlock shape="control" className={s.node} i={4} />
                </SkeletonBlock>
                <SkeletonBlock className={s.zone} i={4}>
                  <SkeletonLines widths={["48px"]} start={4} className={s.zoneLabel} />
                  <SkeletonBlock shape="control" className={s.node} i={5} />
                </SkeletonBlock>
              </span>
            </SkeletonBlock>
          </div>
        </div>
      </div>
      <div className={app.panelDock}>
        <div className={app.panel}>
          <div className={app.tabs}>
            {TABS.map((t, i) => (
              <span key={t} className={`${s.tabLabel} ${i === 0 ? s.tabCurrent : ""}`}>
                {t}
              </span>
            ))}
          </div>
          <div className={s.chat}>
            <ChatSkeleton />
          </div>
          <span className={s.panelFill} />
          <SkeletonBlock shape="control" className={s.composer} i={6} />
        </div>
      </div>
    </Loading>
  );
}
