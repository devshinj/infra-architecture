import "@testing-library/jest-dom/vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
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

test("definition is exposed via data-def and a focus rule exists", () => {
  const { container } = render(<TermText text="Nginx 사용" terms={terms} />);
  expect(container.querySelector("abbr.term")).toHaveAttribute("data-def", "웹 서버 겸 리버스 프록시");
  const css = readFileSync(join(process.cwd(), "src/ui/panel.module.css"), "utf8");
  expect(css).toMatch(/abbr\.term\):focus-visible::after/);
  expect(css).toMatch(/content: attr\(data-def\)/);
});

test("Latin terms need word boundaries but Korean particles still match", () => {
  const t = [{ key: "os", term: "OS", definition: "운영체제" }, { key: "was", term: "WAS", definition: "앱 서버" }];
  const { container } = render(<p><TermText text="hostname 과 OS, WAS를 본다" terms={t} /></p>);
  const abbrs = [...container.querySelectorAll("abbr.term")].map((a) => a.textContent);
  expect(abbrs).toEqual(["OS", "WAS"]);
});

test("special-character terms match literally", () => {
  const t = [
    { key: "c++", term: "C++", definition: "a" },
    { key: ".net", term: ".NET", definition: "b" },
    { key: "cicd", term: "CI/CD", definition: "c" },
    { key: "가용영역(az)", term: "가용 영역(AZ)", definition: "d" },
  ];
  const { container } = render(<p><TermText text="C++ 와 .NET, CI/CD, 가용 영역(AZ) 사용" terms={t} /></p>);
  expect([...container.querySelectorAll("abbr.term")].map((a) => a.textContent)).toEqual(["C++", ".NET", "CI/CD", "가용 영역(AZ)"]);
});
