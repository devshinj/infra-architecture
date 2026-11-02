import { LoginForm } from "./LoginForm";

const NOTICES: Record<string, string> = {
  reset: "비밀번호를 바꿨어요. 새 비밀번호로 로그인해 주세요.",
  signup: "가입이 끝났어요. 아이디와 비밀번호로 로그인해 주세요.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ notice?: string | string[] }> }) {
  const { notice } = await searchParams;
  return <LoginForm notice={typeof notice === "string" ? NOTICES[notice] : undefined} />;
}
