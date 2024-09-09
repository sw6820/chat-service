import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Inject, LoggerService } from '@nestjs/common';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, ip } = req;
    const userAgent = req.get('user-agent') || '';
    const startTime = Date.now();

    res.on('finish', () => {
      const { statusCode } = res;
      const duration = Date.now() - startTime;
      this.logger.log(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          method,
          url: originalUrl,
          statusCode,
          duration: `${duration}ms`,
          ip,
          userAgent,
        }),
        'HTTP',
      );
    });

    res.on('error', (err) => {
      // Log the error information
      this.logger.error(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          method,
          url: originalUrl,
          statusCode: res.statusCode,
          errorMessage: err.message,
          ip,
          userAgent,
        }),
        'HTTP Error',
      );
    });

    next();
  }
}
