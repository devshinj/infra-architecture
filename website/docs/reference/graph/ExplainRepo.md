---
title: "ExplainRepo"
sidebar_position: 31
---
# ExplainRepo

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 11 nodes · cohesion 0.24

## Key Concepts

- **ExplainRepo** (9 connections) — `src/server/explain.ts`
- **ExplanationTargetKind** (5 connections) — `src/db/schema.ts`
- **.addAiTerm()** (5 connections) — `src/server/explain.ts`
- **.findTerm()** (4 connections) — `src/server/explain.ts`
- **.getLatestState()** (4 connections) — `src/server/explain.ts`
- **GlossaryRow** (4 connections) — `src/server/glossary.ts`
- **.ensureSeeded()** (3 connections) — `src/server/explain.ts`
- **.getCached()** (3 connections) — `src/server/explain.ts`
- **.saveExplanation()** (3 connections) — `src/server/explain.ts`
- **AiTermInput** (3 connections) — `src/server/glossary.ts`
- **.listSignatures()** (2 connections) — `src/server/explain.ts`

## Relationships

- [설명 생성과 품질 검사](설명_생성과_품질_검사.md) (15 shared connections)
- [용어 사전 저장과 시드](용어_사전_저장과_시드.md) (2 shared connections)
- [DB 스키마와 인증](DB_스키마와_인증.md) (1 shared connections)
- [오른쪽 패널과 설명 화면](오른쪽_패널과_설명_화면.md) (1 shared connections)

## Source Files

- `src/db/schema.ts`
- `src/server/explain.ts`
- `src/server/glossary.ts`

## Audit Trail

- EXTRACTED: 28 (88%)
- INFERRED: 4 (12%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*