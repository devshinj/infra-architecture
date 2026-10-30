---
sidebar_position: 4
title: 문서 관리
---

# 문서 관리

이 사이트는 두 층으로 나뉩니다.

| 층 | 위치 | 누가 쓰나 |
| --- | --- | --- |
| 가이드 | `website/docs/guide/` | 사람이 직접 씁니다 |
| 코드 그래프 | `website/docs/reference/graph/`, `website/static/graph/` | graphify 결과를 스크립트로 복사합니다. 직접 고치지 않습니다 |

## 사이트 실행

```bash
cd website
npm install
npm start        # 개발 서버 (http://localhost:3000)
npm run build    # 정적 파일 빌드 (website/build)
npm run serve    # 빌드 결과 확인
```

앱의 개발 서버도 3000 포트를 쓰므로, 둘을 함께 띄울 때는 `npm start -- --port 3001` 처럼 포트를 바꾸세요.

## 코드 그래프 갱신

### 코드가 바뀌었을 때

```bash
cd website
npm run docs:refresh
```

이 명령은 LLM 없이 몇 초 안에 끝나며 다음을 차례로 합니다.

1. `graphify update .` 로 바뀐 코드 파일만 다시 추출합니다.
2. 커뮤니티 이름을 이어받습니다. graphify 는 묶음 구성원이 하나라도 바뀌면 이름을 파일 이름으로 덮어씁니다. 그래서 갱신 전후를 비교해, 새 묶음과 이전 묶음이 **서로 절반 넘게 겹치면 이전 이름을 그대로** 씁니다.
3. 저장한 이름으로 보고서와 위키를 다시 만들고, 사이트(`docs/reference/graph/`, `static/graph/`)로 복사합니다.

끝나면 이름을 이어받지 못한 커뮤니티 목록이 출력됩니다. 이 커뮤니티들은 `pipeline.ts` 같은 파일 이름으로 남습니다. 한국어 이름을 새로 붙이려면 Claude Code 에서 `/graphify` 를 다시 돌리거나 `.graphify_labels.json` 을 직접 고친 뒤 `docs:refresh` 를 한 번 더 실행합니다.

`npm run build` 로 깨진 링크가 없는지 확인하고, 바뀐 파일을 함께 커밋합니다.

graphify 는 [uv](https://docs.astral.sh/uv/) 로 설치합니다(`uv tool install graphifyy`). 다른 경로에 설치했다면 `GRAPHIFY_PYTHON` 환경 변수에 graphify 가 설치된 Python 경로를 지정하세요.

### 설계 문서(`docs/`)가 바뀌었을 때

문서 내용 추출에는 LLM 이 필요해서 `docs:refresh` 는 문서 변경을 반영하지 않습니다. 저장소 루트에서 Claude Code 로 실행한 뒤 복사합니다.

```text
/graphify . --update --wiki
```

```bash
cd website
npm run sync:graph
```

### Git 에 올리는 것

- `graphify-out/` 에서는 `graph.json`, `.graphify_labels.json`, `.graphify_labels.json.sig` 만 올립니다. 다른 PC 나 배포 서버도 이 기준 그래프에서 출발해야 커뮤니티 이름이 유지됩니다. 나머지 파일은 `docs:refresh` 가 다시 만듭니다.
- 사이트로 복사된 `website/docs/reference/graph/` 와 `website/static/graph/` 도 올립니다. 그래서 graphify 가 없는 환경에서도 사이트를 빌드할 수 있습니다.
- graphify 대상은 루트의 `.graphifyignore` 가 정합니다. 지금은 `src/` 와 `docs/` 만 읽습니다.

### 배포 때

사내 서버 배포 파이프라인을 만들 때는 앱을 빌드한 뒤 `cd website && npm ci && npm run docs:refresh && npm run build` 를 이어서 실행하면 됩니다. 배포 서버에도 graphify 가 설치돼 있어야 합니다.

## 가이드 쓰는 법

graphify 는 가이드를 쓸 때 재료로 씁니다. 결과를 그대로 옮기지 말고, 독자가 읽는 순서에 맞게 다시 씁니다.

- 전체 구조를 잡을 때는 [분석 보고서](../reference/graph/report.md)의 커뮤니티와 핵심 노드를 봅니다.
- 특정 흐름을 설명할 때는 graphify 에 물어봅니다.

  ```text
  /graphify query "대화 한 차례가 캔버스에 그려지기까지"
  /graphify path "useChatTurn" "createVersion"
  /graphify explain "computeMissing"
  ```

- 그래프에서 `INFERRED` 로 표시된 관계는 추론입니다. 가이드에 쓰기 전에 코드에서 확인하세요.
- 파일 경로와 함수 이름은 코드와 똑같이 적어, 나중에 그래프와 대조하기 쉽게 합니다.

## 알려진 한계

- `graph.svg` 는 한글 글꼴이 없어 라벨이 깨지므로 사이트에 넣지 않았습니다. 대신 `graph.html`(인터랙티브 그래프)을 씁니다.
- `graph.html` 은 그래프 라이브러리를 unpkg CDN 에서 읽습니다. 인터넷이 막힌 환경에서는 열리지 않습니다.
- SQL 마이그레이션 파일과 CSS 는 그래프에 들어가지 않습니다.
