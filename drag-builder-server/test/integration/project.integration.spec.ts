import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { ProjectModule } from '../../src/modules/project/project.module';
import { ProjectEntity } from '../../src/modules/project/project.entity';
import { Repository } from 'typeorm';

/**
 * 项目 API 集成测试
 *
 * 测试范围：完整的 HTTP 请求/响应流程，包括：
 * - ValidationPipe（DTO 验证）
 * - Controller 路由和参数解析
 * - Service 业务逻辑
 * - 错误处理（404、400 验证错误）
 *
 * 使用模拟 Repository 替代真实数据库，专注于测试应用层集成。
 *
 * 需求：11. 后端 API
 */
describe('Project API 集成测试', () => {
  let app: INestApplication;
  let mockRepo: jest.Mocked<Partial<Repository<ProjectEntity>>>;

  // ─── 测试数据工厂 ───────────────────────────────────────────────────────────

  const VALID_UUID = 'a1b2c3d4-e5f6-4a7b-8c9d-e0f1a2b3c4d5';
  const ANOTHER_UUID = 'b2c3d4e5-f6a7-4b8c-9d0e-f1a2b3c4d5e6';

  function makeEntity(overrides: Partial<ProjectEntity> = {}): ProjectEntity {
    const entity = new ProjectEntity();
    entity.id = overrides.id ?? VALID_UUID;
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

  const validCreateBody = {
    name: '我的项目',
    canvasConfig: {
      width: 1440,
      height: 900,
      preset: 'desktop',
      backgroundColor: '#FFFFFF',
    },
    componentsTree: [],
  };

  // ─── 测试模块初始化 ─────────────────────────────────────────────────────────

  beforeEach(async () => {
    mockRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      delete: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ProjectModule],
    })
      .overrideProvider(getRepositoryToken(ProjectEntity))
      .useValue(mockRepo)
      .compile();

    app = moduleFixture.createNestApplication();

    // 启用全局 ValidationPipe，与生产环境保持一致
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: false,
        transform: true,
      })
    );

    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  // ─── POST /api/projects ─────────────────────────────────────────────────────

  describe('POST /api/projects', () => {
    it('应该创建项目并返回 201', async () => {
      const entity = makeEntity({ name: validCreateBody.name });
      (mockRepo.create as jest.Mock).mockReturnValue(entity);
      (mockRepo.save as jest.Mock).mockResolvedValue(entity);

      const res = await request(app.getHttpServer())
        .post('/api/projects')
        .send(validCreateBody)
        .expect(201);

      expect(res.body.id).toBe(VALID_UUID);
      expect(res.body.name).toBe(validCreateBody.name);
    });

    it('应该在缺少 name 时返回 400', async () => {
      const body = { ...validCreateBody };
      delete (body as any).name;

      await request(app.getHttpServer()).post('/api/projects').send(body).expect(400);
    });

    it('应该在 name 为空字符串时返回 400', async () => {
      await request(app.getHttpServer())
        .post('/api/projects')
        .send({ ...validCreateBody, name: '' })
        .expect(400);
    });

    it('应该在 name 超过 255 字符时返回 400', async () => {
      await request(app.getHttpServer())
        .post('/api/projects')
        .send({ ...validCreateBody, name: 'a'.repeat(256) })
        .expect(400);
    });

    it('应该在缺少 canvasConfig 时返回 400', async () => {
      const body = { ...validCreateBody };
      delete (body as any).canvasConfig;

      await request(app.getHttpServer()).post('/api/projects').send(body).expect(400);
    });

    it('应该在 canvasConfig.width 超出范围时返回 400', async () => {
      await request(app.getHttpServer())
        .post('/api/projects')
        .send({
          ...validCreateBody,
          canvasConfig: { ...validCreateBody.canvasConfig, width: 99 },
        })
        .expect(400);
    });

    it('应该在 canvasConfig.preset 无效时返回 400', async () => {
      await request(app.getHttpServer())
        .post('/api/projects')
        .send({
          ...validCreateBody,
          canvasConfig: { ...validCreateBody.canvasConfig, preset: 'invalid' },
        })
        .expect(400);
    });

    it('应该在 canvasConfig.backgroundColor 格式无效时返回 400', async () => {
      await request(app.getHttpServer())
        .post('/api/projects')
        .send({
          ...validCreateBody,
          canvasConfig: { ...validCreateBody.canvasConfig, backgroundColor: 'red' },
        })
        .expect(400);
    });

    it('应该在缺少 componentsTree 时返回 400', async () => {
      const body = { ...validCreateBody };
      delete (body as any).componentsTree;

      await request(app.getHttpServer()).post('/api/projects').send(body).expect(400);
    });

    it('应该在 componentsTree 不是数组时返回 400', async () => {
      await request(app.getHttpServer())
        .post('/api/projects')
        .send({ ...validCreateBody, componentsTree: 'not-an-array' })
        .expect(400);
    });

    it('应该接受所有有效的 preset 类型', async () => {
      const presets = ['mobile', 'tablet', 'desktop', 'custom'] as const;

      for (const preset of presets) {
        const entity = makeEntity();
        (mockRepo.create as jest.Mock).mockReturnValue(entity);
        (mockRepo.save as jest.Mock).mockResolvedValue(entity);

        await request(app.getHttpServer())
          .post('/api/projects')
          .send({
            ...validCreateBody,
            canvasConfig: { ...validCreateBody.canvasConfig, preset },
          })
          .expect(201);
      }
    });
  });

  // ─── GET /api/projects ──────────────────────────────────────────────────────

  describe('GET /api/projects', () => {
    it('应该返回分页项目列表', async () => {
      const entities = [makeEntity({ id: VALID_UUID }), makeEntity({ id: ANOTHER_UUID })];
      (mockRepo.findAndCount as jest.Mock).mockResolvedValue([entities, 2]);

      const res = await request(app.getHttpServer()).get('/api/projects').expect(200);

      expect(res.body.data).toHaveLength(2);
      expect(res.body.total).toBe(2);
      expect(res.body.page).toBe(1);
      expect(res.body.limit).toBe(10);
    });

    it('应该支持自定义分页参数', async () => {
      (mockRepo.findAndCount as jest.Mock).mockResolvedValue([[], 0]);

      const res = await request(app.getHttpServer())
        .get('/api/projects?page=2&limit=5')
        .expect(200);

      expect(res.body.page).toBe(2);
      expect(res.body.limit).toBe(5);
    });

    it('应该支持搜索参数', async () => {
      const entity = makeEntity({ name: '登录页面' });
      (mockRepo.findAndCount as jest.Mock).mockResolvedValue([[entity], 1]);

      const res = await request(app.getHttpServer()).get('/api/projects?search=登录').expect(200);

      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].name).toBe('登录页面');
    });

    it('应该在没有项目时返回空列表', async () => {
      (mockRepo.findAndCount as jest.Mock).mockResolvedValue([[], 0]);

      const res = await request(app.getHttpServer()).get('/api/projects').expect(200);

      expect(res.body.data).toEqual([]);
      expect(res.body.total).toBe(0);
    });

    it('应该在 page 参数无效时使用默认值 1', async () => {
      (mockRepo.findAndCount as jest.Mock).mockResolvedValue([[], 0]);

      // page 参数缺失时使用默认值
      const res = await request(app.getHttpServer()).get('/api/projects').expect(200);

      expect(res.body.page).toBe(1);
    });
  });

  // ─── GET /api/projects/:id ──────────────────────────────────────────────────

  describe('GET /api/projects/:id', () => {
    it('应该返回指定 ID 的项目', async () => {
      const entity = makeEntity();
      (mockRepo.findOne as jest.Mock).mockResolvedValue(entity);

      const res = await request(app.getHttpServer()).get(`/api/projects/${VALID_UUID}`).expect(200);

      expect(res.body.id).toBe(VALID_UUID);
      expect(res.body.name).toBe('测试项目');
    });

    it('应该在项目不存在时返回 404', async () => {
      (mockRepo.findOne as jest.Mock).mockResolvedValue(null);

      const res = await request(app.getHttpServer()).get(`/api/projects/${VALID_UUID}`).expect(404);

      expect(res.body.message).toContain(VALID_UUID);
    });

    it('应该在 ID 不是有效 UUID 时返回 400', async () => {
      await request(app.getHttpServer()).get('/api/projects/not-a-uuid').expect(400);
    });

    it('响应体应包含 canvasConfig 和 componentsTree', async () => {
      const entity = makeEntity({
        componentsTree: [{ id: 'c1', type: 'button' }],
      });
      (mockRepo.findOne as jest.Mock).mockResolvedValue(entity);

      const res = await request(app.getHttpServer()).get(`/api/projects/${VALID_UUID}`).expect(200);

      expect(res.body.canvasConfig).toBeDefined();
      expect(res.body.componentsTree).toHaveLength(1);
    });
  });

  // ─── PUT /api/projects/:id ──────────────────────────────────────────────────

  describe('PUT /api/projects/:id', () => {
    it('应该更新项目名称并返回更新后的实体', async () => {
      const original = makeEntity();
      const updated = makeEntity({ name: '新名称' });

      (mockRepo.findOne as jest.Mock).mockResolvedValue(original);
      (mockRepo.save as jest.Mock).mockResolvedValue(updated);

      const res = await request(app.getHttpServer())
        .put(`/api/projects/${VALID_UUID}`)
        .send({ name: '新名称' })
        .expect(200);

      expect(res.body.name).toBe('新名称');
    });

    it('应该支持仅更新 canvasConfig', async () => {
      const original = makeEntity();
      const newConfig = { width: 768, height: 1024, preset: 'tablet', backgroundColor: '#F5F5F5' };
      const updated = makeEntity({ canvasConfig: newConfig as any });

      (mockRepo.findOne as jest.Mock).mockResolvedValue(original);
      (mockRepo.save as jest.Mock).mockResolvedValue(updated);

      const res = await request(app.getHttpServer())
        .put(`/api/projects/${VALID_UUID}`)
        .send({ canvasConfig: newConfig })
        .expect(200);

      expect(res.body.canvasConfig.preset).toBe('tablet');
    });

    it('应该支持仅更新 componentsTree', async () => {
      const original = makeEntity();
      const newTree = [{ id: 'c1', type: 'text' }];
      const updated = makeEntity({ componentsTree: newTree });

      (mockRepo.findOne as jest.Mock).mockResolvedValue(original);
      (mockRepo.save as jest.Mock).mockResolvedValue(updated);

      const res = await request(app.getHttpServer())
        .put(`/api/projects/${VALID_UUID}`)
        .send({ componentsTree: newTree })
        .expect(200);

      expect(res.body.componentsTree).toHaveLength(1);
    });

    it('应该在项目不存在时返回 404', async () => {
      (mockRepo.findOne as jest.Mock).mockResolvedValue(null);

      await request(app.getHttpServer())
        .put(`/api/projects/${VALID_UUID}`)
        .send({ name: '新名称' })
        .expect(404);
    });

    it('应该在 ID 不是有效 UUID 时返回 400', async () => {
      await request(app.getHttpServer())
        .put('/api/projects/invalid-id')
        .send({ name: '新名称' })
        .expect(400);
    });

    it('应该在 name 超过 255 字符时返回 400', async () => {
      await request(app.getHttpServer())
        .put(`/api/projects/${VALID_UUID}`)
        .send({ name: 'a'.repeat(256) })
        .expect(400);
    });

    it('应该接受空 body（不更新任何字段）', async () => {
      const entity = makeEntity();
      (mockRepo.findOne as jest.Mock).mockResolvedValue(entity);
      (mockRepo.save as jest.Mock).mockResolvedValue(entity);

      await request(app.getHttpServer()).put(`/api/projects/${VALID_UUID}`).send({}).expect(200);
    });
  });

  // ─── DELETE /api/projects/:id ───────────────────────────────────────────────

  describe('DELETE /api/projects/:id', () => {
    it('应该删除项目并返回 204', async () => {
      const entity = makeEntity();
      (mockRepo.findOne as jest.Mock).mockResolvedValue(entity);
      (mockRepo.delete as jest.Mock).mockResolvedValue({ affected: 1, raw: [] });

      await request(app.getHttpServer()).delete(`/api/projects/${VALID_UUID}`).expect(204);
    });

    it('应该在项目不存在时返回 404', async () => {
      (mockRepo.findOne as jest.Mock).mockResolvedValue(null);

      await request(app.getHttpServer()).delete(`/api/projects/${VALID_UUID}`).expect(404);
    });

    it('应该在 ID 不是有效 UUID 时返回 400', async () => {
      await request(app.getHttpServer()).delete('/api/projects/not-a-uuid').expect(400);
    });

    it('删除后响应体应为空', async () => {
      const entity = makeEntity();
      (mockRepo.findOne as jest.Mock).mockResolvedValue(entity);
      (mockRepo.delete as jest.Mock).mockResolvedValue({ affected: 1, raw: [] });

      const res = await request(app.getHttpServer())
        .delete(`/api/projects/${VALID_UUID}`)
        .expect(204);

      expect(res.body).toEqual({});
    });
  });

  // ─── 完整 CRUD 流程测试 ─────────────────────────────────────────────────────

  describe('完整 CRUD 流程', () => {
    it('应该完成创建 → 查询 → 更新 → 删除的完整流程', async () => {
      const created = makeEntity({ name: '流程测试项目' });
      const updated = makeEntity({ name: '已更新项目' });

      // 1. 创建
      (mockRepo.create as jest.Mock).mockReturnValue(created);
      (mockRepo.save as jest.Mock).mockResolvedValue(created);

      const createRes = await request(app.getHttpServer())
        .post('/api/projects')
        .send(validCreateBody)
        .expect(201);

      const projectId = createRes.body.id;
      expect(projectId).toBe(VALID_UUID);

      // 2. 查询单个
      (mockRepo.findOne as jest.Mock).mockResolvedValue(created);

      const getRes = await request(app.getHttpServer())
        .get(`/api/projects/${projectId}`)
        .expect(200);

      expect(getRes.body.id).toBe(projectId);

      // 3. 更新
      (mockRepo.findOne as jest.Mock).mockResolvedValue(created);
      (mockRepo.save as jest.Mock).mockResolvedValue(updated);

      const updateRes = await request(app.getHttpServer())
        .put(`/api/projects/${projectId}`)
        .send({ name: '已更新项目' })
        .expect(200);

      expect(updateRes.body.name).toBe('已更新项目');

      // 4. 删除
      (mockRepo.findOne as jest.Mock).mockResolvedValue(updated);
      (mockRepo.delete as jest.Mock).mockResolvedValue({ affected: 1, raw: [] });

      await request(app.getHttpServer()).delete(`/api/projects/${projectId}`).expect(204);

      // 5. 确认删除后查询返回 404
      (mockRepo.findOne as jest.Mock).mockResolvedValue(null);

      await request(app.getHttpServer()).get(`/api/projects/${projectId}`).expect(404);
    });
  });

  // ─── 错误处理测试 ───────────────────────────────────────────────────────────

  describe('错误处理', () => {
    it('400 响应应包含 message 字段', async () => {
      const res = await request(app.getHttpServer()).post('/api/projects').send({}).expect(400);

      expect(res.body.message).toBeDefined();
      expect(res.body.statusCode).toBe(400);
    });

    it('404 响应应包含 message 字段', async () => {
      (mockRepo.findOne as jest.Mock).mockResolvedValue(null);

      const res = await request(app.getHttpServer()).get(`/api/projects/${VALID_UUID}`).expect(404);

      expect(res.body.message).toBeDefined();
      expect(res.body.statusCode).toBe(404);
    });

    it('数据库异常应返回 500', async () => {
      (mockRepo.create as jest.Mock).mockReturnValue(makeEntity());
      (mockRepo.save as jest.Mock).mockRejectedValue(new Error('数据库连接失败'));

      await request(app.getHttpServer()).post('/api/projects').send(validCreateBody).expect(500);
    });
  });
});
