import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { Repository, Like } from 'typeorm';
import { ProjectService } from '../src/modules/project/project.service';
import { ProjectEntity } from '../src/modules/project/project.entity';
import { CreateProjectDto, UpdateProjectDto } from '../src/modules/project/project.dto';

/**
 * 创建模拟项目实体的工厂函数
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
 * 创建有效的 CreateProjectDto
 */
function makeCreateDto(overrides: Partial<CreateProjectDto> = {}): CreateProjectDto {
  return {
    name: overrides.name ?? '新项目',
    canvasConfig: overrides.canvasConfig ?? {
      width: 1440,
      height: 900,
      preset: 'desktop',
      backgroundColor: '#FFFFFF',
    },
    componentsTree: overrides.componentsTree ?? [],
  };
}

/**
 * ProjectService 单元测试
 *
 * 测试目标：
 * - CRUD 操作（create, findAll, findOne, update, remove）
 * - 分页和搜索功能
 * - 错误处理（404, 400）
 *
 * 需求：11.1, 11.7, 11.8
 */
describe('ProjectService', () => {
  let service: ProjectService;
  let repo: jest.Mocked<Repository<ProjectEntity>>;

  beforeEach(async () => {
    // 构建模拟 Repository
    const mockRepo: Partial<jest.Mocked<Repository<ProjectEntity>>> = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectService,
        {
          provide: getRepositoryToken(ProjectEntity),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<ProjectService>(ProjectService);
    repo = module.get(getRepositoryToken(ProjectEntity));
  });

  // ─────────────────────────────────────────────
  // create
  // ─────────────────────────────────────────────
  describe('create()', () => {
    it('应该创建并返回新项目', async () => {
      const dto = makeCreateDto();
      const entity = makeProject({ name: dto.name });

      repo.create.mockReturnValue(entity);
      repo.save.mockResolvedValue(entity);

      const result = await service.create(dto);

      expect(repo.create).toHaveBeenCalledWith({
        name: dto.name,
        canvasConfig: dto.canvasConfig,
        componentsTree: dto.componentsTree,
      });
      expect(repo.save).toHaveBeenCalledWith(entity);
      expect(result).toBe(entity);
    });

    it('应该将 componentsTree 原样传递给 repository', async () => {
      const components = [
        { id: 'comp-1', type: 'div', position: { x: 0, y: 0, width: 100, height: 100, zIndex: 0 } },
      ];
      const dto = makeCreateDto({ componentsTree: components });
      const entity = makeProject({ componentsTree: components });

      repo.create.mockReturnValue(entity);
      repo.save.mockResolvedValue(entity);

      await service.create(dto);

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ componentsTree: components })
      );
    });

    it('应该将 canvasConfig 原样传递给 repository', async () => {
      const canvasConfig = {
        width: 375,
        height: 667,
        preset: 'mobile' as const,
        backgroundColor: '#F0F0F0',
      };
      const dto = makeCreateDto({ canvasConfig });
      const entity = makeProject({ canvasConfig });

      repo.create.mockReturnValue(entity);
      repo.save.mockResolvedValue(entity);

      await service.create(dto);

      expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ canvasConfig }));
    });

    it('当 repository.save 抛出异常时应该向上传播', async () => {
      const dto = makeCreateDto();
      const entity = makeProject();

      repo.create.mockReturnValue(entity);
      repo.save.mockRejectedValue(new Error('数据库连接失败'));

      await expect(service.create(dto)).rejects.toThrow('数据库连接失败');
    });
  });

  // ─────────────────────────────────────────────
  // findAll
  // ─────────────────────────────────────────────
  describe('findAll()', () => {
    it('应该返回默认分页结果（第 1 页，每页 10 条）', async () => {
      const projects = [makeProject({ id: 'id-1' }), makeProject({ id: 'id-2' })];
      repo.findAndCount.mockResolvedValue([projects, 2]);

      const result = await service.findAll();

      expect(repo.findAndCount).toHaveBeenCalledWith({
        where: {},
        order: { createdAt: 'DESC' },
        skip: 0,
        take: 10,
      });
      expect(result).toEqual({ data: projects, total: 2, page: 1, limit: 10 });
    });

    it('应该正确计算分页偏移量（第 3 页，每页 5 条）', async () => {
      repo.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll({ page: 3, limit: 5 });

      expect(repo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 5 })
      );
    });

    it('应该在提供 search 时使用 Like 查询', async () => {
      repo.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll({ search: '登录' });

      expect(repo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ where: { name: Like('%登录%') } })
      );
    });

    it('应该在 search 为空字符串时不添加 where 条件', async () => {
      repo.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll({ search: '' });

      // 空字符串被视为 falsy，不应添加 Like 条件
      expect(repo.findAndCount).toHaveBeenCalledWith(expect.objectContaining({ where: {} }));
    });

    it('应该在没有数据时返回空列表', async () => {
      repo.findAndCount.mockResolvedValue([[], 0]);

      const result = await service.findAll();

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('应该在结果中正确反映自定义 page 和 limit', async () => {
      repo.findAndCount.mockResolvedValue([[], 0]);

      const result = await service.findAll({ page: 2, limit: 20 });

      expect(result.page).toBe(2);
      expect(result.limit).toBe(20);
    });

    it('应该按 createdAt 降序排列', async () => {
      repo.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll();

      expect(repo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ order: { createdAt: 'DESC' } })
      );
    });
  });

  // ─────────────────────────────────────────────
  // findOne
  // ─────────────────────────────────────────────
  describe('findOne()', () => {
    it('应该返回存在的项目', async () => {
      const entity = makeProject();
      repo.findOne.mockResolvedValue(entity);

      const result = await service.findOne(entity.id);

      expect(repo.findOne).toHaveBeenCalledWith({ where: { id: entity.id } });
      expect(result).toBe(entity);
    });

    it('应该在项目不存在时抛出 NotFoundException（404）', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(NotFoundException);
    });

    it('NotFoundException 的消息应包含项目 ID', async () => {
      const missingId = 'missing-uuid-1234';
      repo.findOne.mockResolvedValue(null);

      await expect(service.findOne(missingId)).rejects.toThrow(missingId);
    });
  });

  // ─────────────────────────────────────────────
  // update
  // ─────────────────────────────────────────────
  describe('update()', () => {
    it('应该更新并返回修改后的项目', async () => {
      const entity = makeProject();
      const dto: UpdateProjectDto = { name: '更新后的名称' };
      const updated = makeProject({ name: '更新后的名称' });

      repo.findOne.mockResolvedValue(entity);
      repo.save.mockResolvedValue(updated);

      const result = await service.update(entity.id, dto);

      expect(repo.save).toHaveBeenCalled();
      expect(result).toBe(updated);
    });

    it('应该仅更新 dto 中提供的字段', async () => {
      const entity = makeProject({ name: '原始名称' });
      const dto: UpdateProjectDto = { name: '新名称' };

      repo.findOne.mockResolvedValue(entity);
      repo.save.mockImplementation(async e => e as ProjectEntity);

      const result = await service.update(entity.id, dto);

      expect(result.name).toBe('新名称');
      // canvasConfig 和 componentsTree 保持不变
      expect(result.canvasConfig).toEqual(entity.canvasConfig);
      expect(result.componentsTree).toEqual(entity.componentsTree);
    });

    it('应该支持仅更新 canvasConfig', async () => {
      const entity = makeProject();
      const newConfig = {
        width: 768,
        height: 1024,
        preset: 'tablet' as const,
        backgroundColor: '#F5F5F5',
      };
      const dto: UpdateProjectDto = { canvasConfig: newConfig };

      repo.findOne.mockResolvedValue(entity);
      repo.save.mockImplementation(async e => e as ProjectEntity);

      const result = await service.update(entity.id, dto);

      expect(result.canvasConfig).toEqual(newConfig);
      expect(result.name).toBe(entity.name);
    });

    it('应该支持仅更新 componentsTree', async () => {
      const entity = makeProject();
      const newTree = [{ id: 'c1', type: 'button' }];
      const dto: UpdateProjectDto = { componentsTree: newTree };

      repo.findOne.mockResolvedValue(entity);
      repo.save.mockImplementation(async e => e as ProjectEntity);

      const result = await service.update(entity.id, dto);

      expect(result.componentsTree).toEqual(newTree);
    });

    it('应该在项目不存在时抛出 NotFoundException（404）', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.update('non-existent-id', { name: '新名称' })).rejects.toThrow(
        NotFoundException
      );
    });

    it('应该在 dto 为空对象时不修改任何字段', async () => {
      const entity = makeProject();
      const dto: UpdateProjectDto = {};

      repo.findOne.mockResolvedValue(entity);
      repo.save.mockImplementation(async e => e as ProjectEntity);

      const result = await service.update(entity.id, dto);

      expect(result.name).toBe(entity.name);
      expect(result.canvasConfig).toEqual(entity.canvasConfig);
      expect(result.componentsTree).toEqual(entity.componentsTree);
    });
  });

  // ─────────────────────────────────────────────
  // remove
  // ─────────────────────────────────────────────
  describe('remove()', () => {
    it('应该成功删除存在的项目', async () => {
      const entity = makeProject();
      repo.findOne.mockResolvedValue(entity);
      repo.delete.mockResolvedValue({ affected: 1, raw: [] });

      await expect(service.remove(entity.id)).resolves.toBeUndefined();
      expect(repo.delete).toHaveBeenCalledWith(entity.id);
    });

    it('应该在项目不存在时抛出 NotFoundException（404）', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.remove('non-existent-id')).rejects.toThrow(NotFoundException);
    });

    it('删除不存在的项目时不应调用 repository.delete', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.remove('non-existent-id')).rejects.toThrow(NotFoundException);
      expect(repo.delete).not.toHaveBeenCalled();
    });

    it('应该使用正确的 ID 调用 repository.delete', async () => {
      const targetId = 'target-uuid-5678';
      const entity = makeProject({ id: targetId });
      repo.findOne.mockResolvedValue(entity);
      repo.delete.mockResolvedValue({ affected: 1, raw: [] });

      await service.remove(targetId);

      expect(repo.delete).toHaveBeenCalledWith(targetId);
    });
  });
});
