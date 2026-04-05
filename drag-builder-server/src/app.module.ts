import { Module } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ProjectModule } from './modules/project';
import { HealthModule } from './modules/health/health.module';
import databaseConfig from './config/database.config';

/**
 * 应用根模块
 * 注册全局配置模块和数据库连接
 */
@Module({
  imports: [
    // 加载 .env 文件中的环境变量，设置为全局可用
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig], // 加载配置文件
      envFilePath: '.env',
    }),

    // 注册 TypeORM 数据库连接，使用 databaseConfig 配置
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        configService.getOrThrow<TypeOrmModuleOptions>('database'), // 获取刚才注册的 'database' 配置
    }),

    // 注册项目模块
    ProjectModule,

    // 注册健康检查模块
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
