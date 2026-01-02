# DragBuilder React 前端应用

这是 DragBuilder 的前端 React 应用，提供可视化拖拽编程界面。

## 技术栈

- **框架**: React 18.2+ with TypeScript
- **构建工具**: Vite 5.0+
- **样式**: Tailwind CSS 3.4+ (JIT 模式)
- **状态管理**: Zustand 4.5+
- **拖拽引擎**: @dnd-kit/core 6.1+
- **动画引擎**: Framer Motion 11.0+
- **代码高亮**: Prism.js 1.29+
- **HTTP 客户端**: Axios 1.6+

## 目录结构

```
drag-builder-react/
├── src/
│   ├── components/       # React 组件
│   ├── store/           # Zustand 状态管理
│   ├── types/           # TypeScript 类型定义
│   ├── utils/           # 工具函数
│   ├── api/             # API 请求封装
│   ├── hooks/           # 自定义 Hooks
│   ├── App.tsx          # 根组件
│   └── main.tsx         # 入口文件
├── public/              # 静态资源
├── index.html           # HTML 模板
├── vite.config.ts       # Vite 配置
├── tailwind.config.js   # Tailwind 配置
└── tsconfig.json        # TypeScript 配置
```

## 安装依赖

```bash
pnpm install
```

## 开发

```bash
pnpm run dev
```

应用将在 http://localhost:5173 启动。

## 构建

```bash
pnpm run build
```

构建产物将输出到 `dist/` 目录。

## 预览生产构建

```bash
pnpm run preview
```

## 代码规范

- TypeScript 严格模式（禁止使用 any）
- 所有代码必须包含详尽的中文注释
- 使用函数式组件 + Hooks API
- 遵循 Linear/Vercel 风格的 UI 设计规范

## 核心模块

### Canvas 画布系统
- 无限画布（平移、缩放）
- 网格背景
- 组件渲染引擎

### MaterialPanel 物料库
- 5 个基础组件
- 拖拽源实现

### PropertyPanel 属性面板
- 位置与尺寸编辑
- 样式配置
- 内容编辑
- 层级控制

### CodeGenerator 代码生成
- TSX 代码生成
- Tailwind 类名映射
- 语法高亮显示

## 状态管理

使用 Zustand 管理三个主要 Store：
- `canvasStore`: 画布状态（配置、缩放、平移）
- `componentStore`: 组件树状态（CRUD 操作）
- `uiStore`: UI 状态（模态框、Toast、加载）

## 性能优化

- React.memo 避免不必要的重渲染
- useCallback 和 useMemo 优化性能
- 虚拟化渲染（组件数量 > 50）
- 防抖和节流优化输入

## 测试

```bash
# 运行单元测试
pnpm run test

# 运行属性测试
pnpm run test:property

# 运行 E2E 测试
pnpm run test:e2e
```

## 环境变量

创建 `.env` 文件：

```env
VITE_API_URL=http://localhost:3000
```

---

**注意**: 本项目使用 Vite 作为构建工具，享受极速的 HMR 和开发体验。
