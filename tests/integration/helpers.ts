import { randomUUID } from "node:crypto";

import { db } from "@/db/client";
import { diagrams, projects, users } from "@/db/schema";
import { withDiagramLock } from "@/server/chat/lock";

export async function makeOwnedDiagram(): Promise<{ userId: string; diagramId: string }> {
  const tag = randomUUID().slice(0, 8);
  const [user] = await db
    .insert(users)
    .values({ username: `u-${tag}`, email: `${tag}@example.com`, passwordHash: "x" })
    .returning({ id: users.id });
  const [project] = await db
    .insert(projects)
    .values({ ownerId: user.id, name: "p" })
    .returning({ id: projects.id });
  const [diagram] = await db
    .insert(diagrams)
    .values({ projectId: project.id, name: "d" })
    .returning({ id: diagrams.id });
  return { userId: user.id, diagramId: diagram.id };
}

export async function makeDiagram(): Promise<string> {
  return (await makeOwnedDiagram()).diagramId;
}

/**
 * 구성도 잠금을 쥔 채 멈춰 둔다(도는 중인 대화 차례 흉내). 잠금 안에 들어간 뒤에 돌아오므로 시간을 재며 기다리지 않는다.
 * 끝나면 release 를 불러 풀고, 잠금이 다 풀릴 때까지 기다린다.
 */
export async function holdDiagramLock(diagramId: string): Promise<{ release: () => Promise<void> }> {
  let open!: () => void;
  const gate = new Promise<void>((r) => (open = r));
  let entered!: () => void;
  const inside = new Promise<"inside">((r) => (entered = () => r("inside")));
  const held = withDiagramLock(diagramId, async () => {
    entered();
    await gate;
  });
  if ((await Promise.race([inside, held])) !== "inside") throw new Error(`구성도 ${diagramId} 의 잠금을 잡지 못했다`);
  return {
    release: async () => {
      open();
      await held;
    },
  };
}
