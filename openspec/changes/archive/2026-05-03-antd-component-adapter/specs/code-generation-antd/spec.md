## ADDED Requirements

### Requirement: AntDesign 代码生成器

系统 SHALL 为每个 antd 组件提供完整的代码生成功能，生成的代码包含：
- import 语句（引入 antd 组件）
- JSX 元素（包含所有可配置属性）
- 组件内容（文本、子元素等）

#### Scenario: 生成 Button 组件完整代码
- **WHEN** 用户请求生成 `antd-button` 组件的代码
- **THEN** 系统 SHALL 生成类似以下完整代码：
```tsx
import { Button } from 'antd';

<Button type="primary" size="middle">
  按钮
</Button>
```

#### Scenario: 生成 Select 组件完整代码
- **WHEN** 用户请求生成 `antd-select` 组件的代码
- **THEN** 系统 SHALL 生成类似以下完整代码：
```tsx
import { Select } from 'antd';

<Select
  mode="single"
  placeholder="请选择"
  options={[
    { value: 'option1', label: '选项 1' },
    { value: 'option2', label: '选项 2' },
  ]}
  style={{ width: 200 }}
/>
```

### Requirement: 组件属性到 JSX 的映射

系统 SHALL 将组件的 `props` 字段正确映射为 JSX 属性：
- 布尔类型属性（`disabled`、`loading`、`allowClear`）仅在值为 `true` 时生成
- 字符串类型属性直接渲染为属性值
- 数组类型属性（如 `options`）格式化为 JSX 数组字面量

#### Scenario: Boolean 属性映射
- **WHEN** Button 组件的 `props.disabled = true`
- **THEN** 生成的代码 SHALL 包含 `disabled` 属性
- **WHEN** Button 组件的 `props.disabled = false`
- **THEN** 生成的代码 SHALL 不包含 `disabled` 属性

### Requirement: 样式属性映射

系统 SHALL 将组件的 `styles` 字段映射为 JSX `style` 属性或 `className`：
- 位置相关样式（`width`、`height`）通过 `style` 属性设置
- 视觉样式（`backgroundColor`、`borderRadius` 等）通过 `style` 属性设置

#### Scenario: 样式属性生成
- **WHEN** Button 组件设置了 `styles.backgroundColor = '#ff0000'` 和 `styles.borderRadius = 8`
- **THEN** 生成的代码 SHALL 包含 `style={{ backgroundColor: '#ff0000', borderRadius: 8 }}`

### Requirement: 嵌套组件代码生成

系统 SHALL 支持包含子元素的组件代码生成：
- Modal 的 `footer` 属性可以包含 Button 组件
- Card 的 `title` 属性可以包含文本或自定义内容

#### Scenario: Modal with Footer Buttons
- **WHEN** Modal 的 `footer` 配置了确定和取消两个 Button
- **THEN** 生成的代码 SHALL 包含完整的 footer JSX 结构

### Requirement: Trigger 触发器代码保留

系统 SHALL 在代码生成时保留组件的 trigger 配置，但转换为注释说明：
- Button 的 `triggers.onClick` 指向 Modal 时，生成对应注释

#### Scenario: Trigger 配置保留
- **WHEN** Button 配置了 `triggers.onClick = 'modal-1'`
- **THEN** 生成的代码 SHALL 包含注释 `// onClick triggers modal-1`
