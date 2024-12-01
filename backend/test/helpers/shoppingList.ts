import { ShoppingListRepository } from '../../src/db/repository/shoppingList.repository';
import { Database } from '../../src/db/db';

export class ShoppingListTestHelper {
  private shoppingListRepository: ShoppingListRepository;

  constructor(database: Database) {
    this.shoppingListRepository = new ShoppingListRepository(database);
  }

  async createShoppingList(data: {
    id: string;
    name: string;
    description: string;
  }) {
    return this.shoppingListRepository.createShoppingList(data);
  }
}
