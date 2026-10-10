import { config } from 'dotenv';
import { defineConfig, env } from 'prisma/config';

// ENV_FILE=.env.test points the CLI at the test branch; Render has no file and sets real env vars
config({ path: process.env.ENV_FILE ?? '.env', quiet: true });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed/index.ts',
  },
  // Migrations need the direct connection: Neon's pooler can't hold the locks Prisma Migrate uses
  datasource: {
    url: env('DIRECT_URL'),
  },
});
