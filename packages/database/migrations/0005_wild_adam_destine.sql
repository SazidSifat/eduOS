CREATE TABLE "admission_configuration_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" uuid NOT NULL,
	"actor_id" text NOT NULL,
	"value" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "admission_configuration_history" ADD CONSTRAINT "admission_configuration_history_institution_id_actor_id_institution_membership_institution_id_user_id_fk" FOREIGN KEY ("institution_id","actor_id") REFERENCES "public"."institution_membership"("institution_id","user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "admission_configuration_tenant" ON "admission_configuration_history" USING btree ("institution_id","created_at");