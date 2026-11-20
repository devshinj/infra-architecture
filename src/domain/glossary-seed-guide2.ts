import type { GlossarySeedEntry } from "./glossary-seed";
import { TERMS as CCTV } from "./glossary-seed-guide2/cctv";
import { TERMS as DELIVERY } from "./glossary-seed-guide2/delivery";
import { TERMS as MESSENGER } from "./glossary-seed-guide2/messenger";
import { TERMS as RELAY } from "./glossary-seed-guide2/relay";
import { TERMS as SOCIAL_LOGIN } from "./glossary-seed-guide2/sociallogin";
import { TERMS as STREAMING } from "./glossary-seed-guide2/streaming";

// 용어 사전 초안: 학습 대본 2차(메신저·배달앱·동영상 스트리밍·영상관제·SNS 로그인·중계시스템)가 쓰는 말.
// 주제마다 glossary-seed-guide2/<주제>.ts 에 나눠 쓴다. 새 묶음이라 기존 계정에도 한 번 들어간다.
export const GLOSSARY_SEED_GUIDE2: GlossarySeedEntry[] = [...MESSENGER, ...DELIVERY, ...STREAMING, ...CCTV, ...SOCIAL_LOGIN, ...RELAY];
