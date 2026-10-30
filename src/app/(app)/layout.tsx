import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { listProjects } from "@/server/projects";
import { ShellProvider } from "@/ui/Shell";
import { Sidebar } from "@/ui/Sidebar";

import styles from "@/ui/app.module.css";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const projects = await listProjects(session.user.id);
  return (
    <ShellProvider>
      <Sidebar projects={projects} userName={session.user.name ?? ""} />
      <div className={styles.main}>{children}</div>
    </ShellProvider>
  );
}
