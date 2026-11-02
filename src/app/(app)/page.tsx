import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { lastActiveDiagram, listProjects } from "@/server/projects";
import { CreateButton } from "@/ui/Shell";

import styles from "@/ui/app.module.css";

export default async function Home() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  // 이어서 작업하던 구성도로 보낸다(가장 최근에 손댄 것).
  const last = await lastActiveDiagram(session.user.id);
  if (last) redirect(`/p/${last.projectId}/d/${last.id}`);
  const projects = await listProjects(session.user.id);
  if (projects.length === 0) {
    return (
      <div className={styles.emptyState}>
        <h1>아직 프로젝트가 없어요</h1>
        <p>프로젝트는 하나의 서비스(예: 쇼핑몰)를 담는 폴더예요.</p>
        <p>만들면 빈 구성도가 하나 함께 생기고, 대화로 설명하거나 샘플을 불러와 그릴 수 있어요.</p>
        <div className={styles.emptyActions}>
          <CreateButton>첫 프로젝트 만들기</CreateButton>
        </div>
      </div>
    );
  }
  const first = projects[0];
  return (
    <div className={styles.emptyState}>
      <h1>구성도가 없어요</h1>
      <p>구성도는 프로젝트 안에 그리는 한 장의 그림이에요. 운영·개발처럼 나눠 여러 장 둘 수 있어요.</p>
      <div className={styles.emptyActions}>
        <CreateButton projectId={first.id}>{`‘${first.name}’에 구성도 만들기`}</CreateButton>
      </div>
    </div>
  );
}
