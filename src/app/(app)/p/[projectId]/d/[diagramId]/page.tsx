import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { sessionPayload } from "@/server/chat/events";
import { listMessages } from "@/server/chat/messages";
import { listSessionPage } from "@/server/chat/sessions";
import { getNetworkKnowledge } from "@/server/network";
import { NotFoundError, getDiagram } from "@/server/projects";
import { SAMPLES } from "@/server/samples";
import { DiagramWorkspace } from "@/ui/DiagramWorkspace";
import { messagesToLines } from "@/ui/chat/lines";

export default async function DiagramPage({ params }: { params: Promise<{ projectId: string; diagramId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const { projectId, diagramId } = await params;
  let d;
  try {
    d = await getDiagram(session.user.id, diagramId);
  } catch (e) {
    if (e instanceof NotFoundError) notFound();
    throw e;
  }
  if (d.projectId !== projectId) notFound();
  const initialChat = messagesToLines(await listMessages(d.id, 100));
  // 대화 고르기는 무리(구성도 대화·노드 질문)마다 최근 50개를 먼저 보이고, 나머지는 `더 보기` 로 불러온다.
  // 망 지식(계정 공통, 처음이면 기본 항목을 넣는다). 못 읽으면 망 종류·연결 방식 예상 없이 지금처럼 보인다.
  const userId = session.user.id;
  const [diagramPage, nodePage, knowledge] = await Promise.all([
    listSessionPage(d.id, "diagram"),
    listSessionPage(d.id, "node"),
    getNetworkKnowledge(userId).catch((err) => {
      console.error("diagram page network knowledge failed", err);
      return null;
    }),
  ]);
  const initialSessions = [...diagramPage.items, ...nodePage.items].map(sessionPayload);
  const initialPaging = {
    diagram: { cursor: diagramPage.nextCursor, syncedAt: diagramPage.syncedAt },
    node: { cursor: nodePage.nextCursor, syncedAt: nodePage.syncedAt },
  };
  return (
    <DiagramWorkspace
      key={d.id}
      diagramId={d.id}
      name={d.name}
      projectName={d.projectName}
      latest={d.latest}
      initialPinned={d.pinnedPositions ?? {}}
      samples={SAMPLES}
      initialChat={initialChat}
      initialSessions={initialSessions}
      initialPaging={initialPaging}
      knowledge={knowledge}
    />
  );
}
