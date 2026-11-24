import { afterEach, vi } from "vitest";

// 단위 테스트(node·jsdom)는 DB 에 붙지 않는다. .env 의 개발 DB 주소가 있어도 닿지 않게 접속할 수 없는 주소로 덮고,
// 드라이버를 부르는 순간을 잡아 그 테스트를 실패시킨다(호출한 쪽이 오류를 .catch 로 삼켜도 드러난다).
// DB 를 쓰는 서버 모듈(@/server/network, @/server/glossary 등)은 테스트에서 vi.mock 으로 모의한다.
// 통합 테스트는 이 파일을 읽지 않는다(tests/integration/setup.ts 가 _test DB 를 쓴다).
process.env.DATABASE_URL = "postgres://unit:unit@127.0.0.1:1/unit-tests-do-not-connect";

const touched = vi.hoisted(() => ({ stacks: [] as string[] }));

vi.mock("postgres", () => ({
  default: () => {
    const err = new Error("단위 테스트가 DB 에 붙으려 했다. DB 를 쓰는 서버 모듈을 vi.mock 으로 모의하세요.");
    touched.stacks.push(err.stack ?? err.message);
    throw err;
  },
}));

afterEach(() => {
  const stacks = touched.stacks.splice(0);
  if (stacks.length > 0) throw new Error(`단위 테스트가 DB 에 ${stacks.length}번 붙으려 했다.\n${stacks[0]}`);
});
