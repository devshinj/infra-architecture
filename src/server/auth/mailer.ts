import nodemailer from "nodemailer";

import { env } from "@/env";

/** SMTP_HOST 가 있을 때만 보낸다. 호출하는 쪽이 SMTP 유무를 먼저 확인한다. */
export async function sendMail(to: string, subject: string, text: string): Promise<void> {
  if (!env.SMTP_HOST) return;
  const transport = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT ?? 587,
    auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
  });
  await transport.sendMail({ from: env.SMTP_FROM ?? env.SMTP_USER, to, subject, text });
}
