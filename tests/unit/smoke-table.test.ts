import { describe, expect, it } from "vitest";
import { accuracy, formatTable } from "../../scripts/smoke-table";

describe("smoke-table", () => {
  it("열 너비를 맞춰 표를 만든다", () => {
    const t = formatTable(["a", "bb"], [["xxx", "1"]]).split("\n");
    expect(t[0]).toBe("a   | bb");
    expect(t[1]).toBe("----+---");
    expect(t[2]).toBe("xxx | 1 ");
  });
  it("한글은 두 칸으로 센다", () => {
    const t = formatTable(["이름"], [["ab"]]).split("\n");
    expect(t[2]).toBe("ab  ");
  });
  it("정답률", () => {
    expect(accuracy([true, false, true, true])).toBe("3/4 (75%)");
    expect(accuracy([])).toBe("0/0 (0%)");
  });
});
