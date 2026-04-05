# DOMAIN.md — 领域逻辑与核心算法规范

> 本文件是画布引擎的核心领域文档，供维护画布引擎的 AI 助手读取。
> 理解本文档是修改拖拽逻辑、状态管理或组件渲染的前提。

---

## 1. 数据流向总览

### 1.1 核心数据结构：扁平化组件树

`components: ComponentNode[]` 以**扁平化**结构存储在 `componentStore` 中，而非嵌套树。

```typescript
// 组件节点结构（types/component.ts）
interface ComponentNode {
  id: string;           // UUID v4
  type: ComponentType;  // 'div' | 'button' | 'text' | 'image' | 'input' | 'radio' | 'checkbox' | 'tag'
  position: Position;   // { x, y, width, height, zIndex }
  styles: ComponentStyles;
  content: ComponentContent;
  children?: ComponentNode[]; // 可选的嵌套子节点（静态渲染，不参与拖拽）
}
```

> **设计意图**：扁平化存储简化了选中查询和批量操作。`children` 字段仅用于嵌套组件的静态渲染，拖拽和吸附逻辑**仅基于顶层 `components` 数组**。

### 1.2 Store 职责划分

| Store | 职责 | 关键状态 |
|-------|------|----------|
| `componentStore` | 组件树、选中、CRUD、撤销/重做 | `components`, `selectedId`, `selectedIds`, `history` |
| `canvasStore` | 画布配置、缩放、平移 | `config`, `zoom`, `pan` |
| `uiStore` | UI 交互状态（辅助线、拖拽偏移、Toast） | `snapLines`, `dragOffset`, `dragPosition`, `isDraggingComponent` |

### 1.3 面板间数据流转

```
MaterialPanel                    Canvas                    PropertyPanel
     │                             │                            │
     │  useDraggable (dnd-kit)     │                            │
     ├────────────────────────────►│                            │
     │                             │                            │
     │                             │  DndContext.onDragEnd      │
     │                             ├───────────────────────────►│
     │                             │  selectedId / selectedIds │
     │                             │                            │
     │                             │  updateComponent()         │
     │                             │◄────────────────────────────┘
     │                             │
     │                             │
     ▼                             ▼
componentStore ←──────────────────────────────────────────────►│
   (唯一数据源)                                                  │
                                                                 │
     ▲                                                          │
     │                                                            │
     │  components, selectedId, selectedIds                      │
     └────────────────────────────────────────────────────────────┘
```

**关键约束**：
- **单一数据源**：`componentStore.components` 是画布上所有组件的唯一真相。
- **面板间不共享状态**：MaterialPanel 只负责产生拖拽事件，Canvas 只负责渲染和交互，PropertyPanel 只负责展示和编辑选中组件的属性。三者通过 Store 解耦。
- **永远不从 Canvas 的 DOM 节点读取组件位置**：位置信息必须来自 Store，绝不允许直接操作 DOM 样式来更新组件位置。

---

## 2. 拖拽生命周期

### 2.1 DndContext 事件流向

所有拖拽事件由 `EditorPage.tsx` 中的 `DndContext` 统一处理：

```typescript
// EditorPage.tsx
<DndContext
  sensors={[SmartPointerSensor]}  // 自定义传感器，过滤 data-no-dnd 属性
  onDragStart={handleDragStart}
  onDragMove={handleDragMove}    // 节流 16ms
  onDragEnd={handleDragEnd}
>
```

### 2.2 坐标转换体系

**坐标系层级（从外到内）**：

```
Viewport（浏览器窗口）
  └── Canvas Container（overflow: hidden）
        └── Canvas（白色画布区域，带 transform: scale + translate）
              └── ComponentNode（绝对定位）
```

**关键坐标转换公式**（来自 `Canvas.tsx:handleWheel`）：

```typescript
// 鼠标在容器中的像素位置 → 画布逻辑坐标
const canvasLeft = rect.width / 2 + pan.x - (config.width * zoom) / 2;
const canvasTop = rect.height / 2 + pan.y - (config.height * zoom) / 2;
const canvasMouseX = (mouseX - canvasLeft) / zoom;  // 相对画布的 X
const canvasMouseY = (mouseY - canvasTop) / zoom;  // 相对画布的 Y
```

**拖拽时 delta 的处理**（EditorPage.tsx:246）：

```typescript
// @dnd-kit 的 delta 是屏幕像素偏移，需要除以 zoom 才能得到画布坐标偏移
const deltaX = delta.x / zoom;
const deltaY = delta.y / zoom;
```

> **⚠️ 绝对禁忌 1**：禁止直接使用 `event.clientX/Y` 或 `event.pageX/Y` 来设置组件位置。所有鼠标坐标必须经过 `getBoundingClientRect()` + `zoom/pan` 转换。

**🛠️ AI 坐标计算速记口诀**：
- **屏幕坐标转画布坐标**：`(clientX - canvasLeft) / zoom`
- **屏幕偏移量转画布偏移量**：`deltaX / zoom`
- **画布坐标转屏幕坐标**（极少用到）：`canvasX * zoom + canvasLeft`

在编写任何涉及坐标的新逻辑时，AI 助手**必须优先查找 `utils/` 下是否已有封装好的坐标转换工具函数**，避免重复手写复杂的数学公式。

### 2.3 吸附引擎集成（snapping.ts）

`SnappingEngine` 是 `detectSnapping()` 方法的核心类，被两处调用：

#### 2.3.1 拖拽移动时的吸附检测（EditorPage.tsx:283）

```typescript
// 在 handleDragMove（节流 16ms）中被调用
const snappingResult = snappingEngine.detectSnapping(
  tempComponent,        // 移动中的组件（或虚拟组）
  otherComponents,      // 其他组件（用于计算对齐）
  config.width,          // 画布宽度（用于画布边缘吸附）
  config.height,         // 画布高度
  isGridSnapEnabled      // 网格吸附开关
);

// 返回值
// - snapLines: 辅助线数组（传给 uiStore 用于渲染）
// - snapX / snapY: 吸附后的坐标（null 表示不吸附）
```

#### 2.3.2 调整尺寸时的吸附检测（ResizeHandles.tsx:323）

`ResizeHandles` 有自己独立的吸附逻辑，直接在组件内使用 `SnappingEngine` 实例。辅助线存储在 `uiStore.snapLines` 中，与拖拽共用同一渲染器。

#### 2.3.3 吸附阈值

| 参数 | 值 | 含义 |
|------|-----|------|
| `SNAP_THRESHOLD` | 5px | 触发磁吸的距离 |
| `GRID_SIZE` | 20px | 网格吸附单元 |
| `SHOW_DISTANCE_THRESHOLD` | 50px | 显示距离标注的阈值 |

### 2.4 拖拽流程分阶段说明

#### Phase 1: onDragStart

```typescript
const handleDragStart = (event: DragStartEvent) => {
  setActiveId(event.active.id as string);
  const activeData = event.active.data.current;

  if (activeData && !activeData.isMaterial) {
    // 拖拽画布上的已有组件
    setDraggingComponent(true);           // 显示 DragGrid
    setDragOffset({ x: 0, y: 0 }, event.active.id as string);
  }
  // 物料库拖拽（isMaterial: true）不在此处理
};
```

#### Phase 2: onDragMove（节流 16ms）

```typescript
const handleDragMove = throttle((event: DragMoveEvent) => {
  const { active, delta } = event;
  const activeData = active.data.current;

  if (!activeData || activeData.isMaterial) return; // 跳过物料库拖拽

  // 更新多选同步移动的偏移量
  setDragOffset(delta, active.id as string);

  // 多选模式：创建虚拟组
  if (isMultiSelect) {
    const virtualGroup = createVirtualGroupComponent(selectedComponents, deltaX, deltaY);
    // 使用虚拟组做吸附检测...
  }

  // 检测吸附
  const snappingResult = snappingEngine.detectSnapping(tempComponent, otherComponents, ...);

  // 更新辅助线和位置气泡
  setSnapLines(snappingResult.snapLines);
  setDragPosition({ x: finalX, y: finalY, width, height });
}, 16);
```

#### Phase 3: onDragEnd

```typescript
const handleDragEnd = (event: DragEndEvent) => {
  const { active, over, delta, activatorEvent } = event;

  // 清除 UI 状态
  clearSnapLines();
  setDraggingComponent(false);
  setDragPosition(null);
  setDragOffset(null, null);

  // 情况 1：从物料库拖入画布 → 创建新组件
  if (activeData?.isMaterial && over?.id === 'canvas-drop-zone') {
    // 计算 drop 坐标（相对于画布）
    const canvasX = (dropX - canvasRect.left) / zoom;
    const canvasY = (dropY - canvasRect.top) / zoom;
    const newComponent = createDefaultComponent(type, { x, y });
    addComponent(newComponent); // 内部 pushHistory + selectedId 更新
  }

  // 情况 2：拖拽已有组件 → 应用吸附位置
  else if (activeData && !activeData.isMaterial && delta) {
    // 计算最终位置（含吸附）
    updateComponent(componentId, { position: { x: finalX, y: finalY } });
  }
};
```

### 2.5 多选组件的虚拟组机制

当多选组件被拖拽时，`createVirtualGroupComponent()` 将所有选中组件的边界合并为一个**虚拟 div**（`id: 'virtual-group'`），用于吸附检测：

```typescript
// multiSelectBounds.ts:createVirtualGroupComponent
return {
  id: 'virtual-group',
  type: 'div',
  position: {
    x: bounds.x + deltaX,  // 包含实时偏移
    y: bounds.y + deltaY,
    width: bounds.width,
    height: bounds.height,
    zIndex: 0,
  },
  styles: { backgroundColor: 'transparent' },
  content: {},
};
```

> **⚠️ 注意**：虚拟组**仅用于吸附检测**，不存储到 Store。吸附完成后，通过 `moveMultipleComponents(ids, deltaX, deltaY)` 批量更新每个选中组件的实际位置。

---

## 3. 嵌套渲染与事件冒泡

### 3.1 children 字段的用途

`ComponentNode.children` 用于支持嵌套组件的**静态渲染**（如容器内含子组件）。当前实现中：

- `children` 仅在 `ComponentNode.renderContent()` 的 `div` 类型分支中被使用（实际上当前 `div` 分支并没有渲染 children）
- 拖拽选中、吸附计算、层级排序**全部基于顶层 `components` 数组**，不递归 children

### 3.2 选中状态与事件冒泡

```
点击 ComponentNode
       │
       ▼
handleClick（ComponentNode.tsx:72）
  ├── e.stopPropagation()  ← 阻止冒泡到 Canvas
  │
  ├── Ctrl/Cmd + 点击 → toggleSelectComponent（多选切换）
  │
  └── 普通点击 → selectComponent（单选）
                        │
                        ▼
              componentStore.selectedId / selectedIds
                        │
                        ▼
              ComponentNode.isSelected 决定是否渲染蓝色边框
```

**关键设计**：`e.stopPropagation()` 确保点击组件不会触发画布的取消选中逻辑（Canvas.tsx:handleCanvasClick）。

### 3.3 调整手柄与拖拽的冲突解决

`ResizeHandles` 在每个手柄 DOM 元素上添加了 `data-no-dnd="true"` 属性：

```typescript
// ResizeHandles.tsx:609
<div data-no-dnd="true" ... />
```

`SmartPointerSensor`（EditorPage.tsx:29）会检查这个属性并返回 `false`，阻止 dnd-kit 在调整尺寸时错误启动拖拽：

```typescript
class SmartPointerSensor extends PointerSensor {
  static activators = [{
    eventName: 'onPointerDown',
    handler: ({ nativeEvent: event }) => {
      if (event.target instanceof HTMLElement && event.target.dataset.noDnd) {
        return false; // 不启动拖拽
      }
      return true;
    },
  }];
}
```

同时，`ComponentNode` 组件在 `handleClick` 中检查 `justResized` 标志（100ms 内忽略点击），避免调整尺寸结束后误触发选中切换：

```typescript
// ComponentNode.tsx:77
if (justResized) {
  setJustResized(false);
  return; // 忽略这次点击
}
```

---

## 4. 历史记录机制（Undo/Redo）

### 4.1 快照结构

```typescript
interface HistorySnapshot {
  components: ComponentNode[]; // 深度拷贝的组件数组
}

// componentStore 内部
history: HistorySnapshot[];   // 最多 50 条
historyIndex: number;         // 当前快照索引（-1 表示无历史）
```

### 4.2 快照保存时机

**所有修改组件的操作必须先调用 `pushHistory()`**：

| 操作 | 调用位置 |
|------|----------|
| `addComponent()` | componentStore.ts:127 |
| `deleteComponent()` | componentStore.ts:196 |
| `deleteSelected()` | componentStore.ts:515 |
| `pasteComponents()` | componentStore.ts:474 |

> **⚠️ 批量操作**：如 `moveMultipleComponents` 本身**不调用** `pushHistory()`，因为它通常在 `handleDragEnd` 中被调用，而 dragEnd 已经是一个完整的用户动作。但如果独立调用（例如键盘方向键移动），需要先手动调用 `pushHistory()`。

### 4.3 撤销/重做实现

```typescript
// 撤销
undo: () => {
  const { history, historyIndex } = get();
  if (historyIndex <= 0) return;
  set(state => {
    state.historyIndex = historyIndex - 1;
    state.components = JSON.parse(JSON.stringify(history[historyIndex - 1].components));
    state.selectedId = null;
    state.selectedIds = [];
  });
}

// 重做
redo: () => {
  const { history, historyIndex } = get();
  if (historyIndex >= history.length - 1) return;
  set(state => {
    state.historyIndex = historyIndex + 1;
    state.components = JSON.parse(JSON.stringify(history[historyIndex + 1].components));
    state.selectedId = null;
    state.selectedIds = [];
  });
}
```

**关键特性**：
- `JSON.parse(JSON.stringify())` 实现深拷贝，避免快照被后续修改污染
- 撤销时清除选中状态（防止撤销后选中已删除的组件）
- 新操作会**截断**重做历史（新操作覆盖）

---

## 5. 虚拟化渲染

### 5.1 触发条件

当 `components.length > 50` 时启用虚拟化（`VIRTUALIZATION_THRESHOLD = 50`）。

### 5.2 可视区域计算

```typescript
// virtualCanvas.ts:calculateViewport
export function calculateViewport(
  containerWidth, containerHeight,  // 容器尺寸
  canvasWidth, canvasHeight,        // 画布尺寸
  zoom, pan                         // 当前缩放和平移
): ViewportRect {
  const canvasLeft = containerWidth / 2 + pan.x - (canvasWidth * zoom) / 2;
  const canvasTop = containerHeight / 2 + pan.y - (canvasHeight * zoom) / 2;

  return {
    left: -canvasLeft / zoom - VIEWPORT_BUFFER,   // 200px 缓冲
    right: (containerWidth - canvasLeft) / zoom + VIEWPORT_BUFFER,
    top: -canvasTop / zoom - VIEWPORT_BUFFER,
    bottom: (containerHeight - canvasTop) / zoom + VIEWPORT_BUFFER,
  };
}
```

### 5.3 虚拟化过滤规则

```typescript
// filterVisibleComponents
return components.filter(
  component =>
    isComponentVisible(component, viewport) ||  // 在可视区域内
    selectedIds.includes(component.id)            // 选中的组件始终渲染
);
```

> **⚠️ 重要**：选中组件无论是否在可视区域内都必须渲染，以确保选中状态在虚拟化时仍然可见。

---

## 6. AI 修改画布引擎的绝对禁忌

> **⚠️ 违反以下任何一条可能导致画布引擎行为错乱或状态不一致**

### 禁忌 1：禁止直接操作 DOM 样式来更新组件位置

**错误示例**：

```tsx
// ❌ 绝对禁止！
const handleDrag = (e) => {
  element.style.left = `${newX}px`;  // 直接操作 DOM
};
```

**正确做法**：始终通过 `updateComponent()` 更新 Store，由 React 重新渲染后反映到 DOM。

**为什么**：本项目使用**声明式渲染**，DOM 是状态的派生结果。直接修改 DOM 会导致 DOM 与 Store 失去同步，造成：
- 撤销/重做后 UI 不一致
- 虚拟化计算错误（基于 DOM 而非 Store）
- 多选组件位置错乱

---

### 禁忌 2：禁止在坐标转换中省略 zoom/pan 的除法

**错误示例**：

```typescript
// ❌ 绝对禁止！
const newX = movingComponent.position.x + delta.x;  // 缺少 / zoom
```

**正确做法**：

```typescript
// ✅ 正确
const newX = movingComponent.position.x + delta.x / zoom;
const newY = movingComponent.position.y + delta.y / zoom;
```

**为什么**：`delta.x` 和 `delta.y` 来自 dnd-kit，是**屏幕像素偏移**。画布可能处于缩放状态（zoom ≠ 1），必须除以 zoom 才能得到画布坐标系中的正确偏移。省略会导致组件移动距离与鼠标拖拽距离不匹配。

---

### 禁忌 3：禁止在拖拽等连续修改位置的操作中遗漏历史快照

**错误示例**：

```typescript
// ❌ 绝对禁止：用户拖拽位置错乱后无法撤销
const handleDragEnd = (event) => {
  updateComponent(id, { position: { x: newX, y: newY } });
};
```

**正确做法**：

```typescript
// ✅ 正确：在拖拽开始时保存初始状态的快照
const handleDragStart = (event) => {
  // 在组件开始移动前，保存当前画布的快照
  pushHistory();
  setActiveId(event.active.id);
};

const handleDragEnd = (event) => {
  // 拖拽结束时更新最终位置，若用户此时 Undo，将回到 dragStart 时的快照位置
  updateComponent(id, { position: { x: newX, y: newY } });
};
```

**说明**：拖拽移动是一个**完整的意图变更**。如果遗漏了快照，用户在误拖拽后按下 Ctrl+Z 将无法让组件回到原位。
必须遵循以下快照时机规范：
1. **连续操作（如拖拽、调整大小）**：必须在操作开始时（onDragStart / onResizeStart）调用 pushHistory() 保存初始状态，而在结束时（onDragEnd）只需更新最终位置。
2. **离散操作（如添加、删除、对齐到网格）**：必须在操作执行前或执行中调用 pushHistory()，以确保修改前的数据被记录。

> **但是**：如果新增了**其他离散操作**（如"对齐到网格"、"复制到剪贴板"等），必须确保该操作调用了 `pushHistory()`。

---

## 附录：关键文件索引

| 文件 | 职责 |
|------|------|
| `store/componentStore.ts` | 组件树状态、选中、撤销/重做 |
| `store/canvasStore.ts` | 画布配置、缩放、平移 |
| `store/uiStore.ts` | UI 状态（辅助线、拖拽偏移、Toast） |
| `utils/snapping.ts` | 吸附引擎（对齐检测、网格吸附） |
| `utils/multiSelectBounds.ts` | 多选边界计算、虚拟组创建 |
| `utils/virtualCanvas.ts` | 可视区域计算、虚拟化渲染过滤 |
| `utils/componentNesting.ts` | 嵌套关系检测（用于调整尺寸时同步子组件） |
| `components/Canvas/Canvas.tsx` | 画布容器（缩放/平移/可视区域计算） |
| `components/Canvas/ComponentNode.tsx` | 组件节点渲染（选中边框/调整手柄/事件处理） |
| `components/Canvas/ResizeHandles.tsx` | 8 向调整手柄（独立吸附逻辑） |
| `pages/EditorPage.tsx` | DndContext 入口（拖拽生命周期管理） |
| `components/MaterialPanel/MaterialItem.tsx` | 物料项（useDraggable 配置） |
