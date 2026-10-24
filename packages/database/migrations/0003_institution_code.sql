CREATE SEQUENCE "public"."institution_code_seq" INCREMENT BY 1 MINVALUE 100000 MAXVALUE 999999 START WITH 100000 CACHE 1;--> statement-breakpoint
ALTER TABLE "institution" ADD COLUMN "code" text DEFAULT nextval('institution_code_seq'::regclass)::text NOT NULL;--> statement-breakpoint
ALTER TABLE "institution" ADD CONSTRAINT "institution_code_unique" UNIQUE("code");--> statement-breakpoint
ALTER TABLE "institution" ADD CONSTRAINT "institution_code_format" CHECK ("institution"."code" ~ '^[1-9][0-9]{5}$');