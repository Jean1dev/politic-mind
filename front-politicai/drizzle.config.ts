import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

config({
  path: '.env.local',
});

export default defineConfig({
  schema: './lib/db/schema.ts',
  out: './lib/db/migrations',
  dialect: 'mysql',
  dbCredentials: {
    // biome-ignore lint: Forbidden non-null assertion.
    url: process.env.MYSQL_URL!,
  },
});
