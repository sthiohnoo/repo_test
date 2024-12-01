import express, { Application } from 'express';
import { Routes } from './routes/routes';
import helmet from 'helmet';
import { globalErrorHandler } from './utils/global-error';

export class App {
  private app: Application;

  constructor(private readonly routes: Routes) {
    this.app = express();
    this._registerMiddlewares();
    this._registerRoutes();
    this._registerErrorHandlers();
  }

  public listen(port: number, callback: () => void) {
    return this.app.listen(port, callback);
  }

  private _registerMiddlewares() {
    this.app.use(helmet());
    this.app.use(express.json());

    this.app.use((req, _res, next) => {
      console.info(`New request to ${req.path}`);
      next();
    });
  }

  private _registerRoutes() {
    this.app.use('/api', this.routes.getRouter());
  }

  private _registerErrorHandlers() {
    // The errorHandler could also be injected via constructor which would be even better and easily testable
    this.app.use(globalErrorHandler);
  }
}
