import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { User } from '../src/users/entities/user.entity';
import { Room } from '../src/room/entities/room.entity';
import { Message } from '../src/chat/entities/message.entity';
import { UserRoom } from '../src/chat/entities/user-room.entity';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), `envs/.env.${process.env.NODE_ENV}`) });

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT) || 5432,
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  // entities: [User, Room, Message, UserRoom],
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../migrations/*{.ts,.js}'],

  synchronize: false,
  logging: true,
});

AppDataSource.initialize()
  .then(() => {
    console.log('Data Source has been initialized!');
    // Create tables if they don't exist
    return AppDataSource.synchronize();
  })
  .then(() => {
    console.log('Tables have been synchronized!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error during Data Source initialization:', err);
    process.exit(1);
  });
