import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ProjectController } from '../src/modules/project/project.controller';
import { ProjectService, PaginatedResult } from '../src/modules/project/project.service';
import { ProjectEntity } from '../src/modules/project/project.entity';
import { CreateProjectDto, UpdateProjectDto } from '../src/modules/project/project.dto';

/**
 * 创建模拟项目实体
 */
function makeProject(overrides: Partial<ProjectEntity> = {}): ProjectEntity {
  const entity = new ProjectEntity();
  entity.id = overrides.id ?? 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
  entity.name = overrides.name ?? '测试项目';
  entity.canvasConfig = overrides.canvasConfig ?? {
    width: 1440,
    height: 900,
    preset: 'desktop',
    backgroundColor: '#FFFFFF',
  };
  entity.componentsTree = overrides.componentsTree ?? [];
  entity.createdAt = overrides.createdAt ?? new Date('2024-01-01T00:00:00Z');
  entity.updatedAt = overrides.updatedAt ?? new Date('2024-01-01T00:00:00Z');
  return entity;
}

/**
 * 创建分页结果
 */
function makePaginated(
  data: ProjectEntity[],
  total = data.length,
  page = 1,
  limit = 10
): PaginatedResult<ProjectEntity> {
  return { data, total, page, limit };
}

/**
 * ProjectController 单元测试
 *
 * 测试目标：
 * - 各端点正确委托给 ProjectService
 * - 分页和搜索参数正确传递
 * - 错误（404）正确向上传播
 *
 * 需求：11.1, 11.7, 11.8
 */
describe('ProjectController', () => {
  let controller: ProjectController;
  let service: jest.Mocked<ProjectService>;

  beforeEach(async () => {
    const mockService: Partial<jest.Mocked<ProjectService>> = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectController],
      providers: [{ provide: ProjectService, useValue: mockService }],
    }).compile();

    controller = module.get<ProjectController>(ProjectController);
    service = module.get(ProjectService);
  });

  // ─────────────────────────────────────────────
  // POST /api/projects
  // ─────────────────────────────────────────────
  describe('create()', () => {
    it('应该调用 service.create 并返回创建的项目', async () => {
      const dto: CreateProjectDto = {
        name: '新项目',
        canvasConfig: { width: 1440, height: 900, preset: 'desktop', backgroundColor: '#FFFFFF' },
        componentsTree: [],
      };
      const entity = makeProject({ name: dto.name });
      service.create.mockResolvedValue(entity);

      const result = await controller.create(dto);

      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toBe(entity);
    });

    it('应该将 service 抛出的异常向上传播', async () => {
      const dto: CreateProjectDto = {
        name: '新项目',
        canvasConfig: { width: 1440, height: 900, preset: 'desktop', backgroundColor: '#FFFFFF' },
        componentsTree: [],
      };
      service.create.mockRejectedValue(new Error('数据库错误'));

      await expect(controller.create(dto)).rejects.toThrow('数据库错误');
    });
  });

  // ─────────────────────────────────────────────
  // GET /api/projects
  // ─────────────────────────────────────────────
  describe('findAll()', () => {
    it('应该使用默认参数调用 service.findAll', async () => {
      const paginated = makePaginated([makeProject()]);
      service.findAll.mockResolvedValue(paginated);

      const result = await controller.findAll(1, 10, undefined);

      expect(service.findAll).toHaveBeenCalledWith({ page: 1, limit: 10, search: undefined });
      expect(result).toBe(paginated);
    });

    it('应该将自定义分页参数传递给 service', async () => {
      service.findAll.mockResolvedValue(makePaginated([], 0, 3, 5));

      await controller.findAll(3, 5, undefined);

      expect(service.findAll).toHaveBeenCalledWith({ page: 3, limit: 5, search: undefined });
    });

    it('应该将搜索关键词传递给 service', async () => {
      service.findAll.mockResolvedValue(makePaginated([]));

      await controller.findAll(1, 10, '登录页');

      expect(service.findAll).toHaveBeenCalledWith({ page: 1, limit: 10, search: '登录页' });
    });

    it('应该返回空列表当没有项目时', async () => {
      service.findAll.mockResolvedValue(makePaginated([], 0));

      const result = await controller.findAll(1, 10, undefined);

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  // ─────────────────────────────────────────────
  // GET /api/projects/:id
  // ─────────────────────────────────────────────
  describe('findOne()', () => {
    it('应该返回指定 ID 的项目', async () => {
      const entity = makeProject();
      service.findOne.mockResolvedValue(entity);

      const result = await controller.findOne(entity.id);

      expect(service.findOne).toHaveBeenCalledWith(entity.id);
      expect(result).toBe(entity);
    });

    it('应该在项目不存在时传播 NotFoundException（404）', async () => {
      service.findOne.mockRejectedValue(new NotFoundException('项目不存在'));

      await expect(controller.findOne('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });

  // ─────────────────────────────────────────────
  // PUT /api/projects/:id
  // ─────────────────────────────────────────────
  describe('update()', () => {
    it('应该调用 service.update 并返回更新后的项目', async () => {
      const entity = makeProject({ name: '更新后的名称' });
      const dto: UpdateProjectDto = { name: '更新后的名称' };
      service.update.mockResolvedValue(entity);

      const result = await controller.update(entity.id, dto);

      expect(service.update).toHaveBeenCalledWith(entity.id, dto);
      expect(result).toBe(entity);
    });

    it('应该在项目不存在时传播 NotFoundException（404）', async () => {
      service.update.mockRejectedValue(new NotFoundException('项目不存在'));

      await expect(controller.update('non-existent-id', { name: '新名称' })).rejects.toThrow(
        NotFoundException
      );
    });

    it('应该支持空 dto（不更新任何字段）', async () => {
      const entity = makeProject();
      service.update.mockResolvedValue(entity);

      const result = await controller.update(entity.id, {});

      expect(service.update).toHaveBeenCalledWith(entity.id, {});
      expect(result).toBe(entity);
    });
  });

  // ─────────────────────────────────────────────
  // DELETE /api/projects/:id
  // ─────────────────────────────────────────────
  describe('remove()', () => {
    it('应该调用 service.remove 并返回 undefined', async () => {
      service.remove.mockResolvedValue(undefined);

      const result = await controller.remove('some-uuid');

      expect(service.remove).toHaveBeenCalledWith('some-uuid');
      expect(result).toBeUndefined();
    });

    it('应该在项目不存在时传播 NotFoundException（404）', async () => {
      service.remove.mockRejectedValue(new NotFoundException('项目不存在'));

      await expect(controller.remove('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });
});
