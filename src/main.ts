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
import express from 'express';

async function bootstrap() {
  const nodeEnv = process.env.NODE_ENV || 'local';
  const envPath = path.resolve(process.cwd(), `envs/.env.${nodeEnv}`);
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
  const jwtSecret = configService.get<string>('JWT_SECRET');
  // console.log(`main jwt secret : ${jwtSecret}`);
  console.log(`JWT Secret: ${jwtSecret ? 'Set' : 'Not set'}`);
  
  if (!jwtSecret) {
    logger.error('JWT_SECRET is not set in the environment variables');
    process.exit(1);
  } else {
    logger.log(`JWT_SECRET is set (length: ${jwtSecret.length})`);
  }
  const port = parseInt(configService.get<string>('SERVER_PORT'), 10);
  console.log(`port -----> ${port}`);
  const environment = configService.get<string>('NODE_ENV');
  // consol
  console.log(`node env : ${environment}`);
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
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "wss:", "https:"],
      },
    },
    crossOriginEmbedderPolicy: false,
  }));

  // Performance Optimization
  app.use(compression());

  // CORS configuration with dynamic origin handling
  app.enableCors({
    origin: [
      'https://chat-service-frontend.pages.dev',
      'https://*.chat-service-frontend.pages.dev',
      'http://localhost:3000',
      'http://localhost:8080',
      '*',
    ],
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization'],
    exposedHeaders: ['Authorization', 'Set-Cookie'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });
  // app.use(cors());

  // Trust proxy (Cloudflare)
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('trust proxy', true);

  // Block access to sensitive files
  app.use((req, res, next) => {
    const blockedPaths = ['.env', '.git', '.aws', 'config', '.config'];
    if (blockedPaths.some(path => req.path.toLowerCase().includes(path))) {
      res.status(403).send('Forbidden');
      return;
    }
    next();
  });

  // Root path and health check handlers (before global prefix)
  const router = express.Router();
  router.get('/', (req, res) => {
    res.json({
      status: 'ok',
      message: 'Chat Service API is running',
      docs: '/docs',
    });
  });

  router.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });
  expressApp.use(router);

  // Remove global prefix - all routes will be accessible directly
  // app.setGlobalPrefix('api', {
  //   exclude: ['/', '/health'],
  // });

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

  // app.useGlobalFilters(new GlobalExceptionFilter());

  // Swagger setup (conditionally enable in non-production environments)
  if (environment !== 'prod') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Users API')
      .setDescription('This is a REST API')
      .setVersion('1.0')
      .addTag('tag')
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document);
  }

  // Serve static assets
  // app.useStaticAssets(join(__dirname, '..', 'frontend', 'public'));

  // Add global prefix if running as the secondary service
  if (process.env.SERVICE_TYPE === 'newnest') {
    app.setGlobalPrefix('newnest');
  }

  // Start the server
  const portToUse = configService.get('SERVER_PORT') || 3000;
  await app.listen(portToUse, '0.0.0.0');  // Listen on all network interfaces
  console.log(`Application is running on: ${await app.getUrl()}`);
  console.log(`start server port : ${portToUse}`);
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
