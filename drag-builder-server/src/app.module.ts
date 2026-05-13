import { Module } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ProjectModule } from './modules/project';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import githubConfig from './config/github.config';

/**
 * 应用根模块
 * 注册全局配置模块和数据库连接
 */
@Module({
  imports: [
    // 加载 .env 文件中的环境变量，设置为全局可用
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, jwtConfig, githubConfig],
      envFilePath: '.env',
    }),

    // 注册 TypeORM 数据库连接，使用 databaseConfig 配置
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        configService.getOrThrow<TypeOrmModuleOptions>('database'), // 获取刚才注册的 'database' 配置
    }),

    ProjectModule,

    HealthModule,

    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
