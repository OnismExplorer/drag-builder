## ADDED Requirements

### Requirement: 双图标源渲染

系统 SHALL 支持在物料面板中渲染两种来源的图标：
- `lucide` 图标（使用 lucide-react）
- `@ant-design/icons` 图标（直接使用 antd 图标组件）

#### Scenario: Lucide 图标渲染
- **WHEN** 物料配置的 `iconSource = 'lucide'` 且 `icon = 'Box'`
- **THEN** MaterialItem SHALL 使用 lucide-react 的 `<Box />` 组件渲染图标

#### Scenario: Ant Design 图标渲染
- **WHEN** 物料配置的 `iconSource = 'antd'` 且 `icon = 'antd:Button'`
- **THEN** MaterialItem SHALL 使用 @ant-design/icons 的 `<ButtonOutlined />` 组件渲染图标

### Requirement: Ant Design 图标映射表

系统 SHALL 提供 antd 图标名称到 @ant-design/icons 组件的映射：
- `antd:Button` → `ButtonOutlined`
- `antd:Calendar` → `CalendarOutlined`
- `antd:Select`（下拉箭头）→ `DownOutlined`
- 等等

系统 SHALL 维护一个 `ICON_MAP` 常量对象，包含所有 antd 物料组件对应的图标映射。

#### Scenario: 图标名称解析
- **WHEN** 物料配置的 `icon = 'antd:Calendar'`
- **THEN** 系统 SHALL 从 ICON_MAP 查找并返回 `CalendarOutlined` 组件

### Requirement: 图标按需加载

@ant-design/icons SHALL 使用动态导入，确保仅在使用 antd 物料时才加载图标资源。

#### Scenario: 动态导入图标
- **WHEN** 首次渲染 antd 物料面板
- **THEN** 系统 SHALL 动态导入 @ant-design/icons，且已加载的图标组件应被缓存

### Requirement: 图标加载状态

系统 SHALL 处理图标加载状态：
- 加载中：显示占位符或 Loading 动画
- 加载失败：显示默认占位符并输出警告日志

#### Scenario: 图标加载失败
- **WHEN** @ant-design/icons 组件渲染失败
- **THEN** MaterialItem SHALL 显示默认占位符（如 `<Icon component={QuestionOutlined} />`），并输出警告日志

### Requirement: MaterialItem 图标渲染逻辑

MaterialItem SHALL 根据 `iconSource` 字段选择渲染方式：

```tsx
// 伪代码
if (iconSource === 'antd') {
  const IconComponent = ICON_MAP[iconName];
  return <Icon component={IconComponent} style={{ fontSize: 16 }} />;
} else {
  const LucideIcon = lucideIcons[iconName];
  return <LucideIcon size={16} />;
}
```
