import * as http from 'http';

import { App } from './app';
import { EnvType } from './config/env.config';

export class Server {
  constructor(
    private readonly _app: App,
    private readonly _config: EnvType,
  ) {}

  start = async () => {
    const server = this._app.listen(this._config.PORT, () => {
      console.info(`Listening to port ${this._config.PORT}`);
    });

    this._handleUnexpectedErrors(server);
    this._handleSigterm(server);
  };

  private _handleExit = (server: http.Server) => {
    if (server) {
      server.close(() => {
        console.info('Server closed');
        process.exit(1);
      });
    } else {
      process.exit(1);
    }
  };

  private _handleUnexpectedErrors = (server: http.Server) => {
    /**
     * @param error - an unexpected error to handle
     */
    const handler = (error: unknown) => {
      console.error(error);
      this._handleExit(server);
    };

    process.on('uncaughtException', handler);
    process.on('unhandledRejection', handler);
  };

  private _handleSigterm = (server: http.Server) => {
    process.on('SIGTERM', () => {
      console.info('SIGTERM received');
      if (server) {
        server.close();
      }
    });
  };
}
