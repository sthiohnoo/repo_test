import { relations } from 'drizzle-orm';
import { pgTable, unique } from 'drizzle-orm/pg-core';
import { commonSchema } from './common.schema';
import { shoppingListItem } from './shoppingListItem.schema';

export const item = pgTable(
  'item',
  {
    ...commonSchema,
  },
  (table) => ({
    unq: unique().on(table.name),
  }),
);

export const itemRelations = relations(item, ({ many }) => ({
  shoppingListItems: many(shoppingListItem),
}));
