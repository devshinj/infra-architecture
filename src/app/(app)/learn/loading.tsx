import { PageSkeleton } from "@/ui/skeleton/PageSkeleton";

export default function Loading() {
  return <PageSkeleton title="학습 모드" lead columns="minmax(0, 1fr)" cells={1} rows={3} />;
}
