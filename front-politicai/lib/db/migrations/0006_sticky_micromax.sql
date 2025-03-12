CREATE TABLE IF NOT EXISTS "Plans" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "planRef" text NOT NULL,
    "active" boolean DEFAULT true NOT NULL,
    "name" text NOT NULL,
    "description" text NOT NULL,
    "price" integer NOT NULL,
    CONSTRAINT "Plans_id_pk" PRIMARY KEY("id")
);

INSERT INTO "Plans" ("planRef", "active", "name", "description", "price") 
    VALUES ('prod_Rvjw1xg0YAJ8Ye', true, 'Plano Inicial (Cobranca unica)', 'Adiciona mais 50 chamadas para utilizar no mes', 199);

INSERT INTO "Plans" ("planRef", "active", "name", "description", "price") 
    VALUES ('prod_RvjwP9WwOX23rA', true, 'Plano Start (Cobranca unica)', 'Adiciona mais 500 chamadas para utilizar no mes', 1099);

INSERT INTO "Plans" ("planRef", "active", "name", "description", "price") 
    VALUES ('prod_RvjwluWOXhqI8m', true, 'Plano Smart Search (Cobranca unica)', 'Adiciona mais 1500 chamadas para utilizar no mes', 2499);

/* 
    Unfortunately in current drizzle-kit version we can't automatically get name for primary key.
    We are working on making it available!

    Meanwhile you can:
        1. Check pk name in your database, by running
            SELECT constraint_name FROM information_schema.table_constraints
            WHERE table_schema = 'public'
                AND table_name = 'UserLimit'
                AND constraint_type = 'PRIMARY KEY';
        2. Uncomment code below and paste pk name manually
        
    Hope to release this update as soon as possible
*/

-- ALTER TABLE "UserLimit" DROP CONSTRAINT "<constraint_name>";