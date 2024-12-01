import { TestDatabase } from './helpers/database';
import { ItemRepository } from '../src/db/repository/item.repository';

const TEST_IDS = {
  NON_EXISTENT_ITEM: '123e4567-e89b-12d3-a456-426614174010',
} as const;

describe('ItemRepository Integration Tests', () => {
  const testDatabase = new TestDatabase();
  let repository: ItemRepository;

  beforeAll(async () => {
    await testDatabase.setup();
    repository = new ItemRepository(testDatabase.database);
  }, 60000);

  afterEach(async () => {
    await testDatabase.clear();
  });

  afterAll(async () => {
    await testDatabase.teardown();
  });

  describe('getItems', () => {
    it('should successfully retrieve all items', async () => {
      // Arrange
      const testItem1 = {
        name: 'Test Item 1',
        description: 'Test Description',
      };
      const testItem2 = {
        name: 'Test Item 2',
      };

      const createdItems = await repository.createItems([testItem1, testItem2]);

      // Act
      const result = await repository.getItems();

      // Assert
      expect(result).toBeDefined();
      expect(result.length).toBe(2);

      const retrievedItem1 = result.find((list) => list.id === createdItems[0].id);
      const retrievedItem2 = result.find((list) => list.id === createdItems[1].id);

      expect(retrievedItem1).toBeDefined();
      expect(retrievedItem1?.id).toBe(createdItems[0].id);
      expect(retrievedItem1?.name).toBe(testItem1.name);
      expect(retrievedItem1?.description).toBe(testItem1.description);

      expect(retrievedItem2).toBeDefined();
      expect(retrievedItem2?.id).toBe(createdItems[1].id);
      expect(retrievedItem2?.name).toBe(testItem2.name);
      expect(retrievedItem2?.description).toBeNull();
    });

    it('should return an empty array with no items', async () => {
      // Act
      const result = await repository.getItems();

      // Assert
      expect(result).toBeDefined();
      expect(result.length).toBe(0);
    });
  });

  describe('getItemById', () => {
    it('should successfully retrieve an item by id', async () => {
      // Arrange
      const testItem = {
        name: 'Test Item ',
        description: 'Test Description',
      };

      const createdItems = await repository.createItems([testItem]);
      const createdItem = createdItems[0];
      // Act
      const result = await repository.getItemById(createdItem.id);

      // Assert
      expect(result).toBeDefined();
      expect(result?.id).toBe(createdItem.id);
      expect(result?.name).toBe(createdItem.name);
      expect(result?.description).toBe(createdItem.description);
    });

    it('should return undefined for non-existent item', async () => {
      // Act
      const result = await repository.getItemById(TEST_IDS.NON_EXISTENT_ITEM);

      // Assert
      expect(result).toBeUndefined();
    });
  });

  describe('getItemByName', () => {
    it('should successfully retrieve an item by name', async () => {
      // Arrange
      const testItem = {
        name: 'Test Item ',
        description: 'Test Description',
      };

      const createdItems = await repository.createItems([testItem]);
      const createdItem = createdItems[0];
      // Act
      const result = await repository.getItemByName(createdItem.name);

      // Assert
      expect(result).toBeDefined();
      expect(result?.id).toBe(createdItem.id);
      expect(result?.name).toBe(createdItem.name);
      expect(result?.description).toBe(createdItem.description);
    });

    it('should return undefined for non-existent item', async () => {
      // Act
      const result = await repository.getItemByName('I do not exist');

      // Assert
      expect(result).toBeUndefined();
    });
  });

  describe('getItemsByNamesOrIds', () => {
    it('should successfully retrieve items with name and id', async () => {
      // Arrange
      const testItem1 = {
        name: 'Test Item 1',
        description: 'Test Description',
      };
      const testItem2 = {
        name: 'Test Item 2',
      };

      const createdItems = await repository.createItems([testItem1, testItem2]);
      const createdItem1 = createdItems[0];
      const createdItem2 = createdItems[1];
      // Act
      const result = await repository.getItemsByNamesOrIds([createdItem2.name], [createdItem1.id]);

      // Assert
      expect(result).toBeDefined();
      expect(result[0]?.id).toBe(createdItem1.id);
      expect(result[0]?.name).toBe(testItem1.name);
      expect(result[0]?.description).toBe(testItem1.description);

      expect(result[1]?.id).toBe(createdItem2.id);
      expect(result[1]?.name).toBe(testItem2.name);
      expect(result[1]?.description).toBeNull();
    });

    it('should successfully retrieve an item with only name or only id', async () => {
      // Arrange
      const testItem = {
        name: 'Test Item',
        description: 'Test Description',
      };

      const createdItems = await repository.createItems([testItem]);
      const createdItem = createdItems[0];

      // Act
      const result1 = await repository.getItemsByNamesOrIds([createdItem.name], []);
      const result2 = await repository.getItemsByNamesOrIds([], [createdItem.id]);

      // Assert
      expect(result1).toBeDefined();
      expect(result1[0]?.id).toBe(createdItem.id);
      expect(result1[0]?.name).toBe(testItem.name);
      expect(result1[0]?.description).toBe(testItem.description);

      expect(result2).toBeDefined();
      expect(result2[0]?.id).toBe(createdItem.id);
      expect(result2[0]?.name).toBe(testItem.name);
      expect(result2[0]?.description).toBe(testItem.description);
    });

    it('should return an empty array for non-existent itemId or itemName', async () => {
      // Act
      const result = await repository.getItemsByNamesOrIds(
        ['I do not exist'],
        [TEST_IDS.NON_EXISTENT_ITEM],
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.length).toBe(0);
    });
  });

  describe('updateItemById', () => {
    it('should successfully update a item', async () => {
      // Arrange
      const testItem = {
        name: 'Test Item',
        description: 'Test Description',
      };

      const createdItems = await repository.createItems([testItem]);
      const createdItem = createdItems[0];

      const updatedData = {
        name: 'Updated Name',
        description: 'Updated Description',
      };

      // Act
      const updatedItem = await repository.updateItemById(createdItem.id, updatedData);

      // Assert
      expect(updatedItem).toBeDefined();
      expect(updatedItem?.id).toBe(createdItem.id);
      expect(updatedItem?.name).toBe(updatedData.name);
      expect(updatedItem?.description).toBe(updatedData.description);
    });

    it('should successfully update with only a part of the data', async () => {
      // Arrange
      const testItem = {
        name: 'Test Item',
        description: 'Test Description',
      };

      const createdItems = await repository.createItems([testItem]);
      const createdItem = createdItems[0];

      const updatedData = {
        name: 'Updated only Name',
      };

      // Act
      const updatedItem = await repository.updateItemById(createdItem.id, updatedData);

      // Assert
      expect(updatedItem).toBeDefined();
      expect(updatedItem?.id).toBe(createdItem.id);
      expect(updatedItem?.name).toBe(updatedData.name);
      expect(updatedItem?.description).toBe(testItem.description);
    });

    it('should return undefined with non-existent item', async () => {
      // Arrange
      const updatedData = {
        name: 'Updated Name',
        description: 'Updated Description',
      };

      // Act
      const result = await repository.updateItemById(TEST_IDS.NON_EXISTENT_ITEM, updatedData);

      // Assert
      expect(result).toBeUndefined();
    });
  });

  describe('deleteItemById', () => {
    it('should successfully delete an item', async () => {
      // Arrange
      const testItem = {
        name: 'Test Item',
        description: 'Test Description',
      };

      const createdItems = await repository.createItems([testItem]);
      const createdItem = createdItems[0];

      // Act
      await repository.deleteItemById(createdItem.id);
      const result = await repository.getItemById(createdItem.id);

      // Assert
      expect(result).toBeUndefined();
    });

    it('should delete nothing with non-existent item', async () => {
      // Arrange
      const testItem = {
        name: 'Test Item',
        description: 'Test Description',
      };
      await repository.createItems([testItem]);

      const countBeforeDeletion = (await repository.getItems()).length;

      // Act
      await repository.deleteItemById(TEST_IDS.NON_EXISTENT_ITEM);
      const countAfterDeletion = (await repository.getItems()).length;

      // Assert
      expect(countBeforeDeletion).toBeDefined();
      expect(countBeforeDeletion).toBe(1);

      expect(countAfterDeletion).toBeDefined();
      expect(countAfterDeletion).toBe(1);
    });
  });
});
