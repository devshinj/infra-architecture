import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { listNetworkRules, listNetworkTypes } from "@/server/network";
import { NetworkKnowledgePage } from "@/ui/network/NetworkKnowledgePage";

export default async function NetworkKnowledge() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const uid = session.user.id;
  const types = await listNetworkTypes(uid);
  const rules = await listNetworkRules(uid);
  return <NetworkKnowledgePage initialTypes={types} initialRules={rules} />;
}
