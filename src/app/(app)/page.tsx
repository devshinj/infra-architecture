import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { listProjects } from "@/server/projects";

import styles from "@/ui/app.module.css";

export default async function Home() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const projects = await listProjects(session.user.id);
  const first = projects.find((p) => p.diagrams.length > 0);
  if (first) redirect(`/p/${first.id}/d/${first.diagrams[0].id}`);
  return (
    <div className={styles.emptyState}>
      <h1>{projects.length === 0 ? "아직 프로젝트가 없어요" : "구성도가 없어요"}</h1>
      <p>
        {projects.length === 0
          ? "왼쪽 프로젝트 영역의 ‘새 프로젝트’로 시작해 보세요."
          : "프로젝트 이름 옆 메뉴에서 ‘새 구성도’를 만들어 보세요."}
      </p>
    </div>
  );
}
