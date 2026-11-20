CREATE TABLE "guide_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"diagram_id" uuid NOT NULL,
	"guide_id" text NOT NULL,
	"env" text,
	"step" integer DEFAULT 0 NOT NULL,
	"step_versions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"env_version" integer,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "guide_runs_diagram_id_unique" UNIQUE("diagram_id")
);
--> statement-breakpoint
ALTER TABLE "guide_runs" ADD CONSTRAINT "guide_runs_diagram_id_diagrams_id_fk" FOREIGN KEY ("diagram_id") REFERENCES "public"."diagrams"("id") ON DELETE cascade ON UPDATE no action;