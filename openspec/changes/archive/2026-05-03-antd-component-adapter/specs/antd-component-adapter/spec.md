## ADDED Requirements

### Requirement: AntDesign 组件适配器架构

系统 SHALL 提供配置驱动的 AntDesign 组件适配器，支持批量注册 antd 组件到 ComponentRegistry。

### Requirement: 组件分类体系

系统 SHALL 将 antd 组件按业务场景分为以下分类：
- `form`: 高频业务组件（DatePicker、Select、Table、Modal）
- `inputs`: 基础表单组件（InputNumber、Switch、Checkbox.Group、Radio.Group、Slider、Cascader、TreeSelect）
- `display`: 展示型组件（Card、Avatar、Badge、Tag、Progress、Alert、Tabs）

系统 SHALL 支持分类排序，优先级为 form > inputs > display。

### Requirement: antd 组件物料配置

每个 antd 组件 SHALL 提供以下配置：
- `type`: 唯一标识符（如 `antd-button`）
- `component`: antd 实际组件名（如 `Button`）
- `module`: 所属模块（如 `antd`）
- `category`: 物料面板分类
- `subcategory`: 子分类（可选）
- `icon`: 图标名称（如 `antd:Button`）
- `iconSource`: 图标来源（`lucide` | `antd`）
- `defaults`: 默认位置、样式、内容、props
- `propertyGroups`: 属性配置数组

### Requirement: Phase 2 高频业务组件

系统 SHALL 支持以下 Phase 2 组件：
- `antd-DatePicker`: 日期选择器，支持 `picker`（date/week/month/quarter/year）、`format`、`disabled`、`placeholder` 属性
- `antd-Select`: 下拉选择器，支持 `mode`（single/multiple）、`options`、`disabled`、`placeholder` 属性
- `antd-Table`: 基础表格，支持静态列配置（`columns`）、`dataSource`、`bordered`、`size` 属性
- `antd-Modal`: 对话框，支持 `open`、`title`、`width`、`footer`、`closable` 属性
- `antd-Button`: 按钮（重构），支持 `type`、`size`、`disabled`、`loading`、`danger`、`icon` 属性

### Requirement: Phase 3 基础表单组件

系统 SHALL 支持以下 Phase 3 组件：
- `antd-InputNumber`: 数字输入框，支持 `min`、`max`、`step`、`disabled` 属性
- `antd-Switch`: 开关，支持 `checked`、`disabled`、`size` 属性
- `antd-Checkbox.Group`: 多选组，支持 `options`、`disabled`、`layout`（horizontal/vertical）属性
- `antd-Radio.Group`: 单选组，支持 `options`、`disabled`、`layout` 属性
- `antd-Slider`: 滑动条，支持 `min`、`max`、`step`、`disabled`、`showInput` 属性
- `antd-Cascader`: 级联选择，支持 `options`、`placeholder`、`disabled`、`expandTrigger` 属性
- `antd-TreeSelect`: 树形选择，支持 `treeData`、`placeholder`、`disabled`、`multiple` 属性

### Requirement: Phase 4 展示型组件

系统 SHALL 支持以下 Phase 4 组件：
- `antd-Card`: 卡片，支持 `title`、`bordered`、`hoverable`、`size` 属性
- `antd-Avatar`: 头像，支持 `shape`（circle/square）、`size`、`src`、`alt` 属性
- `antd-Badge`: 徽标，支持 `count`、`overflow`、`dot`、`status` 属性
- `antd-Tag`: 标签，支持 `color`、` closable`、显示文本 属性
- `antd-Progress`: 进度条，支持 `percent`、`strokeColor`、`size`、`status` 属性
- `antd-Alert`: 警告提示，支持 `type`（success/info/warning/error）、`message`、`description`、`closable` 属性
- `antd-Tabs`: 标签页，支持 `items`、`type`（line/card）、`tabPosition` 属性

### Requirement: Trigger 触发器机制

系统 SHALL 支持组件间触发器机制，允许组件通过 `props.triggers.onClick` 引用其他组件。

#### Scenario: Button 触发 Modal
- **WHEN** 用户在画布上选中一个 Button 组件，并将 `triggers.onClick` 设置为某个 Modal 组件的 ID
- **THEN** 点击该 Button 时，该 Modal 的 `props.open` 属性自动变为 `true`

#### Scenario: Trigger 引用不存在的组件
- **WHEN** Button 的 `triggers.onClick` 引用了一个不存在的组件 ID
- **THEN** 点击 Button 时不产生任何效果，且控制台输出警告日志

#### Scenario: Trigger 目标组件类型验证
- **WHEN** 用户尝试将 Button 的 `triggers.onClick` 设置为非 Modal 类型组件的 ID
- **THEN** 系统 SHOULD 提供警告或错误提示，提示用户目标组件不支持此触发器
