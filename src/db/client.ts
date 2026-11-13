import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

type Db = ReturnType<typeof makeDb>;

/** 쉬는 연결을 닫기까지의 초. 바쁠 때는 풀이 그대로 다시 쓰고, 한가하면 DB 연결 자리를 돌려준다. */
const IDLE_TIMEOUT_S = 20;

function makeDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL 이 설정되지 않았습니다");
  return drizzle(postgres(url, { idle_timeout: IDLE_TIMEOUT_S }), { schema });
}

/** db.transaction 콜백이 받는 트랜잭션 타입. */
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

/**
 * 풀은 프로세스에 하나만 둔다. 개발 서버는 HMR 때마다, 또 페이지·서버 액션·라우트 묶음마다 이 모듈을 새로 읽는데,
 * 모듈 변수에 두면 읽을 때마다 연결 10개짜리 풀이 새로 생기고 옛 풀은 닫히지 않아 DB 최대 연결(100)을 채운다.
 */
const holder = globalThis as typeof globalThis & { __infrasketchDb?: Db };

// 연결은 처음 쓸 때 만든다. import 만으로는 연결하지 않아 단위 테스트가 DB 없이 돈다.
export const db: Db = new Proxy({} as Db, {
  get(_target, prop) {
    const instance = (holder.__infrasketchDb ??= makeDb());
    const value = Reflect.get(instance, prop, instance);
    return typeof value === "function" ? value.bind(instance) : value;
  },
});
