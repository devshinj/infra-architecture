import { notFound } from "next/navigation";

import { EdgePanels } from "./EdgePanels";

// Dev-only visual check for the edge layer (fork / merge / diamond / kinds). Not shipped.
export default function DevEdgesPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <EdgePanels />;
}
