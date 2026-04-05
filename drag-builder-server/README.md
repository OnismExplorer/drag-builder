# drag-builder-server

DragBuilder 后端服务，基于 NestJS 11 + TypeORM 0.3 + PostgreSQL 16+ 构建的 RESTful API 服务。

## 项目介绍

提供项目数据的持久化存储与查询接口，支持项目的增删改查、分页列表和关键词搜索。内置 Swagger API 文档、全局参数校验（class-validator）和统一异常处理（HttpExceptionFilter）。

### 主要功能

- 项目 CRUD 操作（创建、查询、更新、删除）
- 分页列表查询（支持 `page`、`limit`、`search` 参数）
- 完整的输入验证（class-validator DTO 校验）
- 统一异常处理（HttpExceptionFilter）
- JSONB 字段存储（`canvas_config`、`components_tree`）
- GIN 索引加速 JSONB 字段查询
- Swagger UI API 文档
- CORS 跨域支持（可配置允许来源）
- 健康检查端点

## 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| NestJS | 11 | 服务端框架 |
| TypeORM | 0.3 | ORM（Repository 模式） |
| PostgreSQL | 16+ | 数据库 |
| @nestjs/swagger | 11 | Swagger API 文档 |
| class-validator | 0.14 | 请求参数校验 |
| class-transformer | 0.5 | 数据转换（JSON ↔ DTO） |
| reflect-metadata | 0.2 | 装饰器元数据支持 |
| rxjs | 7.8 | 响应式编程 |

## 安装和运行

### 前置要求

- Node.js >= 18
- PostgreSQL 16+（已创建 `dragbuilder` 数据库，参考根目录 README.md）
- 数据库连接配置（见下方环境变量）

### 安装依赖

```bash
cd drag-builder-server
npm install
```

### 配置环境变量

在 `drag-builder-server/` 目录下创建 `.env` 文件：

```env
# 数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=onism
DB_PASSWORD=123456
DB_DATABASE=dragbuilder

# 服务配置
PORT=3000

# 跨域配置（前端地址）
CORS_ORIGIN=http://localhost:5173
```

### 启动开发服务器

```bash
npm run start:dev
```

服务默认运行在 http://localhost:3000

### 构建生产版本

```bash
npm run build
npm run start:prod
```

### 运行测试

```bash
# 单元测试
npm test

# 测试覆盖率
npm run test:cov

# E2E 测试
npm run test:e2e

# 调试模式（监听 Jest）
npm run test:debug
```

### 代码检查

```bash
# ESLint 检查
npm run lint

# ESLint 自动修复
npm run lint:fix

# Prettier 格式化检查
npm run format:check

# Prettier 自动格式化
npm run format

# TypeScript 类型检查
npm run typecheck
```

## API 文档

启动服务后访问 Swagger UI：**http://localhost:3000/api**

### 接口列表

| 方法 | 路径 | 描述 | 鉴权 | 返回状态码 |
|------|------|------|------|-----------|
| `POST` | `/api/projects` | 创建项目 | — | 201 |
| `GET` | `/api/projects` | 项目列表（分页 + 搜索） | — | 200 |
| `GET` | `/api/projects/:id` | 获取单个项目详情 | — | 200 |
| `PUT` | `/api/projects/:id` | 更新项目（部分更新） | — | 200 |
| `DELETE` | `/api/projects/:id` | 删除项目 | — | 204 |
| `GET` | `/health` | 健康检查 | — | 200 |

### 请求/响应示例

#### 创建项目 (POST /api/projects)

**请求体：**
```json
{
  "name": "我的登录页",
  "canvasConfig": {
    "width": 1440,
    "height": 900,
    "preset": "desktop",
    "backgroundColor": "#FFFFFF"
  },
  "componentsTree": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "type": "text",
      "position": {
        "x": 100,
        "y": 100,
        "width": 200,
        "height": 40,
        "zIndex": 0
      },
      "styles": {
        "fontSize": 24,
        "fontWeight": 600,
        "textColor": "#333333"
      },
      "content": {
        "text": "欢迎登录"
      }
    },
    {
      "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      "type": "button",
      "position": {
        "x": 100,
        "y": 200,
        "width": 120,
        "height": 44,
        "zIndex": 1
      },
      "styles": {
        "backgroundColor": "#1890FF",
        "borderRadius": 8
      },
      "content": {
        "text": "登录"
      }
    }
  ]
}
```

**响应 (201 Created)：**
```json
{
  "id": "generated-uuid-here",
  "name": "我的登录页",
  "canvasConfig": {
    "width": 1440,
    "height": 900,
    "preset": "desktop",
    "backgroundColor": "#FFFFFF"
  },
  "componentsTree": [ ... ],
  "createdAt": "2026-04-02T10:00:00.000Z",
  "updatedAt": "2026-04-02T10:00:00.000Z"
}
```

#### 分页列表 (GET /api/projects)

**查询参数：**
```
GET /api/projects?page=1&limit=10&search=登录
```

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `page` | number | 1 | 页码 |
| `limit` | number | 10 | 每页数量（最大 100） |
| `search` | string | — | 按项目名称模糊搜索 |

**响应 (200 OK)：**
```json
{
  "data": [
    {
      "id": "uuid-1",
      "name": "登录页面",
      "canvasConfig": { ... },
      "componentsTree": [ ... ],
      "createdAt": "2026-04-01T08:00:00.000Z",
      "updatedAt": "2026-04-02T10:00:00.000Z"
    }
  ],
  "total": 25,
  "page": 1,
  "limit": 10
}
```

#### 获取单个项目 (GET /api/projects/:id)

**响应 (200 OK)：**
```json
{
  "id": "uuid-here",
  "name": "我的登录页",
  "canvasConfig": { ... },
  "componentsTree": [ ... ],
  "createdAt": "2026-04-02T10:00:00.000Z",
  "updatedAt": "2026-04-02T10:00:00.000Z"
}
```

#### 更新项目 (PUT /api/projects/:id)

支持部分更新，以下请求体可只包含需要更新的字段：

```json
{
  "name": "新名称",
  "canvasConfig": {
    "width": 1920,
    "height": 1080,
    "preset": "custom",
    "backgroundColor": "#F5F5F5"
  }
}
```

**响应 (200 OK)：** 返回更新后的完整项目对象。

#### 删除项目 (DELETE /api/projects/:id)

**响应 (204 No Content)：** 空响应体。

### 错误响应格式

所有异常由 `HttpExceptionFilter` 统一拦截，格式如下：

```json
{
  "statusCode": 400,
  "error": "Validation Failed",
  "message": [
    "name 不能为空",
    "canvasConfig.width 必须是数字"
  ],
  "path": "/api/projects",
  "timestamp": "2026-04-02T10:00:00.000Z"
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `statusCode` | `number` | HTTP 状态码 |
| `error` | `string` | 错误类型名称 |
| `message` | `string \| string[]` | 验证错误消息数组或单个字符串 |
| `path` | `string` | 请求路径 |
| `timestamp` | `string` | ISO 8601 时间戳 |

## 数据模型

### ProjectEntity

| 字段名 | 类型 | 说明 |
|--------|------|------|
| `id` | UUID (PrimaryGeneratedColumn) | 项目唯一标识符 |
| `name` | VARCHAR(255) | 项目名称 |
| `canvas_config` | JSONB | 画布配置 |
| `components_tree` | JSONB | 组件树 DSL |
| `created_at` | TIMESTAMP WITH TIME ZONE | 创建时间（自动生成） |
| `updated_at` | TIMESTAMP WITH TIME ZONE | 更新时间（自动更新） |

### CanvasConfig DTO 校验规则

| 字段 | 类型 | 约束 |
|------|------|------|
| `width` | number | 100-5000px |
| `height` | number | 100-5000px |
| `preset` | enum | 'mobile' \| 'tablet' \| 'desktop' \| 'custom' |
| `backgroundColor` | string | HEX 格式（如 `#FFFFFF`） |

### ComponentNode DTO 校验规则

| 字段 | 类型 | 约束 |
|------|------|------|
| `id` | string | UUID v4 格式 |
| `type` | enum | 'div' \| 'button' \| 'text' \| 'image' \| 'input' \| 'radio' \| 'checkbox' \| 'tag' |
| `position.x` | number | >= 0 |
| `position.y` | number | >= 0 |
| `position.width` | number | >= 1 |
| `position.height` | number | >= 1 |
| `position.zIndex` | number | 0-999 |
| HEX 颜色字段 | string | `#RRGGBB` 格式 |
| `fontSize` | number | >= 1 |
| `fontWeight` | number | 100-900 |

## 目录结构

```
drag-builder-server/
├── src/
│   ├── main.ts                      # 应用入口
│   ├── app.module.ts                # 根模块
│   ├── common/
│   │   └── filters/
│   │       └── http-exception.filter.ts  # 全局异常过滤器
│   ├── config/
│   │   └── database.config.ts       # TypeORM 数据库配置
│   └── modules/
│       ├── health/
│       │   ├── health.module.ts
│       │   └── health.controller.ts  # 健康检查控制器
│       └── project/
│           ├── project.module.ts
│           ├── project.controller.ts  # 项目 REST 控制器
│           ├── project.service.ts    # 项目业务逻辑
│           ├── project.entity.ts     # TypeORM 实体
│           └── project.dto.ts        # 请求/响应 DTO
├── test/
│   └── *.e2e-spec.ts                # E2E 测试
├── package.json
├── tsconfig.json
├── tsconfig.build.json
├── nest-cli.json
└── eslint.config.mjs
```

## 模块设计

### HttpExceptionFilter

全局异常过滤器，统一处理所有 `HttpException` 及其子类。

**功能：**
- 捕获所有 HTTP 异常
- 格式化错误响应（包含 `statusCode`、`error`、`message`、`path`、`timestamp`）
- class-validator 校验错误整理为扁平的消息数组

### ValidationPipe

全局验证管道，应用在所有请求上。

**配置：**
- `whitelist: true` — 自动剥离非 DTO 定义的字段
- `forbidNonWhitelisted: true` — 存在非白名单字段时抛出 400 错误
- `transform: true` — 自动类型转换（如 Query 参数 `page` 从 string 转为 number）
- 自定义 `exceptionFactory` — 将 class-validator 错误整理为 `{ message: string[] }` 格式

### ProjectModule

项目 CRUD 模块，包含完整的业务逻辑和数据访问。

**控制器接口：**
```
POST   /api/projects         — 创建项目
GET    /api/projects         — 分页列表（page, limit, search）
GET    /api/projects/:id     — 详情
PUT    /api/projects/:id     — 更新（部分更新）
DELETE /api/projects/:id     — 删除
```

**Service 方法：**
```typescript
create(createDto: CreateProjectDto): Promise<ProjectEntity>
findAll(query: { page, limit, search }): Promise<PaginatedResult<ProjectEntity>>
findOne(id: string): Promise<ProjectEntity>
update(id: string, updateDto: UpdateProjectDto): Promise<ProjectEntity>
remove(id: string): Promise<void>
```

### HealthModule

健康检查模块，提供服务可用性检查。

**接口：**
```
GET /health
```

**响应：**
```json
{
  "status": "ok",
  "timestamp": "2026-04-02T10:00:00.000Z"
}
```

## 数据库配置

数据库初始化脚本位于 `drag-builder-sql/` 目录，请先完成数据库初始化再启动服务。

TypeORM 配置位于 `src/config/database.config.ts`，通过环境变量注入连接参数：

| 环境变量 | 说明 | 默认值 |
|----------|------|--------|
| `DB_HOST` | 数据库主机 | localhost |
| `DB_PORT` | 数据库端口 | 5432 |
| `DB_USERNAME` | 数据库用户名 | onism |
| `DB_PASSWORD` | 数据库密码 | 123456 |
| `DB_DATABASE` | 数据库名 | dragbuilder |

**重要**：开发环境下 `synchronize` 选项已关闭，所有 Schema 变更必须通过 SQL 脚本管理。

## 安全注意事项

1. **CORS 配置**：默认只允许 `http://localhost:5173`，生产环境请修改 `CORS_ORIGIN` 环境变量。
2. **数据库凭据**：不要将明文密码提交到代码仓库，使用 `.env` 文件管理。
3. **输入校验**：所有输入通过 class-validator 进行严格校验，白名单模式 (`whitelist: true`) 自动拒绝未知字段。
4. **无用户认证**：当前版本未实现用户认证系统，项目数据不隔离（后续版本规划）。

## 与前端集成

前端 API 客户端位于 `drag-builder-react/src/api/` 目录：

- `client.ts` — Axios 实例，配置了请求/响应拦截器
- `projectApi.ts` — 项目相关的 API 方法

**API 基础地址配置：**
```typescript
// drag-builder-react/src/api/client.ts
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  // ...
});
```

**调用示例：**
```typescript
import { projectApi } from '@/api/projectApi';

// 创建项目
const project = await projectApi.create({
  name: '我的项目',
  canvasConfig: { width: 1440, height: 900, preset: 'desktop', backgroundColor: '#fff' },
  componentsTree: [],
});

// 获取列表
const { data, total } = await projectApi.getProjects({ page: 1, limit: 10 });

// 更新项目
await projectApi.update(id, { name: '新名称' });
```

> 完整的 API 契约文档参考根目录 `docs/API.md`。
