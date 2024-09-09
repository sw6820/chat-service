import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import passport from 'passport';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import * as compression from 'compression';
import logger from './logger/logger';
import {
  WinstonModule,
  utilities as nestWinstonModuleUtilities,
} from 'nest-winston';
import winston from 'winston';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: WinstonModule.createLogger({
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            nestWinstonModuleUtilities.format.nestLike('ChatService', {
              prettyPrint: true,
            }),
          ),
        }),
        new winston.transports.File({
          filename: 'combined.log',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
        }),
        new winston.transports.File({
          filename: 'errors.log',
          level: 'error',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
        }),
      ],
    }),
  });
  const configService = app.get(ConfigService);

  // Retrieve environment-specific settings
  const secretKey = configService.get<string>('SECRET_KEY');
  const port = configService.get<string>('SERVER_PORT');
  const environment = configService.get<string>('NODE_ENV');
  const corsOrigin = configService.get<string>('CORS_ORIGIN');

  const rateLimiter = new RateLimiterMemory({
    points: 5, // Number of points
    duration: 1, // Per second
  });

  app.use((req, res, next) => {
    rateLimiter
      .consume(req.ip)
      .then(() => {
        next();
      })
      .catch(() => {
        res.status(429).send('Too Many Requests');
      });
  });

  // Global validation pipes
  app.useGlobalPipes(new ValidationPipe());

  // Cookie parser middleware
  app.use(cookieParser());

  // Security Enhanced Middleware
  app.use(helmet());

  // Performance Optimization
  app.use(compression());

  // Enable CORS for the specified origin or allow multiple origins based on your needs
  app.enableCors({
    origin: corsOrigin.split(','),
    credentials: true,
  });

  // Session management
  app.use(
    session({
      secret: secretKey,
      resave: false,
      saveUninitialized: false,
      cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 }, // 7 days
    }),
  );

  // Initialize Passport.js
  app.use(passport.initialize());
  app.use(passport.session());

  // Swagger setup (conditionally enable in non-production environments)
  if (environment !== 'prod') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Users API')
      .setDescription('This is a REST API')
      .setVersion('1.0')
      .addTag('tag')
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api', app, document);
  }

  // Serve static assets
  // app.useStaticAssets(join(__dirname, '..', 'frontend', 'public'));

  // Start the server
  await app.listen(port);
}
bootstrap();
