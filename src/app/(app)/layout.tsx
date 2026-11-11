import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { listProjects } from "@/server/projects";
import { ShellProvider } from "@/ui/Shell";
import { ShellMain } from "@/ui/ShellMain";
import { Sidebar } from "@/ui/Sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const projects = await listProjects(session.user.id);
  return (
    <ShellProvider>
      <Sidebar projects={projects} userName={session.user.name ?? ""} />
      <ShellMain>{children}</ShellMain>
    </ShellProvider>
  );
}
