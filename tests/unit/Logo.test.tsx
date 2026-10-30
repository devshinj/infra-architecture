import "@testing-library/jest-dom/vitest";
import { cleanup, render } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";

import { Logo, LogoMark } from "@/ui/brand/Logo";

afterEach(cleanup);

test("logo reads as the service name and hides the mark", () => {
  const { container } = render(<Logo />);
  expect(container.firstElementChild).toHaveTextContent("InfraSketch");
  expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
});

test("mark paints only with design tokens", () => {
  const { container } = render(<LogoMark size={36} />);
  const painted = container.querySelectorAll("[fill], [stroke]");
  expect(painted.length).toBeGreaterThan(0);
  for (const el of painted) {
    for (const attr of ["fill", "stroke"]) {
      const v = el.getAttribute(attr);
      if (v !== null) expect(v).toMatch(/^(none|var\(--[a-z-]+\))$/);
    }
  }
});
