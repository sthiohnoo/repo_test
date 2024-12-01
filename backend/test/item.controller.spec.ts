import request from 'supertest';
import express, { Application } from 'express';
import { TestDatabase } from './helpers/database';
import { ShoppingListTestHelper } from './helpers/shoppingList';
import { ItemTestHelper } from './helpers/item';

import { ItemController } from '../src/controller/item.controller';
import { ShoppingListItemRepository } from '../src/db/repository/shoppingListItem.repository';
import { ItemRepository } from '../src/db/repository/item.repository';
import { globalErrorHandler } from '../src/utils/global-error';

const TEST_IDS = {
  ITEM_1: '123e4567-e89b-12d3-a456-426614174000',
  ITEM_2: '123e4567-e89b-12d3-a456-426614174013',
  LIST_1: '123e4567-e89b-12d3-a456-426614174001',
  NON_EXISTENT_ITEM: '123e4567-e89b-12d3-a456-426614174011',
  INVALID_ID: 'invalid-id',
} as const;

describe('ItemController Integration Tests', () => {
  const testDatabase = new TestDatabase();
  let app: Application;
  let shoppingListHelper: ShoppingListTestHelper;
  let itemHelper: ItemTestHelper;

  let controller: ItemController;
  let shoppingListItemRepository: ShoppingListItemRepository;
  let itemRepository: ItemRepository;

  beforeAll(async () => {
    await testDatabase.setup();
    shoppingListHelper = new ShoppingListTestHelper(testDatabase.database);
    itemHelper = new ItemTestHelper(testDatabase.database);

    itemRepository = new ItemRepository(testDatabase.database);
    shoppingListItemRepository = new ShoppingListItemRepository(testDatabase.database);

    controller = new ItemController(itemRepository, shoppingListItemRepository);
  }, 60000);

  beforeEach(async () => {
    app = express();
    app.use(express.json());

    app.get('/items', controller.getItems.bind(controller));
    app.get('/items/:itemId', controller.getItemById.bind(controller));
    app.get('/items/name/:itemName', controller.getItemByName.bind(controller));
    app.post('/items', controller.createItem.bind(controller));
    app.put('/items/:itemId', controller.updateItemById.bind(controller));
    app.delete('/items/:itemId', controller.deleteItemById.bind(controller));

    app.use(globalErrorHandler);

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
  });

  afterEach(async () => {
    await testDatabase.clear();
  });

  afterAll(async () => {
    await testDatabase.teardown();
  });

  describe('GET /items', () => {
    it('should return 200 and all items', async () => {
      // Act
      const response = await request(app).get('/items');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(2);
    });

    it('should return 200 and an empty array if no items exist', async () => {
      // Arrange
      await testDatabase.clear();

      // Act
      const response = await request(app).get('/items');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });

  describe('GET /items/:itemId', () => {
    it('should return 200 and the item', async () => {
      // Act
      const response = await request(app).get(`/items/${TEST_IDS.ITEM_1}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.id).toBe(TEST_IDS.ITEM_1);
    });

    it('should return 404 with message for non-existent item', async () => {
      // Act
      const response = await request(app).get(`/items/${TEST_IDS.NON_EXISTENT_ITEM}`);

      // Assert
      expect(response.status).toBe(404);
      expect(response.body.errors).toContain('Item not found');
    });

    it('should return 400  with message for invalid id format', async () => {
      // Act
      const response = await request(app).get(`/items/${TEST_IDS.INVALID_ID}`);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            message: 'Invalid itemId format. please provide a valid UUID',
          }),
        ]),
      );
    });
  });

  describe('GET /items/name/:itemName', () => {
    it('should return 200 and the item', async () => {
      // Act
      const response = await request(app).get(`/items/name/item2`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.id).toBe(TEST_IDS.ITEM_2);
    });

    it('should return 404 with message for non-existent item', async () => {
      // Act
      const response = await request(app).get(`/items/name/non_existent_name`);

      // Assert
      expect(response.status).toBe(404);
      expect(response.body.errors).toContain('Item not found');
    });
  });

  describe('POST /items', () => {
    it('should return 201 and the created items', async () => {
      // Arrange
      const newItem1 = {
        name: 'newItem',
        description: 'newItem_description',
      };
      const newItem2 = {
        name: 'newItem2',
      };

      // Act
      const response = await request(app).post('/items').send([newItem1, newItem2]);

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.length).toBe(2);
      expect(response.body[0].name).toBe(newItem1.name);
      expect(response.body[0].description).toBe(newItem1.description);
      expect(response.body[1].name).toBe(newItem2.name);
      expect(response.body[1].description).toBeNull();
    });

    it('should return 409 with message for already existing item', async () => {
      // Arrange
      const newItem = {
        name: 'item1',
        description: 'item1_description',
      };

      // Act
      const response = await request(app).post('/items').send([newItem]);

      // Assert
      expect(response.status).toBe(409);
      expect(response.body.errors).toContain('Creation canceled! Item already exists');
    });

    it('should return 400 with message for invalid name', async () => {
      // Arrange
      const newItem = {
        name: '',
        description: 'newItem_description',
      };

      // Act
      const response = await request(app).post('/items').send([newItem]);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            message: 'String must contain at least 1 character(s)',
          }),
        ]),
      );
    });
  });

  describe('PUT /items/:itemId', () => {
    it('should return 200 and the updated item', async () => {
      // Arrange
      const updatedItem = {
        name: 'updatedItem',
        description: 'updatedItem_description',
      };

      // Act
      const response = await request(app).put(`/items/${TEST_IDS.ITEM_1}`).send(updatedItem);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.name).toBe(updatedItem.name);
      expect(response.body.description).toBe(updatedItem.description);
    });

    it('should return 404 with message for non-existent item', async () => {
      // Arrange
      const updatedItem = {
        name: 'updatedItem',
        description: 'updatedItem_description',
      };

      // Act
      const response = await request(app)
        .put(`/items/${TEST_IDS.NON_EXISTENT_ITEM}`)
        .send(updatedItem);

      // Assert
      expect(response.status).toBe(404);
      expect(response.body.errors).toContain('Item not found');
    });

    it('should return 400 with message for invalid id format', async () => {
      // Arrange
      const updatedItem = {
        name: 'updatedItem',
        description: 'updatedItem_description',
      };

      // Act
      const response = await request(app).put(`/items/${TEST_IDS.INVALID_ID}`).send(updatedItem);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            message: 'Invalid itemId format. please provide a valid UUID',
          }),
        ]),
      );
    });
  });

  describe('DELETE /items/:itemId', () => {
    it('should return 204 and delete the item', async () => {
      // Arrange
      const countBeforeDelete = (await itemRepository.getItems()).length;

      // Act
      const response = await request(app).delete(`/items/${TEST_IDS.ITEM_1}`);
      const countAfterDelete = (await itemRepository.getItems()).length;

      // Assert
      expect(response.status).toBe(204);
      expect(countAfterDelete).toBe(countBeforeDelete - 1);
    });

    it('should return 404 with message for non-existent item', async () => {
      // Act
      const response = await request(app).delete(`/items/${TEST_IDS.NON_EXISTENT_ITEM}`);

      // Assert
      expect(response.status).toBe(404);
      expect(response.body.errors).toContain('Item not found');
    });

    it('should return 400 with message for invalid id format', async () => {
      // Act
      const response = await request(app).delete(`/items/${TEST_IDS.INVALID_ID}`);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            message: 'Invalid itemId format. please provide a valid UUID',
          }),
        ]),
      );
    });

    it('should return 409 with message when trying to delete an item used in shoppingLists', async () => {
      // Arrange
      const itemToList = {
        listId: TEST_IDS.LIST_1,
        itemId: TEST_IDS.ITEM_1,
        quantity: 1,
        isPurchased: false,
      };
      await shoppingListItemRepository.addItemToList(itemToList);

      const countBeforeDelete = (await itemRepository.getItems()).length;

      // Act
      const response = await request(app).delete(`/items/${TEST_IDS.ITEM_1}`);

      const countAfterDelete = (await itemRepository.getItems()).length;

      // Assert
      expect(response.status).toBe(409);
      expect(countAfterDelete).toBe(countBeforeDelete);
      expect(response.body.errors).toContain('Deletion canceled. Item exists in a ShoppingList');
    });
  });
});
