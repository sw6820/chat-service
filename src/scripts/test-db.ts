import { createConnection } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), 'envs/.env.local') });

async function testConnection() {
  try {
    const connection = await createConnection({
      type: 'postgres',
      host: process.env.DATABASE_HOST,
      port: parseInt(process.env.DATABASE_PORT),
      username: process.env.DATABASE_USERNAME,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
    });

    console.log('Successfully connected to database!');
    // List all tables
    const tables = await connection.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('\nExisting tables:');
    console.table(tables);

    await connection.close();
  } catch (error) {
    console.error('Failed to connect to database:', error);
  }
}

testConnection();
