import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ProjectService, PaginatedResult } from './project.service';
import { CreateProjectDto, UpdateProjectDto } from './project.dto';
import { ProjectEntity } from './project.entity';

/**
 * ProjectController - 项目 REST API 控制器
 * 提供项目的增删改查接口
 *
 * 需求：11.1, 11.2, 11.8
 */
@Controller('api/projects')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  /**
   * POST /api/projects
   * 创建新项目
   * 返回 HTTP 201 Created
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createProjectDto: CreateProjectDto): Promise<ProjectEntity> {
    return this.projectService.create(createProjectDto);
  }

  /**
   * GET /api/projects
   * 获取项目列表，支持分页和搜索
   * 查询参数：page（页码）、limit（每页数量）、search（搜索关键词）
   */
  @Get()
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('search') search?: string
  ): Promise<PaginatedResult<ProjectEntity>> {
    return this.projectService.findAll({ page, limit, search });
  }

  /**
   * GET /api/projects/:id
   * 获取单个项目详情
   * 使用 ParseUUIDPipe 验证 UUID 格式
   */
  @Get(':id')
  async findOne(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string
  ): Promise<ProjectEntity> {
    return this.projectService.findOne(id);
  }

  /**
   * PUT /api/projects/:id
   * 更新项目（支持部分更新）
   * 使用 ParseUUIDPipe 验证 UUID 格式
   */
  @Put(':id')
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() updateProjectDto: UpdateProjectDto
  ): Promise<ProjectEntity> {
    return this.projectService.update(id, updateProjectDto);
  }

  /**
   * DELETE /api/projects/:id
   * 删除项目
   * 返回 HTTP 204 No Content
   * 使用 ParseUUIDPipe 验证 UUID 格式
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string): Promise<void> {
    return this.projectService.remove(id);
  }
}
