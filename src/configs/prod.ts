import { Config } from '../types/config.types';

const prodConfig: Config = {
  // http: {
  //   host: process.env.SERVER_DOMAIN || 'your-production-domain.com',
  //   port: parseInt(process.env.SERVER_PORT, 10) || 3000,
  // },
  // db: {
  //   postgres: {
  //     url: process.env.DATABASE_HOST || 'your-production-db-host',
  //     port: parseInt(process.env.DATABASE_PORT, 10) || 5432,
  //     database: process.env.DATABASE_NAME || 'chatpostgres',
  //     username: process.env.DATABASE_USERNAME || 'chatadmin',
  //     password: process.env.DATABASE_PASSWORD || 'your-production-password',
  //   },
  // redis: {
  //   host: process.env.REDIS_HOST || 'your-production-redis-host',
  //   port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  // },
  // },
  // github: {
  //   clientId: process.env.GITHUB_CLIENT_ID || 'your-production-github-client-id',
  //   clientSecret: process.env.GITHUB_CLIENT_SECRET || 'your-production-github-client-secret',
  // },
  // jwt: {
  //   secret: process.env.JWT_SECRET || 'your-production-jwt-secret',
  // },
  // secretKey: process.env.SECRET_KEY || 'your-production-secret-key',
};

export default prodConfig;
