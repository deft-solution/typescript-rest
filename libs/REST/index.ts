import { Router } from 'express';

import { container } from '../inversify/container';
import { ServiceFactory } from '../meta';
import { ServerContainer } from '../Server';

export class REST {

  static register<T>(name: string, serviceImpl: any) {
    container.bind<T>(name).to(serviceImpl);
  }

  /**
   * Create the routes for all classes decorated with our decorators
   */
  static buildServices(router: Router, ...types: any[]) {
    const iternalRESTFul: ServerContainer = new ServerContainer(router);
    iternalRESTFul.buildServices(types);
  }

  /**
   * Register a custom serviceFactory. It will be used to instantiate the service Objects
   * If You plan to use a custom serviceFactory, You must ensure to call this method before any typescript-rest service declaration.
   */
  static registerServiceFactory(serviceFactory: ServiceFactory) {
    ServerContainer.serviceFactory = serviceFactory;
  }

  /**
   * Configure the RESTFul to use [typescript-ioc](https://github.com/thiagobustamante/typescript-ioc)
   * to instantiate the service objects.
   * If You plan to use IoC, You must ensure to call this method before any typescript-rest service declaration.
   */
  static useIoC() {
    REST.registerServiceFactory({
      create: (serviceClass) => {
        return container.get(serviceClass.name);
      },
      getTargetClass: (serviceClass: Function) => {
        return <FunctionConstructor>serviceClass;
      }
    });
  }
}