import { Request, Response, Router } from 'express';
import { NextFunction } from 'express-serve-static-core';

import { ServiceContext } from './classes';
import { HttpMethod, ParamType } from './enums';
import { pathResolver } from './helpers';
import { ServiceClass, ServiceFactory, ServiceMethod } from './meta';

export class ServerContainer {
  static serverClasses: Map<string, ServiceClass> = new Map<string, ServiceClass>();
  static paths: Map<string, Set<HttpMethod>> = new Map<string, Set<HttpMethod>>();
  static pathsResolved: boolean = false;

  static serviceFactory: ServiceFactory = {
    create: (serviceClass: any) => {
      return new serviceClass();
    },
    getTargetClass: (serviceClass: Function) => {
      return <FunctionConstructor>serviceClass;
    }
  };

  static registerServiceClass(target: Function): ServiceClass {
    const name: string = target["name"] || target.constructor["name"];
    target = ServerContainer.serviceFactory.getTargetClass(target);

    if (!ServerContainer.serverClasses.has(name)) {
      ServerContainer.serverClasses.set(name, new ServiceClass(target));
    }

    const serviceClass: ServiceClass = ServerContainer.serverClasses.get(name) ?? new ServiceClass(target);
    return serviceClass;
  }

  router: Router;

  constructor(router: Router) {
    this.router = router;
  }

  buildServices(types: Array<Function>) {
    if (types) {
      types = types.map(type => ServerContainer.serviceFactory.getTargetClass(type));
    }
    ServerContainer.serverClasses.forEach(classData => {
      classData.methods.forEach(method => {
        if (this.validateTargetType(classData.targetClass, types)) {
          this.buildService(classData, method);
        }
      });
    });
    ServerContainer.pathsResolved = true;
  }

  async buildService(serviceClass: ServiceClass, serviceMethod: ServiceMethod) {
    const serviceObject = this.createService(serviceClass);
    const path = pathResolver(serviceClass.path ?? '', serviceMethod.path ?? '');
    serviceMethod.resolvedPath = path;

    const handler = async (request: Request, res: Response, next: NextFunction) => {
      try {
        const context = new ServiceContext({ request, response: res, next });
        const args = this._resolveParameter(serviceMethod, context) as any;
        const response = await serviceObject[serviceMethod.name](...args);
        return res.json(response);
      } catch (error) {
        next(error)
      }
    }
    this._registerRoute(serviceMethod, handler);
  }

  private _resolveParameter(serviceMethod: ServiceMethod, context: ServiceContext) {
    const parameters = [] as any;
    serviceMethod.parameters.forEach((param) => {
      switch (param.paramType) {
        case ParamType.context_request:
          parameters.push(context.request);
          break;
        case ParamType.context_response:
          parameters.push(context.response);
          break;
        case ParamType.context_next:
          parameters.push(context.next);
        case ParamType.body:
          parameters.push(context.request.body);
        case ParamType.context:
          parameters.push(context);
          break;
        default:
          throw new Error("HttpVerb is not supported!.");
      }
    });
    return parameters;
  }

  private _registerRoute(serviceMethod: ServiceMethod, handler: any) {
    const args = serviceMethod.middlewares.concat(handler);

    switch (serviceMethod.httpMethod) {
      case HttpMethod.GET:
        return this.router.get(serviceMethod.resolvedPath, [...args]);
      case HttpMethod.PUT:
        return this.router.put(serviceMethod.resolvedPath, [...args]);
      case HttpMethod.POST:
        return this.router.post(serviceMethod.resolvedPath, [...args]);
      case HttpMethod.PATCH:
        return this.router.patch(serviceMethod.resolvedPath, [...args]);
      case HttpMethod.DELETE:
        return this.router.delete(serviceMethod.resolvedPath, [...args]);

      default:
        throw new Error("HttpMethod is not supported!.");
    }
  }

  static registerServiceMethod(target: Function, methodName: string) {
    const classData: ServiceClass = ServerContainer.registerServiceClass(target);

    if (!classData.methods.has(methodName)) {
      classData.methods.set(methodName, new ServiceMethod());
    }
    const serviceMethod: ServiceMethod = classData.methods.get(methodName) ?? new ServiceMethod();
    return serviceMethod;
  }


  private createService(serviceClass: ServiceClass) {
    const serviceObject = ServerContainer.serviceFactory.create(serviceClass.targetClass);
    return serviceObject;
  }

  private validateTargetType(targetClass: Function, types: Array<Function>): boolean {
    if (types && types.length > 0) {
      return (types.indexOf(targetClass) > -1);
    }
    return true;
  }
}