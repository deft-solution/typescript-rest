import { REST } from '../../libs';
import { BabyController } from './BabyController';
import { WarriorController } from './WarriorController';

REST.register('BabyController', BabyController);
REST.register('WarriorController', WarriorController);

export default [
  BabyController,
  WarriorController,
]