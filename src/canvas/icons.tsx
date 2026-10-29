import type { Category } from "@/domain/catalog";

// 16x16 monoline paths, copied from the approved design reference.
const PATHS: Record<Category, React.ReactNode> = {
  client: (
    <>
      <circle cx="8" cy="5" r="3" />
      <path d="M2.5 15c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5" />
    </>
  ),
  network: <path d="M2 8h12M10 4l4 4-4 4M6 4 2 8l4 4" />,
  compute: (
    <>
      <rect x="2" y="2.5" width="12" height="4.5" rx="1" />
      <rect x="2" y="9" width="12" height="4.5" rx="1" />
      <path d="M4.5 4.75h.01M4.5 11.25h.01" />
    </>
  ),
  data: (
    <>
      <ellipse cx="8" cy="3.5" rx="5.5" ry="2" />
      <path d="M2.5 3.5v9c0 1.1 2.5 2 5.5 2s5.5-.9 5.5-2v-9M2.5 8c0 1.1 2.5 2 5.5 2s5.5-.9 5.5-2" />
    </>
  ),
  external: <path d="M9 2h5v5M14 2 7.5 8.5M12 9.5V14H2V4h4.5" />,
};

export function CategoryIcon({ category }: { category: Category }) {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.3}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      data-category={category}
    >
      {PATHS[category]}
    </svg>
  );
}
