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

// console.log(`process : ${JSON.stringify(process)}`);
// console.log('env : ' + process.env.NODE_ENV);
// console.log('current working directory : ' + process.cwd());
// console.log(`env : ${process.cwd()}/envs/.env.${process.env.NODE_ENV}`);
// console.log(`dir: ${__dirname}`);
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `${process.cwd()}/envs/.env.${process.env.NODE_ENV}`,
      load: [configuration],
      cache: true,
      expandVariables: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres', //configService.get('DATABASE_TYPE'),
        host: configService.get('DATABASE_HOST'),
        port: configService.get('DATABASE_PORT'),
        username: configService.get('DATABASE_USERNAME'),
        password: configService.get('DATABASE_PASSWORD'),
        database: configService.get('DATABASE_NAME'),
        // ...configService.get('DATABASE_'),
        // host: '0.0.0.0',
        // port: 5432,
        // username: 'chatadmin',
        // password: '1234',
        // database: 'chatpostgres',
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: false, //configService.get('NODE_ENV') !== 'prod', // false in production
        connectTimeout: 30000,
      }),
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'frontend', 'public'),
    }),
    UsersModule,
    ChatModule,
    RoomModule,
    AuthModule,
  ],
  controllers: [AuthController, ChatController],
  providers: [AuthService, ChatService, JwtService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestLoggerMiddleware) // Apply the middleware
      .forRoutes('*'); // Apply to all routes
  }
}
