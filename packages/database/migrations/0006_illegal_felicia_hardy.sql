CREATE TABLE "admission_fee_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" uuid NOT NULL,
	"candidate_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"type" text NOT NULL,
	"label" text NOT NULL,
	"amount_minor" integer NOT NULL,
	"billing_start_date" date,
	"billing_end_date" date,
	CONSTRAINT "fee_item_tenant_candidate_id" UNIQUE("institution_id","candidate_id","id"),
	CONSTRAINT "fee_item_position" UNIQUE("institution_id","candidate_id","position"),
	CONSTRAINT "fee_item_values" CHECK ("admission_fee_item"."position" between 0 and 19 and length(trim("admission_fee_item"."label")) between 1 and 80 and "admission_fee_item"."amount_minor" between 0 and 100000000),
	CONSTRAINT "fee_item_type" CHECK ("admission_fee_item"."type" in ('admission', 'session', 'monthly', 'other')),
	CONSTRAINT "fee_item_billing_dates" CHECK (("admission_fee_item"."type" = 'monthly' and "admission_fee_item"."amount_minor" > 0 and "admission_fee_item"."billing_start_date" is not null and ("admission_fee_item"."billing_end_date" is null or "admission_fee_item"."billing_end_date" >= "admission_fee_item"."billing_start_date")) or ("admission_fee_item"."type" <> 'monthly' and "admission_fee_item"."billing_start_date" is null and "admission_fee_item"."billing_end_date" is null))
);
--> statement-breakpoint
CREATE TABLE "monthly_fee_charge" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" uuid NOT NULL,
	"schedule_id" uuid NOT NULL,
	"due_date" date NOT NULL,
	"amount_minor" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "monthly_charge_tenant_id" UNIQUE("institution_id","id"),
	CONSTRAINT "monthly_charge_period" UNIQUE("institution_id","schedule_id","due_date"),
	CONSTRAINT "monthly_charge_amount" CHECK ("monthly_fee_charge"."amount_minor" between 1 and 100000000)
);
--> statement-breakpoint
CREATE TABLE "monthly_fee_payment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" uuid NOT NULL,
	"charge_id" uuid NOT NULL,
	"collector_id" text NOT NULL,
	"amount_minor" integer NOT NULL,
	"receipt_number" text NOT NULL,
	"method" text DEFAULT 'cash' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "monthly_payment_charge" UNIQUE("institution_id","charge_id"),
	CONSTRAINT "monthly_payment_receipt" UNIQUE("institution_id","receipt_number"),
	CONSTRAINT "monthly_payment_values" CHECK ("monthly_fee_payment"."amount_minor" between 1 and 100000000 and "monthly_fee_payment"."method" = 'cash')
);
--> statement-breakpoint
CREATE TABLE "monthly_fee_schedule" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" uuid NOT NULL,
	"candidate_id" uuid NOT NULL,
	"fee_item_id" uuid NOT NULL,
	"label" text NOT NULL,
	"amount_minor" integer NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"next_due_date" date NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "monthly_schedule_tenant_id" UNIQUE("institution_id","id"),
	CONSTRAINT "monthly_schedule_fee_item" UNIQUE("institution_id","fee_item_id"),
	CONSTRAINT "monthly_schedule_values" CHECK ("monthly_fee_schedule"."amount_minor" between 1 and 100000000 and "monthly_fee_schedule"."next_due_date" > "monthly_fee_schedule"."start_date" and ("monthly_fee_schedule"."end_date" is null or "monthly_fee_schedule"."end_date" >= "monthly_fee_schedule"."start_date"))
);
--> statement-breakpoint
ALTER TABLE "admission_fee_item" ADD CONSTRAINT "admission_fee_item_institution_id_candidate_id_admission_candidate_institution_id_id_fk" FOREIGN KEY ("institution_id","candidate_id") REFERENCES "public"."admission_candidate"("institution_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monthly_fee_charge" ADD CONSTRAINT "monthly_fee_charge_institution_id_schedule_id_monthly_fee_schedule_institution_id_id_fk" FOREIGN KEY ("institution_id","schedule_id") REFERENCES "public"."monthly_fee_schedule"("institution_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monthly_fee_payment" ADD CONSTRAINT "monthly_fee_payment_institution_id_charge_id_monthly_fee_charge_institution_id_id_fk" FOREIGN KEY ("institution_id","charge_id") REFERENCES "public"."monthly_fee_charge"("institution_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monthly_fee_payment" ADD CONSTRAINT "monthly_fee_payment_institution_id_collector_id_institution_membership_institution_id_user_id_fk" FOREIGN KEY ("institution_id","collector_id") REFERENCES "public"."institution_membership"("institution_id","user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monthly_fee_schedule" ADD CONSTRAINT "monthly_fee_schedule_institution_id_candidate_id_fee_item_id_admission_fee_item_institution_id_candidate_id_id_fk" FOREIGN KEY ("institution_id","candidate_id","fee_item_id") REFERENCES "public"."admission_fee_item"("institution_id","candidate_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "monthly_schedule_due" ON "monthly_fee_schedule" USING btree ("active","next_due_date","institution_id");--> statement-breakpoint
CREATE INDEX "monthly_schedule_candidate" ON "monthly_fee_schedule" USING btree ("institution_id","candidate_id");