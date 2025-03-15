CREATE TABLE IF NOT EXISTS "SubscriblePlanUsers" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"pending" boolean DEFAULT true NOT NULL,
	"planId" uuid NOT NULL,
	"userId" uuid NOT NULL,
	"createdAt" timestamp NOT NULL,
	"payedAt" timestamp,
	CONSTRAINT "SubscriblePlanUsers_id_pk" PRIMARY KEY("id")
);
--> statement-breakpoint
/* 
    Unfortunately in current drizzle-kit version we can't automatically get name for primary key.
    We are working on making it available!

    Meanwhile you can:
        1. Check pk name in your database, by running
            SELECT constraint_name FROM information_schema.table_constraints
            WHERE table_schema = 'public'
                AND table_name = 'Plans'
                AND constraint_type = 'PRIMARY KEY';
        2. Uncomment code below and paste pk name manually
        
    Hope to release this update as soon as possible
*/

-- ALTER TABLE "Plans" DROP CONSTRAINT "<constraint_name>";--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "SubscriblePlanUsers" ADD CONSTRAINT "SubscriblePlanUsers_planId_Plans_id_fk" FOREIGN KEY ("planId") REFERENCES "public"."Plans"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "SubscriblePlanUsers" ADD CONSTRAINT "SubscriblePlanUsers_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
