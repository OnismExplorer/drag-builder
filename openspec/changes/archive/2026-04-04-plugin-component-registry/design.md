## Context

### 背景

当前 DragBuilder 的组件系统存在以下问题：

**硬编码架构问题：**

```
当前渲染模式（ComponentNode.tsx)
┌────────────────────────────────────────────┐
│ switch (component.type) {                  │
│   case 'div': return <div ...>;           │
│   case 'button': return <button ...>;      │ ← 每新增一个组件类型
│   case 'text': return <p ...>;            │   都需要修改这里
│   ...                                      │
│ }                                          │
└────────────────────────────────────────────┘
```

**物料配置问题：**

```typescript
// materialConfig.ts - 硬编码的配置
const BASIC_COMPONENTS: MaterialConfig[] = [
  { type: 'div', label: '容器', ... },
  { type: 'button', label: '按钮', ... },
  // ...
];
```

每新增一个组件，都需要同时修改：
1. `ComponentNode.tsx` — 添加渲染 case
2. `materialConfig.ts` — 添加物料配置
3. `materialConfig.ts` — 在 `createDefaultComponent` 中添加默认样式
4. `codeGenerator.ts` — 在 `generateComponentJSX` 中添加代码生成
5. `PropertyPanel.tsx` — 添加属性编辑表单

**动画系统问题：**

`AnimationConfig` 已定义，framer-motion 已安装，但：
- `ComponentNode` 未使用 `<motion.div>` 包裹组件
- 代码生成器未序列化动画配置
- 属性面板无动画配置 UI

### 约束

- 必须保持与现有 `ComponentNode` 接口的向后兼容
- 不能破坏现有的拖拽、选中、调整手柄等功能
- JSONB 数据格式保持不变（`components_tree` 字段）
- React 19 + Tailwind CSS 4 技术栈不变

### 干系人

- 前端开发者：需要扩展新组件类型
- UI/UX：需要配置动画效果
- 导出用户：需要可维护的 CSS 文件

---

## Goals / Non-Goals

**Goals:**

1. **插件化架构**：组件注册与核心渲染解耦，支持运行时注册/注销
2. **动画预览**：画布上实时播放 framer-motion 动画
3. **动画导出**：生成的 TSX 代码携带完整的动画配置
4. **CSS 分离模式**：支持导出独立 .css 文件
5. **动态属性面板**：基于 Schema 自动生成属性编辑器
6. **第三方组件适配器**：提供 Ant Design 组件库的接入示例

**Non-Goals:**

1. **不支持运行时用户自定义组件**（仅限代码层面扩展）
2. **不支持组件市场/持久化**（仅限内存注册表）
3. **不迁移现有 DSL 数据格式**（向后兼容现有 JSONB 结构）
4. **不实现完整的 Ant Design 组件库**（仅提供 Button 等基础示例）

---

## Decisions

### Decision 1: ComponentDefinition.render 函数 vs JSX 模板字符串

**选择：`render` 函数**

```typescript
// ✅ 正确：完整的 React 能力
render: ({ component, isSelected, onClick }) => (
  <div onClick={onClick}>
    {component.content.text}
  </div>
)

// ❌ 弃用：模板字符串不够灵活
render: `<div class="{{className}}">{{content}}</div>`
```

**理由：**
- 支持条件渲染（loading 状态、错误状态）
- 支持动态导入第三方组件（懒加载 antd）
- 支持复杂的子元素结构
- TypeScript 类型检查
- IDE 自动补全

**替代方案考虑：**
- JSX 模板字符串：需要额外解析器，无法获得 React 类型安全
- JSON Schema 描述 UI：过度工程化，增加不必要的抽象层

---

### Decision 2: propertyGroups 静态定义 vs 运行时反射

**选择：静态定义**

```typescript
// ✅ 正确：静态定义，类型安全
propertyGroups: [
  {
    id: 'style',
    label: '样式',
    properties: [
      { key: 'backgroundColor', label: '背景色', type: 'color', defaultValue: '#FFFFFF' },
      // ...
    ],
  },
]

// ❌ 弃用：运行时反射，失去类型检查
propertyGroups: reflectProperties(component)
```

**理由：**
- TypeScript 编译期类型检查
- IDE 自动补全和验证
- 在注册前可验证配置完整性
- 便于静态分析和工具生成

---

### Decision 3: 动画配置存储位置

**选择：`ComponentNode.animation` 实例级配置**

```typescript
// ✅ 正确：每个实例持有自己的动画配置
interface ComponentNode {
  animation?: AnimationConfig;  // 实例级
}

// ❌ 弃用：Definition 持有默认动画
interface ComponentDefinition {
  defaults: { animation?: AnimationConfig };  // 所有实例共用
}
```

**理由：**
- 同一组件类型可有不同的动画（入场动画 vs 悬停动画）
- 用户可能关闭某些组件的动画
- 动画是"状态"的一部分，应在实例层面管理
- 保持与现有 DSL 序列化格式兼容

---

### Decision 4: Registry 单例 vs Context Provider

**选择：单例模式**

```typescript
// ✅ 正确：单例
export const componentRegistry = new ComponentRegistry();

// ❌ 弃用：Context（过度复杂）
export const RegistryContext = createContext<ComponentRegistry>(...);
```

**理由：**
- 简单直接，无需 React Context 层层传递
- Zustand Store 已在使用相同模式
- 适合单页应用，无需多实例
- 便于全局访问和调试

---

### Decision 5: 代码生成 CSS 模式 vs Tailwind 模式

**选择：CSS 文件模式（非 Tailwind）**

```typescript
// 生成的 CSS
.comp-abc123 {
  position: absolute;
  left: 100px;
  top: 200px;
  background-color: #C2410C;
  border-radius: 8px;
}

// 生成的 TSX
<div className="comp-abc123">内容</div>
```

**理由：**
- Tailwind 需要目标项目配置 @tailwindcss/jit
- 生成的 Tailwind 类名可能与项目现有规则冲突
- CSS 文件模式更通用，适合任何项目
- 支持 CSS 变量主题化

**替代方案考虑：**
- Tailwind 模式：需要假设目标项目使用 Tailwind，耦合过高
- CSS Modules：需要额外构建配置

---

## Risks / Trade-offs

| Risk | Impact | Mitigation |
|------|--------|------------|
| **迁移过程中破坏现有功能** | 高 | 先实现 Registry 并行运行，再逐步迁移内置组件 |
| **运行时注册内存泄漏** | 低 | Registry 只增不减，不提供卸载机制（第一版） |
| **动画性能问题** | 中 | 使用 `React.memo` + `useCallback` 优化，50+ 组件启用虚拟化 |
| **第三方组件库版本升级** | 中 | Adapter 版本锁定，升级需手动同步 |
| **CSS 类名冲突** | 低 | 使用 `comp-{uuid}` 格式保证唯一性 |

---

## Migration Plan

### Phase 1: 基础设施（不影响现有功能）

1. 创建 `src/store/componentRegistry.ts`
2. 定义 `ComponentDefinition` 等核心类型
3. 实现 Registry 类的基础 API（register, get, getAll）
4. 创建 `src/components/built-in/index.ts` 存放迁移后的组件

### Phase 2: 迁移内置组件

5. 将 `materialConfig.ts` 中的组件迁移到 Registry 定义格式
6. 将 `createDefaultComponent` 改为 `Registry.createDefault`
7. 保持原有 `switch-case` 渲染逻辑作为 fallback

### Phase 3: Canvas 渲染集成

8. 修改 `ComponentNode.tsx`，添加 Registry 渲染路径
9. 保持原有 switch-case 路径仅用于兼容
10. 集成 framer-motion 动画预览

### Phase 4: UI 面板动态化

11. 修改 `MaterialPanel.tsx` 从 Registry 动态获取组件列表
12. 创建 `DynamicPropertyEditor.tsx` 动态表单生成器
13. 新增动画配置面板 UI

### Phase 5: 代码生成扩展

14. 修改 `CodeGenerator` 支持动画序列化
15. 实现 CSS 文件模式导出
16. 创建 Ant Design 适配器示例

### Rollback Strategy

每个阶段完成后，如果发现问题：
- Phase 1-2：删除 Registry 代码，恢复原有硬编码
- Phase 3：注释掉 Registry 渲染路径，恢复 switch-case
- Phase 4-5：保持 Registry 运行，只恢复 UI 面板

---

## Open Questions

1. **AntD 组件的依赖声明**：导出的代码需要 `import { Button } from 'antd'`，如何在代码中标注依赖？
2. **组件嵌套表达能力**：当前 `children` 字段仅用于静态渲染，如何在 Registry 中表达"容器组件"的概念？
3. **动画触发时机**：画布上的动画应该"自动播放"还是"用户手动触发预览"？
4. **CSS 变量主题化**：是否需要支持 CSS 变量（如 `--primary-color`）而非硬编码颜色值？
