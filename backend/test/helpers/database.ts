import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';

import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';

import { Database } from '../../src/db/db';
import { databaseSchema } from '../../src/db/schema';
import { shoppingList } from '../../src/db/schema/shoppingList.schema';
import { shoppingListItem } from '../../src/db/schema/shoppingListItem.schema';
import { item } from '../../src/db/schema/item.schema';

export class TestDatabase {
  public database!: Database;
  private container!: StartedPostgreSqlContainer;

  async setup() {
    this.container = await new PostgreSqlContainer().start();
    this.database = drizzle({
      connection: this.container.getConnectionUri(),
      schema: databaseSchema,
      casing: 'snake_case',
    });
    await migrate(this.database, {
      migrationsFolder: './src/db/migrations',
    });
  }

  async teardown() {
    await (this.database.$client as { end: () => Promise<void> }).end();
    await this.container.stop();
  }

  async clear() {
    await this.database.delete(shoppingListItem).execute();
    await this.database.delete(shoppingList).execute();
    await this.database.delete(item).execute();
  }
}
