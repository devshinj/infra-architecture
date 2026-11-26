import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  AUTH_SECRET: z.string().min(1),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
  QWEN_CODER_KEY: z.string().optional(),
  QWEN_MODEL: z.string().default("qwen3.8-flash-next"),
  QWEN_API_URL: z.string().optional(),
  CLEF_API_KEY: z.string().optional(),
  CLEF_API_URL: z.string().default("http://192.168.102.105:30000"),
  CLEF_MAX_CONCURRENCY: z.coerce.number().int().positive().default(2),
  APP_URL: z.string().default("http://localhost:3000"),
  /** 앞단 프록시 수. 주면 x-forwarded-for 를 오른쪽에서 그만큼 세고(0 이면 헤더를 믿지 않는다), 없으면 첫 값을 믿는다. */
  TRUSTED_PROXY_HOPS: z.coerce.number().int().min(0).optional(),
  /** 메일 서버 없이 운영할 때, 재설정 링크를 서버 로그에 찍는다. 개발·테스트에서는 켜지 않아도 찍는다. */
  RESET_LINK_LOG: z
    .string()
    .optional()
    .transform((v) => v === "1" || v === "true"),
});

export type Env = z.infer<typeof envSchema>;

export function parseEnv(raw: Record<string, string | undefined>): Env {
  // 빈 문자열은 값이 없는 것과 같게 취급한다 (.env.example 이 모든 키를 빈 값으로 나열함).
  const cleaned = Object.fromEntries(
    Object.entries(raw).filter(([, value]) => value !== "")
  );
  const result = envSchema.safeParse(cleaned);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`환경변수 검증 실패: ${issues}`);
  }
  return result.data;
}

export const AUTH_SECRET_MIN = 32;

/**
 * 운영(`NODE_ENV=production`)으로 서버를 켤 때만 보는 것. errors 가 있으면 켜지 않는다(src/instrumentation.ts).
 * 스키마에 넣지 않은 까닭: 스키마는 `next build` 때도 읽혀서, 여기서 막으면 비밀값 없이 빌드할 수 없다.
 */
export function productionChecks(raw: Record<string, string | undefined>): { errors: string[]; warnings: string[] } {
  const has = (key: string) => (raw[key] ?? "") !== "";
  const errors: string[] = [];
  const warnings: string[] = [];
  if ((raw.AUTH_SECRET ?? "").length < AUTH_SECRET_MIN) {
    errors.push(`AUTH_SECRET 은 ${AUTH_SECRET_MIN}자 이상이어야 합니다. 짧으면 로그인 토큰을 맞혀 볼 수 있습니다. \`npx auth secret\` 으로 만드세요.`);
  }
  if (!has("APP_URL")) {
    errors.push("APP_URL 이 없습니다. 없으면 재설정 메일과 MCP 응답의 링크가 http://localhost:3000 으로 나갑니다.");
  }
  if (!has("SMTP_HOST") && raw.RESET_LINK_LOG !== "1" && raw.RESET_LINK_LOG !== "true") {
    warnings.push("SMTP_HOST 가 없어 비밀번호 재설정 메일을 보내지 못합니다. 메일 서버 없이 쓰려면 RESET_LINK_LOG=1 로 링크를 로그에 남기세요.");
  }
  if (!has("TRUSTED_PROXY_HOPS")) {
    warnings.push("TRUSTED_PROXY_HOPS 가 없어 x-forwarded-for 의 첫 값을 요청한 쪽 IP 로 믿습니다. 앞단 프록시 수를 넣으세요(프록시가 없으면 0).");
  }
  return { errors, warnings };
}

export const env = parseEnv(process.env);
