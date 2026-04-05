# drag-builder-react

DragBuilder 前端应用，基于 React 19 + Vite + TypeScript 构建的可视化拖拽页面编辑器。

## 项目介绍

DragBuilder 是一款所见即所得的可视化页面搭建工具，支持通过拖拽方式将组件放置到画布上，实时调整样式、位置和内容，并将项目保存到后端数据库。

### 主要功能

- 拖拽组件到画布（Div、Button、Text、Image、Input、Radio、Checkbox、Tag）
- 多选、批量移动、吸附辅助线（5px 阈值、20px 网格）
- 属性面板实时编辑样式与内容
- 画布尺寸预设（桌面 / 平板 / 移动端）及自定义尺寸
- 画布缩放（10%-200%）与平移
- 项目保存与加载（RESTful API）
- 撤销/重做（最多 50 步历史记录）
- 导出 React + Tailwind 代码
- 导出画布为 PNG 图片

## 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 19 | UI 框架 |
| Vite | 7 | 构建工具 |
| TypeScript | 5.9 | 类型系统 (strict) |
| Tailwind CSS | 4 | 样式框架 |
| Zustand | 5 | 全局状态管理 |
| Immer | 11 | 不可变状态更新 |
| @dnd-kit/core | 6 | 拖拽引擎 |
| framer-motion | 12 | 动画库 |
| react-router-dom | 7 | 路由 |
| axios | 1 | HTTP 请求 |
| lucide-react | — | 图标库 |
| Vitest | 4 | 单元测试 |
| fast-check | 4 | 基于属性的测试 |

## 安装和运行

### 前置要求

- Node.js >= 18
- npm >= 9
- 后端服务已启动（参考根目录 README.md）

### 安装依赖

```bash
cd drag-builder-react
npm install
```

### 启动开发服务器

```bash
npm run dev
```

默认访问地址：http://localhost:5173

### 构建生产版本

```bash
npm run build
```

产物输出到 `dist/` 目录。

### 类型检查

```bash
npm run typecheck
```

### 运行测试

```bash
# 单次运行所有测试
npm test

# 监听模式（文件变化自动重跑）
npm run test:watch

# 测试 UI 界面
npm run test:ui

# 生成覆盖率报告
npm run test:cov
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
```

## 目录结构

```
drag-builder-react/
├── src/
│   ├── api/                     # Axios 客户端与 API 方法
│   │   ├── client.ts            # Axios 实例（拦截器配置）
│   │   ├── projectApi.ts        # 项目 CRUD 操作
│   │   ├── errorHandler.ts      # API 错误解析与日志工具
│   │   └── index.ts
│   ├── assets/                  # 静态资源
│   ├── components/             # React 组件
│   │   ├── Canvas/              # 画布引擎
│   │   │   ├── Canvas.tsx        # 画布主组件
│   │   │   ├── ComponentNode.tsx # 组件节点渲染器
│   │   │   ├── ResizeHandles.tsx # 调整大小手柄
│   │   │   ├── SnappingGuides.tsx # 吸附辅助线
│   │   │   ├── CanvasGrid.tsx    # 画布网格背景
│   │   │   ├── DragGrid.tsx      # 拖拽网格
│   │   │   └── PositionTooltip.tsx # 位置提示
│   │   ├── MaterialPanel/        # 左侧组件物料库
│   │   │   └── MaterialPanel.tsx
│   │   ├── PropertyPanel/        # 右侧属性编辑面板
│   │   │   └── PropertyPanel.tsx
│   │   ├── Toolbar/              # 顶部工具栏
│   │   │   └── Toolbar.tsx
│   │   ├── Toast/                # 消息通知
│   │   │   └── Toast.tsx
│   │   ├── Modal/                # 模态框组件
│   │   │   ├── Modal.tsx          # 基础模态框
│   │   │   ├── CanvasSizeModal.tsx # 画布尺寸选择
│   │   ├── ProjectList/          # 项目列表
│   │   │   └── ProjectList.tsx
│   │   ├── CodePreview/          # 代码预览
│   │   │   └── CodePreview.tsx
│   │   ├── ErrorBoundary/        # 错误边界
│   │   │   └── ErrorBoundary.tsx
│   │   ├── ResponsiveGuard/      # 响应式守卫
│   │   │   └── ResponsiveGuard.tsx
│   │   ├── FeatureCard/          # 功能卡片
│   │   │   └── FeatureCard.tsx
│   │   ├── StarBorder/           # 装饰组件
│   │   │   └── StarBorder.tsx
│   │   ├── PixelSnow/            # 装饰组件
│   │   │   └── PixelSnow.tsx
│   │   ├── built-in/             # 内置组件注册
│   │   │   ├── Div.tsx, Button.tsx, Text.tsx... # 各组件定义文件
│   │   │   ├── index.ts          # 统一注册入口
│   │   │   └── utils.ts          # 内置组件工具函数
│   │   ├── adapters/             # 组件适配器
│   │   │   └── antd-adapter.tsx  # Ant Design 组件适配器
│   │   └── index.ts              # 组件统一导出
│   ├── hooks/                    # 自定义 React Hooks
│   │   ├── useKeyboardShortcuts.ts # 键盘快捷键
│   │   └── useApiErrorHandler.ts  # API 错误全局处理
│   ├── pages/                    # 页面组件
│   │   ├── HomePage.tsx          # 首页（项目列表）
│   │   └── EditorPage.tsx        # 编辑器主页面
│   ├── store/                    # Zustand 状态管理
│   │   ├── componentStore.ts     # 组件树状态（核心）
│   │   ├── canvasStore.ts        # 画布配置/缩放/平移
│   │   ├── uiStore.ts           # UI 状态（Toast/Modal/辅助线）
│   │   ├── colorHistoryStore.ts  # 颜色历史记录
│   │   ├── componentRegistry.ts  # 组件注册表（运行时注册/注销）
│   │   └── index.ts             # Store 统一导出
│   ├── types/                    # TypeScript 类型定义
│   │   ├── component.ts          # 组件节点类型
│   │   ├── canvas.ts            # 画布类型
│   │   ├── project.ts           # 项目类型
│   │   └── index.ts            # 类型统一导出
│   ├── utils/                    # 工具函数
│   │   ├── snapping.ts         # 吸附引擎（核心）
│   │   ├── multiSelectBounds.ts # 多选边界计算
│   │   ├── virtualCanvas.ts     # 虚拟画布/性能优化
│   │   ├── componentNesting.ts  # 组件嵌套处理
│   │   ├── codeGenerator.ts     # React 代码生成器
│   │   ├── timing.ts           # throttle / debounce
│   │   ├── colorUtils.ts       # 颜色工具函数
│   │   └── sanitization.ts     # XSS 防护工具
│   ├── App.tsx                  # 根组件 / 路由配置
│   ├── main.tsx                 # 入口文件
│   └── index.css               # Tailwind 入口样式
├── public/                      # 公共静态资源
├── cypress/                      # E2E 测试（Cypress）
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── eslint.config.js
├── .prettierrc
└── package.json
```

## 路由

| 路径 | 页面 | 说明 |
|------|------|------|
| `/` | HomePage | 项目列表，新建 / 打开 / 删除项目 |
| `/editor` | EditorPage | 拖拽画布编辑器（需较大屏幕，最小 1280×720） |

## 组件类型

### 支持的组件类型

| 类型 | 说明 | 关键属性 |
|------|------|---------|
| `div` | 容器组件 | backgroundColor, border, borderRadius, padding, shadow |
| `button` | 按钮组件 | text, backgroundColor, borderRadius |
| `text` | 文本组件 | text, fontSize, fontWeight, textColor |
| `image` | 图片组件 | src, alt, borderRadius |
| `input` | 输入框组件 | placeholder, textColor |
| `radio` | 单选组件 | options, textColor |
| `checkbox` | 多选组件 | options, textColor |
| `tag` | 标签组件 | text, backgroundColor, borderRadius |

### 组件节点数据结构

```typescript
interface ComponentNode {
  id: string;                    // UUID v4
  type: ComponentType;           // 组件类型
  position: {
    x: number;                   // 画布相对 X（px）
    y: number;                   // 画布相对 Y（px）
    width: number;               // 宽度（px）
    height: number;              // 高度（px）
    zIndex: number;              // 层级（0-999）
  };
  styles: {
    backgroundColor?: string;    // HEX
    borderColor?: string;        // HEX
    borderWidth?: number;        // px
    borderRadius?: number;       // px
    textColor?: string;          // HEX
    fontSize?: number;           // px
    fontWeight?: number;         // 100-900
    padding?: number;            // px
    shadow?: {
      x: number; y: number; blur: number; color: string;
    };
  };
  content: {
    text?: string;
    src?: string;
    placeholder?: string;
    alt?: string;
    options?: Array<{ id: string; label: string; checked: boolean; disabled?: boolean; }>;
  };
  animation?: {
    initial?: Record<string, string | number | boolean>;
    animate?: Record<string, string | number | boolean>;
    transition?: { duration: number; delay: number; ease: string; };
  };
  children?: ComponentNode[];    // 嵌套子组件（静态渲染）
}
```

## 状态管理

### Store 架构

```
┌─────────────────────────────────────────────────────┐
│                  componentStore                     │
│  - components: ComponentNode[] (扁平化存储)         │
│  - selectedId: string | null                        │
│  - selectedIds: string[] (多选)                    │
│  - history: HistorySnapshot[] (撤销/重做)           │
│  - clipboard: ComponentNode[] (复制/粘贴)           │
│                                                     │
│  操作: addComponent, updateComponent,              │
│        deleteComponent, selectComponent,           │
│        bringToFront, sendToBack, undo, redo        │
└─────────────────────────────────────────────────────┘
                          │
┌─────────────────────────┼─────────────────────────┐
│                         │                         │
▼                         ▼                         ▼
┌─────────────┐    ┌─────────────┐          ┌─────────────┐
│ canvasStore │    │   uiStore   │          │    ...      │
│             │    │             │          │             │
│ - config    │    │ - snapLines │          │             │
│ - zoom      │    │ - isDragging│          │             │
│ - pan       │    │ - toast     │          │             │
└─────────────┘    └─────────────┘          └─────────────┘
```

### componentStore（组件树状态）

管理画布上的所有组件节点、选中状态和历史记录。

**核心状态：**
- `components: ComponentNode[]` — 扁平化组件数组（唯一数据源）
- `selectedId: string | null` — 当前选中组件 ID
- `selectedIds: string[]` — 多选组件 ID 列表
- `history: HistorySnapshot[]` — 撤销/重做历史（最多 50 条）
- `historyIndex: number` — 当前历史位置
- `clipboard: ComponentNode[]` — 剪贴板

**核心操作：**
```typescript
// 添加组件
addComponent: (component: ComponentNode) => void;

// 更新组件属性
updateComponent: (id: string, updates: Partial<ComponentNode>) => void;

// 删除组件
deleteComponent: (id: string) => void;

// 选中组件
selectComponent: (id: string | null) => void;

// 切换选中（Ctrl + 点击）
toggleSelectComponent: (id: string) => void;

// 批量更新
updateMultipleComponents: (ids: string[], updates: Partial<ComponentNode>) => void;

// 层级操作
bringToFront: (id: string) => void;
sendToBack: (id: string) => void;

// 撤销/重做
undo: () => void;
redo: () => void;
```

### canvasStore（画布状态）

管理画布配置、缩放比例和平移偏移。

**核心状态：**
```typescript
config: {
  width: number;      // 画布宽度
  height: number;     // 画布高度
  preset: CanvasPreset;
  backgroundColor: string; // HEX
};
zoom: number;         // 缩放比例 (0.1 - 2.0)
pan: { x: number; y: number }; // 平移偏移
```

### uiStore（UI 状态）

管理 UI 交互状态，包括吸附辅助线、拖拽状态、Toast 通知等。

**核心状态：**
```typescript
snapLines: SnapLine[];              // 吸附辅助线
isDraggingComponent: boolean;        // 是否正在拖拽组件
isGridSnapEnabled: boolean;          // 是否启用网格吸附
dragPosition: Position | null;      // 拖拽时的位置
toast: ToastState | null;           // 当前 Toast
isCodePreviewOpen: boolean;         // 代码预览弹窗
isCanvasSizeModalOpen: boolean;     // 画布尺寸弹窗
```

## 吸附引擎

DragBuilder 使用自定义吸附引擎实现组件对齐功能。

### 吸附参数

| 参数 | 值 | 说明 |
|------|-----|------|
| 吸附阈值 | 5px | 组件边缘在此距离内自动吸附对齐 |
| 网格间距 | 20px | 网格吸附的间距 |
| 显示阈值 | 50px | 辅助线超过此距离才显示 |

### 吸附规则

1. **边缘吸附**：检测水平/垂直边缘与其他组件边缘的对齐
2. **中心吸附**：检测组件中心点与边缘/中心的对齐
3. **网格吸附**：当 `isGridSnapEnabled` 启用时，吸附到 20px 网格
4. **画布边界吸附**：组件边缘吸附到画布边界

## 开发指南

### 环境变量

在 `drag-builder-react/` 目录下创建 `.env.local`：

```env
# API 基础地址（默认 http://localhost:3000）
VITE_API_URL=http://localhost:3000
```

### 添加新组件类型

1. **扩展类型定义** (`src/types/component.ts`)：
   ```typescript
   export type ComponentType =
     | 'div' | 'button' | 'text' | 'image'
     | 'input' | 'radio' | 'checkbox' | 'tag'
     | 'your-new-component';  // 新增类型
   ```

2. **添加渲染逻辑** (`src/components/Canvas/ComponentNode.tsx`)：
   ```tsx
   switch (component.type) {
     case 'your-new-component':
       return <YourNewComponent component={component} />;
     // ...
   }
   ```

3. **添加入口** (`src/components/MaterialPanel/MaterialPanel.tsx`)：
   在物料面板中添加新组件的拖拽入口。

4. **添加属性编辑** (`src/components/PropertyPanel/PropertyPanel.tsx`)：
   在属性面板中添加新组件特有的属性编辑器。

### 关键实现注意事项

- **禁止直接操作 DOM 样式更新组件位置**：所有位置变化必须通过 `componentStore.updateComponent()` 更新 Store，再由 React 重新渲染。
- **使用 Immer 中间件**：所有 Store 更新必须通过 `set(state => { ... })` 进行不可变更新。
- **DndContext 事件统一在 EditorPage 处理**：拖拽事件的入口点在 `EditorPage.tsx` 中的 `DndContext`。

## 浏览器兼容性

| 浏览器 | 最低版本 |
|--------|----------|
| Chrome | 90+ |
| Firefox | 88+ |
| Safari | 14+ |
| Edge | 90+ |

**最低分辨率**：1280×720

编辑器页面 (`/editor`) 强制要求较大屏幕，较小的屏幕会显示响应式提示。
