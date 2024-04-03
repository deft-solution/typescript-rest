import { REST } from '../../libs';
import { BabyService, BabyServiceImpl } from './BabyService';

REST.register("BabyService", BabyServiceImpl);

export {
  BabyServiceImpl,
  BabyService,
};