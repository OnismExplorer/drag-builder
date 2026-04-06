# CLAUDE.md — DragBuilder 项目行为准则

> 本文件是 AI 编码助手进入本项目的"系统级行为准则"。
> 所有 AI 助手在执行任何任务前必须阅读并遵循本文件的规范。
> 修改本文件需要项目 Owner 批准。

---

## 1. 项目概述

**DragBuilder** 是一个全栈可视化拖拽页面构建器，提供类 Figma 的自由画布体验。
用户可以将组件从物料库拖拽到画布上，构建 React 页面并保存到 PostgreSQL 数据库。

```
drag-builder-react (React 19 + Vite + TypeScript + Tailwind CSS 4)
    ←HTTP/REST→
drag-builder-server (NestJS 11 + TypeORM)
    ←TypeORM→
drag-builder-sql (PostgreSQL 16+)
```

---

## 2. 技术栈

### 2.1 Frontend (`drag-builder-react`)

> **⚠️ 版本警示：** 本项目使用 **React 19** 和 **Tailwind CSS 4**。AI 助手在提供代码建议时必须注意：
> - 不得使用已被废弃的 API 或类名
> - 注意 React 19 新的 Ref 传递方式（如 `ref` 作为 prop 直接传递）和 Hooks 规范变化

| 类别   | 技术                      |
|------|-------------------------|
| 框架   | React 19                |
| 构建   | Vite 7                  |
| 语言   | TypeScript 5.9 (strict) |
| 样式   | Tailwind CSS 4          |
| 状态管理 | Zustand 5 + Immer 11    |
| 拖拽   | @dnd-kit/core 6         |
| 动画   | Framer Motion 12        |
| 路由   | React Router DOM 7      |
| HTTP | Axios 1                 |
| 图标   | Lucide React            |
| 测试   | Vitest 4 + fast-check 4 |

### 2.2 Backend (`drag-builder-server`)

| 类别  | 技术                                           |
|-----|----------------------------------------------|
| 框架  | NestJS 11                                    |
| ORM | TypeORM 0.3                                  |
| 数据库 | PostgreSQL 16+                               |
| 验证  | class-validator 0.14 + class-transformer 0.5 |
| 文档  | @nestjs/swagger 11                           |
| 语言  | TypeScript (strict + decorators)             |

### 2.3 Database (`drag-builder-sql`)

- PostgreSQL 16+
- JSONB 存储 `canvas_config` 和 `components_tree`
- 支持 GIN 索引加速 JSONB 查询

---

## 3. 项目结构

```
drag-builder/
├── CLAUDE.md                    # 本文件
├── README.md                    # 项目总览
├── package.json                 # 根目录（仅含 shadcn CLI）
│
├── drag-builder-react/          # 前端子项目
│   ├── src/
│   │   ├── api/                 # Axios 客户端 + API 方法
│   │   │   ├── client.ts        # Axios 实例（拦截器配置）
│   │   │   └── projectApi.ts    # 项目 CRUD 操作
│   │   ├── assets/              # 静态资源
│   │   ├── components/          # React 组件
│   │   │   ├── Canvas/          # 画布引擎（Canvas, ComponentNode, ResizeHandles...）
│   │   │   ├── PropertyPanel/   # 右侧属性编辑面板
│   │   │   ├── MaterialPanel/   # 左侧组件物料库
│   │   │   ├── Toolbar/         # 顶部工具栏
│   │   │   ├── Toast/           # Toast 通知
│   │   │   ├── Modal/           # 模态框
│   │   │   ├── ProjectList/     # 项目列表
│   │   │   ├── CodePreview/     # 代码预览
│   │   │   ├── FeatureCard/     # 功能卡片
│   │   │   ├── ErrorBoundary/   # 错误边界
│   │   │   ├── ResponsiveGuard/ # 响应式守卫
│   │   │   ├── StarBorder/      # 装饰组件
│   │   │   └── PixelSnow/       # 装饰组件
│   │   ├── hooks/               # 自定义 React Hooks
│   │   ├── pages/               # 页面组件
│   │   │   ├── HomePage.tsx     # 落地页
│   │   │   └── EditorPage.tsx   # 编辑器主页面
│   │   ├── store/               # Zustand Stores
│   │   │   ├── componentStore.ts # 组件树状态
│   │   │   ├── canvasStore.ts   # 画布配置/缩放/平移
│   │   │   └── uiStore.ts       # UI 状态（模态框/Toast）
│   │   ├── types/               # TypeScript 类型定义
│   │   │   ├── component.ts     # 组件节点类型
│   │   │   ├── canvas.ts        # 画布类型
│   │   │   └── project.ts       # 项目类型
│   │   ├── utils/               # 工具函数
│   │   │   ├── snapping.ts      # 吸附引擎（核心）
│   │   │   ├── multiSelectBounds.ts
│   │   │   ├── virtualCanvas.ts
│   │   │   ├── componentNesting.ts
│   │   │   ├── codeGenerator.ts  # 代码生成器
│   │   │   └── timing.ts        # throttle/debounce
│   │   ├── App.tsx              # 根组件
│   │   └── main.tsx             # 入口文件
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json            # 复合项目引用配置
│   ├── tsconfig.app.json
│   ├── tsconfig.node.json
│   ├── vite.config.ts
│   ├── eslint.config.js
│   ├── prettier.config.js
│   ├── tailwind.config.js
│   └── cypress/                 # E2E 测试
│
├── drag-builder-server/          # 后端子项目
│   ├── src/
│   │   ├── common/
│   │   │   └── filters/
│   │   │       └── http-exception.filter.ts  # 全局异常过滤器
│   │   ├── config/
│   │   │   └── database.config.ts             # TypeORM 配置
│   │   ├── modules/
│   │   │   ├── health/           # 健康检查模块
│   │   │   │   ├── health.module.ts
│   │   │   │   └── health.controller.ts
│   │   │   └── project/          # 项目 CRUD 模块
│   │   │       ├── project.module.ts
│   │   │       ├── project.controller.ts
│   │   │       ├── project.service.ts
│   │   │       ├── project.entity.ts
│   │   │       └── project.dto.ts
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── test/
│   ├── package.json
│   ├── tsconfig.json
│   ├── nest-cli.json
│   └── eslint.config.mjs
│
└── drag-builder-sql/             # 数据库脚本
    ├── init.sql                  # 建表脚本
    ├── seed.sql                  # 种子数据
    ├── setup.sh                  # 启动脚本
    └── QUICK_START.md            # 快速开始
```

---

## 4. 代码规范

### 4.1 格式化与 Lint 规则

> **⚠️ 强制执行：** 本项目拥有完整的物理配置文件，AI 助手**必须严格遵守**，禁止在输出代码时产生任何风格偏移。

1. **格式化 (Prettier)**：

- 参考根目录及子项目的 `.prettierrc`。
- 规则要点：单引号、带分号、2 空格缩进、尾随逗号 es5。

2. **静态检查 (ESLint 9+)**：

- 前端遵循 `drag-builder-react/eslint.config.js`。
- 后端遵循 `drag-builder-server/eslint.config.mjs`。

3. **交付闭环纪律**：

- AI 助手在修改任何代码后，**必须主动运行**以下命令进行自检：
  - 前端：`cd drag-builder-react && npm run lint`
  - 后端：`cd drag-builder-server && npm run lint`
- **禁止提交带 Lint 报错的代码。** 若有报错，必须自行修复至 0 错误（或由人类批准的特殊 warn）。

### 4.2 开发风格细则

- **限制 Any**：严格限制使用 `any`，优先使用定义精确的 interface 或 type。对于不确定类型，应使用 unknown 处理。若因第三方库等原因确需使用
  any，必须在同级加上 // eslint-disable-next-line @typescript-eslint/no-explicit-any 并写明合理原因。
- **异步处理**：所有数据库操作必须 await，禁止出现未处理的浮动 Promise（见后端 ESLint 规则）。
- **同步更新**：若因业务需要修改了 `.prettierrc` 或 ESLint 配置，必须同步更新本文件说明（若有变动）。

### 4.3 文件命名规范

| 类别            | 规范                     | 示例                                          |
|---------------|------------------------|---------------------------------------------|
| React 组件      | PascalCase             | `ComponentNode.tsx`, `PropertyPanel.tsx`    |
| React Hooks   | `use` + PascalCase     | `useKeyboardShortcuts.ts`                   |
| Zustand Store | camelCase + `Store` 后缀 | `componentStore.ts`, `canvasStore.ts`       |
| 工具函数          | camelCase              | `snapping.ts`, `timing.ts`                  |
| 类型定义          | camelCase              | `component.ts`, `canvas.ts`                 |
| NestJS 模块文件   | kebab-case             | `project.module.ts`, `health.module.ts`     |
| NestJS 类文件    | PascalCase             | `ProjectController.ts`, `ProjectService.ts` |

### 4.4 React 组件结构规范

```tsx
/**
 * ComponentNode 组件
 * 组件节点渲染器，负责渲染画布上的各种组件类型
 *
 * 需求：3.4, 3.5, 3.6, 4.1, 4.2, 4.3, 4.4
 * - 3.4: 从物料库拖拽组件到画布创建新组件
 * - 3.5: 组件在鼠标释放位置生成
 * - 3.6: 应用默认样式
 * - 4.1: 点击组件选中
 * - 4.2: 显示蓝色选中边框
 * - 4.3: 显示 8 个调整手柄
 * - 4.4: 拖拽选中的组件实时更新位置
 */

import React, {useCallback, useState} from 'react';
import {useDraggable} from '@dnd-kit/core';
import type {ComponentNode as ComponentNodeType} from '../../types';
import {useComponentStore} from '../../store/componentStore';

// ... 其他 imports

interface ComponentNodeProps {
  component: ComponentNodeType;
  isSelected: boolean;
}

/**
 * ComponentNode 组件
 * 动态渲染不同类型的组件
 * 使用 React.memo 避免不必要的重渲染（需求：14.2）
 */
const ComponentNode: React.FC<ComponentNodeProps> = React.memo(({component, isSelected}) => {
  // ...
});

export default ComponentNode;
```

**Import 顺序规则（React）：**

1. React 核心 (`import React from 'react'`)
2. React 库 (`useState`, `useEffect` 等)
3. `@dnd-kit` 相关
4. 组件库/第三方组件
5. 本项目组件 (`../components/...`)
6. Store (`../store/...`)
7. 类型 (`../types/...`)
8. 工具 (`../utils/...`)
9. API (`../api/...`)
10. 相对路径组件
11. 仅导入类型时，必须严格使用 import type { xxx } from '...'，以便于构建工具进行 Tree-shaking 优化

### 4.5 Zustand Store 模式

```typescript
/**
 * 组件树状态接口
 */
interface ComponentStore {
  // 状态
  components: ComponentNode[];
  selectedId: string | null;
  selectedIds: string[];

  // 查询方法
  getComponentById: (id: string) => ComponentNode | undefined;

  // 操作方法
  addComponent: (component: ComponentNode) => void;
  updateComponent: (id: string, updates: Partial<ComponentNode>) => void;
  deleteComponent: (id: string) => void;
}

/**
 * 创建组件树状态 Store
 * 使用 Zustand + Immer 中间件确保不可变更新
 */
export const useComponentStore = create<ComponentStore>()(
  immer((set, get) => ({
    // 初始状态
    components: [],
    selectedId: null,
    selectedIds: [],

    /**
     * 根据 ID 查询组件
     * @param id 组件 ID
     * @returns 组件节点或 undefined
     */
    getComponentById: (id: string) => {
      return get().components.find(comp => comp.id === id);
    },

    /**
     * 添加新组件到画布
     * @param component 新组件节点
     */
    addComponent: (component: ComponentNode) => {
      get().pushHistory();
      set(state => {
        state.components.push(component);
        state.selectedId = component.id;
        state.selectedIds = [component.id];
      });
    },
    // ...
  }))
);
```

**Store 命名约定：** 使用 `use` 前缀（React Hook 规范），如 `useComponentStore`。

### 4.6 NestJS 模式

**Controller：**

```typescript

@Controller('api/projects')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createProjectDto: CreateProjectDto): Promise<ProjectEntity> {
    return this.projectService.create(createProjectDto);
  }

  @Get()
  async findAll(@Query() query: FindAllQueryDto): Promise<PaginatedResult<ProjectEntity>> {
    return this.projectService.findAll(query);
  }
}
```

**Service：**

```typescript

@Injectable()
export class ProjectService {
  private readonly logger = new Logger(ProjectService.name);

  constructor(
    @InjectRepository(ProjectEntity)
    private readonly projectRepository: Repository<ProjectEntity>,
  ) {
  }

  /**
   * 创建新项目
   * @param createProjectDto 创建项目的数据
   * @returns 创建成功的项目实体
   */
  async create(createProjectDto: CreateProjectDto): Promise<ProjectEntity> {
    this.logger.log(`创建项目：${createProjectDto.name}`);
    // ...
  }
}
```

**Import 顺序规则（NestJS）：**

1. `@nestjs` 相关的 imports
2. `typeorm` 相关的 imports
3. 其他第三方库
4. 本地模块 imports (`./modules/...`, `./config/...`, `./common/...`)
5. 仅导入类型时，必须严格使用 import type { xxx } from '...'，以便于构建工具进行 Tree-shaking 优化

### 4.7 JSDoc 注释规范

所有导出函数/类必须包含 JSDoc 注释，使用中文描述：

```typescript
/**
 * 吸附引擎类
 * 提供组件对齐检测和吸附功能
 */
export class SnappingEngine {
  /**
   * 计算两个区间之间的净距离
   * 如果重叠则返回 0
   * @param min1 区间1的最小值
   * @param max1 区间1的最大值
   * @param min2 区间2的最小值
   * @param max2 区间2的最大值
   * @returns 净间距
   */
  private calculateGap(min1: number, max1: number, min2: number, max2: number): number {
    // ...
  }
}
```

### 4.8 API 设计规范

**RESTful 端点：**

| 方法     | 路径                  | 描述            | 返回状态码 |
|--------|---------------------|---------------|-------|
| POST   | `/api/projects`     | 创建项目          | 201   |
| GET    | `/api/projects`     | 获取项目列表（分页+搜索） | 200   |
| GET    | `/api/projects/:id` | 获取单个项目        | 200   |
| PUT    | `/api/projects/:id` | 更新项目（部分更新）    | 200   |
| DELETE | `/api/projects/:id` | 删除项目          | 204   |
| GET    | `/api/health`       | 健康检查          | 200   |

**响应格式：**

```typescript
// 分页响应
interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
```

### 4.9 工程质量检查 (Linting & Formatting)

> **⚠️ 强制纪律：** 本项目严格依赖 ESLint 和 Prettier 保持代码一致性。AI 助手必须确保输出的代码** 100% 符合本地配置文件**。

1. **配置文件优先级**：

- 前端：遵循 `drag-builder-react/eslint.config.js`
- 后端：遵循 `drag-builder-server/eslint.config.mjs`
- 全局格式化：遵循根目录或子项目目录下的 `prettier.config.js`

2. **严禁避开检查**：

- 严禁擅自使用 `// eslint-disable-next-line` 屏蔽报错，除非有充足理由。
- 严禁使用 `any` 类型（除非在极少数确实无法定义类型的底层逻辑中，且需添加说明）。

3. **自动校验流程**：

- AI 在完成代码修改后，**必须主动尝试运行 `npm run lint`**（或对应的 lint 指令）来验证输出结果。
- 如果 lint 报错，AI 必须自行修复所有错误，直至校验通过后再宣告任务完成。

---

## 5. 状态管理

### 5.1 Zustand Store 架构

| Store            | 职责                         |
|------------------|----------------------------|
| `componentStore` | 组件树、选中状态、撤销/重做、剪贴板         |
| `canvasStore`    | 画布尺寸、缩放、平移、辅助线显示           |
| `uiStore`        | 模态框、Toast、拖拽偏移量、正在拖拽的组件 ID |

> **⚠️ 路由规范：** 若涉及 URL 变化（如 `/editor/:projectId`），统一使用 React Router DOM 7 的 `useNavigate` 或 `<Link>` 组件。
**严禁直接操作 `window.location`**。

### 5.2 状态更新模式

**必须使用 Immer 中间件**，通过 `set(state => { ... })` 进行不可变更新：

```typescript
// ✅ 正确
set(state => {
  state.components.push(newComponent);
});

// ❌ 错误（直接修改）
state.components.push(newComponent);
```

---

## 6. 数据库架构

### 6.1 `projects` 表

| 字段                | 类型           | 说明                                           |
|-------------------|--------------|----------------------------------------------|
| `id`              | UUID         | 主键                                           |
| `name`            | VARCHAR(255) | 项目名称                                         |
| `canvas_config`   | JSONB        | 画布配置（width, height, preset, backgroundColor） |
| `components_tree` | JSONB        | 组件节点数组（`ComponentNode[]` DSL）                |
| `created_at`      | TIMESTAMP    | 创建时间                                         |
| `updated_at`      | TIMESTAMP    | 更新时间                                         |

**索引设计：**

- `idx_projects_name` — 项目名称模糊查询
- `idx_projects_created_at` — 按时间排序
- `idx_projects_updated_at` — 按更新时间排序
- GIN 索引 — JSONB 字段全文搜索

### 6.2 数据变更警告

> **⚠️ JSONB 存储警告：** `canvas_config` 和 `components_tree` 作为 JSONB 存储在 PostgreSQL 中。更新 JSONB 字段（如
> canvas_config）时，在 TypeORM 中应当做 Merge 操作，严禁直接全量覆盖导致丢失其他属性。
> 严禁随意修改 `ComponentNode` 的核心字段名（如 `id`、`type`、`position`、`styles`、`content`）。
> 如需扩展字段，必须保证向后兼容性（Backward Compatibility），避免破坏已有项目数据的解析。


---

## 7. Git 工作流

> **⚠️ 变更规范：** 每次已经经过确定的代码/文件/目录的变更，必须及时提交一次规范的 `git commit`(
> 提交之前请必须确保已经通过代码检查，符合规范)，并说明是什么变更。

### 7.1 提交规范

```
<type>: <简短描述>

[type 枚举]
- feat: 新功能
- fix: 修复 bug
- docs: 文档变更
- style: 格式调整（不影响代码）
- refactor: 重构
- test: 测试相关
- chore: 构建/工具变更
```

### 7.2 分支策略

- `master` — 主分支（生产就绪，始终保持稳定可用）
- `develop` — 当前主开发分支
- `feature/` — 功能变更分支（开发新功能）。每次进行需求开发时，从 develop 分支拉取新分支，并采用语义化命名（例如：feature/login-module
  或 feature/JIRA-123）。功能开发完成并确定后，及时 merge 回 develop 分支，并删除该分支
- `hotfix/` — 紧急修复分支（处理线上 Bug）。当生产环境出现紧急问题时，从 master
  分支拉取新分支，并简述修复内容（例如：hotfix/payment-bug）。修复完成并测试通过后，必须同时 merge 回 master 和 develop
  分支，并删除该分支
- 功能开发应在 `openspec/` 目录下创建变更记录

---

## 8. AI 助手行为规范

### 8.1 语言要求

**所有 AI 助手必须全程使用中文进行交流和回复**，包括：

- 任务描述和解释
- 总结和报告
- 代码注释（除标准术语外）
- 错误信息

### 8.2 修改现有代码的原则

1. **先阅读，再修改**：在修改任何文件前，必须先完整阅读该文件，理解其逻辑和上下文。
2. **最小化改动**：只做必要的修改，不要引入无关的"改进"或"清理"。
3. **保持风格一致**：新代码必须遵循本文档规定的命名和格式规范。
4. **不添加冗余注释**：不在自明代码上添加额外注释，不添加文档字符串（除非显式要求）。

### 8.3 创建新文件的规范

1. 检查同类文件的模式（参照本文档规范）
2. 使用正确的命名约定
3. 包含必要的 JSDoc 注释（导出函数/类）
4. 遵循对应的 import 顺序规则

### 8.4 测试与验证规范

关于前后端测试的编写边界、避坑指南以及 AI 必须遵循的 TDD 闭环验证工作流，**请严格参阅第 11 节《测试与验证规范》**。

### 8.5 危险操作确认

以下操作在执行前必须获得用户确认：

- 删除文件或分支（`git rm`, `git branch -D`）
- 强制推送（`git push --force`）
- 重置分支（`git reset --hard`）
- 覆盖已修改的文件
- 运行具有不可逆副作用的命令

### 8.6 性能考虑

- 吸附引擎等高频调用代码已进行优化，新增代码应避免不必要的重渲染和重计算
- 使用 `React.memo` 优化纯展示组件
- 使用 `useCallback` / `useMemo` 缓存频繁创建的函数和对象
- 批量操作应使用 store 的批量 action，而非多次单独调用

### 8.7 代码输出规范

> **⚠️ 完整代码输出要求：** 在提供修改建议时，除非文件过长，否则**尽量输出完整的函数或组件块**，避免过度使用
`// ... 现有代码 ...` 等省略形式，以确保代码可被准确无误地直接替换（Apply）而不产生语法错误或逻辑缺失。严禁使用 // ...
> existing code ... 或 /* 保持不变 */。如果你只修改了某个函数的局部，请完整输出该函数；如果修改了整个组件，请完整输出该组件的代码块。

### 8.8 文档同步更新规范 (Doc-Code Sync)

> **⚠️ 保持文档活性：** 本项目严格执行“文档与代码同步演进”的原则。AI 助手在修改代码时，**绝不能让代码逻辑与约束文档脱节**。

当发生以下变更时，AI 助手**必须在同一任务/同一提交中**主动修改对应的文档：

1. **API 接口变更**：凡涉及后端 Controller、DTO、Entity 的增删改（如新增字段、修改校验规则、增加路由），*
   *必须立即同步更新 `docs/API.md`** 中的参数、类型约束和 JSON 示例。
2. **核心业务变更**：凡涉及拖拽画布引擎、Zustand 状态流转、核心吸附算法的重构或扩展，必须同步检查并更新 `docs/DOMAIN.md`。
3. **安全/基础架构变更**：涉及数据库存储机制、组件 DOM 渲染方式（如新增可能引起 XSS 的富文本组件），必须更新
   `docs/SECURITY.md`。

**交付纪律**：在宣布任务完成前，AI 必须自行核对“代码修改是否已如实反映在附属文档中”。

### 8.9 开发风格深度约束

**前端开发规范：**

- **函数式组件**：统一使用箭头函数 `const Comp: React.FC = () => ...` 形式。
- **状态读取**：优先使用解构赋值从 Store 中读取状态，例如 `const { components, selectedId } = useComponentStore();`。
- **样式处理**：严格使用 Tailwind CSS 4 语法，禁止在 React 组件中写内联 CSS（除非是动态计算的位置/尺寸坐标）。
- **Props 定义**：所有 Props 必须定义 interface，并放置在组件定义上方。

**后端开发规范：**

- **依赖注入**：严格遵守 NestJS 构造函数注入模式。
- **异步处理**：所有数据库操作必须使用 `async/await`，并妥善处理 Promise。
- **错误处理**：业务逻辑错误应抛出 `BadRequestException` 或自定义的 `HttpException`，严禁让未捕获的错误直接导致服务 500。
- **DTO 验证**：所有输入接口必须使用 DTO 承接，并配齐 `class-validator` 装饰器。

尽量避免使用 any，而是使用 unknown 处理不确定类型；若使用 any，必须在注释中说明原因（如：第三方库类型缺失、临时原型开发等）。

---

## 9. 安全注意事项

- **禁止在代码中硬编码凭据**：使用 `.env` 文件和环境变量
- **禁止提交敏感信息**：确保 `.gitignore` 包含 `.env` 文件
- **SQL 注入防护**：使用 TypeORM 参数化查询，禁止拼接 SQL 字符串
- **XSS 防护**：用户输入的内容在渲染前必须经过适当转义

---

## 10. 快速参考

### 启动项目

```bash
# 前端
cd drag-builder-react && npm install && npm run dev

# 后端
cd drag-builder-server && npm install && npm run start:dev

# 数据库（确保 PostgreSQL 运行）
cd drag-builder-sql && ./setup.sh
```

### 常用命令

```bash
# 前端格式化
cd drag-builder-react && npx prettier --write .

# 后端格式化
cd drag-builder-server && npx prettier --write .

# 前端类型检查
cd drag-builder-react && npx tsc --noEmit

# 后端类型检查
cd drag-builder-server && npx tsc --noEmit

# 全局格式化检查（根目录）
npx prettier --check .
```

---

## 11. 测试与验证规范

### 11.1 测试核心原则

AI 助手在完成任何功能开发（前端页面/组件、后端接口）后，**必须主动编写并运行相应的测试**。严禁编写"
只为提升覆盖率但无实质断言"的无效测试。

### 11.2 前端测试规范（`drag-builder-react`）

采用**"重逻辑，轻视图"**的测试策略：

**核心算法测试（必须）：**

- `utils/` 下的工具函数（如 `snapping.ts` 吸附引擎、坐标计算、碰撞检测）必须编写 Vitest 单元测试
- 涉及边界值的纯函数，鼓励使用 `fast-check` 进行基于属性的测试（Property-based Testing）

**状态管理测试（Zustand Store）：**

- 优先测试 Store 的 action 逻辑，验证 `addComponent`、`updateComponent` 后 Store 状态是否如预期变更
- 禁止在测试中直接修改状态，必须通过 Store 暴露的方法触发状态更新

**组件渲染测试避坑：**

- **禁止**在 Vitest/JSDOM 中尝试深度 Mock `@dnd-kit` 的复杂鼠标/触摸拖拽事件（极易产生死循环或无意义报错）
- 组件测试应重点验证：传入特定 `ComponentNode` 属性时，是否正确渲染了对应的 Tailwind 类名和行内 styles

### 11.2.1 前端 E2E 测试规范（Cypress）

> **⚠️ E2E 测试边界：** 不要用 E2E 测试去验证纯逻辑（如吸附算法），那是 Vitest 的工作。E2E 测试仅用于验证核心用户链路。

1. **文件位置**：所有 E2E 测试必须放置在 `drag-builder-react/cypress/e2e/` 目录下，文件以 `.cy.ts` 结尾。
2. **测试模式**：严格遵循 **Arrange-Act-Assert** (准备-执行-断言) 模式编写测试用例。
3. **元素定位（强约束）**：严禁使用容易变化的 Tailwind 类名作为选择器。必须在组件上添加 `data-testid` 属性进行定位（例如
   `cy.get('[data-testid="canvas-area"]')`）。
4. **核心链路覆盖**：

- 从左侧物料库拖拽组件到中心画布。
- 选中组件并在右侧属性面板修改样式/内容。
- 验证画布内组件是否正确渲染并吸附。

### 11.3 后端测试规范（`drag-builder-server`）

**接口集成测试（E2E）：**

- 新增或修改接口后，必须在 `test/` 目录下编写/更新 `.e2e-spec.ts` 文件

**JSONB 校验测试：**

- 必须包含针对 `canvas_config` 和 `components_tree` 字段的非法载荷（Bad Payload）测试
- 确保 `class-validator` 正确拦截了非法的组件嵌套或缺失的必填属性

**数据库真实性：**

- 涉及 PostgreSQL GIN 索引或复杂 JSONB 查询的 Service 方法，**严禁使用 Mock Repository**，必须在测试环境连接真实
  PostgreSQL 数据库进行验证

### 11.4 AI 开发闭环工作流

所有 AI 助手在处理"开发新需求"或"修复 Bug"时，必须遵循以下 TDD/BDD 闭环：

1. **编写代码**：完成组件或接口的代码编写
2. **编写测试**：根据 11.1–11.3 规范编写对应的测试用例
3. **执行验证**：AI 必须主动运行测试命令（`npm run test` 或 `npm run test:e2e`）。若测试失败，必须自行阅读错误堆栈并修复，直到测试通过
4. **最终交付**：在输出"任务完成"总结时，必须**附带测试通过的终端输出结果**（或截图说明），**严禁在未验证的情况下宣告任务结束
   **

---

## 12. 长期任务与上下文管理 (Long-Horizon Tasks & Context Paging)

> **⚠️ 防止失忆警告：** 当面对复杂或繁琐的任务时，为了防止上下文过长导致注意力衰减或 Token 耗尽，你必须采取“状态持久化”策略。

### 12.1 工作区日志规范 (`PROGRESS.md`)

当预判任务需要多次交互才能完成，或者你感到当前上下文已经非常长时，**必须主动在项目根目录创建或更新 `PROGRESS.md` 文件**。

> ⚠️ 写入原则：每次更新此文件时，必须采用全量覆盖（Overwrite）的方式，严禁不断追加（Append）。保持文件精简。

该文件必须包含以下结构：

1. **当前总目标**：一句话概括我们在做什么。
2. **已完成清单 (Done)**：详细列出已经修改的文件和通过的测试。
3. **当前上下文快照 (Context Snapshot)**：记录你目前脑子里的关键信息（例如：“发现了一个 bug，原因是组件渲染顺序不对，目前正在尝试使用
   React.memo 修复”）。
4. **待办清单 (Pending)**：下一步和未来需要做的事。

> **⚠️ 临时内存声明：** `PROGRESS.md` 仅作为跨会话的临时状态暂存盘（Swap File），严禁将其作为长期文档维护。

### 12.2 上下文刷新协议 (Context Flush Protocol)

1. 当你更新完 `PROGRESS.md` 后，必须向用户输出：
   `"⏸️ 任务已存档至 PROGRESS.md。当前上下文过长，建议您新建一个对话（New Chat），并在新对话中输入：请读取 PROGRESS.md 并继续任务。"`
2. **当你作为“新对话”被唤醒并要求继续任务时**，你的第一步动作必须是：完整读取 `PROGRESS.md`，恢复记忆，然后从“待办清单”的下一项继续执行。

### 12.3 任务收尾与垃圾回收 (Garbage Collection)

当 `PROGRESS.md` 中的终极目标全部完成，并准备进行最后的 `git commit` 时，必须执行以下收尾动作：

1. **状态沉淀**：如果开发过程中发现了需要长期记住的经验（如特定的环境坑点、架构改动），必须将其提炼并同步更新到 `docs/` 或
   `CLAUDE.md` 相应文档中。
2. **状态同步**：确保 OpenSpec 的 `tasks.md` 中对应的任务已勾选 `[x]`。
3. **销毁草稿**：执行 `rm PROGRESS.md` 删除该临时文件，保持项目根目录的整洁。

---

## 13. 领域知识与扩展规范路由表 (AI 按需读取)

> **⚠️ 注意**：为了不占用多余的上下文，AI 助手在平时只需遵循本 `CLAUDE.md`。但当遇到以下特定任务时，**必须主动读取对应的详细规范文件
**：

| 如果你的任务涉及...                 | 你必须先读取文件...        |
|-----------------------------|--------------------|
| 前后端接口对接、Axios 封装、查看后端返回格式   | `docs/API.md`      |
| 画布坐标计算、吸附算法、修改 Zustand 复杂状态 | `docs/DOMAIN.md`   |
| 新增富文本/HTML组件、涉及用户输入内容的渲染    | `docs/SECURITY.md` |

---

## 附录：核心类型速查

```typescript
// 组件节点（Canvas 上渲染的每个元素）
interface ComponentNode {
  id: string; // UUID v4
  type: ComponentType; // 'div' | 'button' | 'text' | 'image' | 'input' | 'radio' | 'checkbox' | 'tag'
  position: Position; // { x, y, width, height, zIndex }
  styles: ComponentStyles; // { backgroundColor, borderColor, ... }
  content: ComponentContent; // { text, src, placeholder, ... }
  animation?: AnimationConfig;
  children?: ComponentNode[];
}

interface Position {
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number; // 0-999
}
```
