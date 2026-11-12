---
title: "InfraSketch 설계 문서"
sidebar_position: 7
sidebar_label: "핵심 노드: InfraSketch 설계 문서"
---
# InfraSketch 설계 문서

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 50 nodes · cohesion 0.07

## Key Concepts

- **InfraSketch 설계 문서** (34 connections) — `docs/superpowers/specs/2026-10-29-infra-architecture-visualizer-design.md`
- **NODE_KINDS** (11 connections) — `src/domain/catalog.ts`
- **createClefClient()** (11 connections) — `src/server/llm/clef.ts`
- **변경 이력과 비파괴 되돌리기** (8 connections) — `docs/superpowers/specs/2026-10-29-infra-architecture-visualizer-design.md`
- **2단계 계획: AI 대화** (7 connections) — `docs/superpowers/plans/2026-10-29-infrasketch-phase2-ai-chat.md`
- **run()** (7 connections) — `src/server/llm/clef.ts`
- **빠진 정보 채우기** (6 connections) — `docs/superpowers/specs/2026-10-29-infra-architecture-visualizer-design.md`
- **Clef-Flash 판정 모델** (5 connections) — `docs/superpowers/specs/2026-10-29-infra-architecture-visualizer-design.md`
- **1단계 계획: 기반과 캔버스** (4 connections) — `docs/superpowers/plans/2026-10-29-infrasketch-phase1-foundation-canvas.md`
- **대화 차례 파이프라인** (4 connections) — `docs/superpowers/plans/2026-10-29-infrasketch-phase2-ai-chat.md`
- **3A단계 계획: 빠진 정보 채우기** (4 connections) — `docs/superpowers/plans/2026-10-29-infrasketch-phase3a-missing-info.md`
- **요청 의도 분류** (4 connections) — `docs/superpowers/specs/2026-10-29-infra-architecture-visualizer-design.md`
- **abortError()** (4 connections) — `src/server/llm/clef.ts`
- **폼 저장 = "직접 입력" 버전** (3 connections) — `docs/superpowers/plans/2026-10-29-infrasketch-phase3a-missing-info.md`
- **빈 칸 계산은 순수 함수 하나** (3 connections) — `docs/superpowers/plans/2026-10-29-infrasketch-phase3a-missing-info.md`
- **이상한 구성 경고** (3 connections) — `docs/superpowers/specs/2026-10-29-infra-architecture-visualizer-design.md`
- **반목표 (장황한 설명·엉킨 캔버스·자유 드래그)** (3 connections) — `docs/superpowers/specs/2026-10-29-infra-architecture-visualizer-design.md`
- **자동 배치 (ELK layered)** (3 connections) — `docs/superpowers/specs/2026-10-29-infra-architecture-visualizer-design.md`
- **변경 명령 (add_node·add_edge·set_assumption 등)** (3 connections) — `docs/superpowers/specs/2026-10-29-infra-architecture-visualizer-design.md`
- **구조 변경은 대화로만** (3 connections) — `docs/superpowers/specs/2026-10-29-infra-architecture-visualizer-design.md`
- **JSON Lines 전달 방식** (3 connections) — `docs/superpowers/specs/2026-10-29-infra-architecture-visualizer-design.md`
- **노드 종류 목록 (kind·group_kind·edge_kind)** (3 connections) — `docs/superpowers/specs/2026-10-29-infra-architecture-visualizer-design.md`
- **Qwen 생성 모델 (qwen3.8-flash-next)** (3 connections) — `docs/superpowers/specs/2026-10-29-infra-architecture-visualizer-design.md`
- **가독성 규칙과 겹침 검사** (3 connections) — `docs/superpowers/specs/2026-10-29-infra-architecture-visualizer-design.md`
- **실시간 생성 (노드가 하나씩 나타남)** (3 connections) — `docs/superpowers/specs/2026-10-29-infra-architecture-visualizer-design.md`
- *... and 25 more nodes in this community*

## Relationships

- [clef.ts](clef.ts.md) (6 shared connections)
- [getOwnedDiagram](getOwnedDiagram.md) (3 shared connections)
- [missing.ts](missing.ts.md) (3 shared connections)
- [domain/apply.ts](domain-apply.ts.md) (2 shared connections)
- [domain/assumptions.ts](domain-assumptions.ts.md) (2 shared connections)
- [MissingChecklist.tsx](MissingChecklist.tsx.md) (2 shared connections)
- [display.ts](display.ts.md) (2 shared connections)
- [Canvas.tsx](Canvas.tsx.md) (1 shared connections)
- [ask/route.ts](ask-route.ts.md) (1 shared connections)
- [useChatTurn.ts](useChatTurn.ts.md) (1 shared connections)
- [layout.ts](layout.ts.md) (1 shared connections)
- [segments.ts](segments.ts.md) (1 shared connections)

## Source Files

- `docs/superpowers/plans/2026-10-29-infrasketch-phase1-foundation-canvas.md`
- `docs/superpowers/plans/2026-10-29-infrasketch-phase2-ai-chat.md`
- `docs/superpowers/plans/2026-10-29-infrasketch-phase3a-missing-info.md`
- `docs/superpowers/specs/2026-10-29-infra-architecture-visualizer-design.md`
- `src/domain/catalog.ts`
- `src/domain/missing.ts`
- `src/server/llm/clef.ts`

## Audit Trail

- EXTRACTED: 111 (95%)
- INFERRED: 6 (5%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*