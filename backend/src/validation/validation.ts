import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

import { item } from '../db/schema/item.schema';
import { shoppingList } from '../db/schema/shoppingList.schema';
import { shoppingListItem } from '../db/schema/shoppingListItem.schema';

export const createItemsZodSchema = z.array(
  createInsertSchema(item, {
    name: z.string().min(1),
    description: z.string().optional(),
  }),
);

export const updateItemZodSchema = createInsertSchema(item, {
  name: z.string().min(1),
  description: z.string().optional(),
});

export const createShoppingListZodSchema = createInsertSchema(shoppingList, {
  name: z.string().min(1),
  description: z.string().optional(),
})
  .pick({
    name: true,
    description: true,
  })
  .extend({
    items: z
      .array(
        z
          .object({
            id: z.string().uuid().optional(),
            name: z.string().min(1).optional(),
            description: z.string().optional(),
          })
          .refine((data) => data.id ?? data.name, {
            message: 'At least one of id or name must be provided',
          }),
      )
      .optional(),
  });

export const updateShoppingListZodSchema = createInsertSchema(shoppingList, {
  name: z.string().min(1).optional(),
  description: z.string().optional(),
})
  .pick({
    name: true,
    description: true,
  })
  .extend({
    items: z
      .array(
        z.object({
          id: z.string().uuid({
            message: 'Invalid itemId format. please provide a valid UUID',
          }),
          quantity: z.number().min(1).optional(),
          isPurchased: z.boolean().optional(),
        }),
      )
      .optional(),
  });

export const addItemToListZodSchema = createInsertSchema(shoppingListItem, {
  listId: z.string().uuid({
    message: 'Invalid shoppingListId format. please provide a valid UUID',
  }),
  itemId: z.string().uuid({
    message: 'Invalid itemId format. please provide a valid UUID',
  }),
  quantity: z.number().min(1),
  isPurchased: z.boolean().default(false).optional(),
});

export type CreateShoppingList = z.infer<typeof createShoppingListZodSchema>;
export type UpdateShoppingList = z.infer<typeof updateShoppingListZodSchema>;
export type AddItemToList = z.infer<typeof addItemToListZodSchema>;
export type UpdateItem = z.infer<typeof updateItemZodSchema>;
