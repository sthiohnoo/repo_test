import { defineConfig } from 'drizzle-kit';
import { ENV } from './env.config';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema',
  out: './src/db/migrations',
  casing: 'snake_case',
  dbCredentials: {
    url: ENV.DATABASE_URL,
  },
  migrations: {
    table: 'migrations',
  },
});
