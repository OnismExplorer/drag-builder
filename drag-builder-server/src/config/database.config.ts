import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ProjectEntity } from '@modules/project';
import { UserEntity } from '@modules/auth';

export default registerAs(
  'database',
  (): TypeOrmModuleOptions => ({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME,
    password: String(process.env.DB_PASSWORD || ''),
    database: process.env.DB_DATABASE || 'drag_builder',
    entities: [ProjectEntity, UserEntity],
    synchronize: process.env.NODE_ENV === 'development',
    logging: process.env.NODE_ENV === 'development',
  })
);
