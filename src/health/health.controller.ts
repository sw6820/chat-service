import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
  MemoryHealthIndicator,
} from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private memory: MemoryHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  async check() {
    return this.health.check([
      // Database health - Essential for user data and chat history
      () => this.db.pingCheck('database'),

      // Memory usage check - Important for WebSocket connections
      () => this.memory.checkHeap('memory_heap', 200 * 1024 * 1024), // Heap < 200MB

      // Application health - Checks if the NestJS app is responsive
      async () => {
        const startTime = Date.now();
        return {
          app: {
            status: 'up',
            responseTime: `${Date.now() - startTime}ms`,
          }
        };
      },
    ]);
  }

  @Get('detailed')
  @HealthCheck()
  async detailedCheck() {
    const startTime = Date.now();
    const result = await this.check();
    return {
      ...result,
      meta: {
        uptime: process.uptime(),
        responseTime: `${Date.now() - startTime}ms`,
        nodeVersion: process.version,
        memoryUsage: process.memoryUsage(),
      }
    };
  }
}