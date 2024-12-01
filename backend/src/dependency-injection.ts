import { App } from './app';
import { ENV } from './config/env.config';
import { Database, db } from './db/db';
import { Server } from './server';

import { HealthController } from './controller/health.controller';
import { ItemController } from './controller/item.controller';
import { ShoppingListController } from './controller/shoppingList.controller';

import { ItemRepository } from './db/repository/item.repository';
import { ShoppingListRepository } from './db/repository/shoppingList.repository';
import { ShoppingListItemRepository } from './db/repository/shoppingListItem.repository';
import { Routes } from './routes/routes';

export const DI = {} as {
  app: App;
  db: Database;
  server: Server;
  routes: Routes;
  repositories: {
    item: ItemRepository;
    shoppingList: ShoppingListRepository;
    shoppingListItem: ShoppingListItemRepository;
  };
  controllers: {
    health: HealthController;
    item: ItemController;
    shoppingList: ShoppingListController;
  };
};

export function initializeDependencyInjection() {
  // Initialize database
  DI.db = db;

  // Initialize repositories
  DI.repositories = {
    item: new ItemRepository(DI.db),
    shoppingList: new ShoppingListRepository(DI.db),
    shoppingListItem: new ShoppingListItemRepository(DI.db),
  };

  // Initialize controllers
  DI.controllers = {
    health: new HealthController(),
    item: new ItemController(DI.repositories.item, DI.repositories.shoppingListItem),
    shoppingList: new ShoppingListController(
      DI.repositories.shoppingList,
      DI.repositories.item,
      DI.repositories.shoppingListItem,
    ),
  };

  // Initialize routes
  DI.routes = new Routes(DI.controllers.health, DI.controllers.item, DI.controllers.shoppingList);

  // Initialize app
  DI.app = new App(DI.routes);
  DI.server = new Server(DI.app, ENV);
}
