CREATE TABLE "attendance_register_mark" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" uuid NOT NULL,
	"register_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"mark" text NOT NULL,
	"original" text,
	CONSTRAINT "attendance_mark_student" UNIQUE("institution_id","register_id","student_id"),
	CONSTRAINT "attendance_mark_values" CHECK ("attendance_register_mark"."mark" in ('Present','Absent','Late','Unmarked') and ("attendance_register_mark"."original" is null or "attendance_register_mark"."original" in ('Present','Absent','Late')))
);
--> statement-breakpoint
ALTER TABLE "attendance_register_mark" ADD CONSTRAINT "attendance_register_mark_institution_id_register_id_attendance_register_institution_id_id_fk" FOREIGN KEY ("institution_id","register_id") REFERENCES "public"."attendance_register"("institution_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_register_mark" ADD CONSTRAINT "attendance_register_mark_institution_id_student_id_student_institution_id_id_fk" FOREIGN KEY ("institution_id","student_id") REFERENCES "public"."student"("institution_id","id") ON DELETE restrict ON UPDATE no action;