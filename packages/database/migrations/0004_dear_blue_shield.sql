CREATE TABLE "academic_offering" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" uuid NOT NULL,
	"session" text NOT NULL,
	"class_name" text NOT NULL,
	CONSTRAINT "offering_tenant_id" UNIQUE("institution_id","id"),
	CONSTRAINT "offering_tenant_session_id" UNIQUE("institution_id","id","session"),
	CONSTRAINT "offering_session_class" UNIQUE("institution_id","session","class_name")
);
--> statement-breakpoint
CREATE TABLE "student" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" uuid NOT NULL,
	"name" text NOT NULL,
	"birth_certificate" text,
	"profile" text NOT NULL,
	CONSTRAINT "student_tenant_id" UNIQUE("institution_id","id"),
	CONSTRAINT "student_birth_identity" UNIQUE("institution_id","birth_certificate")
);
--> statement-breakpoint
CREATE TABLE "student_enrollment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"offering_id" uuid NOT NULL,
	"session" text NOT NULL,
	CONSTRAINT "enrollment_one_per_session" UNIQUE("institution_id","student_id","session")
);
--> statement-breakpoint
CREATE TABLE "admission_candidate" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" uuid NOT NULL,
	"offering_id" uuid NOT NULL,
	"assignee_id" text NOT NULL,
	"state" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"profile" jsonb NOT NULL,
	"follow_up_date" date,
	"admission_fee_minor" integer NOT NULL,
	"willing_fee_minor" integer NOT NULL,
	"credit_willing_fee" boolean NOT NULL,
	"student_id" uuid,
	"admission_number" text,
	"admitted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "candidate_tenant_id" UNIQUE("institution_id","id"),
	CONSTRAINT "candidate_admission_number" UNIQUE("institution_id","admission_number"),
	CONSTRAINT "candidate_state" CHECK ("admission_candidate"."state" in ('follow_up','willing','admitted','closed')),
	CONSTRAINT "candidate_follow_up" CHECK (("admission_candidate"."state" = 'follow_up') = ("admission_candidate"."follow_up_date" is not null)),
	CONSTRAINT "candidate_admitted" CHECK (("admission_candidate"."state" = 'admitted') = ("admission_candidate"."student_id" is not null and "admission_candidate"."admitted_at" is not null and "admission_candidate"."admission_number" is not null)),
	CONSTRAINT "candidate_amounts" CHECK ("admission_candidate"."willing_fee_minor" >= 0 and "admission_candidate"."admission_fee_minor" >= 0 and "admission_candidate"."version" > 0)
);
--> statement-breakpoint
CREATE TABLE "admission_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" uuid NOT NULL,
	"candidate_id" uuid NOT NULL,
	"actor_id" text NOT NULL,
	"action" text NOT NULL,
	"note" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admission_operation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" uuid NOT NULL,
	"operation_key" uuid NOT NULL,
	"actor_id" text NOT NULL,
	"fingerprint" text NOT NULL,
	"candidate_id" uuid NOT NULL,
	CONSTRAINT "admission_operation_key" UNIQUE("institution_id","operation_key")
);
--> statement-breakpoint
CREATE TABLE "admission_settings" (
	"institution_id" uuid PRIMARY KEY NOT NULL,
	"version" integer NOT NULL,
	"reminder_days_before" integer NOT NULL,
	"before_time" text NOT NULL,
	"on_date_time" text NOT NULL,
	"willing_fee_minor" integer NOT NULL,
	"admission_fee_minor" integer NOT NULL,
	"credit_willing_fee" boolean NOT NULL,
	CONSTRAINT "admission_settings_amounts" CHECK ("admission_settings"."willing_fee_minor" >= 0 and "admission_settings"."admission_fee_minor" >= 0),
	CONSTRAINT "admission_settings_days" CHECK ("admission_settings"."reminder_days_before" between 1 and 30),
	CONSTRAINT "admission_settings_times" CHECK ("admission_settings"."before_time" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' and "admission_settings"."on_date_time" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$')
);
--> statement-breakpoint
CREATE TABLE "follow_up_reminder" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" uuid NOT NULL,
	"candidate_id" uuid NOT NULL,
	"recipient_id" text NOT NULL,
	"candidate_version" integer NOT NULL,
	"due_date" date NOT NULL,
	"kind" text NOT NULL,
	"deliver_at" timestamp with time zone NOT NULL,
	"delivered_at" timestamp with time zone,
	"read" boolean DEFAULT false NOT NULL,
	"cancelled" boolean DEFAULT false NOT NULL,
	CONSTRAINT "reminder_delivery_key" UNIQUE("institution_id","candidate_id","due_date","kind","candidate_version"),
	CONSTRAINT "reminder_kind" CHECK ("follow_up_reminder"."kind" in ('before','on_date'))
);
--> statement-breakpoint
CREATE TABLE "admission_charge" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" uuid NOT NULL,
	"candidate_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"amount_minor" integer NOT NULL,
	"credit_minor" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "charge_tenant_id" UNIQUE("institution_id","id"),
	CONSTRAINT "candidate_charge_kind" UNIQUE("institution_id","candidate_id","kind"),
	CONSTRAINT "charge_amounts" CHECK ("admission_charge"."amount_minor" >= 0 and "admission_charge"."credit_minor" >= 0 and "admission_charge"."credit_minor" <= "admission_charge"."amount_minor"),
	CONSTRAINT "charge_kind" CHECK ("admission_charge"."kind" in ('willing','admission'))
);
--> statement-breakpoint
CREATE TABLE "admission_payment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" uuid NOT NULL,
	"charge_id" uuid NOT NULL,
	"collector_id" text NOT NULL,
	"amount_minor" integer NOT NULL,
	"method" text DEFAULT 'cash' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payment_tenant_id" UNIQUE("institution_id","id"),
	CONSTRAINT "payment_one_per_charge" UNIQUE("institution_id","charge_id"),
	CONSTRAINT "payment_positive" CHECK ("admission_payment"."amount_minor" > 0 and "admission_payment"."method" = 'cash')
);
--> statement-breakpoint
CREATE TABLE "admission_receipt" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" uuid NOT NULL,
	"payment_id" uuid NOT NULL,
	"number" text NOT NULL,
	CONSTRAINT "receipt_number" UNIQUE("institution_id","number"),
	CONSTRAINT "receipt_payment" UNIQUE("institution_id","payment_id")
);
--> statement-breakpoint
ALTER TABLE "academic_offering" ADD CONSTRAINT "academic_offering_institution_id_institution_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institution"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student" ADD CONSTRAINT "student_institution_id_institution_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institution"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_enrollment" ADD CONSTRAINT "student_enrollment_institution_id_student_id_student_institution_id_id_fk" FOREIGN KEY ("institution_id","student_id") REFERENCES "public"."student"("institution_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_enrollment" ADD CONSTRAINT "student_enrollment_institution_id_offering_id_session_academic_offering_institution_id_id_session_fk" FOREIGN KEY ("institution_id","offering_id","session") REFERENCES "public"."academic_offering"("institution_id","id","session") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_candidate" ADD CONSTRAINT "admission_candidate_institution_id_offering_id_academic_offering_institution_id_id_fk" FOREIGN KEY ("institution_id","offering_id") REFERENCES "public"."academic_offering"("institution_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_candidate" ADD CONSTRAINT "admission_candidate_institution_id_assignee_id_institution_membership_institution_id_user_id_fk" FOREIGN KEY ("institution_id","assignee_id") REFERENCES "public"."institution_membership"("institution_id","user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_candidate" ADD CONSTRAINT "admission_candidate_institution_id_student_id_student_institution_id_id_fk" FOREIGN KEY ("institution_id","student_id") REFERENCES "public"."student"("institution_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_history" ADD CONSTRAINT "admission_history_institution_id_candidate_id_admission_candidate_institution_id_id_fk" FOREIGN KEY ("institution_id","candidate_id") REFERENCES "public"."admission_candidate"("institution_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_history" ADD CONSTRAINT "admission_history_institution_id_actor_id_institution_membership_institution_id_user_id_fk" FOREIGN KEY ("institution_id","actor_id") REFERENCES "public"."institution_membership"("institution_id","user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_operation" ADD CONSTRAINT "admission_operation_institution_id_candidate_id_admission_candidate_institution_id_id_fk" FOREIGN KEY ("institution_id","candidate_id") REFERENCES "public"."admission_candidate"("institution_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_operation" ADD CONSTRAINT "admission_operation_institution_id_actor_id_institution_membership_institution_id_user_id_fk" FOREIGN KEY ("institution_id","actor_id") REFERENCES "public"."institution_membership"("institution_id","user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_settings" ADD CONSTRAINT "admission_settings_institution_id_institution_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institution"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follow_up_reminder" ADD CONSTRAINT "follow_up_reminder_institution_id_candidate_id_admission_candidate_institution_id_id_fk" FOREIGN KEY ("institution_id","candidate_id") REFERENCES "public"."admission_candidate"("institution_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follow_up_reminder" ADD CONSTRAINT "follow_up_reminder_institution_id_recipient_id_institution_membership_institution_id_user_id_fk" FOREIGN KEY ("institution_id","recipient_id") REFERENCES "public"."institution_membership"("institution_id","user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_charge" ADD CONSTRAINT "admission_charge_institution_id_candidate_id_admission_candidate_institution_id_id_fk" FOREIGN KEY ("institution_id","candidate_id") REFERENCES "public"."admission_candidate"("institution_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_payment" ADD CONSTRAINT "admission_payment_institution_id_charge_id_admission_charge_institution_id_id_fk" FOREIGN KEY ("institution_id","charge_id") REFERENCES "public"."admission_charge"("institution_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_payment" ADD CONSTRAINT "admission_payment_institution_id_collector_id_institution_membership_institution_id_user_id_fk" FOREIGN KEY ("institution_id","collector_id") REFERENCES "public"."institution_membership"("institution_id","user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_receipt" ADD CONSTRAINT "admission_receipt_institution_id_payment_id_admission_payment_institution_id_id_fk" FOREIGN KEY ("institution_id","payment_id") REFERENCES "public"."admission_payment"("institution_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "candidate_call_queue" ON "admission_candidate" USING btree ("institution_id","assignee_id","state","follow_up_date");--> statement-breakpoint
CREATE INDEX "candidate_directory" ON "admission_candidate" USING btree ("institution_id","state","created_at");--> statement-breakpoint
CREATE INDEX "admission_history_candidate" ON "admission_history" USING btree ("institution_id","candidate_id","created_at");--> statement-breakpoint
CREATE INDEX "reminder_delivery_queue" ON "follow_up_reminder" USING btree ("cancelled","delivered_at","deliver_at");--> statement-breakpoint
CREATE INDEX "reminder_inbox" ON "follow_up_reminder" USING btree ("institution_id","recipient_id","delivered_at");