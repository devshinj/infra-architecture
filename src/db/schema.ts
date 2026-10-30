import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

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

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: uuid("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  createdAt: createdAt(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const diagrams = pgTable("diagrams", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  pinnedPositions: jsonb("pinned_positions")
    .$type<Record<string, { x: number; y: number }>>()
    .notNull()
    .default(sql`'{}'::jsonb`),
  createdAt: createdAt(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type MessageRole = "user" | "assistant" | "system";

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    diagramId: uuid("diagram_id").notNull().references(() => diagrams.id, { onDelete: "cascade" }),
    role: text("role").$type<MessageRole>().notNull(),
    content: text("content").notNull(),
    meta: jsonb("meta").$type<MessageMeta>().notNull().default(sql`'{}'::jsonb`),
    createdAt: createdAt(),
  },
  (t) => [index("messages_diagram_created_idx").on(t.diagramId, t.createdAt)],
);

export type VersionSource = "import" | "restore" | "ai" | "form";
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
    createdAt: createdAt(),
  },
  (t) => [unique().on(t.diagramId, t.number)],
);

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
    data: jsonb("data").$type<Record<string, unknown>>().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique().on(t.diagramId, t.targetKind, t.targetId)],
);
