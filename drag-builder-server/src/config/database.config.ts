import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ProjectEntity } from '../modules/project';

/**
 * 数据库配置
 * 使用环境变量配置 TypeORM 连接参数
 * 开发环境启用 synchronize 和 logging，生产环境禁用
 *
 * 需求：12. 数据库配置
 */
export default registerAs(
  'database',
  (): TypeOrmModuleOptions => ({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME,
    password: String(process.env.DB_PASSWORD || ''), // 强制转字符串
    database: process.env.DB_DATABASE || 'drag_builder',
    entities: [ProjectEntity],
    synchronize: process.env.NODE_ENV === 'development',
    logging: process.env.NODE_ENV === 'development',
  })
);
