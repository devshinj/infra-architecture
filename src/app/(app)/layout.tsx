import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getGuide } from "@/domain/guides";
import { learnBadge } from "@/domain/guides/progress";
import { guideView } from "@/domain/guides/view";
import { listGuideRuns } from "@/server/guide/runs";
import { listProjects } from "@/server/projects";
import { ShellProvider } from "@/ui/Shell";
import { ShellMain } from "@/ui/ShellMain";
import { Sidebar } from "@/ui/Sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const [projects, runs] = await Promise.all([listProjects(session.user.id), listGuideRuns(session.user.id)]);
  // 학습 중인 구성도에는 사이드바 줄에 "학습 3/12" 배지를 붙인다.
  const badges = new Map<string, string>();
  for (const r of runs) {
    const guide = r.status === "active" ? getGuide(r.guideId) : undefined;
    if (guide) badges.set(r.diagramId, learnBadge(guideView(r, guide)));
  }
  const withBadges = projects.map((p) => ({
    ...p,
    diagrams: p.diagrams.map((d) => {
      const learning = badges.get(d.id);
      return learning ? { ...d, learning } : d;
    }),
  }));
  return (
    <ShellProvider>
      <Sidebar projects={withBadges} userName={session.user.name ?? ""} />
      <ShellMain>{children}</ShellMain>
    </ShellProvider>
  );
}
