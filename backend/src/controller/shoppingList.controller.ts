import { Request, Response } from 'express';
import { z } from 'zod';
import {
  addItemToListZodSchema,
  createShoppingListZodSchema,
  updateShoppingListZodSchema,
} from '../validation/validation';

import { ShoppingListRepository } from '../db/repository/shoppingList.repository';
import { ItemRepository } from '../db/repository/item.repository';
import { ShoppingListItemRepository } from '../db/repository/shoppingListItem.repository';

export class ShoppingListController {
  constructor(
    private readonly shoppingListRepository: ShoppingListRepository,
    private readonly itemRepository: ItemRepository,
    private readonly shoppingListItemRepository: ShoppingListItemRepository,
  ) {}

  async getShoppingLists(req: Request, res: Response): Promise<void> {
    const withRelations = z
      .boolean()
      .default(true)
      .parse(req.query.withRelations === 'true' || req.query.withRelations === undefined);

    const shoppingLists = await this.shoppingListRepository.getShoppingList(withRelations);
    res.send(shoppingLists);
  }

  async getShoppingListById(req: Request, res: Response): Promise<void> {
    const { shoppingListId } = req.params;
    const withRelations = z
      .boolean()
      .default(true)
      .parse(req.query.withRelations === 'true' || req.query.withRelations === undefined);
    const validatedShoppingListId = this.isValidShoppingListId(shoppingListId);

    if (!(await this.checkShoppingListExists(validatedShoppingListId, res))) {
      return;
    }

    const shoppingLists = await this.shoppingListRepository.getShoppingListById(
      validatedShoppingListId,
      withRelations,
    );
    res.send(shoppingLists);
  }

  async getShoppingListsWithSearchingItemById(req: Request, res: Response): Promise<void> {
    const { itemId } = req.params;
    const validatedItemId = this.isValidItemId(itemId);

    if (!(await this.checkItemExistsInAnyShoppingList(validatedItemId, res))) {
      return;
    }

    const shoppingLists =
      await this.shoppingListItemRepository.getListsInListByItemId(validatedItemId);
    res.send(shoppingLists);
  }

  async searchShoppingListsWithNameOrDescription(req: Request, res: Response): Promise<void> {
    const { name, description } = req.query;
    const validatedName = z.string().optional().parse(name);
    const validatedDescription = z.string().optional().parse(description);

    const shoppingLists = await this.shoppingListRepository.searchShoppingLists(
      validatedName,
      validatedDescription,
    );

    if (shoppingLists.length === 0) {
      res.status(404).json({ errors: ['ShoppingList not found'] });
      return;
    }
    res.status(200).send(shoppingLists);
  }

  async createShoppingList(req: Request, res: Response): Promise<void> {
    const validatedData = createShoppingListZodSchema.parse(req.body);

    const createdShoppingList = await this.shoppingListRepository.createShoppingList(validatedData);

    const itemsWithName = [];
    const itemsWithId = [];

    if (validatedData.items) {
      for (const item of validatedData.items) {
        if (item.id) {
          itemsWithId.push(item.id);
        } else if (item.name) {
          itemsWithName.push({
            name: item.name,
            description: item.description,
          });
        }
      }
    }

    // Create possibly new items if there are any items with only names
    if (itemsWithName.length > 0) {
      const createdItems = await this.itemRepository.createItems(itemsWithName);
      itemsWithId.push(...createdItems.map((item) => item.id));
    }

    if (itemsWithId.length > 0) {
      const items = await this.itemRepository.getItemsByNamesOrIds(
        itemsWithName.map((t) => t.name),
        itemsWithId,
      );
      await this.shoppingListRepository.associateItemsWithShoppingList(
        createdShoppingList.id,
        items.map((t) => t.id),
      );
    }

    const shoppingListWithItems = await this.shoppingListRepository.getShoppingListById(
      createdShoppingList.id,
    );
    res.status(201).send(shoppingListWithItems);
  }

  async updateShoppingListById(req: Request, res: Response): Promise<void> {
    const { shoppingListId } = req.params;
    const validatedShoppingListId = this.isValidShoppingListId(shoppingListId);

    if (!(await this.checkShoppingListExists(validatedShoppingListId, res))) {
      return;
    }

    const validatedData = updateShoppingListZodSchema.parse(req.body);

    if (validatedData.items && validatedData.items.length > 0) {
      const existingListInList =
        await this.shoppingListItemRepository.getListInListById(validatedShoppingListId);
      if (!existingListInList) {
        res.status(404).json({
          errors: ['Update canceled! Updating list has no items'],
        });
        return;
      }

      for (const item of validatedData.items) {
        const existingItemInList = await this.shoppingListItemRepository.getItemInAllListsById(
          item.id,
        );
        if (!existingItemInList) {
          res.status(404).json({
            errors: ['Update canceled! updating item not found in the shoppingList'],
          });
          return;
        }
      }
    }

    const updatedShoppingList = await this.shoppingListRepository.updateShoppingListById(
      validatedShoppingListId,
      validatedData,
    );

    if (validatedData.items) {
      for (const item of validatedData.items) {
        await this.shoppingListItemRepository.updateListItemById(validatedShoppingListId, item.id, {
          quantity: item.quantity,
          isPurchased: item.isPurchased,
        });
      }
    }
    res.send(updatedShoppingList);
  }

  async addItemToList(req: Request, res: Response): Promise<void> {
    const { shoppingListId, itemId } = req.params;
    const validatedData = addItemToListZodSchema.parse({
      ...req.body,
      listId: shoppingListId,
      itemId: itemId,
    });

    if (!(await this.checkShoppingListExists(validatedData.listId, res))) {
      return;
    }
    if (!(await this.checkItemExists(validatedData.itemId, res))) {
      return;
    }
    if (await this.checkItemIsAlreadyInList(validatedData.listId, validatedData.itemId, res)) {
      return;
    }

    const addedItemInList = await this.shoppingListItemRepository.addItemToList(validatedData);
    res.status(201).send(addedItemInList);
  }

  async deleteItemInListById(req: Request, res: Response): Promise<void> {
    const { shoppingListId, itemId } = req.params;
    const validatedShoppingListId = this.isValidShoppingListId(shoppingListId);
    const validatedItemId = this.isValidItemId(itemId);

    if (!(await this.checkShoppingListHasItems(validatedShoppingListId, res))) {
      return;
    }

    const deletedItem = await this.shoppingListItemRepository.deleteItemInListById(
      validatedShoppingListId,
      validatedItemId,
    );
    if (deletedItem.rowCount === 0) {
      res.status(404).json({ errors: ['Item not found in the ShoppingList'] });
      return;
    }
    res.status(204).send({});
  }

  async deleteShoppingListById(req: Request, res: Response): Promise<void> {
    const { shoppingListId } = req.params;
    const validatedShoppingListId = this.isValidShoppingListId(shoppingListId);

    if (!(await this.checkShoppingListExists(validatedShoppingListId, res))) {
      return;
    }

    await this.shoppingListItemRepository.deleteListInListById(validatedShoppingListId);
    await this.shoppingListRepository.deleteShoppingListById(validatedShoppingListId);
    res.status(204).send({});
  }

  async toggleIsPurchased(req: Request, res: Response): Promise<void> {
    const { shoppingListId, itemId } = req.params;
    const validatedShoppingListId = this.isValidShoppingListId(shoppingListId);
    const validatedItemId = this.isValidItemId(itemId);

    if (!(await this.checkShoppingListHasItems(validatedShoppingListId, res))) {
      return;
    }
    const existingItemInList = await this.shoppingListItemRepository.getItemInListById(
      validatedShoppingListId,
      validatedItemId,
    );
    if (!existingItemInList) {
      res.status(404).json({ errors: ['Item not found in the ShoppingList'] });
      return;
    }

    const newIsPurchasedStatus = !existingItemInList.isPurchased;
    const updatedItem = await this.shoppingListItemRepository.updateListItemById(
      validatedShoppingListId,
      validatedItemId,
      { isPurchased: newIsPurchasedStatus },
    );
    res.send(updatedItem);
  }

  async updateQuantity(req: Request, res: Response): Promise<void> {
    const { shoppingListId, itemId } = req.params;
    const { quantity } = req.body;
    const validatedShoppingListId = this.isValidShoppingListId(shoppingListId);
    const validatedItemId = this.isValidItemId(itemId);
    const validatedQuantity = z.number().min(1).parse(quantity);

    if (!(await this.checkShoppingListHasItems(validatedShoppingListId, res))) {
      return;
    }
    if (
      !(await this.checkItemExistsInShoppingList(validatedShoppingListId, validatedItemId, res))
    ) {
      return;
    }

    const updatedItem = await this.shoppingListItemRepository.updateListItemById(
      validatedShoppingListId,
      validatedItemId,
      { quantity: validatedQuantity },
    );
    res.send(updatedItem);
  }

  // Freestyle task #1
  async getAllFavoriteShoppingLists(req: Request, res: Response): Promise<void> {
    const withRelations = z
      .boolean()
      .default(true)
      .parse(req.query.withRelations === 'true' || req.query.withRelations === undefined);

    const favoriteShoppingLists =
      await this.shoppingListRepository.getAllFavoriteShoppingLists(withRelations);
    res.send(favoriteShoppingLists);
  }

  // Freestyle task #1
  async updateFavoriteStatus(req: Request, res: Response): Promise<void> {
    const { shoppingListId } = req.params;
    const { isFavorite } = req.body;
    const validatedIsFavorite = z.boolean().parse(isFavorite);
    const validatedId = this.isValidShoppingListId(shoppingListId);

    if (!(await this.checkShoppingListExists(validatedId, res))) {
      return;
    }

    const updatedShoppingList = await this.shoppingListRepository.setFavorite(
      validatedId,
      validatedIsFavorite,
    );
    res.send(updatedShoppingList);
  }

  // Helper Functions
  private isValidItemId(itemId: string): string {
    return z
      .string()
      .uuid({ message: 'Invalid itemId format. please provide a valid UUID' })
      .parse(itemId);
  }

  private isValidShoppingListId(shoppingListId: string): string {
    return z
      .string()
      .uuid({ message: 'Invalid shoppingListId format. please provide a valid UUID' })
      .parse(shoppingListId);
  }

  private async checkShoppingListExists(shoppingListId: string, res: Response): Promise<boolean> {
    const existingShoppingList =
      await this.shoppingListRepository.getShoppingListById(shoppingListId);
    if (!existingShoppingList) {
      res.status(404).json({ errors: ['ShoppingList not found'] });
      return false;
    }
    return true;
  }

  private async checkItemExists(itemId: string, res: Response): Promise<boolean> {
    const existingItem = await this.itemRepository.getItemById(itemId);
    if (!existingItem) {
      res.status(404).json({ errors: ['Item not found'] });
      return false;
    }
    return true;
  }

  private async checkShoppingListHasItems(shoppingListId: string, res: Response): Promise<boolean> {
    const existingListInList =
      await this.shoppingListItemRepository.getListInListById(shoppingListId);
    if (!existingListInList) {
      res.status(404).json({ errors: ['ShoppingList has no Items'] });
      return false;
    }
    return true;
  }

  private async checkItemExistsInAnyShoppingList(itemId: string, res: Response): Promise<boolean> {
    const existingListWithItem =
      await this.shoppingListItemRepository.getItemInAllListsById(itemId);
    if (!existingListWithItem) {
      res.status(404).json({ errors: ['Item not found in any ShoppingList'] });
      return false;
    }
    return true;
  }

  private async checkItemExistsInShoppingList(
    shoppingListId: string,
    itemId: string,
    res: Response,
  ): Promise<boolean> {
    const existingItemInList = await this.shoppingListItemRepository.getItemInListById(
      shoppingListId,
      itemId,
    );
    if (!existingItemInList) {
      res.status(404).json({ errors: ['Item not found in the ShoppingList'] });
      return false;
    }
    return true;
  }

  private async checkItemIsAlreadyInList(
    listId: string,
    itemId: string,
    res: Response,
  ): Promise<boolean> {
    const existingItemInList = await this.shoppingListItemRepository.getItemInListById(
      listId,
      itemId,
    );
    if (existingItemInList) {
      res.status(409).json({ errors: ['Item already in the ShoppingList'] });
      return true;
    }
    return false;
  }
}
