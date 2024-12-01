import { ItemRepository } from '../../src/db/repository/item.repository';
import { Database } from '../../src/db/db';

export class ItemTestHelper {
  private itemRepository: ItemRepository;

  constructor(database: Database) {
    this.itemRepository = new ItemRepository(database);
  }

  async createItem(
    data: {
      id: string;
      name: string;
      description: string;
    }[],
  ) {
    return this.itemRepository.createItems(data);
  }
}
