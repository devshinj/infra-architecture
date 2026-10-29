import { sql } from "drizzle-orm";
import {
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

import type { DiagramState } from "@/domain/types";

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
    createdAt: createdAt(),
  },
  (t) => [unique().on(t.diagramId, t.number)],
);
