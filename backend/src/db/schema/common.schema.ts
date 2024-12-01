import { text, uuid, varchar } from 'drizzle-orm/pg-core';

export const commonSchema = {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar({ length: 256 }).notNull(),
  description: text(),
};
