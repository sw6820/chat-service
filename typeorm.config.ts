const { DataSource } = require('typeorm');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), 'envs/.env.local') });

module.exports = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT),
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  entities: ["dist/**/entities/*.entity{.ts,.js}"],
  // migrations: ['src/migrations/*.ts'],
  synchronize: false,
});
