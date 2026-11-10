import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import type { LinkMethod, NetGrade } from "@/domain/network";
import type { EdgeExplanation, NodeExplanation } from "@/domain/explain";
import type { Flow } from "@/domain/flows";
import type { DiagramState } from "@/domain/types";
import type { MessageMeta } from "@/server/chat/events";

const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: createdAt(),
});

// Nexus 연동 자리. 지금은 쓰지 않는다.
export const accounts = pgTable(
  "accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
  },
  (t) => [unique().on(t.provider, t.providerAccountId)],
);

export const passwordResetTokens = pgTable("password_reset_tokens", {
  tokenHash: text("token_hash").primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
});

// 이름은 앞뒤 공백을 지운 채로 저장된다(server/projects.ts cleanName). 그래서 lower(name) 만으로
// 앱의 비교(대소문자 무시)와 같은 기준이 된다. 같은 사용자의 프로젝트, 같은 프로젝트의 구성도끼리 겹치지 않는다.
export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: uuid("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    createdAt: createdAt(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("projects_owner_name_uidx").on(t.ownerId, sql`lower(${t.name})`)],
);

export const diagrams = pgTable(
  "diagrams",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    pinnedPositions: jsonb("pinned_positions")
      .$type<Record<string, { x: number; y: number }>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    // 흐름 자동 제안을 한 번만 하기 위한 표식. 제안한 시각이 들어간다.
    flowsSuggestedAt: timestamp("flows_suggested_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("diagrams_project_name_uidx").on(t.projectId, sql`lower(${t.name})`)],
);

export type MessageRole = "user" | "assistant" | "system";

export type ChatSessionKind = "diagram" | "node";

// 대화 세션(§6.8). kind 가 node 면 노드에 대해 물어보는 질문 세션, diagram 이면 구성도를 바꾸는 대화를 따로 이어 가는 세션이다.
// 세션이 없는 구성도 대화(기본 대화)는 session_id null 로 쌓인다.
export const chatSessions = pgTable(
  "chat_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    diagramId: uuid("diagram_id").notNull().references(() => diagrams.id, { onDelete: "cascade" }),
    kind: text("kind").$type<ChatSessionKind>().notNull().default("node"),
    // 질문 세션만 노드가 있다(구성도 대화 세션은 둘 다 null).
    nodeId: text("node_id"),
    // 만들 때의 노드 이름 스냅숏. 노드가 지워지거나 이름이 바뀌어도 목록에서 알아볼 수 있게.
    nodeLabel: text("node_label"),
    title: text("title").notNull(),
    createdAt: createdAt(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("chat_sessions_diagram_updated_idx").on(t.diagramId, t.updatedAt),
    check(
      "chat_sessions_kind_node_check",
      sql`(${t.kind} = 'node' AND ${t.nodeId} IS NOT NULL AND ${t.nodeLabel} IS NOT NULL) OR (${t.kind} = 'diagram' AND ${t.nodeId} IS NULL AND ${t.nodeLabel} IS NULL)`,
    ),
  ],
);

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    diagramId: uuid("diagram_id").notNull().references(() => diagrams.id, { onDelete: "cascade" }),
    sessionId: uuid("session_id").references(() => chatSessions.id, { onDelete: "cascade" }),
    role: text("role").$type<MessageRole>().notNull(),
    content: text("content").notNull(),
    meta: jsonb("meta").$type<MessageMeta>().notNull().default(sql`'{}'::jsonb`),
    createdAt: createdAt(),
  },
  (t) => [
    index("messages_diagram_created_idx").on(t.diagramId, t.createdAt),
    index("messages_session_created_idx").on(t.sessionId, t.createdAt),
  ],
);

export type VersionSource = "import" | "restore" | "ai" | "form" | "mcp";
export type VersionStatus = "complete" | "aborted";

export const diagramVersions = pgTable(
  "diagram_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    diagramId: uuid("diagram_id").notNull().references(() => diagrams.id, { onDelete: "cascade" }),
    number: integer("number").notNull(),
    state: jsonb("state").$type<DiagramState>().notNull(),
    source: text("source").$type<VersionSource>().notNull(),
    status: text("status").$type<VersionStatus>().notNull().default("complete"),
    restoredFrom: integer("restored_from"),
    messageId: uuid("message_id").references(() => messages.id, { onDelete: "set null" }),
    // Claude Code(MCP)로 만든 버전이면 "mcp". 되돌리기처럼 source 가 다른 버전에도 붙는다.
    via: text("via").$type<"mcp">(),
    summary: text("summary"),
    createdAt: createdAt(),
  },
  (t) => [unique().on(t.diagramId, t.number)],
);

// Claude Code 연결용 키. 원문은 저장하지 않고 SHA-256 해시만 둔다.
export const mcpKeys = pgTable("mcp_keys", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  prefix: text("prefix").notNull(),
  hash: text("hash").notNull().unique(),
  createdAt: createdAt(),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
});

export type GlossarySource = "seed" | "ai";

// 사용자별 용어 사전. key 는 정규화된 키이고 aliases 도 정규화 키들이다.
export const glossaryTerms = pgTable(
  "glossary_terms",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    term: text("term").notNull(),
    fullName: text("full_name").notNull(),
    category: text("category").notNull(),
    definition: text("definition").notNull(),
    why: text("why").notNull(),
    compare: text("compare").notNull(),
    aliases: jsonb("aliases").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
    reviewed: boolean("reviewed").notNull().default(false),
    source: text("source").$type<GlossarySource>().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique().on(t.userId, t.key)],
);

export type ExplanationTargetKind = "node" | "edge";

// 노드·엣지 설명 캐시. signature 가 바뀌면 다시 만든다. data 형태는 설명 도메인 타입이 정한다.
export const explanations = pgTable(
  "explanations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    diagramId: uuid("diagram_id").notNull().references(() => diagrams.id, { onDelete: "cascade" }),
    targetKind: text("target_kind").$type<ExplanationTargetKind>().notNull(),
    targetId: text("target_id").notNull(),
    signature: text("signature").notNull(),
    data: jsonb("data").$type<NodeExplanation | EdgeExplanation>().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique().on(t.diagramId, t.targetKind, t.targetId)],
);

export type FlowSource = "ai" | "user";

// 구성도의 흐름. 버전과 따로 저장해 되돌려도 남는다. key 는 흐름 id, data 는 흐름 도메인 타입이다.
// 끊김(problems)은 저장하지 않고 불러올 때마다 최신 상태로 계산한다.
export const flows = pgTable(
  "flows",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    diagramId: uuid("diagram_id").notNull().references(() => diagrams.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    data: jsonb("data").$type<Flow>().notNull(),
    source: text("source").$type<FlowSource>().notNull(),
    reviewed: boolean("reviewed").notNull().default(false),
    createdAt: createdAt(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique().on(t.diagramId, t.key)],
);

export type NetworkTypeSource = "seed" | "user";

// 계정 공통 망 종류. seed 는 기본 제공(고치면 edited, 숨길 수 있음), user 는 직접 만든 것이다.
export const networkTypes = pgTable(
  "network_types",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    name: text("name").notNull(),
    aliases: jsonb("aliases").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
    description: text("description").notNull().default(""),
    grade: text("grade").$type<NetGrade>().notNull(),
    source: text("source").$type<NetworkTypeSource>().notNull(),
    edited: boolean("edited").notNull().default(false),
    hidden: boolean("hidden").notNull().default(false),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique().on(t.userId, t.key)],
);

// 계정 공통 망 종류 짝 규칙. typeA < typeB 로 정렬해 저장한다.
export const networkRules = pgTable(
  "network_rules",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    typeA: text("type_a").notNull(),
    typeB: text("type_b").notNull(),
    method: text("method").$type<LinkMethod>().notNull(),
    note: text("note").notNull().default(""),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique().on(t.userId, t.typeA, t.typeB)],
);
