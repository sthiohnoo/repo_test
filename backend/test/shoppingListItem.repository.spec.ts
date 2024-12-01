import { TestDatabase } from './helpers/database';
import { ItemTestHelper } from './helpers/item';
import { ShoppingListTestHelper } from './helpers/shoppingList';
import { ShoppingListItemRepository } from '../src/db/repository/shoppingListItem.repository';

const TEST_IDS = {
  ITEM_1: '123e4567-e89b-12d3-a456-426614174000',
  ITEM_2: '123e4567-e89b-12d3-a456-426614174013',
  LIST_1: '123e4567-e89b-12d3-a456-426614174001',
  LIST_2: '123e4567-e89b-12d3-a456-426614174002',
  NON_EXISTENT_SHOPPINGLIST: '123e4567-e89b-12d3-a456-426614174010',
  NON_EXISTENT_ITEM: '123e4567-e89b-12d3-a456-426614174011',
} as const;

describe('ShoppingListItemRepository Integration Tests', () => {
  const testDatabase = new TestDatabase();
  let repository: ShoppingListItemRepository;
  let itemHelper: ItemTestHelper;
  let shoppingListHelper: ShoppingListTestHelper;

  beforeAll(async () => {
    await testDatabase.setup();
    repository = new ShoppingListItemRepository(testDatabase.database);
    itemHelper = new ItemTestHelper(testDatabase.database);
    shoppingListHelper = new ShoppingListTestHelper(testDatabase.database);
  }, 60000);

  beforeEach(async () => {
    // Create fresh test items
    await itemHelper.createItem([
      {
        id: TEST_IDS.ITEM_1,
        name: 'item1',
        description: 'item1_description',
      },
      {
        id: TEST_IDS.ITEM_2,
        name: 'item2',
        description: 'item2_description',
      },
    ]);

    // Create fresh test shoppingLists
    await shoppingListHelper.createShoppingList({
      id: TEST_IDS.LIST_1,
      name: 'shoppingList1',
      description: 'shoppingList1_description',
    });

    await shoppingListHelper.createShoppingList({
      id: TEST_IDS.LIST_2,
      name: 'shoppingList2',
      description: 'shoppingList2_description',
    });
  });

  afterEach(async () => {
    await testDatabase.clear();
  });

  afterAll(async () => {
    await testDatabase.teardown();
  });

  describe('getItemInListById', () => {
    it('should successfully retrieve an item in a specific list by id', async () => {
      // Arrange
      const listEntry = {
        listId: TEST_IDS.LIST_1,
        itemId: TEST_IDS.ITEM_1,
        quantity: 1,
        isPurchased: false,
      };

      const addedListEntry = await repository.addItemToList(listEntry);

      // Act
      const result = await repository.getItemInListById(
        addedListEntry.listId,
        addedListEntry.itemId,
      );

      // Arrange
      expect(result).toBeDefined();
      expect(result?.listId).toBe(listEntry.listId);
      expect(result?.itemId).toBe(listEntry.itemId);
      expect(result?.quantity).toBe(listEntry.quantity);
      expect(result?.isPurchased).toBe(listEntry.isPurchased);
    });

    it('should return undefined for non-existent shoppingList', async () => {
      // Act
      const result = await repository.getItemInListById(
        TEST_IDS.NON_EXISTENT_SHOPPINGLIST,
        TEST_IDS.ITEM_1,
      );

      // Arrange
      expect(result).toBeUndefined();
    });

    it('should return undefined for non-existent item', async () => {
      // Act
      const result = await repository.getItemInListById(
        TEST_IDS.LIST_1,
        TEST_IDS.NON_EXISTENT_ITEM,
      );

      // Arrange
      expect(result).toBeUndefined();
    });
  });

  describe('getItemInAllListsById', () => {
    it('should successfully retrieve an item in all lists by id', async () => {
      // Arrange
      const listEntry1 = {
        listId: TEST_IDS.LIST_1,
        itemId: TEST_IDS.ITEM_1,
        quantity: 1,
        isPurchased: false,
      };

      const listEntry2 = {
        listId: TEST_IDS.LIST_2,
        itemId: TEST_IDS.ITEM_2,
        quantity: 10,
        isPurchased: true,
      };

      await repository.addItemToList(listEntry1);
      await repository.addItemToList(listEntry2);

      // Act
      const result = await repository.getItemInAllListsById(listEntry2.itemId);

      // Arrange
      expect(result).toBeDefined();
      expect(result?.listId).toBe(listEntry2.listId);
      expect(result?.itemId).toBe(listEntry2.itemId);
      expect(result?.quantity).toBe(listEntry2.quantity);
      expect(result?.isPurchased).toBe(listEntry2.isPurchased);
    });

    it('should return undefined for non-existent item', async () => {
      // Act
      const result = await repository.getItemInAllListsById(TEST_IDS.NON_EXISTENT_ITEM);

      // Arrange
      expect(result).toBeUndefined();
    });
  });

  describe('getListInListById', () => {
    it('should successfully retrieve a list by id', async () => {
      // Arrange
      const listEntry = {
        listId: TEST_IDS.LIST_1,
        itemId: TEST_IDS.ITEM_1,
        quantity: 1,
        isPurchased: false,
      };

      await repository.addItemToList(listEntry);

      // Act
      const result = await repository.getListInListById(listEntry.listId);

      // Arrange
      expect(result).toBeDefined();
      expect(result?.listId).toBe(listEntry.listId);
      expect(result?.itemId).toBe(listEntry.itemId);
      expect(result?.quantity).toBe(listEntry.quantity);
      expect(result?.isPurchased).toBe(listEntry.isPurchased);
    });

    it('should return undefined for non-existent list', async () => {
      // Act
      const result = await repository.getListInListById(TEST_IDS.NON_EXISTENT_SHOPPINGLIST);

      // Arrange
      expect(result).toBeUndefined();
    });
  });

  describe('getListsInListByItemId', () => {
    it('should successfully retrieve lists with specific item', async () => {
      // Arrange
      const listEntry1 = {
        listId: TEST_IDS.LIST_1,
        itemId: TEST_IDS.ITEM_1,
        quantity: 1,
        isPurchased: false,
      };

      const listEntry2 = {
        listId: TEST_IDS.LIST_2,
        itemId: TEST_IDS.ITEM_1,
        quantity: 10,
        isPurchased: true,
      };

      await repository.addItemToList(listEntry1);
      await repository.addItemToList(listEntry2);

      // Act
      const results = await repository.getListsInListByItemId(listEntry1.itemId);
      const result1 = results[0];
      const result2 = results[1];

      // Arrange
      expect(results).toBeDefined();
      expect(results.length).toBe(2);

      expect(result1).toBeDefined();
      expect(result1?.listId).toBe(listEntry1.listId);
      expect(result1?.itemId).toBe(listEntry1.itemId);
      expect(result1?.quantity).toBe(listEntry1.quantity);
      expect(result1?.isPurchased).toBe(listEntry1.isPurchased);

      expect(result2).toBeDefined();
      expect(result2?.listId).toBe(listEntry2.listId);
      expect(result2?.itemId).toBe(listEntry1.itemId);
      expect(result2?.quantity).toBe(listEntry2.quantity);
      expect(result2?.isPurchased).toBe(listEntry2.isPurchased);
    });

    it('should return an empty array for non-existent item', async () => {
      // Act
      const result = await repository.getListsInListByItemId(TEST_IDS.NON_EXISTENT_ITEM);

      // Arrange
      expect(result).toBeDefined();
      expect(result.length).toBe(0);
    });
  });

  describe('updateListItemById', () => {
    it('should successfully update item quantity and state in a shoppingList', async () => {
      // Arrange
      const listEntry = {
        listId: TEST_IDS.LIST_1,
        itemId: TEST_IDS.ITEM_1,
        quantity: 1,
        isPurchased: false,
      };

      await repository.addItemToList(listEntry);

      const updatedData = {
        quantity: 10,
        isPurchased: true,
      };

      // Act
      const updatedListEntry = await repository.updateListItemById(
        listEntry.listId,
        listEntry.itemId,
        updatedData,
      );

      // Assert
      expect(updatedListEntry).toBeDefined();
      expect(updatedListEntry?.listId).toBe(listEntry.listId);
      expect(updatedListEntry?.itemId).toBe(listEntry.itemId);
      expect(updatedListEntry?.quantity).toBe(updatedData.quantity);
      expect(updatedListEntry?.isPurchased).toBe(updatedData.isPurchased);
    });

    it('should successfully update with only a part of the data', async () => {
      // Arrange
      const listEntry = {
        listId: TEST_IDS.LIST_1,
        itemId: TEST_IDS.ITEM_1,
        quantity: 1,
        isPurchased: false,
      };

      await repository.addItemToList(listEntry);

      const updatedData = {
        quantity: 10,
      };

      // Act
      const updatedListEntry = await repository.updateListItemById(
        listEntry.listId,
        listEntry.itemId,
        updatedData,
      );

      // Assert
      expect(updatedListEntry).toBeDefined();
      expect(updatedListEntry?.listId).toBe(listEntry.listId);
      expect(updatedListEntry?.itemId).toBe(listEntry.itemId);
      expect(updatedListEntry?.quantity).toBe(updatedData.quantity);
      expect(updatedListEntry?.isPurchased).toBe(listEntry.isPurchased);
    });

    it('should return undefined with non-existent shoppingList', async () => {
      // Arrange
      const updatedData = {
        quantity: 10,
        isPurchased: true,
      };

      // Act
      const result = await repository.updateListItemById(
        TEST_IDS.NON_EXISTENT_SHOPPINGLIST,
        TEST_IDS.ITEM_1,
        updatedData,
      );

      // Assert
      expect(result).toBeUndefined();
    });

    it('should return undefined with non-existent item', async () => {
      // Arrange
      const updatedData = {
        quantity: 10,
        isPurchased: true,
      };

      // Act
      const result = await repository.updateListItemById(
        TEST_IDS.LIST_1,
        TEST_IDS.NON_EXISTENT_ITEM,
        updatedData,
      );

      // Assert
      expect(result).toBeUndefined();
    });
  });

  describe('deleteListInListById', () => {
    it('should successfully delete a shoppingList', async () => {
      // Arrange
      const listEntry = {
        listId: TEST_IDS.LIST_1,
        itemId: TEST_IDS.ITEM_1,
        quantity: 1,
        isPurchased: false,
      };

      const addedEntry = await repository.addItemToList(listEntry);

      // Act
      await repository.deleteListInListById(listEntry.listId);
      const result = await repository.getListInListById(addedEntry.listId);

      // Assert
      expect(result).toBeUndefined();
    });

    it('should delete nothing with non-existent shoppingList', async () => {
      // Arrange
      const listEntry = {
        listId: TEST_IDS.LIST_1,
        itemId: TEST_IDS.ITEM_1,
        quantity: 1,
        isPurchased: false,
      };
      await repository.addItemToList(listEntry);
      const countBeforeDeletion = (await repository.getAllEntries()).length;

      // Act
      await repository.deleteListInListById(TEST_IDS.NON_EXISTENT_SHOPPINGLIST);
      const countAfterDeletion = (await repository.getAllEntries()).length;

      // Assert
      expect(countAfterDeletion).toBeDefined();
      expect(countAfterDeletion).toBe(countBeforeDeletion);
    });
  });

  describe('deleteItemInListById', () => {
    it('should successfully delete a item in a shoppingList', async () => {
      // Arrange
      const listEntry = {
        listId: TEST_IDS.LIST_1,
        itemId: TEST_IDS.ITEM_1,
        quantity: 1,
        isPurchased: false,
      };

      const addedEntry = await repository.addItemToList(listEntry);

      // Act
      await repository.deleteItemInListById(listEntry.listId, listEntry.itemId);
      const result = await repository.getItemInListById(addedEntry.listId, addedEntry.itemId);

      // Assert
      expect(result).toBeUndefined();
    });

    it('should delete nothing with non-existent shoppingList', async () => {
      // Arrange
      const listEntry = {
        listId: TEST_IDS.LIST_1,
        itemId: TEST_IDS.ITEM_1,
        quantity: 1,
        isPurchased: false,
      };
      await repository.addItemToList(listEntry);

      const countBeforeDeletion = (await repository.getAllEntries()).length;

      // Act
      await repository.deleteItemInListById(TEST_IDS.NON_EXISTENT_SHOPPINGLIST, TEST_IDS.ITEM_1);
      const countAfterDeletion = (await repository.getAllEntries()).length;

      // Assert
      expect(countAfterDeletion).toBeDefined();
      expect(countAfterDeletion).toBe(countBeforeDeletion);
    });

    it('should delete nothing with non-existent item', async () => {
      // Arrange
      const listEntry = {
        listId: TEST_IDS.LIST_1,
        itemId: TEST_IDS.ITEM_1,
        quantity: 1,
        isPurchased: false,
      };
      await repository.addItemToList(listEntry);

      const countBeforeDeletion = (await repository.getAllEntries()).length;

      // Act
      await repository.deleteItemInListById(TEST_IDS.LIST_1, TEST_IDS.NON_EXISTENT_ITEM);
      const countAfterDeletion = (await repository.getAllEntries()).length;

      // Assert
      expect(countAfterDeletion).toBeDefined();
      expect(countAfterDeletion).toBe(countBeforeDeletion);
    });
  });
});
