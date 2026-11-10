import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { listMcpKeys } from "@/server/mcpKeys";
import { McpKeysPage } from "@/ui/mcp/McpKeysPage";

export default async function ClaudeCodeConnection() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const keys = await listMcpKeys(session.user.id);
  return (
    <McpKeysPage
      initialKeys={keys.map((k) => ({
        id: k.id,
        name: k.name,
        prefix: k.prefix,
        createdAt: k.createdAt.toISOString(),
        lastUsedAt: k.lastUsedAt ? k.lastUsedAt.toISOString() : null,
      }))}
    />
  );
}
