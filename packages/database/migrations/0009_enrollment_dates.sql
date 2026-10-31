CREATE TABLE "enrollment_date_change" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" uuid NOT NULL,
	"enrollment_id" uuid NOT NULL,
	"actor_id" text NOT NULL,
	"previous_start" date,
	"previous_end" date,
	"starts_on" date,
	"ends_on" date,
	"reason" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "enrollment_change_reason" CHECK (length(trim("enrollment_date_change"."reason")) between 1 and 1000),
	CONSTRAINT "enrollment_change_date_order" CHECK ("enrollment_date_change"."starts_on" is null or "enrollment_date_change"."ends_on" is null or "enrollment_date_change"."starts_on" <= "enrollment_date_change"."ends_on")
);
--> statement-breakpoint
ALTER TABLE "student_enrollment" ADD COLUMN "starts_on" date;--> statement-breakpoint
ALTER TABLE "student_enrollment" ADD COLUMN "ends_on" date;--> statement-breakpoint
ALTER TABLE "student_enrollment" ADD CONSTRAINT "enrollment_tenant_id" UNIQUE("institution_id","id");--> statement-breakpoint
ALTER TABLE "enrollment_date_change" ADD CONSTRAINT "enrollment_date_change_institution_id_enrollment_id_student_enrollment_institution_id_id_fk" FOREIGN KEY ("institution_id","enrollment_id") REFERENCES "public"."student_enrollment"("institution_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollment_date_change" ADD CONSTRAINT "enrollment_date_change_institution_id_actor_id_institution_membership_institution_id_user_id_fk" FOREIGN KEY ("institution_id","actor_id") REFERENCES "public"."institution_membership"("institution_id","user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "enrollment_change_history" ON "enrollment_date_change" USING btree ("institution_id","enrollment_id","created_at");--> statement-breakpoint
CREATE INDEX "enrollment_dated_roster" ON "student_enrollment" USING btree ("institution_id","offering_id","section","starts_on","ends_on");--> statement-breakpoint
ALTER TABLE "student_enrollment" ADD CONSTRAINT "enrollment_date_order" CHECK ("student_enrollment"."starts_on" is null or "student_enrollment"."ends_on" is null or "student_enrollment"."starts_on" <= "student_enrollment"."ends_on");