import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import configuration from './configs/configuration';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth/auth.service';
import { AuthController } from './auth/auth.controller';
// import { ChatGateway } from './chat/gateways/chat.gateway';
import { ChatController } from './chat/chat.controller';
import { ChatService } from './chat/chat.service';
import { ChatModule } from './chat/chat.module';
import { RoomModule } from './room/room.module';
import { AuthModule } from './auth/auth.module';
import { JwtService } from '@nestjs/jwt';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { RequestLoggerMiddleware } from './logger/request-logger.middleware';
import { WinstonModule } from 'nest-winston';
import * as path from 'node:path';

console.log('env : ' + process.env.NODE_ENV);
console.log('current working directory : ' + process.cwd());
console.log(`env : ${process.cwd()}/envs/.env.${process.env.NODE_ENV}`);

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath:
        process.env.NODE_ENV === 'prod'
          ? '/app/chat-service/envs/.env.prod'
          : path.resolve(
              process.cwd(),
              `envs/.env.${process.env.NODE_ENV || 'local'}`,
            ),
      load: [configuration],
      cache: true,
      expandVariables: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],

      useFactory: (configService: ConfigService) => {
        const isProduction = configService.get('NODE_ENV') === 'prod';
        return {
          type: 'postgres', // configService.get<string>('DATABASE_TYPE'), // configService.get<'postgres' | 'mysql'>('DATABASE_TYPE'),
          // host: configService.get<string>('DATABASE_HOST'),
          port: parseInt(configService.get<string>('DATABASE_PORT'), 10),
          // host: 'localhost',
          // username: configService.get<string>('DATABASE_USERNAME'),
          // password: configService.get<string>('DATABASE_PASSWORD'),
          // database: configService.get<string>('DATABASE_NAME'),
          // ...configService.get('DATABASE_'),

          host:
            configService.get('NODE_ENV') === 'local'
              ? 'localhost'
              : '10.0.9.28',
          // port: 5432,
          username: `${configService.get<string>('DATABASE_USERNAME')}`,
          password: `${configService.get<string>('DATABASE_PASSWORD')}`,
          database: `${configService.get<string>('DATABASE_NAME')}`,
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize: false, //false, //configService.get('NODE_ENV') !== 'prod', // false in production
          connectTimeout: 30000,
          logging: !isProduction,
          logger: 'advanced-console',
          extra: {
            connectionLimit: 5,
          },
          ssl: isProduction ? { rejectUnauthorized: false } : false,
        };
      },
    }),
    WinstonModule.forRoot({}),
    UsersModule,
    ChatModule,
    RoomModule,
    AuthModule,
  ],
  controllers: [AuthController, ChatController],
  providers: [
    AuthService,
    ChatService,
    JwtService,
    {
      provide: 'NestWinston',
      useValue: WinstonModule.createLogger({
        // your winston configuration
      }),
    },
  ],
})
export class AppModule implements NestModule {
  constructor(private configService: ConfigService) {
    console.log('NODE_ENV:', this.configService.get<string>('NODE_ENV')); // Check environment
    console.log(
      `EC2 host, user, domain, port, application 
      ${this.configService.get<string>('EC2_HOST')}, 
      ${this.configService.get<string>('EC2_USER')}, 
      ${this.configService.get<string>('SERVER_DOMAIN')}, 
      ${this.configService.get<number>('SERVER_PORT')}`,
    );
    console.log(
      'JWT_SECRET in AppModule:',
      this.configService.get<string>('JWT_SECRET'),
    ); // Check JWT_SECRET
    console.log(
      'All env variables:',
      this.configService.get<Record<string, any>>(''),
    );
  }
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestLoggerMiddleware) // Apply the middleware
      .forRoutes('*'); // Apply to all routes
  }
}
