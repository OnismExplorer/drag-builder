import { Controller, Get } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

/**
 * 健康检查控制器
 * 提供服务状态和数据库连接检查接口
 * 需求：非功能性需求
 */
@Controller('api/health')
export class HealthController {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource
  ) {}

  /**
   * GET /api/health
   * 返回服务状态和数据库连接状态
   */
  @Get()
  async check() {
    // 检查数据库连接
    let dbStatus = 'ok';
    let dbMessage = '数据库连接正常';

    try {
      await this.dataSource.query('SELECT 1');
    } catch {
      dbStatus = 'error';
      dbMessage = '数据库连接失败';
    }

    const isHealthy = dbStatus === 'ok';

    return {
      status: isHealthy ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
      services: {
        database: {
          status: dbStatus,
          message: dbMessage,
        },
      },
    };
  }
}
