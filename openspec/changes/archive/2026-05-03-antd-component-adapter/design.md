## Context

当前 DragBuilder 的组件注册体系（ComponentRegistry）支持基本的组件注册，但存在以下限制：

1. **无命名空间隔离**：所有组件在同一命名空间，antd 的 `Button` 与内置 `button` 可能冲突
2. **Adapter 模式不完善**：现有 `createAntdAdapter()` 返回固定的两个组件，不支持动态扩展
3. **Icon 单一来源**：只能使用 lucide 图标，无法展示 antd 组件真实外观
4. **代码生成不完整**：只生成 JSX 片段，缺少 import 语句
5. **无触发器机制**：组件间无关联关系，无法实现 Button → Modal 联动

## Goals / Non-Goals

**Goals:**
- 建立配置驱动的组件适配架构，支持批量动态注册 antd 组件
- 实现双图标源渲染（lucide + @ant-design/icons）
- 支持组件间触发器机制（Button → Modal）
- 生成完整的、可独立运行的 antd 代码（含 import）

**Non-Goals:**
- 不实现其他第三方组件库（MUI、Chakra 等）
- 不实现完整的 Table 功能（排序、筛选、分页在 Phase 5）
- 不实现组件设计时实时预览动画（保留当前动画预览机制）

## Decisions

### Decision 1: 配置驱动工厂模式 vs 硬编码组件定义

**选择**：配置驱动工厂模式

**理由**：
- 新增组件只需添加配置对象，无需编写重复模板代码
- 便于批量生成组件定义，减少样板代码
- 支持未来扩展其他组件库（抽象出通用 Adapter 接口）

**替代方案**：
- 硬编码：每个组件独立文件定义，工作量大但类型安全
- 装饰器：代码侵入性低但需要 babel 插件支持

### Decision 2: Icon 渲染方案

**选择**：通过 `iconSource: 'lucide' | 'antd'` 字段区分图标来源

**理由**：
- 保持向后兼容，现有 lucide 图标无需修改
- 动态导入 @ant-design/icons，按需加载减少包体积
- MaterialItem 组件根据 iconSource 字段选择渲染逻辑

**实现**：
```tsx
// MaterialItem.tsx 渲染逻辑
{iconSource === 'antd' ? (
  <Icon component={AntdIconMap[iconName]} style={{ fontSize: 16 }} />
) : (
  <LucideIcon name={icon} size={16} />
)}
```

### Decision 3: Trigger 机制设计

**选择**：通过组件 `triggers` 属性引用目标组件 ID

**理由**：
- 符合数据驱动 UI 理念（props 决定行为）
- 便于序列化和存储
- 解耦触发源和目标，组件可复用

**实现**：
```typescript
// ComponentNode.props 扩展
interface ComponentProps {
  triggers?: {
    onClick?: string;   // 目标组件 ID
  };
}

// Button 组件点击时
const handleClick = () => {
  const targetId = component.props?.triggers?.onClick;
  if (targetId) {
    updateComponent(targetId, { 'props.open': true });
  }
};
```

### Decision 4: 代码生成策略

**选择**：组件定义内包含 `codeGen.imports` 和 `codeGen.generateJSX`

**理由**：
- 每种组件有独立的生成逻辑，灵活度高
- import 语句与组件定义绑定，便于维护
- 支持复杂嵌套结构的代码生成

**实现**：
```typescript
// 每个 antd 组件配置
{
  type: 'antd-button',
  codeGen: {
    imports: [`import { Button } from 'antd';`],
    generateJSX: (component) => {
      const props = component.props || {};
      return `<Button type="${props.type || 'primary'}" size="${props.size || 'middle'}">
  ${component.content?.text || '按钮'}
</Button>`;
    }
  }
}
```

### Decision 5: 组件目录结构

**选择**：按功能分类组织配置，而非按组件库分类

```
src/components/adapters/antd/
├── index.ts                    # 统一导出 createAntdAdapter()
├── config/
│   ├── form/                   # 高频业务组件
│   │   ├── datePicker.ts
│   │   ├── select.ts
│   │   ├── table.ts
│   │   └── modal.ts
│   ├── inputs/                 # 基础表单组件
│   │   ├── inputNumber.ts
│   │   ├── switch.ts
│   │   ├── checkbox.ts
│   │   └── ...
│   └── display/                # 展示型组件
│       ├── card.ts
│       ├── avatar.ts
│       └── ...
└── shared/
    ├── iconMap.ts              # antd icon 名称映射
    └── transform.ts            # props 转换工具
```

**理由**：
- 与用户心智模型一致（按业务场景选择组件）
- 便于后续扩展其他组件库时复用目录结构

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| @ant-design/icons 动态导入可能导致首次加载延迟 | 使用 `React.lazy` + Loading 状态，并缓存已加载的 Icon 组件 |
| antd 组件样式与画布预览不一致 | 使用 antd 的 ConfigProvider 统一样式主题，保持预览与实际渲染一致 |
| Trigger 机制跨组件引用可能导致循环依赖 | 在 ComponentStore 层面做拓扑排序，确保被引用组件先渲染 |
| 配置驱动模式类型安全较低 | 通过 TypeScript 泛型约束配置结构，配合运行时校验 |

## Migration Plan

**Phase 1 (本变更)**：
1. 扩展 `ComponentDefinition` 和 `MaterialConfig` 类型
2. 重构 `antd-adapter.tsx` 为配置驱动模式
3. 更新 `MaterialItem.tsx` 支持双图标源
4. 迁移现有 `antd-button`、`antd-input` 到新架构

**向后兼容性**：
- 现有 `ComponentDefinition` 的 `render` 和 `codeGen` 接口不变
- 现有物料面板分类顺序保持不变
- 现有项目数据的 JSON 结构不变（仅扩展 `props` 字段）

## Open Questions

1. **Table 完整功能**：Phase 5 实现时，需要重新评估数据结构设计（列配置是否作为嵌套 ComponentNode？）
2. **Form 整体支持**：antd Form 有独特的表单校验和布局机制，是否需要特殊处理？
3. **组件嵌套**：如 `Card` > `Card.Header` > `Card.Title`，是否支持嵌套组件作为子节点？
