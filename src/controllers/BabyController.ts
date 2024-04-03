import { Request } from 'express';
import { inject, injectable } from 'inversify';

import { ContextRequest, Controller, GET, Middleware } from '../../libs';
import { loggerA, loggerB, loggerC } from '../middlewares';
import { Baby } from '../models/Baby';
import { BabyService } from '../services';

@Controller('/baby')
@injectable()
export class BabyController {

  @inject('BabyService')
  babySv!: BabyService;

  @GET('/v1/list')
  @Middleware(loggerA)
  async getAllBaby(
    @ContextRequest req: Request,
  ): Promise<{ message: string }> {
    return { message: req.body };
  }

  @GET('/v2/list')
  @Middleware([loggerB, loggerC])
  getAllBabyV2(): Baby[] {
    return [{ id: 1, }, { id: 2, }, { id: 3, }]
  }
}