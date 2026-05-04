## ADDED Requirements

### Requirement: ComponentDefinition 类型扩展

系统 SHALL 扩展 `ComponentDefinition` 接口，新增以下字段：
- `namespace`: 命名空间标识（如 `'built-in'` | `'antd'` | `'mui'`），用于组件库隔离
- `codeGen.imports`: 字符串数组，包含代码生成时需要的 import 语句

### Requirement: MaterialConfig 类型扩展

系统 SHALL 扩展 `MaterialConfig` 接口，新增以下字段：
- `iconSource`: 图标来源（`'lucide'` | `'antd'`），默认值为 `'lucide'`

### Requirement: 组件命名空间隔离

系统 SHALL 确保不同命名空间的组件 type 不会冲突：
- `built-in` 命名空间组件 type 前缀为 `bi-`（如 `bi-button`）
- `antd` 命名空间组件 type 前缀为 `antd-`（如 `antd-button`）

#### Scenario: 命名空间相同的组件覆盖
- **WHEN** 注册一个已存在的组件 type
- **THEN** 系统 SHALL 输出警告日志，并覆盖已有定义

### Requirement: 动态批量注册

`createAntdAdapter()` SHALL 接受组件配置数组，批量生成并注册组件定义。

#### Scenario: 批量注册成功
- **WHEN** 调用 `createAntdAdapter([buttonConfig, inputConfig])`
- **THEN** 所有配置对应的组件定义被注册到 ComponentRegistry，且返回的 ComponentAdapter 包含所有组件

### Requirement: 分类排序与命名

系统 SHALL 支持分类配置的顺序设置：
- 分类配置包含 `id`、`name`、`order` 字段
- MaterialPanel SHALL 按照 `order` 升序显示分类

#### Scenario: 分类顺序设置
- **WHEN** 调用 `componentRegistry.setCategoryOrder([{ id: 'form', name: '表单组件', order: 1 }, { id: 'display', name: '展示组件', order: 2 }])`
- **THEN** MaterialPanel 按照 order 顺序显示分类
