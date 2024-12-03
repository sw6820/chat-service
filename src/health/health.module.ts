import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HttpModule } from '@nestjs/axios';
import { HttpHealthIndicator } from '@nestjs/terminus';

@Module({
  imports: [HttpModule],
  controllers: [HealthController],
  providers: [HttpHealthIndicator],
})
export class HealthModule {} 