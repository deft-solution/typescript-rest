import 'reflect-metadata';
import './services';

import * as dotenv from 'dotenv';
import express, { Application } from 'express';
import morgan from 'morgan';
import * as path from 'path';

import { ErrorCode, HttpError, InternalServerError, NotFoundError, REST } from '../libs';
import controllers from './controllers';
import Authentications from './middlewares/Authentications';

class Server {
  private app: Application;

  public static bootstrap(): Server {
    return new Server();
  }

  constructor() {
    this.app = express();
    this._config();
  }

  private _config() {

    dotenv.config();

    // set port server
    this.app.set("port", process.env.PORT || 3000);

    // Morgan logging middleware
    this.app.use(morgan('dev'));

    // add static paths
    this.app.use(express.static(path.join(__dirname, "public")));

    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
  }

  private _routes() {
    REST.registerAuthorizationMiddleware(Authentications);
    REST.useIoC();
    REST.buildServices(this.app, '/api', ...controllers);
    this.handlerError();
  }

  private handlerError() {
    // catch 404 and forward to error handler
    this.app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
      const err = new NotFoundError("Not found");
      next(err);
    });

    // catch exceptions
    this.app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      // Handle known exceptions
      if (err instanceof HttpError) {
        const httpError = err as HttpError;
        res
          .status(httpError.statusCode)
          .json(httpError.toJSON());
        return;
      }
      // Handle uncaught or unknown exceptions
      if (err instanceof Error) {
        const error = new InternalServerError(`Uncaught Exception: ${err.message}`);
        res
          .status(ErrorCode.InternalServerError)
          .json(error.toJSON());
      }
      next(err);
    });
  }


  public start() {
    this.app.listen(this.app.get("port"), () => {
      this._routes();
      console.log(("App is running at http://localhost:%d in %s mode"), this.app.get("port"), this.app.get("env"));
      console.log("Press CTRL-C to stop\n");
    });
  }
}

const server = new Server();
server.start();