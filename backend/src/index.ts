import { DI, initializeDependencyInjection } from './dependency-injection';

initializeDependencyInjection();

try {
  DI.server.start();
} catch (error) {
  console.error(error);
  process.exit(1);
}
