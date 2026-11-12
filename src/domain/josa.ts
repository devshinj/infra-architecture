/**
 * 이름 뒤 조사를 받침에 맞춰 고른다. "관리자 앱이", "ALB가", "API #1이", "v2와".
 * 끝 글자로 판단한다(끝의 공백·닫는 괄호·따옴표는 건너뛴다).
 * - 한글: 종성 유무, (으)로는 ㄹ 받침이면 "로".
 * - 숫자: 읽는 소리(영·일·이·삼·사·오·육·칠·팔·구). 끝이 0 이면 십·백·천·만이라 받침(ㄱ·ㄴ·ㅂ), 로는 "으로".
 * - 영문: 대문자로 끝나면 약어로 글자 이름(L·M·N·R 만 받침, L·R 은 ㄹ), 소문자로 끝나면 낱말 소리
 *   (p·b·k·c·m·n·l·ng 는 받침: App 앱, Web 웹, Bastion 언 / 나머지는 받침 없음: Redis 스, Server 서, Client 트).
 *   Tomcat(캣)처럼 맞지 않는 낱말도 있다(어림).
 * - 그 밖(기호뿐 등): 받침 있는 쪽("이"·"을"·"과"·"은"·"으로")으로 둔다.
 */

type Final = { has: boolean; rieul: boolean };

const DIGIT: Record<string, Final> = {
  "0": { has: true, rieul: false }, // 영
  "1": { has: true, rieul: true }, // 일
  "2": { has: false, rieul: false }, // 이
  "3": { has: true, rieul: false }, // 삼
  "4": { has: false, rieul: false }, // 사
  "5": { has: false, rieul: false }, // 오
  "6": { has: true, rieul: false }, // 육
  "7": { has: true, rieul: true }, // 칠
  "8": { has: true, rieul: true }, // 팔
  "9": { has: false, rieul: false }, // 구
};

const TRAILING = /[\s)\]}"'’”」』>]+$/;

function finalOf(word: string): Final {
  const w = word.replace(TRAILING, "");
  const ch = w.at(-1);
  if (!ch) return { has: true, rieul: false };
  const code = ch.charCodeAt(0);
  if (code >= 0xac00 && code <= 0xd7a3) {
    const jong = (code - 0xac00) % 28;
    return { has: jong !== 0, rieul: jong === 8 };
  }
  if (/[0-9]/.test(ch)) {
    // 끝이 0 인 수: 10 십, 100 백, 1000 천, 10000 만 — 모두 받침, ㄹ 아님. 0 하나만이면 영.
    if (ch === "0" && /[1-9]0+$/.test(w)) return { has: true, rieul: false };
    return DIGIT[ch]!;
  }
  if (/[A-Z]/.test(ch)) {
    // 대문자로 끝나면 약어로 보고 글자 이름으로 읽는다: 엘·엠·엔·알만 받침(ALB 비, MySQL 엘, MongoDB 비).
    return { has: "LMNR".includes(ch), rieul: ch === "L" || ch === "R" };
  }
  if (/[a-z]/.test(ch)) {
    // 소문자로 끝나면 낱말로 읽는다: 앱(App)·웹(Web)·랙(Rack)·맥(Mac)·…엄·…언·…엘·…잉(ng) 은 받침,
    // 나머지(…스·…트·…드·…서·…이)는 받침 없음(Redis·Client·Server·Gateway).
    const tail = w.slice(-2).toLowerCase();
    if (tail === "ng") return { has: true, rieul: false };
    return { has: "pbkcmnl".includes(ch), rieul: ch === "l" };
  }
  return { has: true, rieul: false };
}

/** 이/가 */
export const iGa = (word: string) => `${word}${finalOf(word).has ? "이" : "가"}`;
/** 을/를 */
export const eulReul = (word: string) => `${word}${finalOf(word).has ? "을" : "를"}`;
/** 은/는 */
export const eunNeun = (word: string) => `${word}${finalOf(word).has ? "은" : "는"}`;
/** 과/와 */
export const gwaWa = (word: string) => `${word}${finalOf(word).has ? "과" : "와"}`;
/** 으로/로(ㄹ 받침은 "로") */
export const euro = (word: string) => {
  const f = finalOf(word);
  return `${word}${f.has && !f.rieul ? "으로" : "로"}`;
};
