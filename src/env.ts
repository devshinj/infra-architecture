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

export const env = parseEnv(process.env);
