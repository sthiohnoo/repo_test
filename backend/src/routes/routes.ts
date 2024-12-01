import { Router } from 'express';

import { HealthController } from '../controller/health.controller';
import { ItemController } from '../controller/item.controller';
import { ShoppingListController } from '../controller/shoppingList.controller';

export class Routes {
  private router: Router;

  constructor(
    private readonly healthController: HealthController,
    private readonly itemController: ItemController,
    private readonly shoppingListController: ShoppingListController,
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  public getRouter(): Router {
    return this.router;
  }

  /**
   * Initializes the routes for the application.
   * ?.bind(this.authController.) ensures that 'this' inside the controller method refers to the controller instance rather than Express's context
   */
  private initializeRoutes(): void {
    // Health routes
    this.router.get('/health', this.healthController.getHealthStatus.bind(this.healthController));

    // Item routes
    this.router.get('/items', this.itemController.getItems.bind(this.itemController));
    this.router.get('/items/:itemId', this.itemController.getItemById.bind(this.itemController));
    this.router.get(
      '/items/name/:itemName',
      this.itemController.getItemByName.bind(this.itemController),
    );
    this.router.post('/items', this.itemController.createItem.bind(this.itemController));
    this.router.put('/items/:itemId', this.itemController.updateItemById.bind(this.itemController));
    this.router.delete(
      '/items/:itemId',
      this.itemController.deleteItemById.bind(this.itemController),
    );

    // Shopping list routes
    this.router.get(
      '/shoppingLists',
      this.shoppingListController.getShoppingLists.bind(this.shoppingListController),
    );
    this.router.get(
      //need to be defined before /shoppingLists/:shoppingListId
      '/shoppingLists/search',
      this.shoppingListController.searchShoppingListsWithNameOrDescription.bind(
        this.shoppingListController,
      ),
    );
    this.router.get(
      '/shoppingLists/:shoppingListId',
      this.shoppingListController.getShoppingListById.bind(this.shoppingListController),
    );
    this.router.get(
      '/shoppingLists/items/:itemId',
      this.shoppingListController.getShoppingListsWithSearchingItemById.bind(
        this.shoppingListController,
      ),
    );
    this.router.post(
      '/shoppingLists',
      this.shoppingListController.createShoppingList.bind(this.shoppingListController),
    );
    this.router.put(
      '/shoppingLists/:shoppingListId',
      this.shoppingListController.updateShoppingListById.bind(this.shoppingListController),
    );
    this.router.put(
      '/shoppingLists/:shoppingListId/items/:itemId',
      this.shoppingListController.addItemToList.bind(this.shoppingListController),
    );
    this.router.patch(
      '/shoppingLists/toggle/:shoppingListId/:itemId',
      this.shoppingListController.toggleIsPurchased.bind(this.shoppingListController),
    );
    this.router.patch(
      '/shoppingLists/updateQuantity/:shoppingListId/:itemId',
      this.shoppingListController.updateQuantity.bind(this.shoppingListController),
    );
    this.router.delete(
      '/shoppingLists/:shoppingListId/items/:itemId',
      this.shoppingListController.deleteItemInListById.bind(this.shoppingListController),
    );
    this.router.delete(
      '/shoppingLists/:shoppingListId',
      this.shoppingListController.deleteShoppingListById.bind(this.shoppingListController),
    );

    //Freestyle task #1
    this.router.get(
      '/shoppingLists/search/favorites',
      this.shoppingListController.getAllFavoriteShoppingLists.bind(this.shoppingListController),
    );
    //Freestyle task #1
    this.router.put(
      '/shoppingLists/:shoppingListId/favorites',
      this.shoppingListController.updateFavoriteStatus.bind(this.shoppingListController),
    );
  }
}
