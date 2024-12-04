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
import { join } from 'path';
import { RequestLoggerMiddleware } from './logger/request-logger.middleware';
import { WinstonModule } from 'nest-winston';
import * as path from 'node:path';
import { HealthController } from './health/health.controller';
import { TerminusModule } from '@nestjs/terminus';
import { HttpModule } from '@nestjs/axios';
import * as winston from 'winston';

console.log('env : ' + process.env.NODE_ENV);
console.log('current working directory : ' + process.cwd());
console.log(`env : ${process.cwd()}/envs/.env.${process.env.NODE_ENV}`);

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
      envFilePath: path.resolve(
        process.cwd(),
        `envs/.env.${process.env.NODE_ENV || 'local'}`,
      ),
      cache: true,
      expandVariables: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST', 'localhost'),
        port: configService.get('DATABASE_PORT', 5432),
        username: configService.get('DATABASE_USERNAME'),
        password: configService.get('DATABASE_PASSWORD'),
        database: configService.get('DATABASE_NAME'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: false, // configService.get('NODE_ENV') === 'local',
        logging: configService.get('NODE_ENV') === 'local',
      }),
      inject: [ConfigService],
    }),
    TerminusModule,
    HttpModule,
    UsersModule,
    ChatModule,
    RoomModule,
    AuthModule,
    WinstonModule.forRoot({
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({
          dirname: path.join(__dirname, '../logs'),
          filename: 'error.log',
          level: 'error',
        }),
        new winston.transports.File({
          dirname: path.join(__dirname, '../logs'),
          filename: 'combined.log',
        }),
      ],
    }),
  ],
  controllers: [AuthController, ChatController, HealthController],
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
