CREATE TABLE "user_employees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"agent_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "user_employees_user_id_agent_id_unique" UNIQUE("user_id","agent_id")
);
--> statement-breakpoint
ALTER TABLE "user_employees" ADD CONSTRAINT "user_employees_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_employees" ADD CONSTRAINT "user_employees_agent_id_agent_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agent"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_employees_user_id_idx" ON "user_employees" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_employees_agent_id_idx" ON "user_employees" USING btree ("agent_id");