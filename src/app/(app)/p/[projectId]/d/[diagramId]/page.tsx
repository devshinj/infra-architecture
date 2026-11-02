import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { listMessages } from "@/server/chat/messages";
import { listSessions } from "@/server/chat/sessions";
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
  const initialSessions = (await listSessions(d.id)).map((s) => ({
    id: s.id,
    nodeId: s.nodeId,
    nodeLabel: s.nodeLabel,
    title: s.title,
    updatedAt: s.updatedAt.toISOString(),
  }));
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
    />
  );
}
