import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';

/**
 * 健康检查模块
 * 需求：非功能性需求
 */
@Module({
  controllers: [HealthController],
})
export class HealthModule {}
