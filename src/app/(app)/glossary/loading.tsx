import { PageSkeleton } from "@/ui/skeleton/PageSkeleton";

// 열 너비·이름은 GlossaryPage 범례표(glossary.module.css .legendHead)와 같다.
export default function Loading() {
  return (
    <PageSkeleton
      title="용어 사전"
      tools
      notes
      columns="minmax(130px, 1fr) minmax(140px, 1fr) minmax(0, 3fr) max-content"
      cells={4}
      head={["용어", "분류", "한 줄 설명", "출처"]}
    />
  );
}
