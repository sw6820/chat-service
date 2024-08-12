// prod.ts
import { Config } from '../types/config.types';

const prodConfig: Config = {
  logLevel: 'error',
  dbInfo: 'http://prod-mysql:3306',
};

export default prodConfig;
