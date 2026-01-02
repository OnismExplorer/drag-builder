# 设计文档 - DragBuilder 可视化编程工具

## 概述

DragBuilder 是一个全栈可视化编程工具，采用前后端分离架构。前端使用 React 18 + TypeScript + Tailwind CSS 构建无限画布交互系统，后端使用 NestJS + TypeORM 提供 RESTful API 服务，数据持久化到 PostgreSQL 数据库。

本设计文档详细描述系统的技术架构、核心模块设计、数据流转逻辑以及代码生成引擎的实现方案。

### 设计目标

1. **极简美学**：遵循 Linear/Vercel 风格，使用 Slate 色系和大留白设计
2. **高性能交互**：画布操作保持 30+ FPS，属性更新延迟 <100ms
3. **类型安全**：全栈 TypeScript 严格模式，确保编译时类型检查
4. **可扩展性**：组件系统支持插件化扩展，预留 Ant Design 集成接口
5. **代码质量**：生成符合 React 最佳实践的 TSX 代码

---

## 系统架构

### 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                        客户端层                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              React 应用 (Vite)                        │  │
│  │                                                        │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐           │  │
│  │  │ Material │  │  Canvas  │  │Property  │           │  │
│  │  │  Panel   │  │  Engine  │  │  Panel   │           │  │
│  │  └──────────┘  └──────────┘  └──────────┘           │  │
│  │        │              │              │                │  │
│  │        └──────────────┼──────────────┘                │  │
│  │                       ↓                                │  │
│  │            ┌─────────────────────┐                    │  │
│  │            │   Zustand Store     │                    │  │
│  │            │  (全局状态管理)      │                    │  │
│  │            └─────────────────────┘                    │  │
│  │                       │                                │  │
│  │         ┌─────────────┴─────────────┐                 │  │
│  │         ↓                           ↓                 │  │
│  │  ┌─────────────┐           ┌─────────────┐           │  │
│  │  │Code Generator│           │Animation Eng│           │  │
│  │  └─────────────┘           └─────────────┘           │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                          │ HTTP/REST
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                        服务端层                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              NestJS 应用                              │  │
│  │                                                        │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐           │  │
│  │  │ Project  │  │  Export  │  │  Health  │           │  │
│  │  │  Module  │  │  Module  │  │  Module  │           │  │
│  │  └──────────┘  └──────────┘  └──────────┘           │  │
│  │        │              │              │                │  │
│  │        └──────────────┼──────────────┘                │  │
│  │                       ↓                                │  │
│  │            ┌─────────────────────┐                    │  │
│  │            │      TypeORM        │                    │  │
│  │            └─────────────────────┘                    │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                          │ SQL
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                      数据持久层                              │
│                   PostgreSQL 16+                            │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  projects 表                                          │  │
│  │  - id (UUID)                                          │  │
│  │  - name (VARCHAR)                                     │  │
│  │  - canvas_config (JSONB)                              │  │
│  │  - components_tree (JSONB)                            │  │
│  │  - created_at / updated_at (TIMESTAMP)                │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```



### 技术栈选型

#### 前端技术栈
- **框架**：React 18.2+ (使用 Hooks API)
- **构建工具**：Vite 5.0+ (快速开发服务器和 HMR)
- **语言**：TypeScript 5.0+ (严格模式)
- **样式**：Tailwind CSS 3.4+ (JIT 模式)
- **状态管理**：Zustand 4.5+ (轻量级状态管理)
- **拖拽引擎**：@dnd-kit/core 6.1+ (现代化拖拽库)
- **动画引擎**：Framer Motion 11.0+ (声明式动画)
- **代码高亮**：Prism.js 1.29+ (语法高亮)
- **HTTP 客户端**：Axios 1.6+ (请求拦截和错误处理)

#### 后端技术栈
- **框架**：NestJS 10.0+ (企业级 Node.js 框架)
- **语言**：TypeScript 5.0+ (严格模式)
- **ORM**：TypeORM 0.3+ (支持 PostgreSQL)
- **验证**：class-validator + class-transformer (DTO 验证)
- **文档**：Swagger/OpenAPI (自动生成 API 文档)

#### 数据库
- **数据库**：PostgreSQL 16+ (支持 JSONB 类型)
- **连接池**：pg (Node.js PostgreSQL 驱动)

---

## 前端架构设计

### 目录结构

```
drag-builder-react/
├── src/
│   ├── components/           # React 组件
│   │   ├── Canvas/           # 画布组件
│   │   │   ├── Canvas.tsx
│   │   │   ├── CanvasGrid.tsx
│   │   │   ├── ComponentNode.tsx
│   │   │   ├── SelectionBox.tsx
│   │   │   └── SnappingGuides.tsx
│   │   ├── MaterialPanel/    # 物料库面板
│   │   │   ├── MaterialPanel.tsx
│   │   │   ├── MaterialItem.tsx
│   │   │   └── materialConfig.ts
│   │   ├── PropertyPanel/    # 属性编辑面板
│   │   │   ├── PropertyPanel.tsx
│   │   │   ├── PositionEditor.tsx
│   │   │   ├── StyleEditor.tsx
│   │   │   ├── ContentEditor.tsx
│   │   │   └── LayerControl.tsx
│   │   ├── CodePreview/      # 代码预览
│   │   │   ├── CodePreview.tsx
│   │   │   └── CodeGenerator.ts
│   │   ├── Toolbar/          # 顶部工具栏
│   │   │   ├── Toolbar.tsx
│   │   │   └── ZoomControl.tsx
│   │   ├── Modal/            # 模态框组件
│   │   │   ├── CanvasSizeModal.tsx
│   │   │   └── Modal.tsx
│   │   └── Toast/            # 提示组件
│   │       └── Toast.tsx
│   ├── store/                # Zustand 状态管理
│   │   ├── canvasStore.ts    # 画布状态
│   │   ├── componentStore.ts # 组件树状态
│   │   └── uiStore.ts        # UI 状态
│   ├── types/                # TypeScript 类型定义
│   │   ├── canvas.ts
│   │   ├── component.ts
│   │   └── project.ts
│   ├── utils/                # 工具函数
│   │   ├── geometry.ts       # 几何计算
│   │   ├── snapping.ts       # 吸附算法
│   │   └── codeGenerator.ts  # 代码生成
│   ├── api/                  # API 请求封装
│   │   ├── client.ts         # Axios 实例
│   │   └── projectApi.ts     # 项目 API
│   ├── hooks/                # 自定义 Hooks
│   │   ├── useDragAndDrop.ts
│   │   ├── useKeyboard.ts
│   │   └── useCanvas.ts
│   ├── App.tsx               # 根组件
│   ├── main.tsx              # 入口文件
│   └── index.css             # 全局样式
├── public/
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── package.json
```



### 核心数据模型（DSL）

#### ComponentNode 接口

```typescript
/**
 * 组件节点 - 画布上的可视化元素
 */
interface ComponentNode {
  id: string;                    // UUID v4
  type: ComponentType;           // 组件类型
  position: Position;            // 位置和尺寸
  styles: ComponentStyles;       // 样式配置
  content: ComponentContent;     // 内容配置
  animation?: AnimationConfig;   // 动画配置（可选）
  children?: ComponentNode[];    // 子组件（支持嵌套）
}

/**
 * 组件类型枚举
 */
type ComponentType = 'div' | 'button' | 'text' | 'image' | 'input';

/**
 * 位置和尺寸
 */
interface Position {
  x: number;        // 画布相对 X 坐标（px）
  y: number;        // 画布相对 Y 坐标（px）
  width: number;    // 宽度（px）
  height: number;   // 高度（px）
  zIndex: number;   // 层级（0-999）
}

/**
 * 样式配置
 */
interface ComponentStyles {
  backgroundColor?: string;  // 背景色（HEX）
  borderColor?: string;      // 边框颜色（HEX）
  borderWidth?: number;      // 边框宽度（px）
  borderRadius?: number;     // 圆角（px）
  textColor?: string;        // 文字颜色（HEX）
  fontSize?: number;         // 字体大小（px）
  fontWeight?: number;       // 字体粗细（100-900）
  padding?: number;          // 内边距（px）
  shadow?: ShadowConfig;     // 阴影配置
}

/**
 * 阴影配置
 */
interface ShadowConfig {
  x: number;        // X 偏移（px）
  y: number;        // Y 偏移（px）
  blur: number;     // 模糊半径（px）
  color: string;    // 阴影颜色（HEX）
}

/**
 * 内容配置
 */
interface ComponentContent {
  text?: string;         // 文本内容
  src?: string;          // 图片 URL
  placeholder?: string;  // 占位符文本
  alt?: string;          // 图片替代文本
}

/**
 * 动画配置（Framer Motion）
 */
interface AnimationConfig {
  initial?: Record<string, any>;   // 初始状态
  animate?: Record<string, any>;   // 动画目标状态
  transition?: {
    duration: number;   // 持续时间（秒）
    delay: number;      // 延迟时间（秒）
    ease: string;       // 缓动函数
  };
}
```

#### CanvasState 接口

```typescript
/**
 * 画布状态
 */
interface CanvasState {
  config: CanvasConfig;           // 画布配置
  components: ComponentNode[];    // 组件树（扁平化存储）
  selectedId: string | null;      // 当前选中组件 ID
  zoom: number;                   // 缩放比例（0.1 - 2.0）
  pan: { x: number; y: number };  // 平移偏移量
}

/**
 * 画布配置
 */
interface CanvasConfig {
  width: number;           // 画布宽度（px）
  height: number;          // 画布高度（px）
  preset: CanvasPreset;    // 预设规格
  backgroundColor: string; // 背景色（HEX）
}

/**
 * 画布预设规格
 */
type CanvasPreset = 'mobile' | 'tablet' | 'desktop' | 'custom';

/**
 * 预设尺寸映射
 */
const CANVAS_PRESETS: Record<CanvasPreset, { width: number; height: number }> = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1440, height: 900 },
  custom: { width: 800, height: 600 }, // 默认值
};
```

#### Project 接口

```typescript
/**
 * 项目数据结构
 */
interface Project {
  id: string;                      // UUID v4
  name: string;                    // 项目名称
  canvasConfig: CanvasConfig;      // 画布配置
  componentsTree: ComponentNode[]; // 组件树
  createdAt: string;               // 创建时间（ISO 8601）
  updatedAt: string;               // 更新时间（ISO 8601）
}
```



### 状态管理设计（Zustand）

#### canvasStore - 画布状态管理

```typescript
/**
 * 画布状态 Store
 * 管理画布配置、缩放、平移等全局状态
 */
interface CanvasStore {
  // 状态
  config: CanvasConfig;
  zoom: number;
  pan: { x: number; y: number };
  
  // 操作方法
  setConfig: (config: CanvasConfig) => void;
  setZoom: (zoom: number) => void;
  setPan: (pan: { x: number; y: number }) => void;
  resetCanvas: () => void;
}

// 实现要点：
// 1. 使用 immer 中间件确保不可变更新
// 2. 缩放范围限制在 0.1 - 2.0
// 3. 提供 persist 中间件支持本地存储
```

#### componentStore - 组件树状态管理

```typescript
/**
 * 组件树状态 Store
 * 管理所有组件节点、选中状态、CRUD 操作
 */
interface ComponentStore {
  // 状态
  components: ComponentNode[];
  selectedId: string | null;
  
  // 查询方法
  getComponentById: (id: string) => ComponentNode | undefined;
  getSelectedComponent: () => ComponentNode | undefined;
  
  // 操作方法
  addComponent: (component: ComponentNode) => void;
  updateComponent: (id: string, updates: Partial<ComponentNode>) => void;
  deleteComponent: (id: string) => void;
  selectComponent: (id: string | null) => void;
  
  // 层级操作
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;
  moveUp: (id: string) => void;
  moveDown: (id: string) => void;
  
  // 批量操作
  clearAll: () => void;
  importComponents: (components: ComponentNode[]) => void;
}

// 实现要点：
// 1. 组件使用扁平化存储（避免深层嵌套）
// 2. 使用 Map 数据结构优化查询性能
// 3. 层级操作需要重新计算所有 zIndex
```

#### uiStore - UI 状态管理

```typescript
/**
 * UI 状态 Store
 * 管理模态框、Toast、加载状态等 UI 交互
 */
interface UIStore {
  // 状态
  isCodePreviewOpen: boolean;
  isCanvasSizeModalOpen: boolean;
  toast: ToastState | null;
  isLoading: boolean;
  
  // 操作方法
  openCodePreview: () => void;
  closeCodePreview: () => void;
  openCanvasSizeModal: () => void;
  closeCanvasSizeModal: () => void;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
  hideToast: () => void;
  setLoading: (loading: boolean) => void;
}

interface ToastState {
  message: string;
  type: 'success' | 'error' | 'info';
  timestamp: number;
}
```



### 核心组件设计

#### Canvas 组件 - 画布引擎

**职责**：
- 渲染所有组件节点
- 处理画布平移和缩放
- 管理选中状态
- 显示网格背景

**关键实现**：

```typescript
/**
 * Canvas 组件
 * 使用 transform 实现缩放和平移
 */
const Canvas: React.FC = () => {
  const { config, zoom, pan } = useCanvasStore();
  const { components, selectedId, selectComponent } = useComponentStore();
  
  // 画布容器样式（应用缩放和平移）
  const canvasStyle = {
    transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
    width: config.width,
    height: config.height,
    backgroundColor: config.backgroundColor,
  };
  
  // 处理画布点击（取消选中）
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      selectComponent(null);
    }
  };
  
  return (
    <div className="canvas-container" onClick={handleCanvasClick}>
      <CanvasGrid zoom={zoom} />
      <div className="canvas-content" style={canvasStyle}>
        {components.map(component => (
          <ComponentNode
            key={component.id}
            component={component}
            isSelected={component.id === selectedId}
          />
        ))}
      </div>
      {selectedId && <SelectionBox />}
      <SnappingGuides />
    </div>
  );
};
```

**性能优化**：
- 使用 `React.memo` 避免不必要的重渲染
- 使用 CSS `transform` 而非 `left/top` 实现平移（GPU 加速）
- 组件超过 50 个时启用虚拟化渲染（react-window）

#### ComponentNode 组件 - 组件节点渲染器

**职责**：
- 根据 DSL 渲染对应的 HTML 元素
- 处理拖拽移动
- 处理尺寸调整
- 显示选中边框和调整手柄

**关键实现**：

```typescript
/**
 * ComponentNode 组件
 * 动态渲染不同类型的组件
 */
const ComponentNode: React.FC<Props> = ({ component, isSelected }) => {
  const { updateComponent } = useComponentStore();
  const { sensors, listeners } = useDraggable({ id: component.id });
  
  // 根据类型渲染不同元素
  const renderContent = () => {
    switch (component.type) {
      case 'div':
        return <div className={getClassName(component.styles)} />;
      case 'button':
        return <button className={getClassName(component.styles)}>
          {component.content.text || 'Button'}
        </button>;
      case 'text':
        return <p className={getClassName(component.styles)}>
          {component.content.text || 'Text'}
        </p>;
      case 'image':
        return <img 
          src={component.content.src || '/placeholder.png'} 
          alt={component.content.alt}
          className={getClassName(component.styles)}
        />;
      case 'input':
        return <input 
          placeholder={component.content.placeholder}
          className={getClassName(component.styles)}
        />;
    }
  };
  
  return (
    <div
      className="component-node"
      style={{
        position: 'absolute',
        left: component.position.x,
        top: component.position.y,
        width: component.position.width,
        height: component.position.height,
        zIndex: component.position.zIndex,
      }}
      {...listeners}
    >
      {renderContent()}
      {isSelected && <ResizeHandles />}
    </div>
  );
};
```

**拖拽实现**：
- 使用 `@dnd-kit/core` 的 `useDraggable` Hook
- 拖拽时显示半透明预览
- 按住 Shift 键锁定水平/垂直方向

#### MaterialPanel 组件 - 物料库面板

**职责**：
- 展示可拖拽的组件列表
- 提供组件预览
- 处理拖拽源逻辑

**关键实现**：

```typescript
/**
 * MaterialPanel 组件
 * 使用毛玻璃效果的固定侧边栏
 */
const MaterialPanel: React.FC = () => {
  const materials: MaterialConfig[] = [
    { type: 'div', label: '容器', icon: '□' },
    { type: 'button', label: '按钮', icon: '▭' },
    { type: 'text', label: '文本', icon: 'T' },
    { type: 'image', label: '图片', icon: '🖼' },
    { type: 'input', label: '输入框', icon: '⎯' },
  ];
  
  return (
    <div className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-[280px] 
                    bg-white/80 backdrop-blur-lg border-r border-slate-200">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-slate-900 tracking-tight mb-4">
          组件库
        </h2>
        <div className="space-y-2">
          {materials.map(material => (
            <MaterialItem key={material.type} config={material} />
          ))}
        </div>
      </div>
    </div>
  );
};
```

**样式规范**：
- 使用 `backdrop-blur-lg` 实现毛玻璃效果
- 使用 `bg-white/80` 实现半透明背景
- 边框使用 `border-slate-200`（1px 极浅灰）
- 标题使用 `tracking-tight` 收紧字间距



#### PropertyPanel 组件 - 属性编辑面板

**职责**：
- 展示选中组件的属性
- 提供实时编辑功能
- 处理层级控制

**关键实现**：

```typescript
/**
 * PropertyPanel 组件
 * 右侧固定面板，使用防抖优化性能
 */
const PropertyPanel: React.FC = () => {
  const { getSelectedComponent, updateComponent } = useComponentStore();
  const component = getSelectedComponent();
  
  // 使用防抖优化输入性能（300ms）
  const debouncedUpdate = useMemo(
    () => debounce((id: string, updates: Partial<ComponentNode>) => {
      updateComponent(id, updates);
    }, 300),
    [updateComponent]
  );
  
  if (!component) {
    return (
      <div className="fixed right-0 top-16 h-[calc(100vh-4rem)] w-[320px] 
                      bg-white/80 backdrop-blur-lg border-l border-slate-200">
        <div className="flex items-center justify-center h-full">
          <p className="text-slate-500">请选择一个组件</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="fixed right-0 top-16 h-[calc(100vh-4rem)] w-[320px] 
                    bg-white/80 backdrop-blur-lg border-l border-slate-200 
                    overflow-y-auto">
      <div className="p-6 space-y-6">
        {/* 位置与尺寸 */}
        <PositionEditor component={component} onUpdate={debouncedUpdate} />
        
        {/* 样式配置 */}
        <StyleEditor component={component} onUpdate={debouncedUpdate} />
        
        {/* 内容配置 */}
        <ContentEditor component={component} onUpdate={debouncedUpdate} />
        
        {/* 层级控制 */}
        <LayerControl componentId={component.id} />
      </div>
    </div>
  );
};
```

**子组件设计**：

1. **PositionEditor** - 位置和尺寸编辑
   - 输入框：X, Y, Width, Height
   - 实时验证（最小值 0，最大值 5000）
   - 支持键盘方向键微调（±1px）

2. **StyleEditor** - 样式编辑
   - 颜色选择器（背景色、边框色、文字色）
   - 数值输入（边框宽度、圆角、字体大小）
   - 预设色板（Slate 系列 + 主色调 #C2410C）

3. **ContentEditor** - 内容编辑
   - 文本输入框（Text/Button 组件）
   - URL 输入框（Image 组件）
   - 占位符输入框（Input 组件）

4. **LayerControl** - 层级控制
   - 四个按钮：置于顶层、上移一层、下移一层、置于底层
   - 使用图标按钮（↑↑ ↑ ↓ ↓↓）
   - 按钮样式：`bg-slate-100 hover:bg-slate-200 rounded-lg p-2`

#### CodePreview 组件 - 代码预览窗口

**职责**：
- 生成 TSX 代码
- 语法高亮显示
- 提供复制功能

**关键实现**：

```typescript
/**
 * CodePreview 组件
 * 模态窗口展示生成的代码
 */
const CodePreview: React.FC = () => {
  const { isCodePreviewOpen, closeCodePreview } = useUIStore();
  const { components } = useComponentStore();
  const { config } = useCanvasStore();
  
  // 生成代码
  const generatedCode = useMemo(() => {
    return generateTSXCode(components, config);
  }, [components, config]);
  
  // 复制到剪贴板
  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedCode);
    showToast('代码已复制到剪贴板', 'success');
  };
  
  if (!isCodePreviewOpen) return null;
  
  return (
    <Modal onClose={closeCodePreview} size="large">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-slate-900 tracking-tight">
            生成的代码
          </h2>
          <button
            onClick={handleCopy}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg 
                       hover:bg-orange-700 transition-colors"
          >
            复制代码
          </button>
        </div>
        
        <pre className="bg-slate-50 rounded-2xl p-6 overflow-x-auto">
          <code className="language-tsx">
            {generatedCode}
          </code>
        </pre>
      </div>
    </Modal>
  );
};
```



### 代码生成引擎设计

#### 代码生成器架构

```typescript
/**
 * 代码生成器
 * 将 DSL 转换为标准 React TSX 代码
 */
class CodeGenerator {
  /**
   * 生成完整的 TSX 文件代码
   */
  generateTSXCode(
    components: ComponentNode[], 
    config: CanvasConfig
  ): string {
    const imports = this.generateImports();
    const componentCode = this.generateComponent(components, config);
    const exports = this.generateExports();
    
    return `${imports}\n\n${componentCode}\n\n${exports}`;
  }
  
  /**
   * 生成 import 语句
   */
  private generateImports(): string {
    return `import React from 'react';`;
  }
  
  /**
   * 生成组件代码
   */
  private generateComponent(
    components: ComponentNode[], 
    config: CanvasConfig
  ): string {
    const componentName = 'GeneratedPage';
    const jsx = this.generateJSX(components);
    
    return `
const ${componentName}: React.FC = () => {
  return (
    <div 
      className="relative"
      style={{
        width: '${config.width}px',
        height: '${config.height}px',
        backgroundColor: '${config.backgroundColor}',
      }}
    >
      ${jsx}
    </div>
  );
};`;
  }
  
  /**
   * 生成 JSX 代码（递归处理组件树）
   */
  private generateJSX(components: ComponentNode[]): string {
    return components
      .sort((a, b) => a.position.zIndex - b.position.zIndex)
      .map(component => this.generateComponentJSX(component))
      .join('\n      ');
  }
  
  /**
   * 生成单个组件的 JSX
   */
  private generateComponentJSX(component: ComponentNode): string {
    const style = this.generateInlineStyle(component);
    const className = this.generateClassName(component);
    const content = this.generateContent(component);
    
    switch (component.type) {
      case 'div':
        return `<div className="${className}" style={${style}}>${content}</div>`;
      case 'button':
        return `<button className="${className}" style={${style}}>${content}</button>`;
      case 'text':
        return `<p className="${className}" style={${style}}>${content}</p>`;
      case 'image':
        return `<img src="${component.content.src}" alt="${component.content.alt}" className="${className}" style={${style}} />`;
      case 'input':
        return `<input placeholder="${component.content.placeholder}" className="${className}" style={${style}} />`;
    }
  }
  
  /**
   * 生成内联样式对象
   */
  private generateInlineStyle(component: ComponentNode): string {
    const { position, styles } = component;
    
    const styleObj = {
      position: 'absolute',
      left: `${position.x}px`,
      top: `${position.y}px`,
      width: `${position.width}px`,
      height: `${position.height}px`,
      zIndex: position.zIndex,
      backgroundColor: styles.backgroundColor,
      borderColor: styles.borderColor,
      borderWidth: styles.borderWidth ? `${styles.borderWidth}px` : undefined,
      borderRadius: styles.borderRadius ? `${styles.borderRadius}px` : undefined,
      color: styles.textColor,
      fontSize: styles.fontSize ? `${styles.fontSize}px` : undefined,
      fontWeight: styles.fontWeight,
      padding: styles.padding ? `${styles.padding}px` : undefined,
    };
    
    // 过滤 undefined 值
    const filteredStyle = Object.entries(styleObj)
      .filter(([_, value]) => value !== undefined)
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
    
    return JSON.stringify(filteredStyle, null, 2);
  }
  
  /**
   * 生成 Tailwind 类名
   */
  private generateClassName(component: ComponentNode): string {
    const classes: string[] = [];
    
    // 基础类名
    if (component.type === 'button') {
      classes.push('cursor-pointer', 'transition-colors');
    }
    
    // 根据样式生成 Tailwind 类名
    if (component.styles.borderRadius) {
      const rounded = this.mapBorderRadiusToTailwind(component.styles.borderRadius);
      classes.push(rounded);
    }
    
    return classes.join(' ');
  }
  
  /**
   * 映射圆角值到 Tailwind 类名
   */
  private mapBorderRadiusToTailwind(radius: number): string {
    if (radius <= 4) return 'rounded';
    if (radius <= 8) return 'rounded-lg';
    if (radius <= 16) return 'rounded-2xl';
    return 'rounded-3xl';
  }
  
  /**
   * 生成组件内容
   */
  private generateContent(component: ComponentNode): string {
    return component.content.text || '';
  }
  
  /**
   * 生成 export 语句
   */
  private generateExports(): string {
    return `export default GeneratedPage;`;
  }
}
```

**代码生成策略**：
1. **内联样式优先**：位置和尺寸使用内联样式（精确控制）
2. **Tailwind 辅助**：通用样式使用 Tailwind 类名（减少代码量）
3. **格式化**：使用 Prettier 格式化生成的代码
4. **类型安全**：生成的代码包含完整的 TypeScript 类型注解



### 吸附算法设计

#### 吸附检测逻辑

```typescript
/**
 * 吸附引擎
 * 检测组件对齐关系并提供吸附功能
 */
class SnappingEngine {
  private readonly SNAP_THRESHOLD = 5; // 吸附阈值（px）
  
  /**
   * 检测吸附点
   * @param movingComponent 正在移动的组件
   * @param otherComponents 其他组件
   * @returns 吸附信息
   */
  detectSnapping(
    movingComponent: ComponentNode,
    otherComponents: ComponentNode[]
  ): SnappingResult {
    const snapLines: SnapLine[] = [];
    let snapX: number | null = null;
    let snapY: number | null = null;
    
    const movingRect = this.getRect(movingComponent);
    
    for (const other of otherComponents) {
      if (other.id === movingComponent.id) continue;
      
      const otherRect = this.getRect(other);
      
      // 检测水平对齐
      const horizontalSnap = this.checkHorizontalAlignment(movingRect, otherRect);
      if (horizontalSnap) {
        snapLines.push(horizontalSnap.line);
        snapX = horizontalSnap.snapPosition;
      }
      
      // 检测垂直对齐
      const verticalSnap = this.checkVerticalAlignment(movingRect, otherRect);
      if (verticalSnap) {
        snapLines.push(verticalSnap.line);
        snapY = verticalSnap.snapPosition;
      }
    }
    
    return { snapLines, snapX, snapY };
  }
  
  /**
   * 检测水平对齐（左对齐、右对齐、水平居中）
   */
  private checkHorizontalAlignment(
    moving: Rect,
    other: Rect
  ): SnapResult | null {
    // 左对齐
    if (Math.abs(moving.left - other.left) < this.SNAP_THRESHOLD) {
      return {
        line: {
          type: 'vertical',
          position: other.left,
          start: Math.min(moving.top, other.top),
          end: Math.max(moving.bottom, other.bottom),
        },
        snapPosition: other.left,
      };
    }
    
    // 右对齐
    if (Math.abs(moving.right - other.right) < this.SNAP_THRESHOLD) {
      return {
        line: {
          type: 'vertical',
          position: other.right,
          start: Math.min(moving.top, other.top),
          end: Math.max(moving.bottom, other.bottom),
        },
        snapPosition: other.right - moving.width,
      };
    }
    
    // 水平居中对齐
    const movingCenterX = moving.left + moving.width / 2;
    const otherCenterX = other.left + other.width / 2;
    if (Math.abs(movingCenterX - otherCenterX) < this.SNAP_THRESHOLD) {
      return {
        line: {
          type: 'vertical',
          position: otherCenterX,
          start: Math.min(moving.top, other.top),
          end: Math.max(moving.bottom, other.bottom),
        },
        snapPosition: otherCenterX - moving.width / 2,
      };
    }
    
    return null;
  }
  
  /**
   * 检测垂直对齐（顶部对齐、底部对齐、垂直居中）
   */
  private checkVerticalAlignment(
    moving: Rect,
    other: Rect
  ): SnapResult | null {
    // 顶部对齐
    if (Math.abs(moving.top - other.top) < this.SNAP_THRESHOLD) {
      return {
        line: {
          type: 'horizontal',
          position: other.top,
          start: Math.min(moving.left, other.left),
          end: Math.max(moving.right, other.right),
        },
        snapPosition: other.top,
      };
    }
    
    // 底部对齐
    if (Math.abs(moving.bottom - other.bottom) < this.SNAP_THRESHOLD) {
      return {
        line: {
          type: 'horizontal',
          position: other.bottom,
          start: Math.min(moving.left, other.left),
          end: Math.max(moving.right, other.right),
        },
        snapPosition: other.bottom - moving.height,
      };
    }
    
    // 垂直居中对齐
    const movingCenterY = moving.top + moving.height / 2;
    const otherCenterY = other.top + other.height / 2;
    if (Math.abs(movingCenterY - otherCenterY) < this.SNAP_THRESHOLD) {
      return {
        line: {
          type: 'horizontal',
          position: otherCenterY,
          start: Math.min(moving.left, other.left),
          end: Math.max(moving.right, other.right),
        },
        snapPosition: otherCenterY - moving.height / 2,
      };
    }
    
    return null;
  }
  
  /**
   * 获取组件的矩形边界
   */
  private getRect(component: ComponentNode): Rect {
    return {
      left: component.position.x,
      top: component.position.y,
      right: component.position.x + component.position.width,
      bottom: component.position.y + component.position.height,
      width: component.position.width,
      height: component.position.height,
    };
  }
}

interface Rect {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

interface SnapLine {
  type: 'horizontal' | 'vertical';
  position: number;
  start: number;
  end: number;
}

interface SnapResult {
  line: SnapLine;
  snapPosition: number;
}

interface SnappingResult {
  snapLines: SnapLine[];
  snapX: number | null;
  snapY: number | null;
}
```

**吸附渲染**：
- 使用 SVG 绘制辅助线（性能更好）
- 辅助线颜色：`#EC4899`（粉色）
- 辅助线宽度：1px
- 拖拽结束后立即隐藏



---

## 后端架构设计

### 目录结构

```
drag-builder-server/
├── src/
│   ├── modules/              # 业务模块
│   │   ├── project/          # 项目模块
│   │   │   ├── project.controller.ts
│   │   │   ├── project.service.ts
│   │   │   ├── project.entity.ts
│   │   │   ├── project.dto.ts
│   │   │   └── project.module.ts
│   │   ├── export/           # 导出模块
│   │   │   ├── export.controller.ts
│   │   │   ├── export.service.ts
│   │   │   └── export.module.ts
│   │   └── health/           # 健康检查模块
│   │       ├── health.controller.ts
│   │       └── health.module.ts
│   ├── common/               # 公共模块
│   │   ├── filters/          # 异常过滤器
│   │   │   └── http-exception.filter.ts
│   │   ├── interceptors/     # 拦截器
│   │   │   └── logging.interceptor.ts
│   │   └── pipes/            # 管道
│   │       └── validation.pipe.ts
│   ├── config/               # 配置
│   │   ├── database.config.ts
│   │   └── app.config.ts
│   ├── app.module.ts         # 根模块
│   └── main.ts               # 入口文件
├── test/                     # 测试文件
├── .env                      # 环境变量
├── .env.example              # 环境变量示例
├── nest-cli.json
├── tsconfig.json
└── package.json
```

### 数据库实体设计

#### Project Entity

```typescript
/**
 * 项目实体
 * 使用 JSONB 存储 DSL 数据
 */
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('projects')
export class ProjectEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  
  @Column({ type: 'varchar', length: 255 })
  name: string;
  
  @Column({ type: 'jsonb' })
  canvasConfig: {
    width: number;
    height: number;
    preset: string;
    backgroundColor: string;
  };
  
  @Column({ type: 'jsonb' })
  componentsTree: any[]; // ComponentNode[]
  
  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;
  
  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
```

**索引设计**：
- `name` 字段：B-tree 索引（支持模糊搜索）
- `created_at` 字段：B-tree 索引（支持时间排序）
- `components_tree` 字段：GIN 索引（支持 JSONB 查询）

### DTO 设计

#### CreateProjectDto

```typescript
/**
 * 创建项目 DTO
 * 使用 class-validator 进行验证
 */
import { IsString, IsNotEmpty, IsObject, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class CanvasConfigDto {
  @IsNumber()
  @Min(100)
  @Max(5000)
  width: number;
  
  @IsNumber()
  @Min(100)
  @Max(5000)
  height: number;
  
  @IsString()
  @IsIn(['mobile', 'tablet', 'desktop', 'custom'])
  preset: string;
  
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/)
  backgroundColor: string;
}

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;
  
  @IsObject()
  @ValidateNested()
  @Type(() => CanvasConfigDto)
  canvasConfig: CanvasConfigDto;
  
  @IsArray()
  componentsTree: any[]; // 简化验证，实际应该验证每个组件节点
}
```

#### UpdateProjectDto

```typescript
/**
 * 更新项目 DTO
 * 所有字段可选
 */
export class UpdateProjectDto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  name?: string;
  
  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => CanvasConfigDto)
  canvasConfig?: CanvasConfigDto;
  
  @IsArray()
  @IsOptional()
  componentsTree?: any[];
}
```



### API 端点设计

#### ProjectController

```typescript
/**
 * 项目控制器
 * 提供 RESTful API
 */
@Controller('api/projects')
@UseInterceptors(LoggingInterceptor)
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}
  
  /**
   * 创建新项目
   * POST /api/projects
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createProjectDto: CreateProjectDto): Promise<ProjectEntity> {
    return this.projectService.create(createProjectDto);
  }
  
  /**
   * 获取项目列表
   * GET /api/projects?page=1&limit=10&search=keyword
   */
  @Get()
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('search') search?: string,
  ): Promise<{ data: ProjectEntity[]; total: number; page: number; limit: number }> {
    return this.projectService.findAll(page, limit, search);
  }
  
  /**
   * 获取单个项目
   * GET /api/projects/:id
   */
  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<ProjectEntity> {
    const project = await this.projectService.findOne(id);
    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }
    return project;
  }
  
  /**
   * 更新项目
   * PUT /api/projects/:id
   */
  @Put(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProjectDto: UpdateProjectDto,
  ): Promise<ProjectEntity> {
    return this.projectService.update(id, updateProjectDto);
  }
  
  /**
   * 删除项目
   * DELETE /api/projects/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.projectService.remove(id);
  }
}
```

#### ProjectService

```typescript
/**
 * 项目服务
 * 处理业务逻辑
 */
@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(ProjectEntity)
    private readonly projectRepository: Repository<ProjectEntity>,
  ) {}
  
  /**
   * 创建项目
   */
  async create(createProjectDto: CreateProjectDto): Promise<ProjectEntity> {
    const project = this.projectRepository.create(createProjectDto);
    return this.projectRepository.save(project);
  }
  
  /**
   * 获取项目列表（分页 + 搜索）
   */
  async findAll(
    page: number,
    limit: number,
    search?: string,
  ): Promise<{ data: ProjectEntity[]; total: number; page: number; limit: number }> {
    const queryBuilder = this.projectRepository.createQueryBuilder('project');
    
    // 搜索功能
    if (search) {
      queryBuilder.where('project.name ILIKE :search', { search: `%${search}%` });
    }
    
    // 分页
    const [data, total] = await queryBuilder
      .orderBy('project.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    
    return { data, total, page, limit };
  }
  
  /**
   * 获取单个项目
   */
  async findOne(id: string): Promise<ProjectEntity | null> {
    return this.projectRepository.findOne({ where: { id } });
  }
  
  /**
   * 更新项目
   */
  async update(id: string, updateProjectDto: UpdateProjectDto): Promise<ProjectEntity> {
    const project = await this.findOne(id);
    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }
    
    Object.assign(project, updateProjectDto);
    return this.projectRepository.save(project);
  }
  
  /**
   * 删除项目
   */
  async remove(id: string): Promise<void> {
    const result = await this.projectRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }
  }
}
```

### 错误处理

#### HttpExceptionFilter

```typescript
/**
 * 全局异常过滤器
 * 统一错误响应格式
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();
    
    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: typeof exceptionResponse === 'string' 
        ? exceptionResponse 
        : (exceptionResponse as any).message,
    };
    
    // 记录错误日志
    console.error(`[${errorResponse.timestamp}] ${errorResponse.method} ${errorResponse.path}`, errorResponse);
    
    response.status(status).json(errorResponse);
  }
}
```

**错误响应格式**：
```json
{
  "statusCode": 404,
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/api/projects/invalid-uuid",
  "method": "GET",
  "message": "Project with ID invalid-uuid not found"
}
```



---

## 数据库设计

### Schema 定义

```sql
-- 项目表
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  canvas_config JSONB NOT NULL,
  components_tree JSONB NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_projects_name ON projects(name);
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX idx_projects_components_tree ON projects USING GIN(components_tree);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON projects
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

### 示例数据

```sql
-- 插入示例项目
INSERT INTO projects (name, canvas_config, components_tree) VALUES (
  '示例项目 - 登录页面',
  '{
    "width": 1440,
    "height": 900,
    "preset": "desktop",
    "backgroundColor": "#FFFFFF"
  }',
  '[
    {
      "id": "comp-1",
      "type": "div",
      "position": { "x": 100, "y": 100, "width": 400, "height": 300, "zIndex": 0 },
      "styles": {
        "backgroundColor": "#FFFFFF",
        "borderColor": "#F1F5F9",
        "borderWidth": 1,
        "borderRadius": 16
      },
      "content": {}
    },
    {
      "id": "comp-2",
      "type": "button",
      "position": { "x": 200, "y": 350, "width": 200, "height": 40, "zIndex": 1 },
      "styles": {
        "backgroundColor": "#C2410C",
        "textColor": "#FFFFFF",
        "borderRadius": 8
      },
      "content": { "text": "登录" }
    }
  ]'
);
```

### 数据库连接配置

```typescript
/**
 * TypeORM 配置
 * 位于 src/config/database.config.ts
 */
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'onism',
  password: process.env.DB_PASSWORD || '123456',
  database: process.env.DB_DATABASE || 'dragbuilder',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: process.env.NODE_ENV === 'development', // 生产环境禁用
  logging: process.env.NODE_ENV === 'development',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
};
```

### 环境变量配置

```bash
# .env.example
# 数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=onism
DB_PASSWORD=123456
DB_DATABASE=dragbuilder
DB_SSL=false

# 应用配置
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:5173
```

---

## 正确性属性（Correctness Properties）

*属性（Property）是一个特征或行为，应该在系统的所有有效执行中保持为真。属性是人类可读规范和机器可验证正确性保证之间的桥梁。*

在进行正确性属性分析之前，我需要先使用 prework 工具分析需求文档中的验收标准。



### 属性反思（Property Reflection）

在编写正确性属性之前，我需要识别并消除冗余属性：

**冗余分析**：

1. **组件创建相关**：
   - 3.4（拖拽创建组件）+ 3.5（位置正确）+ 3.6（默认样式）+ 3.7（唯一 ID）+ 3.8（自动选中）
   - **合并为**：一个综合属性"组件创建完整性"

2. **选中状态相关**：
   - 4.1（点击选中）+ 4.2（显示边框）+ 4.3（显示手柄）+ 4.7（属性面板同步）
   - **合并为**：一个综合属性"组件选中状态一致性"

3. **尺寸调整相关**：
   - 5.1（角落手柄）+ 5.2（边缘手柄）+ 5.3（保持宽高比）
   - **保留独立**：这些是不同的调整模式，需要分别测试

4. **尺寸边界相关**：
   - 5.4（最小尺寸）+ 5.5（最大尺寸）
   - **合并为**：一个综合属性"组件尺寸边界不变量"

5. **层级操作相关**：
   - 8.2（置于顶层）+ 8.3（上移）+ 8.4（下移）+ 8.5（置于底层）
   - **保留独立**：这些是不同的操作，需要分别测试
   - 8.6（zIndex 非负）是一个全局不变量，独立保留

6. **吸附相关**：
   - 6.1（检测对齐）+ 6.2（显示辅助线）+ 6.4（自动吸附）
   - **合并为**：一个综合属性"吸附系统完整性"

7. **API 验证相关**：
   - 11.2（验证必需字段）+ 11.3（返回 400）
   - **合并为**：一个综合属性"API 输入验证"

8. **数据持久化相关**：
   - 11.4（存入数据库）+ 11.5（生成 UUID）+ 11.6（记录时间戳）
   - **合并为**：一个综合属性"项目持久化完整性"

9. **往返一致性**：
   - 10.8（恢复画布状态）是一个重要的往返属性，独立保留

### 正确性属性

基于上述分析，以下是系统的核心正确性属性：

#### 属性 1：画布缩放边界不变量

*对于任何*画布缩放操作，缩放值应该始终保持在 0.1 到 2.0 之间（10% 到 200%）。

**验证需求**：2.3

---

#### 属性 2：组件创建完整性

*对于任何*从物料库拖拽到画布的操作，系统应该：
1. 创建一个新的组件节点
2. 将组件放置在鼠标释放位置
3. 应用该组件类型的默认样式
4. 分配一个唯一的 UUID（不与现有组件重复）
5. 自动选中新创建的组件

**验证需求**：3.4, 3.5, 3.6, 3.7, 3.8

---

#### 属性 3：组件选中状态一致性

*对于任何*被选中的组件，系统应该同时满足：
1. 显示蓝色选中边框（2px solid #3B82F6）
2. 显示 8 个调整手柄（四角 + 四边中点）
3. 在属性面板中显示该组件的所有属性
4. 将 selectedId 状态设置为该组件的 ID

**验证需求**：4.1, 4.2, 4.3, 4.7

---

#### 属性 4：组件拖拽位置更新

*对于任何*组件的拖拽操作，组件的 position.x 和 position.y 应该实时反映鼠标的移动距离。

**验证需求**：4.4

---

#### 属性 5：Shift 键约束拖拽

*对于任何*按住 Shift 键的拖拽操作，组件的移动应该被锁定在水平或垂直方向（取决于初始移动方向的主导轴）。

**验证需求**：4.5

---

#### 属性 6：组件尺寸边界不变量

*对于任何*组件，在任何时刻，其尺寸应该满足：
1. width >= 20 且 height >= 20（最小尺寸）
2. width <= canvasWidth * 2 且 height <= canvasHeight * 2（最大尺寸）

**验证需求**：5.4, 5.5

---

#### 属性 7：角落手柄调整行为

*对于任何*拖拽组件角落手柄的操作，组件的宽度和高度应该同时改变。

**验证需求**：5.1

---

#### 属性 8：边缘手柄调整行为

*对于任何*拖拽组件边缘手柄的操作，只有对应方向的尺寸应该改变（水平边缘改变高度，垂直边缘改变宽度）。

**验证需求**：5.2

---

#### 属性 9：Shift 键保持宽高比

*对于任何*按住 Shift 键拖拽角落手柄的操作，组件的宽高比应该保持不变。

**验证需求**：5.3

---

#### 属性 10：属性面板实时同步

*对于任何*组件属性的修改（通过属性面板），画布上的组件渲染应该在 100ms 内反映该修改。

**验证需求**：7.5

---

#### 属性 11：输入验证错误处理

*对于任何*非法的输入值（如负数宽度、超出范围的尺寸），系统应该：
1. 显示错误提示信息
2. 阻止状态更新（保持原值）

**验证需求**：1.5, 7.7, 15.3

---

#### 属性 12：层级操作 - 置于顶层

*对于任何*"置于顶层"操作，选中组件的 zIndex 应该被设置为 max(所有组件的 zIndex) + 1。

**验证需求**：8.2

---

#### 属性 13：层级操作 - 上移一层

*对于任何*"上移一层"操作，选中组件的 zIndex 应该增加 1。

**验证需求**：8.3

---

#### 属性 14：层级操作 - 下移一层

*对于任何*"下移一层"操作，选中组件的 zIndex 应该减少 1（但不小于 0）。

**验证需求**：8.4

---

#### 属性 15：层级操作 - 置于底层

*对于任何*"置于底层"操作，选中组件的 zIndex 应该被设置为 0。

**验证需求**：8.5

---

#### 属性 16：zIndex 非负不变量

*对于任何*组件，在任何时刻，其 zIndex 值应该是非负整数（>= 0）。

**验证需求**：8.6

---

#### 属性 17：吸附系统完整性

*对于任何*拖拽操作，当组件边缘与其他组件边缘的距离小于 5px 时，系统应该：
1. 检测对齐关系（左/右/顶/底/水平居中/垂直居中）
2. 显示粉色辅助线（1px solid #EC4899）
3. 自动吸附组件到对齐位置（误差 ±2px）

**验证需求**：6.1, 6.2, 6.4

---

#### 属性 18：代码生成有效性

*对于任何*画布状态（包括空画布），生成的 TSX 代码应该：
1. 是有效的 TypeScript + React 18 语法
2. 包含必要的 import 语句
3. 使用 Tailwind CSS 类名或内联样式
4. 能够通过 TypeScript 编译器检查

**验证需求**：9.3, 9.7

---

#### 属性 19：项目持久化完整性

*对于任何*有效的项目创建请求，系统应该：
1. 将项目数据存入 PostgreSQL 数据库
2. 为项目生成唯一的 UUID
3. 记录 created_at 和 updated_at 时间戳
4. 返回 HTTP 201 状态码和完整的项目对象

**验证需求**：11.4, 11.5, 11.6

---

#### 属性 20：API 输入验证

*对于任何*缺少必需字段的 POST /api/projects 请求，系统应该：
1. 返回 HTTP 400 状态码
2. 返回包含错误详情的 JSON 响应
3. 不在数据库中创建任何记录

**验证需求**：11.2, 11.3

---

#### 属性 21：项目数据往返一致性

*对于任何*有效的项目数据，执行"保存 → 加载"操作后，恢复的画布状态和组件树应该与原始状态完全一致（深度相等）。

**验证需求**：10.8

---

#### 属性 22：错误反馈一致性

*对于任何*后端 API 返回的错误响应（HTTP 4xx/5xx），系统应该：
1. 在右上角显示 Toast 错误提示
2. Toast 包含错误信息
3. 在控制台记录完整的错误日志（包含时间戳和堆栈）

**验证需求**：15.1, 15.5

---



## 错误处理策略

### 前端错误处理

#### 1. 网络错误处理

```typescript
/**
 * Axios 拦截器 - 统一处理网络错误
 */
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      // 超时错误
      showToast('请求超时，请检查网络连接', 'error');
    } else if (!error.response) {
      // 网络断开
      showToast('网络连接失败，请检查网络设置', 'error');
    } else {
      // HTTP 错误
      const message = error.response.data?.message || '操作失败，请稍后重试';
      showToast(message, 'error');
    }
    
    // 记录错误日志
    console.error(`[${new Date().toISOString()}] API Error:`, {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.message,
      stack: error.stack,
    });
    
    return Promise.reject(error);
  }
);
```

#### 2. 输入验证错误

```typescript
/**
 * 输入验证 Hook
 */
const useInputValidation = (value: number, min: number, max: number) => {
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (value < min || value > max) {
      setError(`值必须在 ${min} 到 ${max} 之间`);
    } else {
      setError(null);
    }
  }, [value, min, max]);
  
  return error;
};
```

#### 3. 组件错误边界

```typescript
/**
 * React 错误边界
 * 捕获组件渲染错误
 */
class ErrorBoundary extends React.Component<Props, State> {
  state = { hasError: false, error: null };
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-slate-900 mb-2">
              出错了
            </h1>
            <p className="text-slate-500 mb-4">
              页面渲染失败，请刷新页面重试
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg"
            >
              刷新页面
            </button>
          </div>
        </div>
      );
    }
    
    return this.props.children;
  }
}
```

### 后端错误处理

#### 1. 全局异常过滤器

已在前面的 HttpExceptionFilter 中定义。

#### 2. 数据库错误处理

```typescript
/**
 * 数据库错误处理
 */
try {
  await this.projectRepository.save(project);
} catch (error) {
  if (error.code === '23505') {
    // 唯一约束冲突
    throw new ConflictException('项目名称已存在');
  } else if (error.code === '23503') {
    // 外键约束冲突
    throw new BadRequestException('关联数据不存在');
  } else {
    // 其他数据库错误
    console.error('[Database Error]', error);
    throw new InternalServerErrorException('数据库操作失败');
  }
}
```

#### 3. 验证错误处理

```typescript
/**
 * DTO 验证管道
 * 自动验证请求体
 */
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,           // 移除未定义的属性
    forbidNonWhitelisted: true, // 拒绝未定义的属性
    transform: true,            // 自动类型转换
    exceptionFactory: (errors) => {
      // 自定义错误格式
      const messages = errors.map(error => ({
        field: error.property,
        constraints: Object.values(error.constraints || {}),
      }));
      return new BadRequestException({
        statusCode: 400,
        message: '输入验证失败',
        errors: messages,
      });
    },
  })
);
```

---

## 测试策略

### 测试金字塔

```
        ┌─────────────┐
        │  E2E Tests  │  (10%)
        │   Cypress   │
        └─────────────┘
       ┌───────────────┐
       │ Integration   │  (20%)
       │    Tests      │
       └───────────────┘
     ┌───────────────────┐
     │   Unit Tests      │  (70%)
     │   + Property      │
     │   Based Tests     │
     └───────────────────┘
```

### 单元测试（Unit Tests）

**目标**：验证单个函数、组件的具体行为和边界情况。

**工具**：
- **前端**：Vitest + React Testing Library
- **后端**：Jest + Supertest

**覆盖范围**：
1. **工具函数**：
   - 几何计算函数（getRect, calculateDistance）
   - 代码生成函数（generateTSXCode, generateClassName）
   - 吸附算法函数（detectSnapping, checkAlignment）

2. **React 组件**：
   - 组件渲染测试（快照测试）
   - 用户交互测试（点击、拖拽、输入）
   - 条件渲染测试（空状态、错误状态）

3. **API 端点**：
   - 成功响应测试
   - 错误响应测试（400, 404, 500）
   - 输入验证测试

**示例**：

```typescript
// 前端单元测试示例
describe('CanvasSizeModal', () => {
  it('应该显示四个预设选项', () => {
    render(<CanvasSizeModal isOpen={true} onClose={() => {}} />);
    
    expect(screen.getByText('手机')).toBeInTheDocument();
    expect(screen.getByText('平板')).toBeInTheDocument();
    expect(screen.getByText('桌面')).toBeInTheDocument();
    expect(screen.getByText('自定义')).toBeInTheDocument();
  });
  
  it('选择自定义时应该显示输入框', () => {
    render(<CanvasSizeModal isOpen={true} onClose={() => {}} />);
    
    fireEvent.click(screen.getByText('自定义'));
    
    expect(screen.getByLabelText('宽度')).toBeInTheDocument();
    expect(screen.getByLabelText('高度')).toBeInTheDocument();
  });
});

// 后端单元测试示例
describe('ProjectController', () => {
  it('POST /api/projects - 应该创建新项目', async () => {
    const createDto = {
      name: '测试项目',
      canvasConfig: { width: 1440, height: 900, preset: 'desktop', backgroundColor: '#FFFFFF' },
      componentsTree: [],
    };
    
    const response = await request(app.getHttpServer())
      .post('/api/projects')
      .send(createDto)
      .expect(201);
    
    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toBe('测试项目');
  });
  
  it('POST /api/projects - 缺少必需字段应该返回 400', async () => {
    const invalidDto = { name: '测试项目' }; // 缺少 canvasConfig
    
    await request(app.getHttpServer())
      .post('/api/projects')
      .send(invalidDto)
      .expect(400);
  });
});
```

### 属性测试（Property-Based Tests）

**目标**：验证系统的通用属性在大量随机输入下都成立。

**工具**：
- **前端**：fast-check
- **后端**：fast-check

**配置**：
- 每个属性测试运行 **100 次迭代**
- 使用智能生成器约束输入空间

**测试标签格式**：
```typescript
/**
 * Feature: drag-builder, Property 2: 组件创建完整性
 */
```

**示例**：

```typescript
import fc from 'fast-check';

/**
 * Feature: drag-builder, Property 2: 组件创建完整性
 */
describe('Property 2: 组件创建完整性', () => {
  it('对于任何拖拽操作，应该创建完整的组件', () => {
    fc.assert(
      fc.property(
        fc.record({
          type: fc.constantFrom('div', 'button', 'text', 'image', 'input'),
          x: fc.integer({ min: 0, max: 5000 }),
          y: fc.integer({ min: 0, max: 5000 }),
        }),
        (dropData) => {
          // 模拟拖拽操作
          const component = createComponentFromDrop(dropData);
          
          // 验证完整性
          expect(component.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i); // UUID v4
          expect(component.type).toBe(dropData.type);
          expect(component.position.x).toBe(dropData.x);
          expect(component.position.y).toBe(dropData.y);
          expect(component.styles).toBeDefined();
          expect(component.content).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: drag-builder, Property 6: 组件尺寸边界不变量
 */
describe('Property 6: 组件尺寸边界不变量', () => {
  it('对于任何组件，尺寸应该在有效范围内', () => {
    fc.assert(
      fc.property(
        fc.record({
          width: fc.integer({ min: -100, max: 10000 }),
          height: fc.integer({ min: -100, max: 10000 }),
        }),
        (size) => {
          const component = createComponent();
          
          // 尝试设置尺寸
          const result = updateComponentSize(component, size.width, size.height);
          
          // 验证边界
          expect(result.position.width).toBeGreaterThanOrEqual(20);
          expect(result.position.height).toBeGreaterThanOrEqual(20);
          expect(result.position.width).toBeLessThanOrEqual(CANVAS_WIDTH * 2);
          expect(result.position.height).toBeLessThanOrEqual(CANVAS_HEIGHT * 2);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: drag-builder, Property 21: 项目数据往返一致性
 */
describe('Property 21: 项目数据往返一致性', () => {
  it('保存并加载项目后，数据应该完全一致', async () => {
    fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 255 }),
          canvasConfig: fc.record({
            width: fc.integer({ min: 100, max: 5000 }),
            height: fc.integer({ min: 100, max: 5000 }),
            preset: fc.constantFrom('mobile', 'tablet', 'desktop', 'custom'),
            backgroundColor: fc.hexaString({ minLength: 6, maxLength: 6 }).map(s => `#${s}`),
          }),
          componentsTree: fc.array(generateComponentNode(), { maxLength: 10 }),
        }),
        async (projectData) => {
          // 保存项目
          const saved = await projectService.create(projectData);
          
          // 加载项目
          const loaded = await projectService.findOne(saved.id);
          
          // 验证一致性
          expect(loaded.name).toBe(projectData.name);
          expect(loaded.canvasConfig).toEqual(projectData.canvasConfig);
          expect(loaded.componentsTree).toEqual(projectData.componentsTree);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### 集成测试（Integration Tests）

**目标**：验证多个模块协同工作的正确性。

**覆盖范围**：
1. **前端集成**：
   - 拖拽 → 创建组件 → 属性面板更新
   - 修改属性 → 画布实时更新
   - 保存项目 → API 调用 → Toast 提示

2. **后端集成**：
   - API → Service → Repository → Database
   - 完整的 CRUD 流程

### E2E 测试（End-to-End Tests）

**目标**：验证完整的用户流程。

**工具**：Cypress

**关键流程**：
1. 创建新项目 → 选择画布规格 → 进入编辑器
2. 拖拽组件到画布 → 调整位置和尺寸 → 修改样式
3. 保存项目 → 返回首页 → 加载项目
4. 查看代码 → 复制代码

### 测试覆盖率目标

- **单元测试覆盖率**：≥ 80%
- **属性测试覆盖率**：所有核心属性（22 个）
- **集成测试覆盖率**：所有 API 端点
- **E2E 测试覆盖率**：所有关键用户流程

---

## 性能优化策略

### 前端性能优化

1. **虚拟化渲染**：
   - 使用 `react-window` 虚拟化组件列表
   - 仅渲染可视区域内的组件
   - 触发条件：组件数量 > 50

2. **防抖和节流**：
   - 属性输入框：防抖 300ms
   - 画布拖拽：节流 16ms（60 FPS）
   - 窗口 resize：防抖 200ms

3. **React 优化**：
   - 使用 `React.memo` 避免不必要的重渲染
   - 使用 `useMemo` 缓存计算结果
   - 使用 `useCallback` 稳定函数引用

4. **代码分割**：
   - 路由级别的懒加载
   - 大型库（Prism.js）按需加载

### 后端性能优化

1. **数据库优化**：
   - 为常用查询字段创建索引
   - 使用 JSONB 的 GIN 索引加速 DSL 查询
   - 使用连接池管理数据库连接

2. **缓存策略**：
   - 使用 Redis 缓存热门项目数据
   - 设置合理的 TTL（Time To Live）

3. **分页查询**：
   - 项目列表使用分页（默认 10 条/页）
   - 避免一次性加载大量数据

---

## 部署架构

### 开发环境

```
┌─────────────────────────────────────────┐
│  开发机器 (localhost)                    │
│                                          │
│  ┌────────────┐      ┌────────────┐    │
│  │  Frontend  │      │  Backend   │    │
│  │  :5173     │◄────►│  :3000     │    │
│  │  (Vite)    │      │  (NestJS)  │    │
│  └────────────┘      └────────────┘    │
│                            │             │
│                            ▼             │
│                   ┌────────────┐        │
│                   │ PostgreSQL │        │
│                   │   :5432    │        │
│                   └────────────┘        │
└─────────────────────────────────────────┘
```

### 生产环境（建议）

```
┌─────────────────────────────────────────────────┐
│                   CDN (静态资源)                 │
└─────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│              Nginx (反向代理)                    │
│         ┌──────────────┬──────────────┐         │
│         ▼              ▼              ▼         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │ Frontend │  │ Frontend │  │ Frontend │     │
│  │ Instance │  │ Instance │  │ Instance │     │
│  └──────────┘  └──────────┘  └──────────┘     │
└─────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│           Load Balancer (后端)                   │
│         ┌──────────────┬──────────────┐         │
│         ▼              ▼              ▼         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │ Backend  │  │ Backend  │  │ Backend  │     │
│  │ Instance │  │ Instance │  │ Instance │     │
│  └──────────┘  └──────────┘  └──────────┘     │
└─────────────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│         PostgreSQL (主从复制)                    │
│         ┌──────────────┬──────────────┐         │
│         ▼              ▼              ▼         │
│    ┌────────┐    ┌────────┐    ┌────────┐     │
│    │ Master │───►│ Slave1 │    │ Slave2 │     │
│    └────────┘    └────────┘    └────────┘     │
└─────────────────────────────────────────────────┘
```

---

## 总结

本设计文档详细描述了 DragBuilder 系统的技术架构、核心模块设计、数据模型、代码生成引擎、正确性属性、错误处理策略和测试策略。

**关键设计决策**：
1. 使用 Zustand 进行轻量级状态管理
2. 使用 @dnd-kit 实现现代化拖拽交互
3. 使用 JSONB 存储 DSL 数据，支持灵活查询
4. 使用属性测试验证系统的通用正确性
5. 采用前后端分离架构，支持独立部署和扩展

**下一步**：
- 创建实现任务列表（tasks.md）
- 按照任务列表逐步实现功能
- 编写单元测试和属性测试
- 进行集成测试和 E2E 测试

