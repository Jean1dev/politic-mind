CREATE TABLE IF NOT EXISTS "UserLimit" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"iterations" integer DEFAULT 0 NOT NULL,
	"limit" integer DEFAULT 10 NOT NULL,
	"isUnlimited" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp NOT NULL,
	CONSTRAINT "UserLimit_id_pk" PRIMARY KEY("id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "UserLimit" ADD CONSTRAINT "UserLimit_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
