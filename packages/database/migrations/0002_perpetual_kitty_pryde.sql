CREATE TYPE "public"."institution_billing_cycle" AS ENUM('monthly', 'annual');--> statement-breakpoint
CREATE TYPE "public"."institution_module" AS ENUM('academics', 'admissions', 'attendance', 'assessment', 'fees');--> statement-breakpoint
CREATE TYPE "public"."institution_status" AS ENUM('active', 'frozen', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."institution_subscription_status" AS ENUM('trial', 'active', 'past_due', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."institution_type" AS ENUM('kindergarten', 'high_school', 'coaching_center');--> statement-breakpoint
CREATE TYPE "public"."platform_institution_change_type" AS ENUM('created', 'status', 'modules', 'subscription');--> statement-breakpoint
CREATE TABLE "institution_module_grant" (
	"institution_id" uuid NOT NULL,
	"module" "institution_module" NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "institution_module_grant_institution_id_module_pk" PRIMARY KEY("institution_id","module")
);
--> statement-breakpoint
CREATE TABLE "institution_subscription" (
	"institution_id" uuid PRIMARY KEY NOT NULL,
	"plan_name" text NOT NULL,
	"status" "institution_subscription_status" NOT NULL,
	"billing_cycle" "institution_billing_cycle" NOT NULL,
	"amount_taka" integer NOT NULL,
	"period_ends_at" date,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "institution_subscription_amount_nonnegative" CHECK ("institution_subscription"."amount_taka" >= 0)
);
--> statement-breakpoint
CREATE TABLE "platform_institution_change" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" uuid NOT NULL,
	"actor_user_id" text NOT NULL,
	"change_type" "platform_institution_change_type" NOT NULL,
	"previous_value" jsonb,
	"value" jsonb NOT NULL,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "institution" ADD COLUMN "type" "institution_type";--> statement-breakpoint
ALTER TABLE "institution" ADD COLUMN "status" "institution_status" DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "institution" ADD COLUMN "status_reason" text;--> statement-breakpoint
ALTER TABLE "institution" ADD COLUMN "status_updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "institution_module_grant" ADD CONSTRAINT "institution_module_grant_institution_id_institution_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institution"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "institution_subscription" ADD CONSTRAINT "institution_subscription_institution_id_institution_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institution"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_institution_change" ADD CONSTRAINT "platform_institution_change_institution_id_institution_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institution"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_institution_change" ADD CONSTRAINT "platform_institution_change_actor_user_id_platform_operator_user_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."platform_operator"("user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "institution_module_enabled_idx" ON "institution_module_grant" USING btree ("institution_id","enabled");--> statement-breakpoint
CREATE INDEX "institution_subscription_status_idx" ON "institution_subscription" USING btree ("status","period_ends_at");--> statement-breakpoint
CREATE INDEX "platform_institution_change_created_idx" ON "platform_institution_change" USING btree ("institution_id","created_at");