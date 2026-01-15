CREATE TABLE "agent_group_member" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" uuid NOT NULL,
	"group_id" uuid NOT NULL,
	"last_used_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "agent_group_member_agent_id_group_id_unique" UNIQUE("agent_id","group_id")
);
--> statement-breakpoint
CREATE TABLE "agent_group" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"type" varchar DEFAULT 'custom' NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "agent_group_user_id_name_unique" UNIQUE("user_id","name")
);
--> statement-breakpoint
ALTER TABLE "agent_group_member" ADD CONSTRAINT "agent_group_member_agent_id_agent_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agent"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_group_member" ADD CONSTRAINT "agent_group_member_group_id_agent_group_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."agent_group"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_group" ADD CONSTRAINT "agent_group_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "agent_group_member_agent_id_idx" ON "agent_group_member" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "agent_group_member_group_id_idx" ON "agent_group_member" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "agent_group_member_last_used_idx" ON "agent_group_member" USING btree ("last_used_at");--> statement-breakpoint
CREATE INDEX "agent_group_user_id_idx" ON "agent_group" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "agent_group_type_idx" ON "agent_group" USING btree ("type");