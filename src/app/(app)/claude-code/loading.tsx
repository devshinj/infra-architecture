import { PageSkeleton } from "@/ui/skeleton/PageSkeleton";

// 열 이름은 McpKeysPage 키 목록 표와 같다.
export default function Loading() {
  return (
    <PageSkeleton
      title="Claude Code 연결"
      lead
      tools
      columns="minmax(0, 2fr) minmax(0, 1fr) minmax(0, 1fr) max-content"
      cells={4}
      head={["이름", "앞 8글자", "만든 날", "마지막 사용"]}
      rows={3}
    />
  );
}
