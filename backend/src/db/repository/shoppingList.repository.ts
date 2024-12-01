import { eq } from 'drizzle-orm';
import type { Database } from '../db';
import { shoppingList } from '../schema/shoppingList.schema';
import { shoppingListItem } from '../schema/shoppingListItem.schema';
import { CreateShoppingList, UpdateShoppingList } from '../../validation/validation';

export class ShoppingListRepository {
  constructor(private readonly db: Database) {}

  async getShoppingList(includeRelations = true) {
    return this.db.query.shoppingList.findMany({
      with: includeRelations
        ? {
            shoppingListItems: {
              with: {
                item: true,
              },
              columns: {
                quantity: true,
                isPurchased: true,
              },
            },
          }
        : undefined,
    });
  }

  async getShoppingListById(shoppingListId: string, includeRelations = true) {
    return this.db.query.shoppingList.findFirst({
      where: (shoppingList, { eq }) => eq(shoppingList.id, shoppingListId),
      with: includeRelations
        ? {
            shoppingListItems: {
              with: {
                item: true,
              },
              columns: {
                quantity: true,
                isPurchased: true,
              },
            },
          }
        : undefined,
    });
  }

  async searchShoppingLists(name?: string, description?: string) {
    return this.db.query.shoppingList.findMany({
      where: (shoppingList, { or, like }) =>
        or(
          name ? like(shoppingList.name, `%${name}%`) : undefined,
          description ? like(shoppingList.description, `%${description}%`) : undefined,
        ),
    });
  }

  async createShoppingList(data: CreateShoppingList) {
    const [entry] = await this.db.insert(shoppingList).values(data).returning();
    return entry;
  }

  async updateShoppingListById(shoppingListId: string, data: UpdateShoppingList) {
    const [updatedList] = await this.db
      .update(shoppingList)
      .set(data)
      .where(eq(shoppingList.id, shoppingListId))
      .returning();
    return updatedList;
  }

  async deleteShoppingListById(shoppingListId: string) {
    return this.db.delete(shoppingList).where(eq(shoppingList.id, shoppingListId));
  }

  async associateItemsWithShoppingList(shoppingListId: string, itemIds: string[]) {
    return this.db.insert(shoppingListItem).values(
      itemIds.map((itemId) => ({
        listId: shoppingListId,
        itemId,
        quantity: 1,
        isPurchased: false,
      })),
    );
  }

  // Freestyle task #1
  async getAllFavoriteShoppingLists(includeRelations = true) {
    return this.db.query.shoppingList.findMany({
      where: (shoppingList, { eq }) => eq(shoppingList.isFavorite, true),
      with: includeRelations
        ? {
            shoppingListItems: {
              with: {
                item: true,
              },
              columns: {
                quantity: true,
                isPurchased: true,
              },
            },
          }
        : undefined,
    });
  }

  // Freestyle task #1
  async setFavorite(shoppingListId: string, isFavorite: boolean) {
    const [updatedList] = await this.db
      .update(shoppingList)
      .set({ isFavorite })
      .where(eq(shoppingList.id, shoppingListId))
      .returning();
    return updatedList;
  }
}
