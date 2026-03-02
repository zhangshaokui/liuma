CREATE TABLE IF NOT EXISTS "agent_category" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"emoji" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agent" ADD COLUMN IF NOT EXISTS "is_template" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "agent" ADD COLUMN IF NOT EXISTS "category_id" uuid;
--> statement-breakpoint
ALTER TABLE "agent" ADD COLUMN IF NOT EXISTS "copy_count" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE "agent" ADD COLUMN IF NOT EXISTS "cover_emoji" text;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "agent" ADD CONSTRAINT "agent_category_id_agent_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."agent_category"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
