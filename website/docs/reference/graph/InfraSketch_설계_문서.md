---
title: "InfraSketch 설계 문서"
sidebar_position: 37
sidebar_label: "핵심 노드: InfraSketch 설계 문서"
---
# InfraSketch 설계 문서

> 이 문서는 graphify 가 코드에서 자동 생성했습니다. 직접 고치지 마세요. `INFERRED` 로 표시된 관계는 추론이므로 코드로 확인하세요.

> 23 nodes · cohesion 0.14

## Key Concepts

- **InfraSketch 설계 문서** (34 connections) — `docs/superpowers/specs/2026-10-29-infra-architecture-visualizer-design.md`
- **Clef-Flash 판정 모델** (5 connections) — `docs/superpowers/specs/2026-10-29-infra-architecture-visualizer-design.md`
- **대화 차례 파이프라인** (4 connections) — `docs/superpowers/plans/2026-10-29-infrasketch-phase2-ai-chat.md`
- **요청 의도 분류** (4 connections) — `docs/superpowers/specs/2026-10-29-infra-architecture-visualizer-design.md`
- **이상한 구성 경고** (3 connections) — `docs/superpowers/specs/2026-10-29-infra-architecture-visualizer-design.md`
- **반목표 (장황한 설명·엉킨 캔버스·자유 드래그)** (3 connections) — `docs/superpowers/specs/2026-10-29-infra-architecture-visualizer-design.md`
- **자동 배치 (ELK layered)** (3 connections) — `docs/superpowers/specs/2026-10-29-infra-architecture-visualizer-design.md`
- **변경 명령 (add_node·add_edge·set_assumption 등)** (3 connections) — `docs/superpowers/specs/2026-10-29-infra-architecture-visualizer-design.md`
- **구조 변경은 대화로만** (3 connections) — `docs/superpowers/specs/2026-10-29-infra-architecture-visualizer-design.md`
- **JSON Lines 전달 방식** (3 connections) — `docs/superpowers/specs/2026-10-29-infra-architecture-visualizer-design.md`
- **Qwen 생성 모델 (qwen3.8-flash-next)** (3 connections) — `docs/superpowers/specs/2026-10-29-infra-architecture-visualizer-design.md`
- **가독성 규칙과 겹침 검사** (3 connections) — `docs/superpowers/specs/2026-10-29-infra-architecture-visualizer-design.md`
- **실시간 생성 (노드가 하나씩 나타남)** (3 connections) — `docs/superpowers/specs/2026-10-29-infra-architecture-visualizer-design.md`
- **스파이크 결과** (3 connections) — `docs/superpowers/specs/2026-10-29-infra-architecture-visualizer-design.md`
- **기본 정리 옵션 4종** (3 connections) — `docs/superpowers/specs/2026-10-29-infra-architecture-visualizer-design.md`
- **AZ 는 그룹이 아닌 속성** (2 connections) — `docs/superpowers/specs/2026-10-29-infra-architecture-visualizer-design.md`
- **Clef 장애 시 대체 동작** (2 connections) — `docs/superpowers/specs/2026-10-29-infra-architecture-visualizer-design.md`
- **설명 패널** (2 connections) — `docs/superpowers/specs/2026-10-29-infra-architecture-visualizer-design.md`
- **용어 사전 (DB, 미검수)** (2 connections) — `docs/superpowers/specs/2026-10-29-infra-architecture-visualizer-design.md`
- **구성 패턴 라이브러리** (2 connections) — `docs/superpowers/specs/2026-10-29-infra-architecture-visualizer-design.md`
- **로그인·회원 (Auth.js Credentials)** (1 connections) — `docs/superpowers/specs/2026-10-29-infra-architecture-visualizer-design.md`
- **영역 접기/펼치기** (1 connections) — `docs/superpowers/specs/2026-10-29-infra-architecture-visualizer-design.md`
- **디자인 토큰 "미드나잇 다이얼"** (1 connections) — `docs/superpowers/specs/2026-10-29-infra-architecture-visualizer-design.md`

## Relationships

- [NODE_KINDS](NODE_KINDS.md) (7 shared connections)
- [2단계 계획: AI 대화](2단계_계획-_AI_대화.md) (3 shared connections)
- [createClefClient](createClefClient.md) (2 shared connections)
- [deps.ts](deps.ts.md) (2 shared connections)
- [ask/route.ts](ask-route.ts.md) (1 shared connections)
- [layout.ts](layout.ts.md) (1 shared connections)
- [domain/apply.ts](domain-apply.ts.md) (1 shared connections)
- [domain/assumptions.ts](domain-assumptions.ts.md) (1 shared connections)
- [segments.ts](segments.ts.md) (1 shared connections)
- [MentionInput](MentionInput.md) (1 shared connections)
- [createJsonlParser](createJsonlParser.md) (1 shared connections)
- [useDiagramView.ts](useDiagramView.ts.md) (1 shared connections)

## Source Files

- `docs/superpowers/plans/2026-10-29-infrasketch-phase2-ai-chat.md`
- `docs/superpowers/specs/2026-10-29-infra-architecture-visualizer-design.md`

## Audit Trail

- EXTRACTED: 56 (97%)
- INFERRED: 2 (3%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*