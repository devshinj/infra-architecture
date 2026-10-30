CREATE TABLE "explanations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"diagram_id" uuid NOT NULL,
	"target_kind" text NOT NULL,
	"target_id" text NOT NULL,
	"signature" text NOT NULL,
	"data" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "explanations_diagram_id_target_kind_target_id_unique" UNIQUE("diagram_id","target_kind","target_id")
);
--> statement-breakpoint
CREATE TABLE "glossary_terms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"key" text NOT NULL,
	"term" text NOT NULL,
	"full_name" text NOT NULL,
	"category" text NOT NULL,
	"definition" text NOT NULL,
	"why" text NOT NULL,
	"compare" text NOT NULL,
	"aliases" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"reviewed" boolean DEFAULT false NOT NULL,
	"source" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "glossary_terms_user_id_key_unique" UNIQUE("user_id","key")
);
--> statement-breakpoint
ALTER TABLE "explanations" ADD CONSTRAINT "explanations_diagram_id_diagrams_id_fk" FOREIGN KEY ("diagram_id") REFERENCES "public"."diagrams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "glossary_terms" ADD CONSTRAINT "glossary_terms_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;