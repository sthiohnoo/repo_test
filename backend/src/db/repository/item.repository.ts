import type { Database } from '../db';
import { eq } from 'drizzle-orm';
import { item } from '../schema/item.schema';
import { UpdateItem } from '../../validation/validation';

export class ItemRepository {
  constructor(private readonly db: Database) {}

  async getItems() {
    return this.db.query.item.findMany();
  }

  async getItemById(itemId: string) {
    return this.db.query.item.findFirst({
      where: (item, { eq }) => eq(item.id, itemId),
    });
  }

  async getItemByName(itemName: string) {
    return this.db.query.item.findFirst({
      where: (item, { eq }) => eq(item.name, itemName),
    });
  }

  async getItemsByNamesOrIds(names: string[], ids: string[]) {
    return this.db.query.item.findMany({
      where: (item, { and, or, inArray }) =>
        and(or(inArray(item.id, ids), inArray(item.name, names))),
    });
  }

  async createItems(data: { name: string; description?: string }[]) {
    return this.db.insert(item).values(data).onConflictDoNothing().returning();
  }

  async updateItemById(itemId: string, data: UpdateItem) {
    const [updatedItem] = await this.db
      .update(item)
      .set(data)
      .where(eq(item.id, itemId))
      .returning();
    return updatedItem;
  }

  async deleteItemById(itemId: string) {
    return this.db.delete(item).where(eq(item.id, itemId));
  }
}
