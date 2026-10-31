CREATE TABLE "attendance_correction" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" uuid NOT NULL,
	"register_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"original" text NOT NULL,
	"proposed" text NOT NULL,
	"reason" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"actor_id" text NOT NULL,
	"reviewer_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_at" timestamp with time zone,
	CONSTRAINT "attendance_correction_status" CHECK ("attendance_correction"."status" in ('pending','approved','rejected')),
	CONSTRAINT "attendance_correction_marks" CHECK ("attendance_correction"."original" in ('Present','Absent','Late') and "attendance_correction"."proposed" in ('Present','Absent','Late') and "attendance_correction"."original" <> "attendance_correction"."proposed")
);
--> statement-breakpoint
CREATE TABLE "attendance_register" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" uuid NOT NULL,
	"offering_id" uuid NOT NULL,
	"section" text NOT NULL,
	"date" date NOT NULL,
	"marks" jsonb NOT NULL,
	"original_marks" jsonb,
	"submitted" boolean DEFAULT false NOT NULL,
	"actor_id" text NOT NULL,
	"submitted_at" timestamp with time zone,
	CONSTRAINT "attendance_tenant_id" UNIQUE("institution_id","id"),
	CONSTRAINT "attendance_class_date" UNIQUE("institution_id","offering_id","section","date"),
	CONSTRAINT "attendance_submitted_original" CHECK (not "attendance_register"."submitted" or ("attendance_register"."original_marks" is not null and "attendance_register"."submitted_at" is not null))
);
--> statement-breakpoint
CREATE TABLE "class_routine" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" uuid NOT NULL,
	"offering_id" uuid NOT NULL,
	"section" text NOT NULL,
	"version" text NOT NULL,
	"data" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "routine_class_version" UNIQUE("institution_id","offering_id","section","version")
);
--> statement-breakpoint
CREATE TABLE "school_configuration" (
	"institution_id" uuid PRIMARY KEY NOT NULL,
	"revision" integer DEFAULT 0 NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"categories" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"fee_defaults" jsonb DEFAULT '[]'::jsonb NOT NULL,
	CONSTRAINT "school_revision_nonnegative" CHECK ("school_configuration"."revision" >= 0)
);
--> statement-breakpoint
CREATE TABLE "school_evidence" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" uuid NOT NULL,
	"actor_id" text NOT NULL,
	"name" text NOT NULL,
	"media_type" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "school_evidence_tenant_id" UNIQUE("institution_id","id"),
	CONSTRAINT "school_evidence_size" CHECK (length("school_evidence"."content") between 1 and 6990508)
);
--> statement-breakpoint
CREATE TABLE "school_expense" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" uuid NOT NULL,
	"evidence_id" uuid,
	"amount_minor" integer NOT NULL,
	"status" text NOT NULL,
	"data" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "school_expense_amount" CHECK ("school_expense"."amount_minor" between 1 and 100000000),
	CONSTRAINT "school_expense_status" CHECK ("school_expense"."status" in ('draft','pending','approved','returned'))
);
--> statement-breakpoint
CREATE TABLE "school_operation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" uuid NOT NULL,
	"actor_id" text NOT NULL,
	"operation_key" uuid NOT NULL,
	"fingerprint" text NOT NULL,
	"action" text NOT NULL,
	"resource_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "school_operation_key" UNIQUE("institution_id","operation_key")
);
--> statement-breakpoint
CREATE TABLE "school_fee_allocation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" uuid NOT NULL,
	"payment_id" uuid NOT NULL,
	"charge_id" uuid NOT NULL,
	"amount_minor" integer NOT NULL,
	CONSTRAINT "school_allocation_charge" UNIQUE("institution_id","payment_id","charge_id"),
	CONSTRAINT "school_allocation_amount" CHECK ("school_fee_allocation"."amount_minor" between 1 and 100000000)
);
--> statement-breakpoint
CREATE TABLE "school_fee_payment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" uuid NOT NULL,
	"candidate_id" uuid NOT NULL,
	"collector_id" text NOT NULL,
	"amount_minor" integer NOT NULL,
	"date" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "school_payment_tenant_id" UNIQUE("institution_id","id"),
	CONSTRAINT "school_payment_amount" CHECK ("school_fee_payment"."amount_minor" between 1 and 100000000)
);
--> statement-breakpoint
CREATE TABLE "school_fee_reversal" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" uuid NOT NULL,
	"payment_id" uuid NOT NULL,
	"actor_id" text NOT NULL,
	"reason" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "school_reversal_once" UNIQUE("institution_id","payment_id"),
	CONSTRAINT "school_reversal_reason" CHECK (length(trim("school_fee_reversal"."reason")) between 1 and 1000)
);
--> statement-breakpoint
ALTER TABLE "academic_offering" ADD COLUMN "sections" text DEFAULT 'A' NOT NULL;--> statement-breakpoint
ALTER TABLE "academic_offering" ADD COLUMN "capacity" integer DEFAULT 40 NOT NULL;--> statement-breakpoint
ALTER TABLE "academic_offering" ADD COLUMN "teacher_id" text;--> statement-breakpoint
ALTER TABLE "academic_offering" ADD COLUMN "active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "student_enrollment" ADD COLUMN "section" text DEFAULT 'A' NOT NULL;--> statement-breakpoint
ALTER TABLE "attendance_correction" ADD CONSTRAINT "attendance_correction_institution_id_register_id_attendance_register_institution_id_id_fk" FOREIGN KEY ("institution_id","register_id") REFERENCES "public"."attendance_register"("institution_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_correction" ADD CONSTRAINT "attendance_correction_institution_id_student_id_student_institution_id_id_fk" FOREIGN KEY ("institution_id","student_id") REFERENCES "public"."student"("institution_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_correction" ADD CONSTRAINT "attendance_correction_institution_id_actor_id_institution_membership_institution_id_user_id_fk" FOREIGN KEY ("institution_id","actor_id") REFERENCES "public"."institution_membership"("institution_id","user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_correction" ADD CONSTRAINT "attendance_correction_institution_id_reviewer_id_institution_membership_institution_id_user_id_fk" FOREIGN KEY ("institution_id","reviewer_id") REFERENCES "public"."institution_membership"("institution_id","user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_register" ADD CONSTRAINT "attendance_register_institution_id_offering_id_academic_offering_institution_id_id_fk" FOREIGN KEY ("institution_id","offering_id") REFERENCES "public"."academic_offering"("institution_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_register" ADD CONSTRAINT "attendance_register_institution_id_actor_id_institution_membership_institution_id_user_id_fk" FOREIGN KEY ("institution_id","actor_id") REFERENCES "public"."institution_membership"("institution_id","user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_routine" ADD CONSTRAINT "class_routine_institution_id_offering_id_academic_offering_institution_id_id_fk" FOREIGN KEY ("institution_id","offering_id") REFERENCES "public"."academic_offering"("institution_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school_configuration" ADD CONSTRAINT "school_configuration_institution_id_institution_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institution"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school_evidence" ADD CONSTRAINT "school_evidence_institution_id_actor_id_institution_membership_institution_id_user_id_fk" FOREIGN KEY ("institution_id","actor_id") REFERENCES "public"."institution_membership"("institution_id","user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school_expense" ADD CONSTRAINT "school_expense_institution_id_institution_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institution"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school_expense" ADD CONSTRAINT "school_expense_institution_id_evidence_id_school_evidence_institution_id_id_fk" FOREIGN KEY ("institution_id","evidence_id") REFERENCES "public"."school_evidence"("institution_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school_operation" ADD CONSTRAINT "school_operation_institution_id_actor_id_institution_membership_institution_id_user_id_fk" FOREIGN KEY ("institution_id","actor_id") REFERENCES "public"."institution_membership"("institution_id","user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school_fee_allocation" ADD CONSTRAINT "school_fee_allocation_institution_id_payment_id_school_fee_payment_institution_id_id_fk" FOREIGN KEY ("institution_id","payment_id") REFERENCES "public"."school_fee_payment"("institution_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school_fee_allocation" ADD CONSTRAINT "school_fee_allocation_institution_id_charge_id_monthly_fee_charge_institution_id_id_fk" FOREIGN KEY ("institution_id","charge_id") REFERENCES "public"."monthly_fee_charge"("institution_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school_fee_payment" ADD CONSTRAINT "school_fee_payment_institution_id_candidate_id_admission_candidate_institution_id_id_fk" FOREIGN KEY ("institution_id","candidate_id") REFERENCES "public"."admission_candidate"("institution_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school_fee_payment" ADD CONSTRAINT "school_fee_payment_institution_id_collector_id_institution_membership_institution_id_user_id_fk" FOREIGN KEY ("institution_id","collector_id") REFERENCES "public"."institution_membership"("institution_id","user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school_fee_reversal" ADD CONSTRAINT "school_fee_reversal_institution_id_payment_id_school_fee_payment_institution_id_id_fk" FOREIGN KEY ("institution_id","payment_id") REFERENCES "public"."school_fee_payment"("institution_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school_fee_reversal" ADD CONSTRAINT "school_fee_reversal_institution_id_actor_id_institution_membership_institution_id_user_id_fk" FOREIGN KEY ("institution_id","actor_id") REFERENCES "public"."institution_membership"("institution_id","user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "attendance_one_pending" ON "attendance_correction" USING btree ("institution_id","register_id","student_id") WHERE "attendance_correction"."status" = 'pending';--> statement-breakpoint
CREATE INDEX "attendance_correction_tenant" ON "attendance_correction" USING btree ("institution_id","created_at");--> statement-breakpoint
CREATE INDEX "routine_tenant_created" ON "class_routine" USING btree ("institution_id","created_at");--> statement-breakpoint
CREATE INDEX "school_expense_tenant_date" ON "school_expense" USING btree ("institution_id","created_at");--> statement-breakpoint
CREATE INDEX "school_operation_audit" ON "school_operation" USING btree ("institution_id","created_at");--> statement-breakpoint
CREATE INDEX "school_allocation_balance" ON "school_fee_allocation" USING btree ("institution_id","charge_id");--> statement-breakpoint
CREATE INDEX "school_payment_tenant_date" ON "school_fee_payment" USING btree ("institution_id","date");--> statement-breakpoint
ALTER TABLE "academic_offering" ADD CONSTRAINT "academic_offering_institution_id_teacher_id_institution_membership_institution_id_user_id_fk" FOREIGN KEY ("institution_id","teacher_id") REFERENCES "public"."institution_membership"("institution_id","user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_offering" ADD CONSTRAINT "offering_capacity" CHECK ("academic_offering"."capacity" between 1 and 9999);