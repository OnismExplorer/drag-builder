# DragBuilder NestJS 后端服务

这是 DragBuilder 的后端 NestJS 应用，提供 RESTful API 服务和数据持久化。

## 技术栈

- **框架**: NestJS 10.0+ with TypeScript
- **ORM**: TypeORM 0.3+
- **数据库**: PostgreSQL 16+
- **验证**: class-validator + class-transformer
- **文档**: Swagger/OpenAPI

## 目录结构

```
drag-builder-server/
├── src/
│   ├── modules/              # 业务模块
│   │   ├── project/          # 项目模块
│   │   ├── export/           # 导出模块
│   │   └── health/           # 健康检查模块
│   ├── common/               # 公共模块
│   │   ├── filters/          # 异常过滤器
│   │   ├── interceptors/     # 拦截器
│   │   └── pipes/            # 管道
│   ├── config/               # 配置文件
│   │   └── database.config.ts
│   ├── app.module.ts         # 根模块
│   └── main.ts               # 入口文件
├── .env                      # 环境变量
├── .env.example              # 环境变量示例
└── tsconfig.json             # TypeScript 配置
```

## 安装依赖

```bash
pnpm install
```

## 环境配置

创建 `.env` 文件：

```env
# 应用配置
NODE_ENV=development
PORT=3000

# 数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=onism
DB_PASSWORD=123456
DB_DATABASE=dragbuilder

# CORS 配置
CORS_ORIGIN=http://localhost:5173
```

## 数据库初始化

确保 PostgreSQL 已安装并运行，然后执行：

```bash
# 连接到 PostgreSQL
psql -U onism -p 5432

# 创建数据库
CREATE DATABASE dragbuilder;

# 执行初始化脚本
\i ../drag-builder-sql/init.sql
```

## 开发

```bash
# 开发模式（热重载）
pnpm run start:dev

# 调试模式
pnpm run start:debug
```

应用将在 http://localhost:3000 启动。

## 构建

```bash
pnpm run build
```

## 生产运行

```bash
pnpm run start:prod
```

## API 文档

开发模式下，Swagger 文档可通过以下地址访问：
- http://localhost:3000/api/docs

## API 端点

### 项目管理
- `POST /api/projects` - 创建新项目
- `GET /api/projects` - 获取项目列表（支持分页和搜索）
- `GET /api/projects/:id` - 获取单个项目详情
- `PUT /api/projects/:id` - 更新项目
- `DELETE /api/projects/:id` - 删除项目

### 健康检查
- `GET /api/health` - 服务健康状态

## 数据模型

### Project Entity

```typescript
{
  id: string;              // UUID
  name: string;            // 项目名称
  canvasConfig: object;    // 画布配置（JSONB）
  componentsTree: object;  // 组件树（JSONB）
  createdAt: Date;         // 创建时间
  updatedAt: Date;         // 更新时间
}
```

## 错误处理

所有 API 错误遵循统一格式：

```json
{
  "statusCode": 400,
  "message": "错误描述",
  "error": "Bad Request",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/projects"
}
```

## 验证规则

使用 class-validator 进行 DTO 验证：
- 项目名称：必填，1-255 字符
- 画布配置：必填，有效的 JSON 对象
- 组件树：必填，有效的 JSON 数组

## 测试

```bash
# 运行单元测试
pnpm run test

# 运行 E2E 测试
pnpm run test:e2e

# 测试覆盖率
pnpm run test:cov
```

## 代码规范

- TypeScript 严格模式（禁止使用 any）
- 所有代码必须包含详尽的中文注释
- 使用 NestJS 模块化架构
- 遵循 RESTful API 设计规范

## 性能优化

- 数据库连接池配置
- JSONB 字段索引优化
- 分页查询优化
- 响应缓存（可选）

## 安全性

- 输入验证（class-validator）
- SQL 注入防护（TypeORM 参数化查询）
- CORS 配置
- Helmet 安全头
- HTTPS 强制（生产环境）

## 日志

使用 NestJS 内置 Logger：
- 请求日志
- 错误日志
- 数据库查询日志（开发环境）

---

**注意**: 生产环境请务必修改默认数据库密码并启用 HTTPS。
