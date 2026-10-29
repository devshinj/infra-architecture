import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { listMessages } from "@/server/chat/messages";
import { NotFoundError, getDiagram } from "@/server/projects";
import { SAMPLES } from "@/server/samples";
import { DiagramWorkspace } from "@/ui/DiagramWorkspace";

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
  const initialChat = (await listMessages(d.id, 100)).map((m) => ({
    id: m.id,
    kind: m.role,
    text: m.content,
    meta: m.meta,
  }));
  return (
    <DiagramWorkspace
      key={d.id}
      diagramId={d.id}
      name={d.name}
      latest={d.latest}
      initialPinned={d.pinnedPositions ?? {}}
      samples={SAMPLES}
      initialChat={initialChat}
    />
  );
}
