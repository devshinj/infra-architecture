-- 구성도의 흐름을 버전과 따로 저장한다(되돌려도 남는다). 구성도마다 흐름 id(key)가 겹치지 않는다.
-- diagrams.flows_suggested_at: 흐름 자동 제안을 한 번만 하기 위한 표식.
CREATE TABLE "flows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"diagram_id" uuid NOT NULL,
	"key" text NOT NULL,
	"data" jsonb NOT NULL,
	"source" text NOT NULL,
	"reviewed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "flows_diagram_id_key_unique" UNIQUE("diagram_id","key")
);
--> statement-breakpoint
ALTER TABLE "diagrams" ADD COLUMN "flows_suggested_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "flows" ADD CONSTRAINT "flows_diagram_id_diagrams_id_fk" FOREIGN KEY ("diagram_id") REFERENCES "public"."diagrams"("id") ON DELETE cascade ON UPDATE no action;