import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { toGlossaryItem } from "@/domain/glossary-types";
import { ensureSeeded, listTerms } from "@/server/glossary";
import { GlossaryPage } from "@/ui/glossary/GlossaryPage";

export default async function Glossary() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const uid = session.user.id;
  await ensureSeeded(uid);
  const rows = await listTerms(uid);
  const initial = rows.map(toGlossaryItem);
  return <GlossaryPage initial={initial} />;
}
