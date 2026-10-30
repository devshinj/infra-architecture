// 코드 그래프 문서를 한 번에 갱신한다: refresh_graph.py (graphify 갱신) → sync-graph.mjs (사이트로 복사)
// graphify 가 설치된 Python 은 GRAPHIFY_PYTHON → graphify-out/.graphify_python → uv tool 설치 경로 순으로 찾는다.
import {execFileSync, spawnSync} from 'node:child_process';
import {existsSync, readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptsDir, '..', '..');

function findPython() {
  const candidates = [process.env.GRAPHIFY_PYTHON];
  const sidecar = path.join(rootDir, 'graphify-out', '.graphify_python');
  if (existsSync(sidecar)) candidates.push(readFileSync(sidecar, 'utf8').trim());
  try {
    const uvDir = execFileSync('uv', ['tool', 'dir'], {encoding: 'utf8'}).trim();
    const bin = process.platform === 'win32' ? ['Scripts', 'python.exe'] : ['bin', 'python'];
    candidates.push(path.join(uvDir, 'graphifyy', ...bin));
  } catch {
    // uv 가 없으면 건너뛴다
  }
  return candidates.find((p) => p && existsSync(p));
}

const python = findPython();
if (!python) {
  console.error('graphify 가 설치된 Python 을 찾지 못했습니다.');
  console.error('`uv tool install graphifyy` 로 설치하거나 GRAPHIFY_PYTHON 에 경로를 지정하세요.');
  process.exit(1);
}

const run = (cmd, args) => {
  const r = spawnSync(cmd, args, {stdio: 'inherit', env: {...process.env, PYTHONUTF8: '1'}});
  if (r.status !== 0) process.exit(r.status ?? 1);
};

run(python, [path.join(scriptsDir, 'refresh_graph.py')]);
run(process.execPath, [path.join(scriptsDir, 'sync-graph.mjs')]);
