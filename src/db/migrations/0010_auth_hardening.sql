CREATE TABLE "auth_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "session_version" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX "auth_attempts_key_at_idx" ON "auth_attempts" USING btree ("key","at");--> statement-breakpoint
CREATE INDEX "auth_attempts_at_idx" ON "auth_attempts" USING btree ("at");