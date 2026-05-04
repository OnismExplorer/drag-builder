## Why

当前 DragBuilder 对 AntDesign 组件的支持非常有限，仅有 `antd-button` 和 `antd-input` 两个组件，且存在以下问题：

1. **Icon 显示不准确**：物料面板使用 lucide 图标，无法真实反映 antd 组件外观
2. **属性配置不完整**：无法动态配置 antd 特有属性（如 Button 的 `type`、`loading`、`danger`）
3. **代码生成不完整**：生成的代码缺少 antd import 语句，复制后无法直接使用
4. **架构不支持扩展**：当前 adapter 模式不支持动态适配，新增组件需要手动编写大量模板代码

用户需要在画布上使用 antd 丰富的基础组件生态，提升页面构建效率。

## What Changes

### Phase 1: 基础设施
- 扩展 `ComponentDefinition` 类型：新增 `namespace`、`iconSource`、`triggers` 字段
- 扩展 `MaterialConfig` 类型：支持 `iconSource` 区分图标来源
- 重构 `antd-adapter.tsx`：采用配置驱动工厂模式，支持动态批量注册
- Icon 渲染支持 `@ant-design/icons`：物料面板准确展示 antd 组件外观
- 新增 `@ant-design/icons` 依赖

### Phase 2: 高频业务组件 (5 组件)
- `antd-DatePicker`：日期选择器
- `antd-Select`：下拉选择器
- `antd-Table`（基础版）：静态列、文本单元格
- `antd-Modal`：对话框（静态展示）
- `antd-Button` + 触发器：Button 触发 Modal 机制

### Phase 3: 基础表单组件 (7 组件)
- `antd-InputNumber`：数字输入框
- `antd-Switch`：开关
- `antd-Checkbox.Group`：多选组
- `antd-Radio.Group`：单选组
- `antd-Slider`：滑动输入条
- `antd-Cascader`：级联选择
- `antd-TreeSelect`：树形选择

### Phase 4: 展示型组件 (7 组件)
- `antd-Card`：卡片
- `antd-Avatar`：头像
- `antd-Badge`：徽标
- `antd-Tag`：标签
- `antd-Progress`：进度条
- `antd-Alert`：警告提示
- `antd-Tabs`：标签页

### Phase 5: 完整 Table 支持
- 动态列配置
- 排序功能
- 筛选功能
- 分页功能
- 行选择

## Capabilities

### New Capabilities

- `antd-component-adapter`: 完整的 antd 组件适配体系，包括组件定义注册、属性配置、图标渲染、代码生成、触发器机制
- `component-registry-enhancement`: 扩展 ComponentRegistry 支持命名空间、动态注册、触发器关系管理
- `code-generation-antd`: 针对 antd 组件的完整代码生成，包括 import 语句和 JSX 模板
- `icon-rendering-system`: 支持 lucide 和 @ant-design/icons 双图标源动态渲染

## Impact

### 代码影响
- `drag-builder-react/src/store/componentRegistry.ts`：类型扩展
- `drag-builder-react/src/components/adapters/antd-adapter.tsx`：重构为配置驱动模式
- `drag-builder-react/src/components/MaterialPanel/MaterialItem.tsx`：Icon 渲染逻辑扩展
- `drag-builder-react/src/types/component.ts`：新增类型定义
- 新增 `drag-builder-react/src/components/adapters/antd/` 目录：按组件分类的配置文件

### 依赖影响
- 新增 `@ant-design/icons` 依赖

### 物料面板分类调整
- 新增 `form` 分类（高频业务组件）
- 现有 `antd` 分类扩展
- 新增 `inputs` 分类（基础表单组件）
- 新增 `display` 分类（展示型组件）
