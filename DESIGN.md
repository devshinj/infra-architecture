---
name: InfraSketch
description: 대화로 고쳐 쓰는 인프라 구성도. 캔버스의 문법이 모든 화면의 문법이다.
colors:
  signal-lime: "#BCF053"
  signal-lime-hi: "oklch(93% 0.17 126)"
  signal-lime-ink: "oklch(19% 0.04 126)"
  night-paper: "#04090C"
  drafting-well: "oklch(17% 0.014 235)"
  raised-slate: "#182126"
  node-slate: "#1D252B"
  hairline: "#20282C"
  hairline-strong: "#30393F"
  ink: "#EBEFF2"
  ink-soft: "oklch(82% 0.012 230)"
  muted-steel: "#8F9AA0"
  missing-red: "#D9544B"
  missing-red-text: "#E19A96"
  warn-amber: "#EEB154"
  dot-grid: "oklch(64% 0.012 285)"
  edge-request: "#7E8F99"
  edge-async: "#AA8B74"
  edge-replication: "#7CA391"
  edge-aux: "#505D65"
  zone-dmz-brass: "#A68F68"
  zone-private-navy: "#777E9F"
  zone-public-teal: "#68959D"
  zone-external-copper: "#A68471"
typography:
  hero:
    fontFamily: "SUIT, ui-sans-serif, system-ui, sans-serif"
    fontSize: "32px"
    fontWeight: 300
    letterSpacing: "-0.02em"
  page:
    fontFamily: "SUIT, ui-sans-serif, system-ui, sans-serif"
    fontSize: "22px"
    fontWeight: 300
    letterSpacing: "-0.02em"
  title:
    fontFamily: "SUIT, ui-sans-serif, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 600
  body-lg:
    fontFamily: "SUIT, ui-sans-serif, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.6
  body:
    fontFamily: "SUIT, ui-sans-serif, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "SUIT, ui-sans-serif, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 500
  mono:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
    fontSize: "12px"
rounded:
  control: "6px"
  surface: "8px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.signal-lime}"
    textColor: "{colors.night-paper}"
    rounded: "{rounded.control}"
    padding: "8px 16px"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "8px 12px"
  button-danger:
    backgroundColor: "transparent"
    textColor: "{colors.missing-red-text}"
    rounded: "{rounded.control}"
    padding: "8px 16px"
  button-quiet:
    backgroundColor: "transparent"
    textColor: "{colors.muted-steel}"
    rounded: "{rounded.control}"
    padding: "4px 8px"
  input:
    backgroundColor: "{colors.raised-slate}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "8px 12px"
  card:
    backgroundColor: "{colors.drafting-well}"
    textColor: "{colors.ink}"
    rounded: "{rounded.surface}"
    padding: "16px"
  tab:
    backgroundColor: "transparent"
    textColor: "{colors.muted-steel}"
    rounded: "{rounded.pill}"
    padding: "8px 16px"
  tab-selected:
    backgroundColor: "{colors.raised-slate}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
  status-badge:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "2px 8px"
---

# Design System: InfraSketch

## Overview

**Creative North Star: "The Living Blueprint" (살아 있는 설계도)**

InfraSketch 는 대화로 고쳐 쓰는 설계도다. 구성도 캔버스가 이미 이 제품만의 문법을 갖고 있다: 겹겹이 들어앉은 영역, 종류마다 다른 선 모양, 선 위에 붙은 프로토콜 라벨, 잰 것에만 두르는 모서리 눈금, 점 격자 바탕. 이 체계의 일은 그 문법을 캔버스 밖으로 넓히는 것이다. 사이드바, 패널, 목록, 대화상자, 로그인까지 같은 선과 같은 모서리와 같은 라벨 말씨로 그린다. 화면이 설계도의 연장으로 읽혀야 하고, 범용 다크 모드 도구처럼 읽히면 실패다.

설계도는 도면보다 부드럽고 관제실보다 조용하다. 바탕은 푸른 검정 한 장이고, 판은 그림자 없이 머리카락 선 하나로만 갈린다. 색은 구성도가 쓴다(영역 색조, 노드 분류, 연결선 종류). 화면 틀은 무채색 강철로 물러서고, 연두 신호 하나만 "지금 할 일, 지금 고른 것, 방금 바뀐 것"을 가리킨다. 밀도는 작업 도구답게 높지만 글자는 회의 화면 공유와 내보낸 그림에서도 읽혀야 한다.

이 체계는 2026-11-10 Hallmark "Vantage · steel" 재설계(`src/styles/tokens.css`)를 이어받는다. 이번 정리에서 바뀌는 것은 둘이다. 모서리는 캔버스 값(6px·8px)을 따르고, 글자는 12px 아래로 내려가지 않는다.

**Key Characteristics:**
- 캔버스가 앞에 서고 화면 틀은 물러선다.
- 그림자 없음. 깊이는 칠 한 단과 머리카락 선으로 만든다.
- 강조색은 연두 하나. 한 화면에 칠한 연두 버튼은 하나.
- 모서리는 구성도와 같다: 조작 부품 6px(노드), 판 8px(영역), 알약은 탭과 상태 배지만.
- 라벨은 선 위의 프로토콜 라벨처럼 짧고 사실만 말한다.

## Colors

푸른 검정 위의 강철빛 무채색 틀, 구성도가 쓰는 낮은 채도의 색조들, 그리고 연두 신호 하나.

### Primary
- **Signal Lime** (`signal-lime`): 화면마다 하나뿐인 주 동작의 칠(보내기, 만들기), 포커스 링, 지금 고른 노드의 테두리, 흐름 점, 망 경계 표시. 바탕과 15:1, 노드 칠과 13:1. 연두 위 글자는 `night-paper`(14:1).
- **Signal Lime Hi** (`signal-lime-hi`), **Signal Lime Ink** (`signal-lime-ink`): 연두를 밝게 띄우거나 연두 바탕 위 짙은 글자가 필요할 때만.

### Secondary
- **Edge palette** (`edge-request` 강철, `edge-async` 모래, `edge-replication` 이끼, `edge-aux` 흑연): 연결 종류. 색만으로 가르지 않고 선 모양(실선·점선·겹선·짧은 점선)과 짝지어 쓴다. 고른 대상에 닿은 선은 같은 계열의 밝은 짝(`--edge-*-lit`)으로 바뀐다.

### Tertiary
- **Zone tints** (`zone-dmz-brass` 황동, `zone-private-navy` 남색, `zone-public-teal` 청록, `zone-external-copper` 구리, 그 밖에 리전·VPC·쿠버네티스·IDC·망 색조는 `tokens.css` 의 `--zone-tint-*`): 영역 칠·테두리·이름 태그에 옅게 섞어 쓴다. 노드 분류색(`--cat-*`)은 아이콘과 그 뒤 옅은 원에만.

### Neutral
- **Night Paper** (`night-paper`): 캔버스와 화면 전체 바탕. 사이드바와 패널도 같은 종이로 물러난다.
- **Drafting Well** (`drafting-well`): 대화상자, 카드, 로그인 상자, 입력 우물. 종이보다 한 단 밝은 판.
- **Raised Slate** (`raised-slate`): 판 위의 입력칸, 말풍선, 메뉴, 고른 줄, 선택된 탭.
- **Node Slate** (`node-slate`): 노드 칠.
- **Hairline** (`hairline`) / **Hairline Strong** (`hairline-strong`): 판 경계 / 노드·버튼·카드 테두리.
- **Ink** (`ink`), **Ink Soft** (`ink-soft`), **Muted Steel** (`muted-steel`): 본문 / 보조 라벨 / 설명·placeholder. Muted Steel 은 모든 바탕에서 5.6:1 이상.
- **Missing Red** (`missing-red` 테두리·칠, `missing-red-text` 글자), **Warn Amber** (`warn-amber`): 빠진 정보와 경고. 연두와 겹치지 않는다.

### Named Rules
**The One Signal Rule.** 연두는 "지금"만 가리킨다: 지금 누를 것, 지금 고른 것, 방금 바뀐 것. 칠한 연두 버튼은 한 화면에 하나다. 장식으로 연두를 쓰지 않는다.

**The Diagram Owns Color Rule.** 색조는 구성도의 것이다. 화면 틀(사이드바, 패널, 목록, 대화상자)은 무채색 강철로만 그리고, 화면 틀에서 영역·분류 색을 쓸 때는 그것이 구성도의 무언가를 가리킬 때뿐이다(예: 망 지식 목록의 망 색 점).

**The Token-Only Rule.** 컴포넌트에 색 값을 직접 쓰지 않는다. placeholder 를 포함한 모든 글자 색은 토큰에서 온다.

## Typography

**Body Font:** SUIT (next/font 로 `--font-suit`, ui-sans-serif 대체)
**Label/Mono Font:** ui-monospace 계열. 키, 명령, IP·포트 같은 값에만.

**Character:** 한글이 고른 그로테스크 산세리프 하나. 큰 제목은 가는 굵기(300)와 좁은 자간으로 조용하게, 작업 글자는 13px 본문 중심으로 촘촘하게.

### Hierarchy
- **Hero** (300, 32px, -0.02em): 빈 홈과 로그인 제목.
- **Page** (300, 22px, -0.02em): 화면 제목(용어 사전, 망 지식, Claude Code 연결).
- **Title** (600, 15px): 패널·대화상자·노드 설명의 제목.
- **Body Large** (400, 14px, 1.6): 화면 소개 글(lead), 로그인 양식, 좁은 화면에서 손가락으로 누르는 글자·입력칸.
- **Body** (400, 13px, 1.5): 본문, 버튼, 목록 줄.
- **Label** (500, 12px): 섹션 머리, 보조 라벨, 노드 아래 줄, 연결선 라벨, 시각.

### Named Rules
**The 12px Floor Rule.** 화면 틀(패널, 카드, 대화, 목록, 배지, 캔버스 위에 뜨는 팝오버·툴팁)에는 12px 아래 글자가 없다. 크기를 줄이는 대신 색(Ink Soft, Muted Steel)으로 위계를 만든다. 캔버스 안 글자(노드 부제·AZ 칩·배지 11px, 연결선 라벨 11px, 영역 이름 11–20px)는 확대·축소로 크기가 바뀌고 자동 배치 상수(`SUB_PX`, `GROUP_NAME_PX`)와 묶여 있어 이 규칙 밖에 둔다. 대화 아바타의 IS 모노그램(장식)도 예외다. 자동 검출기(impeccable detect)가 캔버스 안 11px 를 권고로 짚는 것은 이 예외 때문이다.

**The Label Voice Rule.** 라벨은 연결선 위의 `TCP 1521` 처럼 짧고 사실만 말한다. 명사로 끝내고, 버튼은 동사와 목적어로 쓴다.

## Layout

- **화면 구조:** 캔버스가 화면 전체 바탕이다. 왼쪽 사이드바(펼침 240px, 레일 56px)와 오른쪽 패널(320–720px, 끌어서 조절)은 가장자리에서 12px(`--panel-gap`) 떨어져 떠 있다. 캔버스 맞춤은 두 판 사이의 보이는 띠에 하고, 그 띠는 360px 이상을 지킨다. 도구 모음은 캔버스 위쪽, 오른쪽 패널 왼편.
- **간격:** 4px 단계(4, 8, 12, 16, 24). 판 안 여백 16px, 줄 사이 8px.
- **보조 페이지:** 용어 사전·망 지식·Claude Code 연결은 같은 셸 안에서 열린다. 내용 폭을 한 줄짜리 좁은 열로 두지 않고 캔버스 자리를 쓴다.
- **좁은 화면(≤ 640px):** 사이드바와 패널이 사라지고 아래 탭 막대(구성도·대화·설명·이력·흐름)로 바뀐다. 데스크톱이 중심이고, 모바일은 보기와 간단한 대화까지 되면 된다. 입력칸 글자는 16px(확대 방지).

### Named Rules
**The Canvas Leads Rule.** 화면 틀은 캔버스를 가리지 않는다. 떠 있는 것(구성 정보, 범례, 도구 모음)은 서로 겹치지 않고 노드를 덮지 않는다.

## Elevation & Depth

그림자를 쓰지 않는다. 깊이는 칠 한 단(Night Paper → Drafting Well → Raised Slate)과 머리카락 선(1px Hairline)으로 만든다. 떠 있는 판도 흐림 없이 불투명하다. 내세운 것과 잰 것(빈 도면, 구성 정보)에만 네 모서리에 10px 눈금(`.ticks`)을 두른다. 빈 화면은 캔버스와 같은 20px 점 격자를 깐다.

### Named Rules
**The Flat Sheet Rule.** 그림자, 흐림, 그라데이션으로 높이를 만들지 않는다. 높이가 필요하면 칠을 한 단 올리고 선을 하나 긋는다.

## Shapes

모서리는 구성도에서 온다.
- **Control** (6px, 노드와 같음): 버튼, 입력칸, 칩, 메뉴 항목, 목록에서 고른 줄.
- **Surface** (8px, 영역과 같음): 카드, 대화상자, 메뉴 판, 떠 있는 패널, 로그인 상자.
- **Pill** (999px): 탭과 상태 배지(경고 수, 버전 표시, 망 넘음 알약)만.

선은 1px 하나. 점선과 짧은 점선은 캔버스에서 영역 종류(리전·이중화·외부)를 가르는 데 쓰고, 화면 틀에서는 "아직 정해지지 않음"(미확정 가정, 빈 칸)을 뜻할 때만 쓴다.

### Named Rules
**The Same Corners Rule.** 화면의 모서리는 6px, 8px, 알약 셋뿐이다. 1px·2px·3px·4px·12px 같은 다른 값을 만들지 않는다.

## Components

### Buttons
설계도 위 도구처럼 정밀하고 조용하다. 하나의 공용 버튼이 네 변형을 갖고, 화면마다 따로 정의하지 않는다.
- **Shape:** Control (6px).
- **Primary:** Signal Lime 칠, Night Paper 글자, 600 굵기, 8px 16px. 화면마다 하나. 올리면 조금 밝게, 누르면 조금 어둡게(120ms).
- **Secondary:** 칠 없음, Hairline Strong 테두리, Ink 글자. 올리면 테두리가 Muted Steel.
- **Danger:** 칠 없음, Missing Red 테두리, Missing Red Text 글자. 되돌릴 수 없는 일에만.
- **Quiet:** 테두리 없는 글자 버튼(로그아웃, 더 보기). 누를 영역은 24px 이상.
- **Disabled:** 무채색으로 물러선다. 주 동작이 비활성일 때도 Primary 자리를 지키되 Raised Slate 칠과 Muted Steel 글자.
- **Focus:** 2px Signal Lime 링, 2px 띄움. 바로 나타난다.

### Chips
- **Style:** Raised Slate 칠, Hairline Strong 테두리, 12px, Control 모서리. 예시 문장, 참조 노드, 가정.
- **State:** 확정된 가정은 600 굵기, 미확정은 점선 테두리.

### Cards / Containers
- **Corner Style:** Surface (8px).
- **Background:** Drafting Well, 또는 바탕과 같은 종이 위 Hairline 테두리.
- **Shadow Strategy:** 없음(Flat Sheet Rule).
- **Border:** 1px Hairline Strong.
- **Internal Padding:** 16px.

### Inputs / Fields
- **Style:** Raised Slate 칠, 입력 테두리(`--line-input`, 어느 칠 위에서도 3:1), Control 모서리, 8px 12px. placeholder 는 Muted Steel.
- **Focus:** 2px Signal Lime 링(입력칸은 안쪽으로 2px).
- **Error / Disabled:** 오류는 칸 바로 아래 Missing Red Text 한 줄, 자리를 미리 잡아 레이아웃이 밀리지 않는다. 비활성은 0.55 불투명도.

### Navigation
- **Sidebar:** 프로젝트 → 구성도 트리. 고른 줄은 Raised Slate 칠, 600 굵기, 왼쪽 연두 막대. 바닥에 새 프로젝트, 화면 링크 셋, 계정 줄.
- **Panel tabs:** 알약 탭(대화·설명·이력·흐름), 선택은 Raised Slate 칠.
- **Mobile:** 아래 탭 막대, 화살표 키로 이동.

### Diagram Node (Signature)
Node Slate 칠, Hairline Strong 테두리, 6px 모서리. 왼쪽에 분류색 아이콘 원, 이름(Body 600)과 부제(Label, Ink Soft). 고르면 연두 테두리, 관련 없는 것은 흐려진다. 변경은 `node--diff-*` 로 표시한다.

### Legend Table + Notes (보조 페이지)
용어 사전·망 지식·Claude Code 연결은 도면의 범례표와 주기처럼 읽힌다.
- **범례표:** 남은 폭 전부. Hairline Strong 테두리, Surface 모서리, 머리 줄 아래 Muted Steel 선. 줄은 열(이름 | 분류 | 한 줄 설명 | 출처)로 맞추고, 열 이름 머리 줄은 눈으로만 본다(aria-hidden, 줄마다 버튼 이름으로 이미 읽힌다).
- **주기 판:** 오른쪽 고정 폭(320–400px), 바탕과 같은 종이 위 Hairline Strong 테두리와 네 모서리 눈금(`.ticks`), 모서리는 각지게. 고르기 전에는 점선 테두리 안 안내 한 줄.
- **좁은 화면:** 한 열로 쌓고 열 이름 머리 줄과 되풀이되는 출처(기본 제공)는 감춘다.

### Auth Stage (로그인·가입·비밀번호)
넓은 화면(1080px 이상)은 화면 가운데 판 하나(560px + 440px, Surface 모서리, Hairline Strong 테두리)를 둔다. 왼쪽 반은 점 격자 위에 서비스 정의 한 줄("말로 그리는 인프라 구성도")과 이 도구의 한 장면이다. 처음 한 번은 아래 가운데에 떠 있는 대화 카드에 요청이 들어오고, 캔버스 문법(영역 알약, 노드 아이콘 원, 연결선 종류, 프로토콜 라벨)으로 노드가 600ms 간격으로 나타나 이어진다. 그 뒤로는 구성도를 지우지 않고, 대화가 "접속 흐름"과 "결제 흐름"을 번갈아 물으면 그 흐름이 연두 점과 연두 길로 지나간다(단계마다 1100ms 이동, 500ms 머묾, 닿은 노드는 연두 테두리와 잔물결 한 번). 흐름 밖 노드·선·라벨은 앱처럼 물러서고, 대화 카드의 단계 칩이 함께 켜진다. 움직임은 두 곡선(부드럽게 출발·멈춤, 등장 감속)으로만 만든다. 탭이 가려지면 멈추고, 동작 줄이기 설정이면 접속 흐름이 켜진 마지막 장면으로 멈춘다. 대화 카드는 그림자 대신 바탕색 띠로 그림에서 떼어 낸다. 오른쪽 반은 Drafting Well 양식이다. 두 반쪽은 위·아래 선과 높이를 함께 써서 한 물건으로 읽히고, 화면 끝까지 늘어나지 않는다(로그인은 빨리 지나가는 화면이라 그림이 양식과 떨어져 따로 놀면 안 된다). 정의 한 줄은 Page 크기로, 양식 제목(Hero)보다 한 단 낮고 설명 문장을 붙이지 않는다. 그림은 장식이라 보조기기에 숨기고 화면 제목(h1)은 양식의 것 하나다. 좁은 화면은 점 격자 위 가운데 양식 판만.

### Edge Label (Signature)
연결선 위에 붙는 프로토콜·포트 라벨(`HTTP/AJP ×2`, `TCP 1521`). Label 크기, 바탕과 같은 종이 위에 놓여 선을 끊는다. 화면 틀의 라벨 말씨는 이 라벨을 기준으로 삼는다.

## Do's and Don'ts

### Do:
- **Do** 버튼은 공용 버튼 하나의 변형(Primary·Secondary·Danger·Quiet)으로만 그린다.
- **Do** 모서리는 6px(조작), 8px(판), 알약(탭·배지) 셋만 쓴다.
- **Do** 위계는 크기보다 색(Ink → Ink Soft → Muted Steel)으로 만든다. 화면 틀 글자는 12px 아래로 내려가지 않는다.
- **Do** 바뀐 것, 고른 것, 지금 할 일에만 연두를 쓴다.
- **Do** 화면 틀의 구분선·목록·카드에 캔버스와 같은 1px 선과 같은 모서리를 쓴다.
- **Do** 확실하지 않은 것(미확정 가정, AI 추정 망연계)은 점선이나 "추정" 표시로 구분한다.

### Don't:
- **Don't** 그림자, 흐림, 그라데이션으로 높이를 만든다.
- **Don't** 화면마다 `.btn` 을 새로 정의한다.
- **Don't** 칠한 연두 버튼을 한 화면에 둘 이상 둔다.
- **Don't** 화면 틀에 영역·분류 색조를 장식으로 칠한다.
- **Don't** 별자리·네온·유리 같은 범용 "테크" 장식을 쓴다. 바탕 그림이 필요하면 설계도의 재료(점 격자, 선, 영역)로 만든다.
