"use client";

import styles from "./app.module.css";
import { useShell } from "./Shell";
import { WorkspaceSkeleton } from "./skeleton/WorkspaceSkeleton";

/**
 * 앱 셸의 본문 자리. 사이드바에서 다른 구성도를 고르면 새 화면이 올 때까지 지금 화면을 감추고 작업 화면 뼈대를 보인다.
 * 구성도 경로에 loading.tsx 를 두지 않는 까닭: 구성도를 고치는 서버 동작의 revalidatePath 새로 그리기가 그 경계에 걸려 끝나지 않고,
 * 남의 구성도 주소가 404 대신 200 으로 나간다. 그래서 뼈대는 이동하는 동안에만 클라이언트에서 덮는다.
 */
export function ShellMain({ children }: { children: React.ReactNode }) {
  const { navigating } = useShell();
  return (
    <main className={styles.main} data-navigating={navigating || undefined}>
      {children}
      {navigating && (
        <div className={styles.navSkeleton}>
          <WorkspaceSkeleton />
        </div>
      )}
    </main>
  );
}
