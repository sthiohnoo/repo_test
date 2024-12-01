import { Request, Response } from 'express';
import { ItemRepository } from '../db/repository/item.repository';
import { ShoppingListItemRepository } from '../db/repository/shoppingListItem.repository';

import { z } from 'zod';
import { createItemsZodSchema, updateItemZodSchema } from '../validation/validation';

export class ItemController {
  constructor(
    private readonly itemRepository: ItemRepository,
    private readonly shoppingListItemRepository: ShoppingListItemRepository,
  ) {}

  async getItems(_req: Request, res: Response): Promise<void> {
    const items = await this.itemRepository.getItems();
    res.status(200).send(items);
  }

  async getItemById(req: Request, res: Response): Promise<void> {
    const itemId = req.params.itemId;

    const validatedItemId = z
      .string()
      .uuid({ message: 'Invalid itemId format. please provide a valid UUID' })
      .parse(itemId);

    const item = await this.itemRepository.getItemById(validatedItemId);

    if (!item) {
      res.status(404).send({ errors: ['Item not found'] });
      return;
    }

    res.status(200).send(item);
  }

  async getItemByName(req: Request, res: Response): Promise<void> {
    const itemName = req.params.itemName;
    const item = await this.itemRepository.getItemByName(itemName);

    if (!item) {
      res.status(404).send({ errors: ['Item not found'] });
      return;
    }

    res.status(200).send(item);
  }

  async createItem(req: Request, res: Response): Promise<void> {
    const validatedData = createItemsZodSchema.parse(req.body);

    for (const item of validatedData) {
      const existingItem = await this.itemRepository.getItemByName(item.name);
      if (existingItem) {
        res.status(409).send({ errors: ['Creation canceled! Item already exists'] });
        return;
      }
    }

    const transformedData = validatedData.map((item) => ({
      ...item,
      description: item.description ?? undefined,
    }));

    const createdItems = await this.itemRepository.createItems(transformedData);

    res.status(201).send(createdItems);
  }

  async updateItemById(req: Request, res: Response): Promise<void> {
    const { itemId } = req.params;

    const validatedItemId = z
      .string()
      .uuid({
        message: 'Invalid itemId format. please provide a valid UUID',
      })
      .parse(itemId);

    const existingItem = await this.itemRepository.getItemById(validatedItemId);
    if (!existingItem) {
      res.status(404).send({ errors: ['Item not found'] });
      return;
    }

    const validatedData = updateItemZodSchema.parse(req.body);

    const existingItemName = await this.itemRepository.getItemByName(validatedData.name);
    if (existingItemName && existingItemName.id !== validatedItemId) {
      res.status(409).send({ errors: ['Update canceled! ItemName already exists'] });
      return;
    }

    const updatedItem = await this.itemRepository.updateItemById(validatedItemId, validatedData);

    res.send(updatedItem);
  }

  async deleteItemById(req: Request, res: Response): Promise<void> {
    const { itemId } = req.params;

    const validatedItemId = z
      .string()
      .uuid({ message: 'Invalid itemId format. please provide a valid UUID' })
      .parse(itemId);

    const existingItem = await this.itemRepository.getItemById(validatedItemId);
    if (!existingItem) {
      res.status(404).send({ errors: ['Item not found'] });
      return;
    }

    const existingItemInList =
      await this.shoppingListItemRepository.getItemInAllListsById(validatedItemId);
    if (existingItemInList) {
      res.status(409).send({ errors: ['Deletion canceled. Item exists in a ShoppingList'] });
      return;
    }

    await this.itemRepository.deleteItemById(validatedItemId);

    res.status(204).send({});
  }
}
