/**
 * 로그인 옆 판의 배경 그림(선택). 아래 한 줄만 바꾸면 된다.
 *  - 영상: { kind: "video", src: "/brand/auth-bg.mp4", poster: "/brand/auth-bg.jpg" } — 포스터가 있어야 켜진다
 *  - 그림: { kind: "image", src: "/brand/auth-bg.webp" } (지금 쓰는 값)
 *  - 끄기: null (파일을 찾는 요청도 보내지 않는다)
 * 파일이 public/ 에 없으면 아무것도 그리지 않는다(포스터·그림을 한 번 불러 보고, 불러지면 그때 깐다).
 */
/* public/brand/auth-bg.webp: Higgsfield 로 만든 추상 배경(1152×1536, 3:4) — 어두운 바탕 위 흐린 노드 띠. */
export const AUTH_BG: AuthBackground | null = { kind: "image", src: "/brand/auth-bg.webp" };

export type AuthBackground = { kind: "video"; src: string; poster: string } | { kind: "image"; src: string };
