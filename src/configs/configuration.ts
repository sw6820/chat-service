import { readFileSync } from 'fs';
import common from './common';
import dev from './dev';
import local from './local';
import prod from './prod';
import * as yaml from 'js-yaml';
import { Config } from '../types/config.types';

const phase = process.env.NODE_ENV as 'local' | 'dev' | 'prod';
const YAML_CONFIG_FILENAME = 'config.yaml';

const configs: Record<'local' | 'dev' | 'prod', Config> = {
  local: local,
  dev: dev,
  prod: prod,
};

const conf: any = configs[phase] || {};

const yamlConfig: Record<string, any> = yaml.load(
  readFileSync(`${process.cwd()}/envs/${YAML_CONFIG_FILENAME}`, 'utf8'),
);
// console.log(`yaml : ${JSON.stringify(yamlConfig)}`);

export default () => ({
  ...common,
  ...conf,
  ...yamlConfig,
});
