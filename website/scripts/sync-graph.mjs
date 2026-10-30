// graphify-out/ 의 결과를 문서 사이트로 복사한다.
//   wiki/*.md        → docs/reference/graph/
//   GRAPH_REPORT.md  → docs/reference/graph/report.md
//   graph.html       → static/graph/graph.html
// 복사본은 매번 새로 만든다. 직접 고치지 말고 graphify 를 다시 돌린 뒤 이 스크립트를 실행한다.
import {cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const siteDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.resolve(siteDir, '..', 'graphify-out');
const wikiDir = path.join(outDir, 'wiki');
const docsDir = path.join(siteDir, 'docs', 'reference', 'graph');
const staticDir = path.join(siteDir, 'static', 'graph');

if (!existsSync(path.join(wikiDir, 'index.md'))) {
  console.error(`graphify wiki 가 없습니다: ${wikiDir}`);
  console.error('루트에서 graphify 를 --wiki 옵션으로 먼저 실행하세요.');
  process.exit(1);
}

const BANNER =
  '> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. ' +
  '`INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.';

// index.md 의 목록 순서대로 사이드바 순서를 정한다: 개요, 보고서, 커뮤니티, 핵심 노드
const index = readFileSync(path.join(wikiDir, 'index.md'), 'utf8');
const section = (heading) => {
  const start = index.indexOf(`## ${heading}`);
  if (start < 0) return [];
  const rest = index.slice(start + heading.length + 3);
  const end = rest.search(/^## /m);
  const body = end < 0 ? rest : rest.slice(0, end);
  return [...body.matchAll(/\]\(([^)]+\.md)\)/g)].map((m) => decodeURI(m[1]));
};
const order = ['index.md', ...section('Communities'), ...section('God Nodes')];

const yamlString = (s) => JSON.stringify(s);

function withFrontMatter(markdown, {position, title, label}) {
  const lines = markdown.split('\n');
  const h1 = lines.findIndex((l) => l.startsWith('# '));
  const heading = title ?? (h1 >= 0 ? lines[h1].slice(2).trim() : 'graphify');
  if (h1 >= 0) lines.splice(h1, 1, `# ${heading}`, '', BANNER);
  else lines.unshift(`# ${heading}`, '', BANNER, '');
  const front = ['---', `title: ${yamlString(heading)}`, `sidebar_position: ${position}`];
  if (label) front.push(`sidebar_label: ${yamlString(label)}`);
  front.push('---', '');
  return front.join('\n') + lines.join('\n');
}

rmSync(docsDir, {recursive: true, force: true});
mkdirSync(docsDir, {recursive: true});

const files = readdirSync(wikiDir).filter((f) => f.endsWith('.md'));
const godNodes = new Set(section('God Nodes'));
let unordered = order.length;
for (const file of files) {
  const pos = order.indexOf(file);
  const position = pos < 0 ? ++unordered : pos === 0 ? 0 : pos + 1;
  // graphify 는 Windows 에서 CRLF 로 쓴다. 정규식의 . 이 \r 을 잡지 못하므로 먼저 맞춘다
  let text = readFileSync(path.join(wikiDir, file), 'utf8').replace(/\r\n/g, '\n');
  let meta = {position};
  if (file === 'index.md') {
    text = text.replace(
      /^(> .*\n)/m,
      '$1\n[인터랙티브 그래프 열기](pathname:///graph/graph.html) — 노드를 끌고 확대해서 전체 연결을 볼 수 있습니다.\n',
    );
    meta = {position, title: '코드 그래프 개요', label: '개요'};
  } else if (godNodes.has(file)) {
    const h1 = text.match(/^# (.+)$/m)?.[1];
    if (h1) meta.label = `핵심 노드: ${h1}`;
  }
  writeFileSync(path.join(docsDir, file), withFrontMatter(text, meta));
}

const report = path.join(outDir, 'GRAPH_REPORT.md');
if (existsSync(report)) {
  const text = readFileSync(report, 'utf8').replace(/\r\n/g, '\n');
  writeFileSync(path.join(docsDir, 'report.md'), withFrontMatter(text, {position: 1, title: '분석 보고서'}));
}

const html = path.join(outDir, 'graph.html');
rmSync(staticDir, {recursive: true, force: true});
if (existsSync(html)) {
  mkdirSync(staticDir, {recursive: true});
  cpSync(html, path.join(staticDir, 'graph.html'));
}

console.log(`graphify 문서 ${files.length}개를 ${path.relative(siteDir, docsDir)} 로 복사했습니다.`);
