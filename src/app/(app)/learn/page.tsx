import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { GUIDE_LIST, getGuide, guideEnvs } from "@/domain/guides";
import { stepCount } from "@/domain/guides/progress";
import { guideSummary, guideView } from "@/domain/guides/view";
import { listGuideRuns } from "@/server/guide/runs";
import { type GuideRunRow, GuidePicker } from "@/ui/guide/GuidePicker";

/** 학습 모드: 주제 고르기와 진행 중·끝낸 학습. 그만둔 학습(quit)은 일반 구성도라 보이지 않는다. */
export default async function Learn() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const runs = await listGuideRuns(session.user.id);
  const rows: GuideRunRow[] = runs.flatMap((r) => {
    const guide = getGuide(r.guideId);
    if (!guide || r.status === "quit") return [];
    const c = stepCount(guideView(r, guide));
    const progress = r.status === "done" ? "완료" : c ? `${c.n} / ${c.total}` : "환경 고르기 전";
    return [{ diagramId: r.diagramId, href: `/p/${r.projectId}/d/${r.diagramId}`, name: r.diagramName, status: r.status, progress }];
  });
  rows.sort((a, b) => a.name.localeCompare(b.name, "ko", { numeric: true }));
  return <GuidePicker guides={GUIDE_LIST.filter((g) => guideEnvs(g).length > 0).map(guideSummary)} runs={rows} />;
}
