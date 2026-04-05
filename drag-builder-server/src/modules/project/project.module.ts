import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectEntity } from './project.entity';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';

/**
 * ProjectModule - 项目功能模块
 * 注册 ProjectEntity、ProjectService 和 ProjectController
 *
 * 需求：11.1
 */
@Module({
  imports: [
    // 注册 ProjectEntity，使 Repository 可注入
    TypeOrmModule.forFeature([ProjectEntity]),
  ],
  controllers: [ProjectController],
  providers: [ProjectService],
  exports: [ProjectService],
})
export class ProjectModule {}
