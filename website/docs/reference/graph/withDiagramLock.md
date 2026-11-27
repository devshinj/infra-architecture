---
title: "withDiagramLock()"
sidebar_position: 154
sidebar_label: "핵심 노드: withDiagramLock()"
---
# withDiagramLock()

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> God node · 47 connections · `src/server/chat/lock.ts`

**Community:** [getOwnedDiagram](getOwnedDiagram.md)

## Connections by Relation

### calls
- rejectLinkGuessFor() `EXTRACTED`
- runChatTurn() `EXTRACTED`
- runAskTurn() `EXTRACTED`
- saveFieldsFor() `EXTRACTED`
- restoreMcpVersion() `EXTRACTED`
- confirmAssumptionFor() `EXTRACTED`
- setWarningIgnoredFor() `EXTRACTED`
- removeNoLinkFor() `EXTRACTED`
- setZoneTypeFor() `EXTRACTED`
- withOwnedFlow() `EXTRACTED`
- confirmLinkGuessFor() `EXTRACTED`
- importSample() `EXTRACTED`
- applyMcpCommands() `EXTRACTED`
- quitGuide() `EXTRACTED`
- restoreGuideVersion() `EXTRACTED`
- DELETE() `EXTRACTED`
- syncGuideAfterRestore() `EXTRACTED`
- restoreVersionLocked() `EXTRACTED`
- release() `EXTRACTED`
- warnExhausted() `EXTRACTED`
- *…and 2 more `calls` connection(s) not listed (lowest-degree first to go)*

### contains
- lock.ts `EXTRACTED`

### imports
- [pipeline.ts](pipeline.ts.md) `EXTRACTED`
- [mcp/apply.ts](mcp-apply.ts.md) `EXTRACTED`
- start.ts `EXTRACTED`
- ask.ts `EXTRACTED`
- server/flows.ts `EXTRACTED`
- versions.ts `EXTRACTED`
- [samples.ts](samples.ts.md) `EXTRACTED`
- [\[sessionId\]/route.ts]([sessionId]-route.ts.md) `EXTRACTED`
- server/linkGuess.ts `EXTRACTED`
- fields.ts `EXTRACTED`
- server/assumptions.ts `EXTRACTED`
- zoneType.ts `EXTRACTED`
- ignore.ts `EXTRACTED`

### indirect_call
- [flowSuggest.ts](flowSuggest.ts.md) `INFERRED`

### references
- Task 6: 가이드 차례와 대화 경로 연결 `INFERRED`
- Task 5: MCP 고치기·되돌리기 서비스 `INFERRED`
- Task 7: 시작·그만두기·되돌리기 맞추기 `INFERRED`
- Task 2: 질문 차례(서버) `INFERRED`
- Task 4: 흐름 저장소·조회·이름 바꾸기·삭제·확인 `INFERRED`
- Task 7: 서버 액션 — 망 종류 확인·바꾸기, 망연계 맞아요·아니에요 `INFERRED`
- Task 6: AI 흐름 제안(처음 그린 뒤 자동 + 버튼) `INFERRED`
- Task 4: "의도된 구성" 저장 `INFERRED`
- 5. 기록과 동시 작업 `INFERRED`
- 구성도당 한 차례 잠금 (409) `EXTRACTED`

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*