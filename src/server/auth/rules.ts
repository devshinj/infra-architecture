/**
 * 가입·재설정 입력 규칙. 서버(signup.ts·reset.ts)와 화면(입력 안내·제출 전 확인)이 함께 쓴다.
 * 화면에서도 불러오므로 DB·bcrypt 같은 서버 전용 모듈을 가져오지 않는다.
 */

export const USERNAME_PATTERN = /^[a-z0-9_]{3,32}$/;
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PASSWORD_MIN = 8;

/** 입력하기 전에 보여 주는 안내 */
export const HINTS = {
  username: "영문 소문자·숫자·밑줄(_)로 3~32자",
  password: `${PASSWORD_MIN}자 이상`,
} as const;

export const MESSAGES = {
  usernameRequired: "아이디를 입력해 주세요",
  usernameInvalid: "아이디는 영문 소문자·숫자·밑줄 3~32자로 입력해 주세요",
  usernameUppercase: "아이디에는 영문 대문자를 쓸 수 없습니다. 소문자로 입력해 주세요",
  emailRequired: "이메일을 입력해 주세요",
  emailInvalid: "이메일 형식이 올바르지 않습니다",
  passwordRequired: "비밀번호를 입력해 주세요",
  passwordShort: `비밀번호는 ${PASSWORD_MIN}자 이상이어야 합니다`,
} as const;

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

/** 가입용 아이디 확인. 문제가 없으면 null. */
export function checkUsername(username: string): string | null {
  if (username === "") return MESSAGES.usernameRequired;
  if (USERNAME_PATTERN.test(username)) return null;
  if (USERNAME_PATTERN.test(username.toLowerCase())) return MESSAGES.usernameUppercase;
  return MESSAGES.usernameInvalid;
}

export function checkEmail(email: string): string | null {
  const value = normalizeEmail(email);
  if (value === "") return MESSAGES.emailRequired;
  return EMAIL_PATTERN.test(value) ? null : MESSAGES.emailInvalid;
}

/** 새 비밀번호(가입·재설정) 확인 */
export function checkNewPassword(password: string): string | null {
  if (password === "") return MESSAGES.passwordRequired;
  return password.length < PASSWORD_MIN ? MESSAGES.passwordShort : null;
}
