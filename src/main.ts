import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ArgumentsHost, ExceptionFilter, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import session from 'express-session';
// import passport from 'passport';
import { ConfigService } from '@nestjs/config';
// import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import compression from 'compression';
// import logger from './logger/logger';
import {
  WinstonModule,
  utilities as nestWinstonModuleUtilities,
} from 'nest-winston';
import winston from 'winston';
import { Logger } from '@nestjs/common';
import passport from 'passport';
import { IoAdapter } from '@nestjs/platform-socket.io';
import * as fs from 'node:fs';
import * as path from 'node:path';

async function bootstrap() {
  const nodeEnv = process.env.NODE_ENV || 'local';
  const envPath =
    nodeEnv === 'prod'
      ? '/app/chat-service/envs/.env.prod'
      : path.resolve(process.cwd(), `envs/.env.${nodeEnv}`);
  console.log(`nodeEnv: ${nodeEnv}`);
  console.log(`envPath : ${envPath}`);
  if (!fs.existsSync(envPath)) {
    console.error(`Environment file not found at ${envPath}`);
    process.exit(1);
  }
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    // logger: WinstonModule.createLogger({
    //   transports: [
    //     new winston.transports.Console({
    //       format: winston.format.combine(
    //         winston.format.timestamp(),
    //         nestWinstonModuleUtilities.format.nestLike('ChatService', {
    //           prettyPrint: true,
    //         }),
    //       ),
    //     }),
    //     new winston.transports.File({
    //       filename: 'combined.log',
    //       format: winston.format.combine(
    //         winston.format.timestamp(),
    //         winston.format.json(),
    //       ),
    //     }),
    //     new winston.transports.File({
    //       filename: 'errors.log',
    //       level: 'error',
    //       format: winston.format.combine(
    //         winston.format.timestamp(),
    //         winston.format.json(),
    //       ),
    //     }),
    //   ],
    // }),
  });
  app.useWebSocketAdapter(new IoAdapter(app));

  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');
  // Retrieve environment-specific settings
  // console.log(`jwt secret : ${configService.get('JWT_SECRET')}`);
  // const secretKey = 'secretKey'; //configService.get('SECRET_KEY');
  // const jwtSecret = configService.get<string>('JWT_SECRET');
  const jwtSecret = 'eTl2a14AzJUOfjxi9C3RTglKk0ijdecVJ9a5ZIwsfoo=';
  console.log(`main jwt secret : ${jwtSecret}`);
  console.log(`JWT Secret: ${jwtSecret ? 'Set' : 'Not set'}`);
  // if (!jwtSecret) {
  //   throw new Error('JWT_SECRET is not set in the environment variables');
  // }
  if (!jwtSecret) {
    logger.error('JWT_SECRET is not set in the environment variables');
    process.exit(1);
  } else {
    logger.log(`JWT_SECRET is set (length: ${jwtSecret.length})`);
  }
  const port = 3000; // parseInt(configService.get<string>('SERVER_PORT'), 10);
  console.log(`port -----> ${port}`);
  const environment = configService.get<string>('NODE_ENV');
  // consol
  console.log(`node env : ${environment}`);
  // const corsOrigin =
  //   environment === 'prod'
  //     ? 'https://1479d390.chat-service-frontend.pages.dev/'
  //     : [
  //         'http://localhost:3000',
  //         'http://localhost:8080',
  //         'http://127.0.0.1:8080',
  //       ]; //configService.get<string>('CORS_ORIGIN');

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
        7;
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
  console.log(`cors origin ${configService.get<string>('CORS_ORIGIN')}`);
  app.enableCors({
    origin: `${configService.get<string>('CORS_ORIGIN')}`, // '*', // Array.isArray(corsOrigin) ? corsOrigin : corsOrigin.split(','),
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Session management
  app.use(
    session({
      secret: `${jwtSecret}`,
      resave: false,
      saveUninitialized: false,
      cookie: { maxAge: 1000 * 60 * 60 * 24 * 7 }, // 7 days
    }),
  );
  // Initialize Passport.js
  app.use(passport.initialize());
  app.use(passport.session());

  app.useGlobalFilters(new GlobalExceptionFilter());

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
  console.log(`Application is running on: ${await app.getUrl()}`);
  console.log(`start server port : ${port}`);
}
bootstrap();

class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('GlobalExceptionFilter');

  catch(exception: any, host: ArgumentsHost) {
    this.logger.error(
      `Unhandled exception: ${exception.message}`,
      exception.stack,
    );
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    response.status(500).json({
      statusCode: 500,
      message: 'Internal server error',
    });
  }
}
