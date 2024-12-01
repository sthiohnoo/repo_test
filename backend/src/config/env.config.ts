import * as dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config({ path: './src/.env' });

const envSchema = z.object({
  DATABASE_URL: z.string().url().min(1),
  PORT: z.coerce.number().int().positive().default(3000),
});

export const ENV = envSchema.parse(process.env);
export type EnvType = typeof ENV;
