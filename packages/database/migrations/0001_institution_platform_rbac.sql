CREATE TYPE "public"."institution_role" AS ENUM('admin', 'principal', 'admission_officer', 'accountant', 'teacher');--> statement-breakpoint
CREATE TYPE "public"."platform_role" AS ENUM('platform_owner', 'platform_manager');--> statement-breakpoint
CREATE TABLE "membership_change" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" uuid NOT NULL,
	"actor_user_id" text NOT NULL,
	"target_user_id" text NOT NULL,
	"previous_role" "institution_role",
	"role" "institution_role",
	"previous_active" boolean NOT NULL,
	"active" boolean NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform_operator" (
	"user_id" text PRIMARY KEY NOT NULL,
	"role" "platform_role" NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform_operator_change" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_user_id" text NOT NULL,
	"target_user_id" text NOT NULL,
	"previous_role" "platform_role",
	"role" "platform_role" NOT NULL,
	"previous_active" boolean,
	"active" boolean NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "institution_membership" ADD COLUMN "role" "institution_role";--> statement-breakpoint
ALTER TABLE "membership_change" ADD CONSTRAINT "membership_change_institution_id_actor_user_id_institution_membership_institution_id_user_id_fk" FOREIGN KEY ("institution_id","actor_user_id") REFERENCES "public"."institution_membership"("institution_id","user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership_change" ADD CONSTRAINT "membership_change_institution_id_target_user_id_institution_membership_institution_id_user_id_fk" FOREIGN KEY ("institution_id","target_user_id") REFERENCES "public"."institution_membership"("institution_id","user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_operator" ADD CONSTRAINT "platform_operator_user_id_auth_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."auth_user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_operator_change" ADD CONSTRAINT "platform_operator_change_actor_user_id_platform_operator_user_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."platform_operator"("user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_operator_change" ADD CONSTRAINT "platform_operator_change_target_user_id_platform_operator_user_id_fk" FOREIGN KEY ("target_user_id") REFERENCES "public"."platform_operator"("user_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "membership_change_institution_created_idx" ON "membership_change" USING btree ("institution_id","created_at");--> statement-breakpoint
CREATE INDEX "platform_operator_active_role_idx" ON "platform_operator" USING btree ("active","role");--> statement-breakpoint
CREATE INDEX "platform_operator_change_created_idx" ON "platform_operator_change" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "membership_institution_role_idx" ON "institution_membership" USING btree ("institution_id","active","role");
