import { randomUUID } from "node:crypto";

import { db } from "@/db/client";
import { diagrams, projects, users } from "@/db/schema";

export async function makeDiagram(): Promise<string> {
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
  return diagram.id;
}
