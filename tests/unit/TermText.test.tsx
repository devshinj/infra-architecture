import "@testing-library/jest-dom/vitest";
import { cleanup, render } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";

import { TermText } from "@/ui/explain/TermText";

afterEach(cleanup);

const terms = [
  { key: "nginx", term: "Nginx", definition: "웹 서버 겸 리버스 프록시" },
  { key: "프록시", term: "프록시", definition: "대신 전달해 주는 중계" },
  { key: "리버스프록시", term: "리버스 프록시", definition: "서버 앞에서 요청을 받아 넘기는 프록시" },
];

test("TermText wraps longest match and shows definition", () => {
  const { container } = render(<p><TermText text="nginx 는 리버스 프록시 역할" terms={terms} /></p>);
  const abbrs = container.querySelectorAll("abbr.term");
  expect(abbrs).toHaveLength(2);
  expect(abbrs[0]).toHaveTextContent("nginx");
  expect(abbrs[0]).toHaveAttribute("title", "웹 서버 겸 리버스 프록시");
  expect(abbrs[1]).toHaveTextContent("리버스 프록시");
  expect(abbrs[1]).toHaveAttribute("tabindex", "0");
  expect(container.querySelector("p")?.textContent).toBe("nginx 는 리버스 프록시 역할");
});

test("own term not wrapped", () => {
  const { container } = render(<p><TermText text="Nginx 는 프록시" terms={terms} exclude="nginx" /></p>);
  const abbrs = container.querySelectorAll("abbr.term");
  expect(abbrs).toHaveLength(1);
  expect(abbrs[0]).toHaveTextContent("프록시");
});

test("single-character terms are ignored", () => {
  const { container } = render(<TermText text="a b" terms={[{ key: "a", term: "a", definition: "x" }]} />);
  expect(container.querySelector("abbr")).toBeNull();
});
