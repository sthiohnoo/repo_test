import request from 'supertest';
import express, { Application } from 'express';
import { TestDatabase } from './helpers/database';
import { ShoppingListTestHelper } from './helpers/shoppingList';
import { ItemTestHelper } from './helpers/item';

import { ShoppingListController } from '../src/controller/shoppingList.controller';
import { ShoppingListItemRepository } from '../src/db/repository/shoppingListItem.repository';
import { ItemRepository } from '../src/db/repository/item.repository';
import { ShoppingListRepository } from '../src/db/repository/shoppingList.repository';
import { globalErrorHandler } from '../src/utils/global-error';

const TEST_IDS = {
  ITEM_1: '123e4567-e89b-12d3-a456-426614174000',
  ITEM_2: '123e4567-e89b-12d3-a456-426614174013',
  LIST_1: '123e4567-e89b-12d3-a456-426614174001',
  LIST_2: '123e4567-e89b-12d3-a456-426614174002',
  NON_EXISTENT_SHOPPINGLIST: '123e4567-e89b-12d3-a456-426614174010',
  NON_EXISTENT_ITEM: '123e4567-e89b-12d3-a456-426614174011',
  INVALID_ID: 'invalid-id',
} as const;

describe('ShoppingListController Integration Tests', () => {
  const testDatabase = new TestDatabase();
  let app: Application;
  let shoppingListHelper: ShoppingListTestHelper;
  let itemHelper: ItemTestHelper;

  let controller: ShoppingListController;
  let shoppingListItemRepository: ShoppingListItemRepository;
  let shoppingListRepository: ShoppingListRepository;
  let itemRepository: ItemRepository;

  beforeAll(async () => {
    await testDatabase.setup();
    shoppingListHelper = new ShoppingListTestHelper(testDatabase.database);
    itemHelper = new ItemTestHelper(testDatabase.database);

    shoppingListRepository = new ShoppingListRepository(testDatabase.database);
    itemRepository = new ItemRepository(testDatabase.database);
    shoppingListItemRepository = new ShoppingListItemRepository(testDatabase.database);

    controller = new ShoppingListController(
      shoppingListRepository,
      itemRepository,
      shoppingListItemRepository,
    );
  }, 60000);

  beforeEach(async () => {
    app = express();
    app.use(express.json());

    app.get('/shoppingLists', controller.getShoppingLists.bind(controller));
    app.get(
      '/shoppingLists/search',
      controller.searchShoppingListsWithNameOrDescription.bind(controller),
    );
    app.get('/shoppingLists/:shoppingListId', controller.getShoppingListById.bind(controller));
    app.get(
      '/shoppingLists/items/:itemId',
      controller.getShoppingListsWithSearchingItemById.bind(controller),
    );
    app.post('/shoppingLists', controller.createShoppingList.bind(controller));
    app.put('/shoppingLists/:shoppingListId', controller.updateShoppingListById.bind(controller));
    app.put(
      '/shoppingLists/:shoppingListId/items/:itemId',
      controller.addItemToList.bind(controller),
    );
    app.delete(
      '/shoppingLists/:shoppingListId/items/:itemId',
      controller.deleteItemInListById.bind(controller),
    );
    app.delete(
      '/shoppingLists/:shoppingListId',
      controller.deleteShoppingListById.bind(controller),
    );
    app.patch(
      '/shoppingLists/toggle/:shoppingListId/:itemId',
      controller.toggleIsPurchased.bind(controller),
    );
    app.patch(
      '/shoppingLists/updateQuantity/:shoppingListId/:itemId',
      controller.updateQuantity.bind(controller),
    );

    //Freestyle task #1
    app.get(
      '/shoppingLists/search/favorites',
      controller.getAllFavoriteShoppingLists.bind(controller),
    );
    //Freestyle task #1
    app.put(
      '/shoppingLists/:shoppingListId/favorites',
      controller.updateFavoriteStatus.bind(controller),
    );

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

  describe('POST /shoppingLists', () => {
    it('should return 201 and create a new shoppingList with items', async () => {
      // Arrange
      const newShoppingList = {
        name: 'Test Shopping List',
        description: 'Test Description',
        items: [{ id: TEST_IDS.ITEM_1 }, { id: TEST_IDS.ITEM_2 }],
      };

      // Act
      const response = await request(app)
        .post('/shoppingLists')
        .send(newShoppingList)
        .set('Accept', 'application/json');

      // Assert
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(newShoppingList.name);
      expect(response.body.description).toBe(newShoppingList.description);
      expect(response.body.shoppingListItems).toHaveLength(2);
      expect(response.body.shoppingListItems[0].item.id).toBe(newShoppingList.items[0].id);
      expect(response.body.shoppingListItems[1].item.id).toBe(newShoppingList.items[1].id);
    });
  });

  it('should return 201 and create a new item while creating a new shoppingList with non-existent item', async () => {
    // Arrange
    const newShoppingList = {
      name: 'Test Shopping List',
      description: 'Test Description',
      items: [{ name: 'newItem1', description: 'newItemDescription' }, { name: 'newItem2' }],
    };
    const countItemBeforeCreation = (await itemRepository.getItems()).length;

    // Act
    const response = await request(app)
      .post('/shoppingLists')
      .send(newShoppingList)
      .set('Accept', 'application/json');
    const countItemAfterCreation = (await itemRepository.getItems()).length;

    // Assert
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toBe(newShoppingList.name);
    expect(response.body.description).toBe(newShoppingList.description);
    expect(response.body.shoppingListItems).toHaveLength(2);
    expect(countItemAfterCreation).toBe(countItemBeforeCreation + 2);
  });

  describe('GET /shoppingLists', () => {
    it('should return 200 and an empty array without a shoppingList', async () => {
      // Arrange
      await testDatabase.clear();

      // Act
      const response = await request(app).get('/shoppingLists');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('should return 200 with shoppingLists', async () => {
      // Act
      const response = await request(app).get('/shoppingLists');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });
  describe('GET /shoppingLists/:shoppingListId', () => {
    it('should return 200 with shoppingList', async () => {
      // Act
      const response = await request(app).get(`/shoppingLists/${TEST_IDS.LIST_1}`);

      // Assert
      expect(response.status).toBe(200);
      expect(typeof response.body).toBe('object');
      expect(Array.isArray(response.body)).toBe(false);
      expect(response.body.id).toBe(TEST_IDS.LIST_1);
    });

    it('should return 400  with message for invalid id format', async () => {
      // Act
      const response = await request(app).get(`/shoppingLists/${TEST_IDS.INVALID_ID}`);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            message: 'Invalid shoppingListId format. please provide a valid UUID',
          }),
        ]),
      );
    });

    it('should return 404 with message for non-existent shoppingList', async () => {
      // Act
      const response = await request(app).get(
        `/shoppingLists/${TEST_IDS.NON_EXISTENT_SHOPPINGLIST}`,
      );

      // Assert
      expect(response.status).toBe(404);
      expect(response.body.errors).toContain('ShoppingList not found');
    });
  });

  describe('GET /shoppingLists/items/:itemId', () => {
    it('should return 200 with shoppingLists', async () => {
      // Arrange
      const newShoppingList_1 = {
        name: 'shoppingList 1 with ITEM_1',
        items: [{ id: TEST_IDS.ITEM_1 }],
      };
      const newShoppingList_2 = {
        name: 'shoppingList 2 with ITEM_1',
        items: [{ id: TEST_IDS.ITEM_1 }],
      };
      const createdShoppingList_1 = await request(app)
        .post('/shoppingLists')
        .send(newShoppingList_1)
        .set('Accept', 'application/json');
      const createdShoppingList_2 = await request(app)
        .post('/shoppingLists')
        .send(newShoppingList_2)
        .set('Accept', 'application/json');

      // Act
      const response = await request(app).get(`/shoppingLists/items/${TEST_IDS.ITEM_1}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(2);

      expect(response.body[0].listId).toBe(createdShoppingList_1.body.id);
      expect(response.body[0].itemId).toBe(TEST_IDS.ITEM_1);
      expect(response.body[1].listId).toBe(createdShoppingList_2.body.id);
      expect(response.body[1].itemId).toBe(TEST_IDS.ITEM_1);
    });

    it('should return 400 with message for invalid id format', async () => {
      // Act
      const response = await request(app).get(`/shoppingLists/items/${TEST_IDS.INVALID_ID}`);

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

    it('should return 404 for item not in any shoppingList', async () => {
      // Act
      const response = await request(app).get(`/shoppingLists/items/${TEST_IDS.ITEM_1}`);

      // Assert
      expect(response.status).toBe(404);
      expect(response.body.errors).toContain('Item not found in any ShoppingList');
    });
  });

  describe('GET /shoppingLists/search', () => {
    it('should return 200 with a shoppingList with only the name', async () => {
      // Act
      const response = await request(app).get(
        `/shoppingLists/search?name=shoppingList1&description=${undefined}`,
      );

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
      expect(response.body[0].id).toBe(TEST_IDS.LIST_1);
      expect(response.body[0].name).toBe('shoppingList1');
      expect(response.body[0].description).toBe('shoppingList1_description');
    });

    it('should return 200 with a shoppingList with only the description', async () => {
      // Act
      const response = await request(app).get(
        `/shoppingLists/search?name=${undefined}&description=shoppingList2_description`,
      );

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
      expect(response.body[0].id).toBe(TEST_IDS.LIST_2);
      expect(response.body[0].name).toBe('shoppingList2');
      expect(response.body[0].description).toBe('shoppingList2_description');
    });

    it('should return 200 with a shoppingList matching the given name and description', async () => {
      // Act
      const response = await request(app).get(
        '/shoppingLists/search?name=shoppingList1&description=shoppingList1_description',
      );

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
      expect(response.body[0].id).toBe(TEST_IDS.LIST_1);
      expect(response.body[0].name).toBe('shoppingList1');
      expect(response.body[0].description).toBe('shoppingList1_description');
    });

    it('should return 200 with all shoppingLists matching with part of the name', async () => {
      // Act
      const response = await request(app).get(
        `/shoppingLists/search?name=List&description=${undefined}`,
      );

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(2);
    });

    it('should return 200 with all shoppingLists with empty name and description', async () => {
      // Act
      const response = await request(app).get('/shoppingLists/search?name=&description=');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should return 404 with message with no matching name and description', async () => {
      // Act
      const response = await request(app).get(
        '/shoppingLists/search?name=non_existent_name&description=non_existent_description',
      );

      // Assert
      expect(response.status).toBe(404);
      expect(response.body.errors).toContain('ShoppingList not found');
    });
  });

  describe('PUT /shoppingLists/:shoppingListId', () => {
    it('should return 200 and update the shopping list, including item quantity and state', async () => {
      // Arrange
      const newShoppingList = {
        name: 'shoppingList 1',
        description: 'Test Description 1',
        items: [{ id: TEST_IDS.ITEM_1 }],
      };
      const createdShoppingList = await request(app)
        .post('/shoppingLists')
        .send(newShoppingList)
        .set('Accept', 'application/json');

      const shoppingListBeforeUpdate = await request(app).get(
        `/shoppingLists/${createdShoppingList.body.id}`,
      );

      const updatedShoppingList = {
        name: 'updated shoppingList',
        description: 'updated shoppingList description',
        items: [
          {
            id: TEST_IDS.ITEM_1,
            quantity: 100,
            isPurchased: true,
          },
        ],
      };

      // Act
      const response = await request(app)
        .put(`/shoppingLists/${createdShoppingList.body.id}`)
        .send(updatedShoppingList)
        .set('Accept', 'application/json');
      const shoppingListAfterUpdate = await request(app).get(
        `/shoppingLists/${createdShoppingList.body.id}`,
      );

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.id).toBe(createdShoppingList.body.id);
      expect(response.body.name).not.toBe(createdShoppingList.body.name);
      expect(response.body.name).toBe(updatedShoppingList.name);
      expect(response.body.description).toBe(updatedShoppingList.description);
      expect(shoppingListBeforeUpdate.body.shoppingListItems[0].quantity).toBe(1);
      expect(shoppingListBeforeUpdate.body.shoppingListItems[0].isPurchased).toBe(false);
      expect(shoppingListAfterUpdate.body.shoppingListItems[0].quantity).toBe(100);
      expect(shoppingListAfterUpdate.body.shoppingListItems[0].isPurchased).toBe(true);
    });

    it('should return 400 with message for invalid shoppingList id format', async () => {
      // Act
      const response = await request(app).put(`/shoppingLists/${TEST_IDS.INVALID_ID}`);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            message: 'Invalid shoppingListId format. please provide a valid UUID',
          }),
        ]),
      );
    });

    it('should return 400 with message for invalid item id format', async () => {
      // Arrange
      const updatedShoppingList = {
        name: 'updated shoppingList',
        description: 'updated shoppingList description',
        items: [
          {
            id: TEST_IDS.INVALID_ID,
            quantity: 100,
            isPurchased: true,
          },
        ],
      };

      // Act
      const response = await request(app)
        .put(`/shoppingLists/${TEST_IDS.LIST_1}`)
        .send(updatedShoppingList)
        .set('Accept', 'application/json');

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

    it('should return 404 with message for non-existent shoppingList', async () => {
      // Act
      const response = await request(app).put(
        `/shoppingLists/${TEST_IDS.NON_EXISTENT_SHOPPINGLIST}`,
      );

      // Assert
      expect(response.status).toBe(404);
      expect(response.body.errors).toContain('ShoppingList not found');
    });

    it('should return 404 with message when updating list has no items', async () => {
      // Arrange
      const updatedShoppingList = {
        name: 'updated shoppingList',
        description: 'updated shoppingList description',
        items: [
          {
            id: TEST_IDS.ITEM_1,
            quantity: 100,
            isPurchased: true,
          },
        ],
      };

      // Act
      const response = await request(app)
        .put(`/shoppingLists/${TEST_IDS.LIST_1}`)
        .send(updatedShoppingList)
        .set('Accept', 'application/json');

      // Assert
      expect(response.status).toBe(404);
      expect(response.body.errors).toContain('Update canceled! Updating list has no items');
    });

    it('should return 404 with message when updating a list that does not contain the specific item', async () => {
      // Arrange
      const newShoppingList = {
        name: 'shoppingList 1',
        description: 'Test Description 1',
        items: [{ id: TEST_IDS.ITEM_1 }],
      };
      const createdShoppingList = await request(app)
        .post('/shoppingLists')
        .send(newShoppingList)
        .set('Accept', 'application/json');

      const updatedShoppingList = {
        name: 'updated shoppingList',
        description: 'updated shoppingList description',
        items: [
          {
            id: TEST_IDS.ITEM_2,
            quantity: 100,
            isPurchased: true,
          },
        ],
      };

      // Act
      const response = await request(app)
        .put(`/shoppingLists/${createdShoppingList.body.id}`)
        .send(updatedShoppingList)
        .set('Accept', 'application/json');

      // Assert
      expect(response.status).toBe(404);
      expect(response.body.errors).toContain(
        'Update canceled! updating item not found in the shoppingList',
      );
    });
  });

  describe('PUT /shoppingLists/:shoppingListId/items/:itemId', () => {
    it('should return 201 and add an item in the shoppingList', async () => {
      // Arrange
      const itemProperties = {
        quantity: 100,
        isPurchased: true,
      };

      // Act
      const response = await request(app)
        .put(`/shoppingLists/${TEST_IDS.LIST_1}/items/${TEST_IDS.ITEM_1}`)
        .send(itemProperties)
        .set('Accept', 'application/json');

      // Assert
      expect(response.status).toBe(201);
      expect(response.body.listId).toBe(TEST_IDS.LIST_1);
      expect(response.body.itemId).toBe(TEST_IDS.ITEM_1);
      expect(response.body.quantity).toBe(itemProperties.quantity);
      expect(response.body.isPurchased).toBe(itemProperties.isPurchased);
    });

    it('should return 400 with message for invalid shoppingList id format', async () => {
      // Act
      const response = await request(app).put(
        `/shoppingLists/${TEST_IDS.INVALID_ID}/items/${TEST_IDS.ITEM_1}`,
      );

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            message: 'Invalid shoppingListId format. please provide a valid UUID',
          }),
        ]),
      );
    });

    it('should return 400 with message for invalid item id format', async () => {
      // Act
      const response = await request(app).put(
        `/shoppingLists/${TEST_IDS.LIST_1}/items/${TEST_IDS.INVALID_ID}`,
      );

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

    it('should return 404 with message for non-existent shoppingList', async () => {
      // Act
      const response = await request(app)
        .put(`/shoppingLists/${TEST_IDS.NON_EXISTENT_SHOPPINGLIST}/items/${TEST_IDS.ITEM_1}`)
        .send({ quantity: 100 })
        .set('Accept', 'application/json');

      // Assert
      expect(response.status).toBe(404);
      expect(response.body.errors).toContain('ShoppingList not found');
    });

    it('should return 404 with message for non-existent item', async () => {
      // Act
      const response = await request(app)
        .put(`/shoppingLists/${TEST_IDS.LIST_1}/items/${TEST_IDS.NON_EXISTENT_ITEM}`)
        .send({ quantity: 100 })
        .set('Accept', 'application/json');

      // Assert
      expect(response.status).toBe(404);
      expect(response.body.errors).toContain('Item not found');
    });

    it('should return 409 with message for item already in the shoppingList', async () => {
      // Arrange
      const itemProperties = {
        quantity: 100,
        isPurchased: true,
      };

      // Act
      await request(app)
        .put(`/shoppingLists/${TEST_IDS.LIST_1}/items/${TEST_IDS.ITEM_1}`)
        .send(itemProperties)
        .set('Accept', 'application/json');
      const response = await request(app)
        .put(`/shoppingLists/${TEST_IDS.LIST_1}/items/${TEST_IDS.ITEM_1}`)
        .send(itemProperties)
        .set('Accept', 'application/json');

      // Assert
      expect(response.status).toBe(409);
      expect(response.body.errors).toContain('Item already in the ShoppingList');
    });

    it('should return 400 with invalid quantity', async () => {
      // Arrange
      const itemProperties = {
        quantity: -1,
        isPurchased: true,
      };

      // Act
      const response = await request(app)
        .put(`/shoppingLists/${TEST_IDS.LIST_1}/items/${TEST_IDS.ITEM_1}`)
        .send(itemProperties)
        .set('Accept', 'application/json');

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            message: 'Number must be greater than or equal to 1',
          }),
        ]),
      );
    });
  });

  describe('DELETE /shoppingLists/:shoppingListId/items/:itemId', () => {
    it('should return 204 and delete an item in the shoppingList', async () => {
      // Arrange
      const newShoppingList = {
        name: 'shoppingList 1',
        description: 'Test Description 1',
        items: [{ id: TEST_IDS.ITEM_1 }],
      };
      const createdShoppingList = await request(app)
        .post('/shoppingLists')
        .send(newShoppingList)
        .set('Accept', 'application/json');
      const countItemsBeforeDeletion = (await shoppingListItemRepository.getAllEntries()).length;

      // Act
      const response = await request(app).delete(
        `/shoppingLists/${createdShoppingList.body.id}/items/${TEST_IDS.ITEM_1}`,
      );
      const countItemsAfterDeletion = (await shoppingListItemRepository.getAllEntries()).length;

      // Assert
      expect(response.status).toBe(204);
      expect(response.body).toEqual({});
      expect(countItemsAfterDeletion).toBe(countItemsBeforeDeletion - 1);
    });

    it('should return 400 with message for invalid shoppingList id format', async () => {
      // Act
      const response = await request(app).delete(
        `/shoppingLists/${TEST_IDS.INVALID_ID}/items/${TEST_IDS.ITEM_1}`,
      );

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            message: 'Invalid shoppingListId format. please provide a valid UUID',
          }),
        ]),
      );
    });

    it('should return 400 with message for invalid item id format', async () => {
      // Act
      const response = await request(app).delete(
        `/shoppingLists/${TEST_IDS.LIST_1}/items/${TEST_IDS.INVALID_ID}`,
      );

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

    it('should return 404 when shoppingList has no items', async () => {
      // Act
      const response = await request(app).delete(
        `/shoppingLists/${TEST_IDS.LIST_1}/items/${TEST_IDS.ITEM_1}`,
      );

      // Assert
      expect(response.status).toBe(404);
      expect(response.body.errors).toContain('ShoppingList has no Items');
    });

    it('should return 404 when shoppingList does not contain the specific item', async () => {
      // Arrange
      const newShoppingList = {
        name: 'shoppingList 1',
        description: 'Test Description 1',
        items: [{ id: TEST_IDS.ITEM_1 }],
      };
      const createdShoppingList = await request(app)
        .post('/shoppingLists')
        .send(newShoppingList)
        .set('Accept', 'application/json');

      // Act
      const response = await request(app).delete(
        `/shoppingLists/${createdShoppingList.body.id}/items/${TEST_IDS.ITEM_2}`,
      );

      // Assert
      expect(response.status).toBe(404);
      expect(response.body.errors).toContain('Item not found in the ShoppingList');
    });
  });

  describe('DELETE /shoppingLists/:shoppingListId', () => {
    it('should return 204 and delete the shoppingList with its relation', async () => {
      // Arrange
      const newShoppingList = {
        name: 'shoppingList 1',
        description: 'Test Description 1',
        items: [{ id: TEST_IDS.ITEM_1 }],
      };
      const createdShoppingList = await request(app)
        .post('/shoppingLists')
        .send(newShoppingList)
        .set('Accept', 'application/json');

      const countRelationsBeforeDeletion = (await shoppingListItemRepository.getAllEntries())
        .length;
      const countListsBeforeDeletion = (await shoppingListRepository.getShoppingList()).length;

      // Act
      const response = await request(app).delete(`/shoppingLists/${createdShoppingList.body.id}`);

      const countRelationsAfterDeletion = (await shoppingListItemRepository.getAllEntries()).length;
      const countListsAfterDeletion = (await shoppingListRepository.getShoppingList()).length;

      // Assert
      expect(response.status).toBe(204);
      expect(response.body).toEqual({});
      expect(countListsAfterDeletion).toBe(countListsBeforeDeletion - 1);
      expect(countRelationsAfterDeletion).toBe(countRelationsBeforeDeletion - 1);
    });

    it('should return 400 with message for invalid shoppingList id format', async () => {
      // Act
      const response = await request(app).delete(`/shoppingLists/${TEST_IDS.INVALID_ID}`);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            message: 'Invalid shoppingListId format. please provide a valid UUID',
          }),
        ]),
      );
    });

    it('should return 404 when shoppingList does not exist', async () => {
      // Act
      const response = await request(app).delete(
        `/shoppingLists/${TEST_IDS.NON_EXISTENT_SHOPPINGLIST}`,
      );

      // Assert
      expect(response.status).toBe(404);
      expect(response.body.errors).toContain('ShoppingList not found');
    });
  });

  describe('PATCH /shoppingLists/toggle/:shoppingListId/:itemId', () => {
    it('should return 200 and toggle the isPurchased status of the item in the shoppingList', async () => {
      // Arrange
      const newShoppingList = {
        name: 'shoppingList 1',
        description: 'Test Description 1',
        items: [{ id: TEST_IDS.ITEM_1 }],
      };
      const createdShoppingList = await request(app)
        .post('/shoppingLists')
        .send(newShoppingList)
        .set('Accept', 'application/json');

      console.log(createdShoppingList.body);

      const shoppingListBeforeToggle = await request(app).get(
        `/shoppingLists/${createdShoppingList.body.id}`,
      );

      // Act
      const response = await request(app).patch(
        `/shoppingLists/toggle/${createdShoppingList.body.id}/${TEST_IDS.ITEM_1}`,
      );
      const shoppingListAfterToggle = await request(app).get(
        `/shoppingLists/${createdShoppingList.body.id}`,
      );
      console.log(shoppingListAfterToggle.body.shoppingListItems[0].isPurchased);
      console.log(response.body);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.listId).toBe(createdShoppingList.body.id);
      expect(response.body.itemId).toBe(TEST_IDS.ITEM_1);
      expect(shoppingListBeforeToggle.body.shoppingListItems[0].isPurchased).toBe(false);
      expect(shoppingListAfterToggle.body.shoppingListItems[0].isPurchased).toBe(true);
    });

    it('should return 400 with message for invalid shoppingList id format', async () => {
      // Act
      const response = await request(app).patch(
        `/shoppingLists/toggle/${TEST_IDS.INVALID_ID}/${TEST_IDS.ITEM_1}`,
      );

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            message: 'Invalid shoppingListId format. please provide a valid UUID',
          }),
        ]),
      );
    });

    it('should return 400 with message for invalid item id format', async () => {
      // Act
      const response = await request(app).patch(
        `/shoppingLists/toggle/${TEST_IDS.LIST_1}/${TEST_IDS.INVALID_ID}`,
      );

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

    it('should return 404 when shoppingList has no items', async () => {
      // Act
      const response = await request(app).patch(
        `/shoppingLists/toggle/${TEST_IDS.LIST_1}/${TEST_IDS.ITEM_1}`,
      );

      // Assert
      expect(response.status).toBe(404);
      expect(response.body.errors).toContain('ShoppingList has no Items');
    });

    it('should return 404 when shoppingList does not contain the specific item', async () => {
      // Arrange
      const newShoppingList = {
        name: 'shoppingList 1',
        description: 'Test Description 1',
        items: [{ id: TEST_IDS.ITEM_1 }],
      };
      const createdShoppingList = await request(app)
        .post('/shoppingLists')
        .send(newShoppingList)
        .set('Accept', 'application/json');

      // Act
      const response = await request(app).patch(
        `/shoppingLists/toggle/${createdShoppingList.body.id}/${TEST_IDS.ITEM_2}`,
      );

      // Assert
      expect(response.status).toBe(404);
      expect(response.body.errors).toContain('Item not found in the ShoppingList');
    });
  });

  describe('PATCH /shoppingLists/updateQuantity/:shoppingListId/:itemId', () => {
    it('should return 200 and update the quantity of the item in the shoppingList', async () => {
      // Arrange
      const newShoppingList = {
        name: 'shoppingList 1',
        description: 'Test Description 1',
        items: [{ id: TEST_IDS.ITEM_1 }],
      };
      const createdShoppingList = await request(app)
        .post('/shoppingLists')
        .send(newShoppingList)
        .set('Accept', 'application/json');

      const shoppingListBeforeUpdate = await request(app).get(
        `/shoppingLists/${createdShoppingList.body.id}`,
      );

      // Act
      const response = await request(app)
        .patch(`/shoppingLists/updateQuantity/${createdShoppingList.body.id}/${TEST_IDS.ITEM_1}`)
        .send({ quantity: 100 });

      const shoppingListAfterUpdate = await request(app).get(
        `/shoppingLists/${createdShoppingList.body.id}`,
      );

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.listId).toBe(createdShoppingList.body.id);
      expect(response.body.itemId).toBe(TEST_IDS.ITEM_1);
      expect(response.body.quantity).toBe(100);
      expect(shoppingListBeforeUpdate.body.shoppingListItems[0].quantity).toBe(1);
      expect(shoppingListAfterUpdate.body.shoppingListItems[0].quantity).toBe(100);
    });

    it('should return 400 with message for invalid quantity', async () => {
      // Act
      const response = await request(app)
        .patch(`/shoppingLists/updateQuantity/${TEST_IDS.LIST_1}/${TEST_IDS.ITEM_1}`)
        .send({ quantity: -1 });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            message: 'Number must be greater than or equal to 1',
          }),
        ]),
      );
    });

    it('should return 400 with message for invalid shoppingList id format', async () => {
      // Act
      const response = await request(app)
        .patch(`/shoppingLists/updateQuantity/${TEST_IDS.INVALID_ID}/${TEST_IDS.ITEM_1}`)
        .send({ quantity: 100 });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            message: 'Invalid shoppingListId format. please provide a valid UUID',
          }),
        ]),
      );
    });

    it('should return 400 with message for invalid item id format', async () => {
      // Act
      const response = await request(app)
        .patch(`/shoppingLists/updateQuantity/${TEST_IDS.LIST_1}/${TEST_IDS.INVALID_ID}`)
        .send({ quantity: 100 });

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

    it('should return 404 when shoppingList has no items', async () => {
      // Act
      const response = await request(app)
        .patch(`/shoppingLists/updateQuantity/${TEST_IDS.LIST_1}/${TEST_IDS.ITEM_1}`)
        .send({ quantity: 100 });

      // Assert
      expect(response.status).toBe(404);
      expect(response.body.errors).toContain('ShoppingList has no Items');
    });

    it('should return 404 when shoppingList does not contain the specific item', async () => {
      // Arrange
      const newShoppingList = {
        name: 'shoppingList 1',
        description: 'Test Description 1',
        items: [{ id: TEST_IDS.ITEM_1 }],
      };
      const createdShoppingList = await request(app)
        .post('/shoppingLists')
        .send(newShoppingList)
        .set('Accept', 'application/json');

      // Act
      const response = await request(app)
        .patch(`/shoppingLists/updateQuantity/${createdShoppingList.body.id}/${TEST_IDS.ITEM_2}`)
        .send({ quantity: 100 });

      // Assert
      expect(response.status).toBe(404);
      expect(response.body.errors).toContain('Item not found in the ShoppingList');
    });
  });

  // Freestyle task #1
  describe('GET /shoppingLists/search/favorites', () => {
    it('should return 200 with all favorite shoppingLists', async () => {
      // Arrange
      await shoppingListRepository.setFavorite(TEST_IDS.LIST_1, true);

      // Act
      const response = await request(app).get('/shoppingLists/search/favorites');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should return 200 and an empty array without a favorite shoppingList', async () => {
      // Act
      const response = await request(app).get('/shoppingLists/search/favorites');

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });

  // Freestyle task #1
  describe('PUT /shoppingLists/:shoppingListId/favorites', () => {
    it('should return 200 and update the favorite status of the shoppingList', async () => {
      // Arrange
      const shoppingListBeforeUpdate = await request(app).get(`/shoppingLists/${TEST_IDS.LIST_1}`);

      // Act
      const response = await request(app)
        .put(`/shoppingLists/${TEST_IDS.LIST_1}/favorites`)
        .send({ isFavorite: true })
        .set('Accept', 'application/json');
      const shoppingListAfterUpdate = await request(app).get(`/shoppingLists/${TEST_IDS.LIST_1}`);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body.id).toBe(TEST_IDS.LIST_1);
      expect(response.body.isFavorite).toBe(true);
      expect(shoppingListBeforeUpdate.body.isFavorite).toBe(false);
      expect(shoppingListAfterUpdate.body.isFavorite).toBe(true);
    });

    it('should return 400 with message for invalid shoppingList id format', async () => {
      // Act
      const response = await request(app)
        .put(`/shoppingLists/${TEST_IDS.INVALID_ID}/favorites`)
        .send({ isFavorite: true })
        .set('Accept', 'application/json');

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            message: 'Invalid shoppingListId format. please provide a valid UUID',
          }),
        ]),
      );
    });

    it('should return 404 with message for non-existent shoppingList', async () => {
      // Act
      const response = await request(app)
        .put(`/shoppingLists/${TEST_IDS.NON_EXISTENT_SHOPPINGLIST}/favorites`)
        .send({ isFavorite: true })
        .set('Accept', 'application/json');

      // Assert
      expect(response.status).toBe(404);
      expect(response.body.errors).toContain('ShoppingList not found');
    });

    it('should return 400 with non-boolean favorite status', async () => {
      // Act
      const response = await request(app)
        .put(`/shoppingLists/${TEST_IDS.LIST_1}/favorites`)
        .send({ isFavorite: 999 })
        .set('Accept', 'application/json');

      // Assert
      expect(response.status).toBe(400);
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            message: 'Expected boolean, received number',
          }),
        ]),
      );
    });
  });
});
