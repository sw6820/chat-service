import { readFileSync } from 'fs';
import * as yaml from 'js-yaml';
import * as dotenv from 'dotenv';
import common from './common';
import dev from './dev';
import local from './local';
import prod from './prod';
import { Config } from '../types/config.types';

const phase = process.env.NODE_ENV as 'local' | 'dev' | 'prod';
// console.log(`Phase: ${phase}`);

dotenv.config({ path: `./envs/.env.${phase}` });

const YAML_CONFIG_FILENAME = 'config.yaml';

const configs: Record<'local' | 'dev' | 'prod', Config> = {
  local: local,
  dev: dev,
  prod: prod,
};

const conf: any = configs[phase] || {};

// Read and preprocess the YAML file to replace environment variables
const yamlContent = readFileSync(
  `${process.cwd()}/envs/${YAML_CONFIG_FILENAME}`,
  'utf8',
);
const yamlWithEnv = yamlContent.replace(
  /\${(\w+)}/g,
  (_, variable) => process.env[variable] || '',
);

const yamlConfig: Record<string, any> = yaml.load(yamlWithEnv);

// const yamlConfig: Record<string, any> = yaml.load(
//   readFileSync(`${process.cwd()}/envs/${YAML_CONFIG_FILENAME}`, 'utf8'),
// );
// console.log(`yaml : ${JSON.stringify(yamlConfig)}`);

export default () => ({
  ...common, // ./common.ts
  // ...conf, // ./${}.ts
  ...yamlConfig, // ./envs/config.yaml
});
