# DragBuilder - 可视化编程工具

DragBuilder 是一个全栈前端拖拉式可视化编程工具，允许开发者通过类似 Figma 的自由画布快速构建 React 页面，并一键导出高质量代码。

## 项目结构

本项目采用前后端分离架构，包含三个子项目：

```
drag-builder/
├── drag-builder-react/    # 前端 React 应用
├── drag-builder-server/   # 后端 NestJS 服务
├── drag-builder-sql/      # 数据库脚本
└── .kiro/                 # Kiro 规范文档
    └── specs/
        └── drag-builder/
            ├── requirements.md  # 需求文档
            ├── design.md        # 设计文档
            └── tasks.md         # 实现计划
```

## 技术栈

### 前端 (drag-builder-react)
- **框架**: React 18.2+ with TypeScript
- **构建工具**: Vite 5.0+
- **样式**: Tailwind CSS 3.4+
- **状态管理**: Zustand 4.5+
- **拖拽引擎**: @dnd-kit/core 6.1+
- **动画**: Framer Motion 11.0+
- **代码高亮**: Prism.js 1.29+

### 后端 (drag-builder-server)
- **框架**: NestJS 10.0+ with TypeScript
- **ORM**: TypeORM 0.3+
- **验证**: class-validator + class-transformer
- **文档**: Swagger/OpenAPI

### 数据库 (drag-builder-sql)
- **数据库**: PostgreSQL 16+
- **连接信息**:
  - 用户: onism
  - 密码: 123456
  - 端口: 5432

## 快速开始

### 前置要求
- Node.js 18+
- PostgreSQL 16+
- pnpm (推荐) 或 npm

### 安装依赖

```bash
# 前端
cd drag-builder-react
pnpm install

# 后端
cd drag-builder-server
pnpm install
```

### 初始化数据库

```bash
# 连接到 PostgreSQL
psql -U onism -p 5432

# 执行初始化脚本
\i drag-builder-sql/init.sql

# 执行种子数据脚本（可选）
\i drag-builder-sql/seed.sql
```

### 启动开发服务器

```bash
# 启动后端服务 (端口 3000)
cd drag-builder-server
pnpm run start:dev

# 启动前端服务 (端口 5173)
cd drag-builder-react
pnpm run dev
```

访问 http://localhost:5173 开始使用 DragBuilder。

## 核心功能

### Phase 1 功能
- ✅ 无限画布系统（平移、缩放、网格）
- ✅ 物料库面板（5 个基础组件）
- ✅ 组件拖拽与布局
- ✅ 属性编辑面板（位置、样式、内容）
- ✅ 吸附辅助线系统
- ✅ 层级管理
- ✅ 代码生成与预览（TSX + Tailwind）
- ✅ 项目保存与加载（PostgreSQL）

### 基础组件
- **Div**: 容器组件
- **Button**: 按钮组件
- **Text**: 文本组件
- **Image**: 图片组件
- **Input**: 输入框组件

## UI 设计规范

DragBuilder 遵循 Linear/Vercel 风格的极简美学：

- **主背景**: 纯白 (#FFFFFF)
- **主色调**: 橙红色 (#C2410C)
- **文字颜色**: Slate-900 (#0F172A) / Slate-500 (#64748B)
- **边框**: 1px 极浅灰 (#F1F5F9)
- **圆角**: 16px (rounded-2xl)
- **阴影**: 极轻微 (shadow-sm)
- **毛玻璃效果**: backdrop-blur-lg + bg-white/80

## 开发指南

### 代码规范
- TypeScript 严格模式（禁止使用 any）
- 所有代码必须包含详尽的中文注释
- React 组件使用函数式组件 + Hooks
- NestJS 使用模块化架构

### 测试策略
- **单元测试**: 测试单个函数和组件
- **属性测试**: 测试通用属性（每个测试 100 次迭代）
- **集成测试**: 测试模块间协作
- **E2E 测试**: 测试完整用户流程

### Git 工作流
- `main`: 生产分支
- `develop`: 开发分支
- `feature/*`: 功能分支
- `bugfix/*`: 修复分支

## API 文档

后端 API 文档在开发模式下可通过以下地址访问：
- Swagger UI: http://localhost:3000/api/docs

### 主要端点
- `POST /api/projects` - 创建新项目
- `GET /api/projects` - 获取项目列表
- `GET /api/projects/:id` - 获取单个项目
- `PUT /api/projects/:id` - 更新项目
- `DELETE /api/projects/:id` - 删除项目

## 性能指标

- 画布渲染帧率: ≥30 FPS (50 个组件以内)
- API 响应时间: ≤500ms (P95)
- 前端首屏加载: ≤2s

## 浏览器兼容性

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

最小屏幕分辨率: 1280x720px

## 贡献指南

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 许可证

本项目采用 MIT 许可证。

## 联系方式

如有问题或建议，请通过以下方式联系：
- 提交 Issue
- 发送邮件至项目维护者

---

**注意**: 本项目目前处于 Phase 1 开发阶段，部分功能仍在开发中。
