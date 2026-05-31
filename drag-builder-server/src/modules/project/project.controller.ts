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
  UseGuards,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { ProjectService, PaginatedResult } from './project.service';
import { CreateProjectDto, UpdateProjectDto } from './project.dto';
import { ProjectEntity } from './project.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

interface RequestWithUser extends Request {
  user: { userId: string; username: string | null };
}

/**
 * ProjectController - 项目 REST API 控制器
 * 提供项目的增删改查接口
 *
 * 需求：11.1, 11.2, 11.8
 */
@Controller('api/projects')
@UseGuards(JwtAuthGuard)
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createProjectDto: CreateProjectDto,
    @Req() req: RequestWithUser
  ): Promise<ProjectEntity> {
    return this.projectService.create(createProjectDto, req.user.userId);
  }

  @Get()
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(12), ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Req() req?: RequestWithUser
  ): Promise<PaginatedResult<ProjectEntity>> {
    // Validate page parameter: must be >= 1, otherwise default to 1
    if (page < 1) {
      page = 1;
    }
    const userId = req?.user?.userId;
    return this.projectService.findAll({ page, limit, search, userId });
  }

  @Get(':id')
  async findOne(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Req() req: RequestWithUser
  ): Promise<ProjectEntity> {
    return this.projectService.findOne(id, req.user.userId);
  }

  @Put(':id')
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() updateProjectDto: UpdateProjectDto,
    @Req() req: RequestWithUser
  ): Promise<ProjectEntity> {
    return this.projectService.update(id, updateProjectDto, req.user.userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Req() req: RequestWithUser
  ): Promise<void> {
    return this.projectService.remove(id, req.user.userId);
  }
}
