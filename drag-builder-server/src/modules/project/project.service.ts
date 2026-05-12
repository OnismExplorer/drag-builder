import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { ProjectEntity } from './project.entity';
import { CreateProjectDto, UpdateProjectDto } from './project.dto';

/**
 * 项目列表查询参数
 */
export interface FindAllOptions {
  page?: number;
  limit?: number;
  search?: string;
  userId?: string;
}

/**
 * 分页结果
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

/**
 * ProjectService - 项目业务逻辑服务
 * 提供项目的 CRUD 操作，支持分页和搜索
 *
 * 需求：11.1, 11.4, 11.7
 */
@Injectable()
export class ProjectService {
  private readonly logger = new Logger(ProjectService.name);

  constructor(
    @InjectRepository(ProjectEntity)
    private readonly projectRepository: Repository<ProjectEntity>
  ) {}

  /**
   * 创建新项目
   * @param createProjectDto 创建项目的数据
   * @returns 创建成功的项目实体
   */
  async create(createProjectDto: CreateProjectDto, userId: string): Promise<ProjectEntity> {
    this.logger.log(`创建项目：${createProjectDto.name}`);

    const project = this.projectRepository.create({
      name: createProjectDto.name,
      canvasConfig: createProjectDto.canvasConfig,
      componentsTree: createProjectDto.componentsTree,
      userId,
    });

    const saved = await this.projectRepository.save(project);
    this.logger.log(`项目创建成功，ID：${saved.id}`);
    return saved;
  }

  /**
   * 获取项目列表，支持分页和搜索
   * @param options 查询选项（页码、每页数量、搜索关键词）
   * @returns 分页后的项目列表
   */
  async findAll(options: FindAllOptions = {}): Promise<PaginatedResult<ProjectEntity>> {
    const { page = 1, limit = 10, search, userId } = options;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (search) {
      where.name = Like(`%${search}%`);
    }
    if (userId) {
      where.userId = userId;
    }

    const [data, total] = await this.projectRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    this.logger.log(`查询项目列表，共 ${total} 条，当前第 ${page} 页`);

    return { data, total, page, limit };
  }

  /**
   * 根据 ID 获取单个项目
   * @param id 项目 UUID
   * @returns 项目实体
   * @throws NotFoundException 项目不存在时抛出 404
   */
  async findOne(id: string, userId?: string): Promise<ProjectEntity> {
    const project = await this.projectRepository.findOne({ where: { id } });

    if (!project) {
      this.logger.warn(`项目不存在，ID：${id}`);
      throw new NotFoundException(`项目 ${id} 不存在`);
    }

    if (userId && project.userId !== userId) {
      throw new ForbiddenException('无权访问该项目');
    }

    return project;
  }

  async update(
    id: string,
    updateProjectDto: UpdateProjectDto,
    userId: string
  ): Promise<ProjectEntity> {
    const project = await this.findOne(id, userId);

    if (updateProjectDto.name !== undefined) {
      project.name = updateProjectDto.name;
    }
    if (updateProjectDto.canvasConfig !== undefined) {
      project.canvasConfig = updateProjectDto.canvasConfig;
    }
    if (updateProjectDto.componentsTree !== undefined) {
      project.componentsTree = updateProjectDto.componentsTree;
    }

    const updated = await this.projectRepository.save(project);
    this.logger.log(`项目更新成功，ID：${id}`);
    return updated;
  }

  async remove(id: string, userId: string): Promise<void> {
    await this.findOne(id, userId);

    await this.projectRepository.delete(id);
    this.logger.log(`项目删除成功，ID：${id}`);
  }
}
