"""graphify 그래프를 코드 기준으로 갱신하면서 커뮤니티 이름을 이어받는다.

graphify update 는 코드가 바뀌어 묶음 구성원이 하나라도 달라지면 저장된 이름을 버리고
파일 이름(예: "(app)/actions.ts")으로 바꾼다. 여기서는 갱신 전후 구성원을 비교해
새 묶음과 이전 묶음이 서로 절반 넘게 겹치면 이전 이름을 그대로 쓴다.

graphify 가 설치된 Python 으로 실행한다 (website/scripts/refresh-graph.mjs 가 찾아서 호출).
LLM 은 쓰지 않는다. 설계 문서(docs/) 변경은 반영하지 않으므로 /graphify . --update 를 따로 돌린다.
"""

import json
import subprocess
import sys
from collections import defaultdict
from pathlib import Path

from graphify.cluster import community_member_sigs

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "graphify-out"
GRAPH = OUT / "graph.json"
LABELS = OUT / ".graphify_labels.json"
SIGS = OUT / ".graphify_labels.json.sig"


def members_by_community(graph_path: Path) -> dict[int, set[str]]:
    data = json.loads(graph_path.read_text(encoding="utf-8"))
    groups: dict[int, set[str]] = defaultdict(set)
    for node in data["nodes"]:
        if node.get("community") is not None:
            groups[int(node["community"])].add(node["id"])
    return dict(groups)


def read_labels() -> dict[int, str]:
    if not LABELS.exists():
        return {}
    return {int(k): v for k, v in json.loads(LABELS.read_text(encoding="utf-8")).items()}


def graphify(*args: str) -> None:
    subprocess.run([sys.executable, "-m", "graphify", *args], cwd=ROOT, check=True)


def main() -> None:
    if not GRAPH.exists():
        sys.exit("graphify-out/graph.json 이 없습니다. 먼저 /graphify . --wiki 로 그래프를 만드세요.")

    before = members_by_community(GRAPH)
    before_labels = read_labels()

    graphify("update", ".")

    after = members_by_community(GRAPH)
    labels = read_labels()

    kept, renamed = 0, []
    for cid, members in after.items():
        best, overlap = None, 0
        for old_cid, old_members in before.items():
            n = len(members & old_members)
            if n > overlap:
                best, overlap = old_cid, n
        # 서로 절반 넘게 겹칠 때만 같은 묶음으로 본다 (한 이전 묶음이 두 곳에 붙지 않는다)
        same = best is not None and overlap * 2 > len(members) and overlap * 2 > len(before[best])
        if same and best in before_labels:
            if labels.get(cid) != before_labels[best]:
                labels[cid] = before_labels[best]
            kept += 1
        else:
            renamed.append(labels.get(cid, f"Community {cid}"))

    LABELS.write_text(
        json.dumps({str(k): v for k, v in sorted(labels.items())}, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    sigs = community_member_sigs({cid: sorted(m) for cid, m in after.items()})
    SIGS.write_text(json.dumps({str(k): v for k, v in sorted(sigs.items())}, indent=2) + "\n", encoding="utf-8")

    # 저장한 이름으로 보고서·graph.json·graph.html 을 다시 쓰고 위키를 만든다
    graphify("cluster-only", ".", "--no-label")
    graphify("export", "wiki")

    print(f"커뮤니티 {len(after)}개 중 {kept}개 이름을 이어받았습니다.")
    if renamed:
        print("새 이름이 필요한 커뮤니티 (graphify label 또는 /graphify 로 다시 지을 수 있습니다):")
        for name in renamed:
            print(f"  - {name}")


if __name__ == "__main__":
    main()
