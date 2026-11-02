/**
 * 가입·재설정 입력 규칙. 서버(signup.ts·reset.ts)와 화면(입력 안내·제출 전 확인)이 함께 쓴다.
 * 화면에서도 불러오므로 DB·bcrypt 같은 서버 전용 모듈을 가져오지 않는다.
 */

export const USERNAME_PATTERN = /^[a-z0-9_]{3,32}$/;
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PASSWORD_MIN = 8;
/** bcrypt 는 72바이트 뒤를 말없이 잘라 버린다 — 그보다 길면 받지 않는다. */
export const PASSWORD_MAX_BYTES = 72;
/** 재설정 링크가 유효한 시간 */
export const RESET_TTL_HOURS = 1;

/** 입력하기 전에 보여 주는 안내 */
export const HINTS = {
  username: "영문·숫자·밑줄(_)로 3~32자 (대문자는 소문자로 바뀌어요)",
  password: `${PASSWORD_MIN}자 이상`,
} as const;

export const MESSAGES = {
  usernameRequired: "아이디를 입력해 주세요",
  usernameInvalid: "아이디는 영문 소문자·숫자·밑줄 3~32자로 입력해 주세요",
  emailRequired: "이메일을 입력해 주세요",
  emailInvalid: "이메일 형식이 올바르지 않습니다",
  passwordRequired: "비밀번호를 입력해 주세요",
  passwordShort: `비밀번호는 ${PASSWORD_MIN}자 이상이어야 합니다`,
  passwordLong: `비밀번호가 너무 길어요. ${PASSWORD_MAX_BYTES}바이트(영문 ${PASSWORD_MAX_BYTES}자, 한글 약 24자) 이하로 입력해 주세요`,
  resetLinkExpired: "만료되었거나 이미 사용한 링크입니다. 재설정 링크를 다시 받아 주세요",
} as const;

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

/** 아이디는 소문자로만 가입되므로, 가입·로그인 모두 앞뒤 공백을 빼고 소문자로 맞춘다. */
export const normalizeUsername = (username: string) => username.trim().toLowerCase();

/** 가입용 아이디 확인(맞춘 뒤 검사). 문제가 없으면 null. */
export function checkUsername(username: string): string | null {
  const value = normalizeUsername(username);
  if (value === "") return MESSAGES.usernameRequired;
  return USERNAME_PATTERN.test(value) ? null : MESSAGES.usernameInvalid;
}

export function checkEmail(email: string): string | null {
  const value = normalizeEmail(email);
  if (value === "") return MESSAGES.emailRequired;
  return EMAIL_PATTERN.test(value) ? null : MESSAGES.emailInvalid;
}

/** 새 비밀번호(가입·재설정) 확인 */
export function checkNewPassword(password: string): string | null {
  if (password === "") return MESSAGES.passwordRequired;
  if (password.length < PASSWORD_MIN) return MESSAGES.passwordShort;
  return new TextEncoder().encode(password).length > PASSWORD_MAX_BYTES ? MESSAGES.passwordLong : null;
}
