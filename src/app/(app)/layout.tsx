import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { learnBadges } from "@/server/guide/runs";
import { listProjects } from "@/server/projects";
import { ShellProvider } from "@/ui/Shell";
import { ShellMain } from "@/ui/ShellMain";
import { Sidebar } from "@/ui/Sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  // 학습 중인 구성도에는 사이드바 줄에 "학습 3/12" 배지를 붙인다. 진행 상태를 못 읽으면 배지 없이 그린다.
  const [projects, badges] = await Promise.all([listProjects(session.user.id), learnBadges(session.user.id)]);
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
