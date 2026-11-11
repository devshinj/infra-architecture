import { PageSkeleton } from "@/ui/skeleton/PageSkeleton";

export default function Loading() {
  return <PageSkeleton title="망 지식" lead notes columns="minmax(0, 2fr) minmax(0, 1fr)" cells={2} rows={6} />;
}
