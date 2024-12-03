import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, HttpHealthIndicator } from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      // Basic HTTP check
      () => this.http.pingCheck('basic-check', 'http://localhost:3000'),
      
      // Memory health check
      // () => Promise.resolve({ memory: { status: 'up' } }),

      // You can add more health checks here
    ]);
  }
} 