import { isResetTokenUsable } from "@/server/auth/reset";

import { ResetPasswordForm } from "./ResetPasswordForm";

export default async function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  // 새 비밀번호를 다 입력한 뒤에야 만료를 알게 되지 않도록 열 때 먼저 확인한다(선점은 제출 때 한다).
  const usable = await isResetTokenUsable(token);
  return <ResetPasswordForm token={token} usable={usable} />;
}
