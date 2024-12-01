import { relations } from 'drizzle-orm';
import { boolean, integer, pgTable, primaryKey, uuid } from 'drizzle-orm/pg-core';
import { item } from './item.schema';
import { shoppingList } from './shoppingList.schema';

export const shoppingListItem = pgTable(
  'shopping_list_item',
  {
    listId: uuid('list_id')
      .references(() => shoppingList.id)
      .notNull(),
    itemId: uuid('item_id')
      .references(() => item.id)
      .notNull(),
    quantity: integer('quantity').notNull(),
    isPurchased: boolean('is_purchased').default(false).notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.listId, t.itemId] }),
  }),
);

export const shoppingListItemRelations = relations(shoppingListItem, ({ one }) => ({
  shoppingList: one(shoppingList, {
    fields: [shoppingListItem.listId],
    references: [shoppingList.id],
  }),
  item: one(item, {
    fields: [shoppingListItem.itemId],
    references: [item.id],
  }),
}));
