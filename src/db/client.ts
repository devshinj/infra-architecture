import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

type Db = ReturnType<typeof makeDb>;

function makeDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL 이 설정되지 않았습니다");
  return drizzle(postgres(url), { schema });
}

let instance: Db | undefined;

// 연결은 처음 쓸 때 만든다. import 만으로는 연결하지 않아 단위 테스트가 DB 없이 돈다.
export const db: Db = new Proxy({} as Db, {
  get(_target, prop) {
    instance ??= makeDb();
    const value = Reflect.get(instance, prop, instance);
    return typeof value === "function" ? value.bind(instance) : value;
  },
});
