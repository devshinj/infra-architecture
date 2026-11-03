-- 대화 세션에 종류(kind)를 둔다: node = 노드 질문 세션(지금까지의 모든 세션), diagram = 구성도 대화 세션(노드 없음).
-- 구성도 대화 세션은 노드가 없으므로 node_id·node_label 을 null 로 둘 수 있게 푼다.
ALTER TABLE "chat_sessions" ALTER COLUMN "node_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "chat_sessions" ALTER COLUMN "node_label" DROP NOT NULL;--> statement-breakpoint
-- DEFAULT 'node' 로 더하면 이미 있는 행은 모두 'node' 로 채워진다(지금까지의 세션은 모두 노드 질문 세션이다).
ALTER TABLE "chat_sessions" ADD COLUMN "kind" text DEFAULT 'node' NOT NULL;--> statement-breakpoint
-- 종류는 둘 중 하나이고, 노드 질문 세션은 노드가 있어야 하며 구성도 대화 세션은 노드가 없어야 한다.
ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_kind_node_check" CHECK (("chat_sessions"."kind" = 'node' AND "chat_sessions"."node_id" IS NOT NULL AND "chat_sessions"."node_label" IS NOT NULL) OR ("chat_sessions"."kind" = 'diagram' AND "chat_sessions"."node_id" IS NULL AND "chat_sessions"."node_label" IS NULL));