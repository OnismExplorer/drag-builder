# DragBuilder - 可视化拖拽页面构建器

DragBuilder 是一款全栈可视化拖拽页面编辑器，提供类 Figma 的自由画布体验。用户可以将组件从物料库拖拽到画布上，构建 React 页面并保存到 PostgreSQL 数据库。

## 项目架构

```
┌─────────────────────────────────────────────────────────────────┐
│                         drag-builder                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────┐         HTTP/REST                     │
│  │  drag-builder-react │ ───────────────────────────────┐      │
│  │  React 19 + Vite 7  │ ◄───────────────────────────── │      │
│  │  Tailwind CSS 4     │                               │      │
│  │  Zustand 5          │                               │      │
│  │  @dnd-kit/core 6    │                               │      │
│  └──────────┬───────────┘                               │      │
│             │        前端 (端口 5173)                   │      │
│             │                                           ▼      │
│             │              ┌──────────────────────────┐        │
│             │              │   drag-builder-server    │        │
│             │              │   NestJS 11 + TypeORM   │        │
│             │              │   POSTGRESQL 16+        │        │
│             │              └──────────┬───────────────┘        │
│             │                         │     后端 (端口 3000)   │
│             │                         │                        │
│             │                         ▼                        │
│             │              ┌──────────────────────────┐        │
│             │              │   drag-builder-sql       │        │
│             │              │   PostgreSQL 16+         │        │
│             │              │   JSONB Storage          │        │
│             │              └──────────────────────────┘        │
│             │                         │                         │
│             │                         │     数据库               │
└─────────────┼─────────────────────────┼─────────────────────────┘
              │                         │
              ▼                         ▼
```

## 技术栈概览

### 前端 (`drag-builder-react`)

| 类别 | 技术 | 版本 |
|------|------|------|
| 框架 | React | 19 |
| 构建 | Vite | 7 |
| 语言 | TypeScript | 5.9 (strict) |
| 样式 | Tailwind CSS | 4 |
| 状态管理 | Zustand + Immer | 5 / 11 |
| 拖拽 | @dnd-kit/core | 6 |
| 动画 | Framer Motion | 12 |
| 路由 | React Router DOM | 7 |
| HTTP | Axios | 1 |
| 图标 | Lucide React | — |
| 测试 | Vitest + fast-check | 4.0 / 4.5 |

### 后端 (`drag-builder-server`)

| 类别 | 技术 | 版本 |
|------|------|------|
| 框架 | NestJS | 11 |
| ORM | TypeORM | 0.3 |
| 数据库 | PostgreSQL | 16+ |
| 验证 | class-validator / class-transformer | 0.14 / 0.5 |
| 文档 | @nestjs/swagger | 11 |

### 数据库 (`drag-builder-sql`)

- PostgreSQL 16+
- JSONB 存储 `canvas_config` 和 `components_tree`
- GIN 索引加速 JSONB 字段查询
- 自动触发器维护 `updated_at` 字段

## 核心功能

- **自由画布** — 平移、缩放（10%-200%）、网格对齐、无限画布体验
- **拖拽组件** — 从物料库拖拽 Div、Button、Text、Image、Input、Radio、Checkbox、Tag 等组件到画布
- **多选与对齐** — 支持多选组件、批量移动、吸附辅助线（5px 阈值）
- **属性面板** — 实时编辑位置、尺寸、样式（背景色、边框、圆角、阴影、文字样式等）
- **画布预设** — 桌面端（1440×900）、平板端（768×1024）、移动端（375×667）、自定义尺寸
- **撤销/重做** — 最多 50 步历史记录
- **项目保存/加载** — RESTful API 持久化到 PostgreSQL
- **导出代码** — 生成可运行的 React + Tailwind 代码
- **导出图片** — 将画布导出为 PNG 图片

## 项目结构

```
drag-builder/
├── CLAUDE.md                        # AI 行为准则
├── README.md                        # 本文件
├── package.json                     # 根目录（仅含 shadcn CLI）
│
├── drag-builder-react/              # 前端应用
│   ├── src/
│   │   ├── api/                    # Axios 客户端 + API 方法
│   │   ├── assets/                 # 静态资源
│   │   ├── components/             # React 组件
│   │   │   ├── Canvas/              # 画布引擎
│   │   │   ├── MaterialPanel/       # 左侧物料库
│   │   │   ├── PropertyPanel/       # 右侧属性面板
│   │   │   ├── Toolbar/             # 顶部工具栏
│   │   │   ├── Toast/               # 消息通知
│   │   │   ├── Modal/               # 模态框
│   │   │   ├── ProjectList/         # 项目列表
│   │   │   ├── CodePreview/         # 代码预览
│   │   │   └── built-in/            # 内置组件
│   │   ├── hooks/                  # 自定义 Hooks
│   │   ├── pages/                  # 页面组件
│   │   ├── store/                  # Zustand 状态管理
│   │   ├── types/                  # TypeScript 类型
│   │   └── utils/                   # 工具函数（吸附引擎等）
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
├── drag-builder-server/             # 后端服务
│   ├── src/
│   │   ├── common/                 # 公共模块
│   │   │   └── filters/             # 全局异常过滤器
│   │   ├── config/                 # 数据库配置
│   │   ├── modules/
│   │   │   ├── health/             # 健康检查
│   │   │   └── project/            # 项目 CRUD
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── test/                       # E2E 测试
│   ├── package.json
│   └── tsconfig.json
│
├── drag-builder-sql/                # 数据库脚本
│   ├── init.sql                    # 建表脚本
│   ├── seed.sql                    # 种子数据
│   └── setup.sh                    # 启动脚本
│
└── docs/                           # 领域文档
    ├── API.md                      # API 契约文档
    ├── DOMAIN.md                    # 画布引擎领域逻辑
    └── SECURITY.md                  # 安全规范
```

## 快速开始

### 前置要求

- **Node.js** >= 18
- **PostgreSQL** 16+
- **npm** >= 9

### 第一步：初始化数据库

```bash
# 创建数据库用户
psql -U postgres -c "CREATE USER onism WITH PASSWORD '123456';"

# 创建数据库
psql -U postgres -c "CREATE DATABASE dragbuilder OWNER onism;"

# 初始化表结构
psql -U onism -d dragbuilder -f drag-builder-sql/init.sql

# 插入示例数据（可选）
psql -U onism -d dragbuilder -f drag-builder-sql/seed.sql
```

> 详细说明参考 [drag-builder-sql/README.md](./drag-builder-sql/README.md)。

### 第二步：启动后端服务

```bash
cd drag-builder-server
npm install

# 创建 .env 文件
cat > .env << 'EOF'
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=onism
DB_PASSWORD=123456
DB_DATABASE=dragbuilder
PORT=3000
CORS_ORIGIN=http://localhost:5173
EOF

npm run start:dev
```

服务运行在 **http://localhost:3000**，Swagger 文档：**http://localhost:3000/api**

### 第三步：启动前端应用

```bash
cd drag-builder-react
npm install
npm run dev
```

前端运行在 **http://localhost:5173**

### 访问应用

1. 打开浏览器访问 http://localhost:5173
2. 首页显示项目列表，点击「新建项目」进入编辑器
3. 从左侧物料库拖拽组件到画布
4. 点击画布上的组件，在右侧属性面板调整属性
5. 点击工具栏「保存」按钮持久化项目

## API 文档

基础 URL：`http://localhost:3000`（无全局路径前缀）

### 接口列表

| 方法 | 路径 | 描述 | 返回状态码 |
|------|------|------|-----------|
| `POST` | `/api/projects` | 创建项目 | 201 |
| `GET` | `/api/projects` | 项目列表（分页 + 搜索） | 200 |
| `GET` | `/api/projects/:id` | 项目详情 | 200 |
| `PUT` | `/api/projects/:id` | 更新项目（部分更新） | 200 |
| `DELETE` | `/api/projects/:id` | 删除项目 | 204 |
| `GET` | `/health` | 健康检查 | 200 |

### 分页查询参数

`GET /api/projects` 支持以下查询参数：

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `page` | number | 1 | 页码 |
| `limit` | number | 10 | 每页数量（最大 100） |
| `search` | string | — | 按项目名称模糊搜索 |

### 请求/响应示例

**创建项目 (POST /api/projects)**

请求体：
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
      "position": { "x": 100, "y": 100, "width": 200, "height": 40, "zIndex": 0 },
      "styles": { "fontSize": 24, "textColor": "#000000" },
      "content": { "text": "欢迎登录" }
    }
  ]
}
```

响应 (201 Created)：
```json
{
  "id": "generated-uuid",
  "name": "我的登录页",
  "canvasConfig": { ... },
  "componentsTree": [ ... ],
  "createdAt": "2026-04-02T10:00:00.000Z",
  "updatedAt": "2026-04-02T10:00:00.000Z"
}
```

**分页列表 (GET /api/projects?page=1&limit=10)**

响应 (200 OK)：
```json
{
  "data": [ ... ],
  "total": 25,
  "page": 1,
  "limit": 10
}
```

> 完整的 API 契约文档参考 [docs/API.md](./docs/API.md)。

## 数据模型

### 组件节点 (ComponentNode)

```typescript
interface ComponentNode {
  id: string;              // UUID v4
  type: ComponentType;     // 'div' | 'button' | 'text' | 'image' | 'input' | 'radio' | 'checkbox' | 'tag'
  position: Position;      // { x, y, width, height, zIndex }
  styles: ComponentStyles; // { backgroundColor, borderColor, fontSize, ... }
  content: ComponentContent; // { text, src, placeholder, ... }
  animation?: AnimationConfig;
  children?: ComponentNode[]; // 嵌套子组件（静态渲染）
}
```

### 画布配置 (CanvasConfig)

```typescript
interface CanvasConfig {
  width: number;           // 画布宽度 (100-5000px)
  height: number;          // 画布高度 (100-5000px)
  preset: CanvasPreset;    // 'mobile' | 'tablet' | 'desktop' | 'custom'
  backgroundColor: string; // HEX 颜色值
}
```

### 画布预设尺寸

| 预设 | 宽度 | 高度 |
|------|------|------|
| mobile | 375 | 667 |
| tablet | 768 | 1024 |
| desktop | 1440 | 900 |
| custom | 800 | 600 |

## 状态管理

使用 Zustand + Immer 进行状态管理，分为三个 Store：

| Store | 职责 | 关键状态 |
|-------|------|---------|
| `componentStore` | 组件树、选中状态、CRUD、撤销/重做 | `components`, `selectedId`, `selectedIds`, `history`, `clipboard` |
| `canvasStore` | 画布配置、缩放、平移 | `config`, `zoom`, `pan` |
| `uiStore` | UI 交互状态（辅助线、拖拽、Toast） | `snapLines`, `isDraggingComponent`, `toast` |

> 详细说明参考 [docs/DOMAIN.md](./docs/DOMAIN.md)。

## 开发指南

### 代码规范

- **格式化**：遵循 `.prettierrc` 配置（单引号、带分号、2 空格缩进）
- **Lint 检查**：
  ```bash
  # 前端
  cd drag-builder-react && npm run lint

  # 后端
  cd drag-builder-server && npm run lint
  ```
- **禁止使用 `any`**：必须定义精确的 interface 或 type
- **必须使用 Immer 中间件**：通过 `set(state => { ... })` 进行不可变更新

### 添加新组件类型

1. 在 `src/types/component.ts` 中扩展 `ComponentType` 类型
2. 在 `src/components/Canvas/ComponentNode.tsx` 中添加渲染逻辑
3. 在 `src/components/MaterialPanel/` 中添加入口
4. 在 `src/components/PropertyPanel/` 中添加对应的属性编辑器

### 测试

```bash
# 前端单元测试
cd drag-builder-react && npm test

# 前端测试覆盖率
cd drag-builder-react && npm run test:cov

# 后端 E2E 测试
cd drag-builder-server && npm run test:e2e
```

## 子项目文档

- [前端文档](./drag-builder-react/README.md)
- [后端文档](./drag-builder-server/README.md)
- [数据库文档](./drag-builder-sql/README.md)
- [API 契约文档](./docs/API.md)
- [画布引擎领域文档](./docs/DOMAIN.md)
- [安全规范文档](./docs/SECURITY.md)

## 浏览器兼容性

| 浏览器 | 最低版本 |
|--------|----------|
| Chrome | 90+ |
| Firefox | 88+ |
| Safari | 14+ |
| Edge | 90+ |

**最低分辨率**：1280×720

## 贡献指南

1. Fork 本仓库
2. 创建功能分支 `git checkout -b feature/your-feature`
3. 提交更改 `git commit -m 'feat: add your feature'`
4. 推送并开启 Pull Request

## 许可证

MIT
