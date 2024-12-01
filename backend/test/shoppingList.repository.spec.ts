import { TestDatabase } from './helpers/database';
import { ShoppingListRepository } from '../src/db/repository/shoppingList.repository';

const TEST_IDS = {
  NON_EXISTENT_SHOPPINGLIST: '123e4567-e89b-12d3-a456-426614174010',
} as const;

describe('ShoppingListRepository Integration Tests', () => {
  const testDatabase = new TestDatabase();
  let repository: ShoppingListRepository;

  beforeAll(async () => {
    await testDatabase.setup();
    repository = new ShoppingListRepository(testDatabase.database);
  }, 60000);

  afterEach(async () => {
    await testDatabase.clear();
  });

  afterAll(async () => {
    await testDatabase.teardown();
  });

  describe('getShoppingList', () => {
    it('should successfully retrieve all shoppingLists', async () => {
      // Arrange
      const testSL_WithDescription = {
        name: 'Test Shopping List 1',
        description: 'Test Description',
        createdAt: new Date(),
      };

      const testSL_WithoutDescription = {
        name: 'Test Shopping List 2',
        createdAt: new Date(),
      };

      const createdSL_WithDesc = await repository.createShoppingList(testSL_WithDescription);
      const createdSL_WithoutDesc = await repository.createShoppingList(testSL_WithoutDescription);

      // Act
      const result = await repository.getShoppingList();

      // Assert
      expect(result).toBeDefined();
      expect(result.length).toBe(2);

      const retrievedSLItems = result.find((list) => list.id === createdSL_WithDesc.id);
      const retrievedSLNoDesc = result.find((list) => list.id === createdSL_WithoutDesc.id);

      expect(retrievedSLItems).toBeDefined();
      expect(retrievedSLItems?.id).toBe(createdSL_WithDesc.id);
      expect(retrievedSLItems?.name).toBe(testSL_WithDescription.name);
      expect(retrievedSLItems?.description).toBe(testSL_WithDescription.description);

      expect(retrievedSLNoDesc).toBeDefined();
      expect(retrievedSLNoDesc?.id).toBe(createdSL_WithoutDesc.id);
      expect(retrievedSLNoDesc?.name).toBe(testSL_WithoutDescription.name);
      expect(retrievedSLNoDesc?.description).toBeNull();
    });

    it('should return an empty array with no shoppingLists', async () => {
      // Act
      const result = await repository.getShoppingList();

      // Assert
      expect(result).toBeDefined();
      expect(result.length).toBe(0);
    });
  });

  describe('getShoppingListById', () => {
    it('should successfully retrieve a shoppingList by id', async () => {
      // Arrange
      const testShoppingList = {
        name: 'Test Shopping List',
        description: 'Test Description',
        createdAt: new Date(),
      };
      const createdShoppingList = await repository.createShoppingList({
        name: testShoppingList.name,
        description: testShoppingList.description,
      });

      // Act
      const result = await repository.getShoppingListById(createdShoppingList.id);

      // Assert
      expect(result).toBeDefined();
      expect(result?.id).toBe(createdShoppingList.id);
      expect(result?.name).toBe(testShoppingList.name);
      expect(result?.description).toBe(testShoppingList.description);
    });

    it('should return undefined for non-existent shoppingList', async () => {
      // Act
      const result = await repository.getShoppingListById(TEST_IDS.NON_EXISTENT_SHOPPINGLIST);

      // Assert
      expect(result).toBeUndefined();
    });
  });

  describe('updateShoppingListById', () => {
    it('should successfully update a shoppingList', async () => {
      // Arrange
      const testShoppingList = {
        name: 'Test Shopping List',
        description: 'Test Description',
        createdAt: new Date(),
      };
      const createdShoppingList = await repository.createShoppingList(testShoppingList);
      const updatedData = {
        name: 'Updated Name',
        description: 'Updated Description',
      };

      // Act
      const updatedShoppingList = await repository.updateShoppingListById(
        createdShoppingList.id,
        updatedData,
      );

      // Assert
      expect(updatedShoppingList).toBeDefined();
      expect(updatedShoppingList?.id).toBe(createdShoppingList.id);
      expect(updatedShoppingList?.name).toBe(updatedData.name);
      expect(updatedShoppingList?.description).toBe(updatedData.description);
    });

    it('should successfully update with only a part of the data', async () => {
      // Arrange
      const testShoppingList = {
        name: 'Test Shopping List',
        description: 'Test Description',
        createdAt: new Date(),
      };
      const createdShoppingList = await repository.createShoppingList(testShoppingList);
      const updatedData = {
        name: 'Updated only Name',
      };

      // Act
      const updatedShoppingList = await repository.updateShoppingListById(
        createdShoppingList.id,
        updatedData,
      );

      // Assert
      expect(updatedShoppingList).toBeDefined();
      expect(updatedShoppingList?.id).toBe(createdShoppingList.id);
      expect(updatedShoppingList?.name).toBe(updatedData.name);
      expect(updatedShoppingList?.description).toBe(testShoppingList.description);
    });

    it('should return undefined with non-existent shoppingList', async () => {
      // Arrange
      const updatedData = {
        name: 'Updated Name',
        description: 'Updated Description',
      };

      // Act
      const result = await repository.updateShoppingListById(
        TEST_IDS.NON_EXISTENT_SHOPPINGLIST,
        updatedData,
      );

      // Assert
      expect(result).toBeUndefined();
    });
  });

  describe('deleteShoppingListById', () => {
    it('should successfully delete a shoppingList', async () => {
      // Arrange
      const testShoppingList = {
        name: 'Delete Shopping List',
        description: 'Delete Description',
        createdAt: new Date(),
      };
      const createdShoppingList = await repository.createShoppingList(testShoppingList);

      // Act
      await repository.deleteShoppingListById(createdShoppingList.id);
      const result = await repository.getShoppingListById(createdShoppingList.id);

      // Assert
      expect(result).toBeUndefined();
    });

    it('should delete nothing with non-existent shoppingList', async () => {
      // Arrange
      const countBeforeDeletion = (await repository.getShoppingList()).length;

      // Act
      await repository.deleteShoppingListById(TEST_IDS.NON_EXISTENT_SHOPPINGLIST);
      const countAfterDeletion = (await repository.getShoppingList()).length;

      // Assert
      expect(countAfterDeletion).toBeDefined();
      expect(countAfterDeletion).toBe(countBeforeDeletion);
    });
  });

  describe('searchShoppingLists', () => {
    it('should successfully search shoppingLists by name', async () => {
      // Arrange
      const testShoppingList = {
        name: 'Search Shopping List',
        description: 'Search Description',
        createdAt: new Date(),
      };
      await repository.createShoppingList(testShoppingList);

      // Act
      const results = await repository.searchShoppingLists('Search Shopping List');

      // Assert
      expect(results).toBeDefined();
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].name).toBe(testShoppingList.name);
    });

    it('should successfully search shoppingLists by part of description', async () => {
      // Arrange
      const testShoppingList = {
        name: 'Search Shopping List',
        description: 'Search Description',
        createdAt: new Date(),
      };
      await repository.createShoppingList(testShoppingList);

      // Act
      const results = await repository.searchShoppingLists(undefined, 'Desc');

      // Assert
      expect(results).toBeDefined();
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].name).toBe(testShoppingList.name);
    });

    it('should return all shoppingLists with nothing to search', async () => {
      // Arrange
      const testShoppingList = {
        name: 'Search Shopping List',
        description: 'Search Description',
        createdAt: new Date(),
      };
      await repository.createShoppingList(testShoppingList);

      // Act
      const results = await repository.searchShoppingLists(undefined, undefined);

      // Assert
      expect(results).toBeDefined();
      expect(results.length).toBe(1);
    });
  });

  // Freestyle task #1
  describe('getAllFavoriteShoppingLists', () => {
    it('should successfully retrieve all favorite shoppingLists', async () => {
      // Arrange
      const testShoppingList = {
        name: 'Favorite Shopping List',
        description: 'Favorite Description',
        createdAt: new Date(),
        isFavorite: true,
      };
      await repository.createShoppingList(testShoppingList);

      // Act
      const results = await repository.getAllFavoriteShoppingLists();

      // Assert
      expect(results).toBeDefined();
      expect(results.length).toBe(1);
      expect(results[0].name).toBe(testShoppingList.name);
      expect(results[0].description).toBe(testShoppingList.description);
      expect(results[0].isFavorite).toBe(true);
    });

    it('should return an empty array with no favorite shoppingLists', async () => {
      // Arrange
      const testShoppingList = {
        name: 'Not Favorite Shopping List',
        description: 'Not Favorite Description',
        createdAt: new Date(),
        isFavorite: false,
      };
      await repository.createShoppingList(testShoppingList);

      // Act
      const results = await repository.getAllFavoriteShoppingLists();

      // Assert
      expect(results).toBeDefined();
      expect(results.length).toBe(0);
    });
  });

  describe('setFavorite', () => {
    it('should successfully set a shoppingList as favorite', async () => {
      // Arrange
      const testShoppingList = {
        name: 'Set Favorite Shopping List',
        description: 'Set Favorite Description',
        createdAt: new Date(),
        isFavorite: false,
      };
      const createdShoppingList = await repository.createShoppingList(testShoppingList);

      // Act
      await repository.setFavorite(createdShoppingList.id, true);
      const result = await repository.getShoppingListById(createdShoppingList.id);

      // Assert
      expect(result).toBeDefined();
      expect(result?.isFavorite).toBe(true);
    });

    it('should successfully set a shoppingList as not favorite', async () => {
      // Arrange
      const testShoppingList = {
        name: 'Set Not Favorite Shopping List',
        description: 'Set Not Favorite Description',
        createdAt: new Date(),
        isFavorite: true,
      };
      const createdShoppingList = await repository.createShoppingList(testShoppingList);

      // Act
      await repository.setFavorite(createdShoppingList.id, false);
      const result = await repository.getShoppingListById(createdShoppingList.id);

      // Assert
      expect(result).toBeDefined();
      expect(result?.isFavorite).toBe(false);
    });

    it('should return undefined with non-existent shoppingList', async () => {
      // Act
      const result = await repository.setFavorite(TEST_IDS.NON_EXISTENT_SHOPPINGLIST, true);

      // Assert
      expect(result).toBeUndefined();
    });
  });
});
