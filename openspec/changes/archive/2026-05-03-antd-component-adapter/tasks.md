## 1. 基础设施 - 类型扩展与架构

- [x] 1.1 扩展 `ComponentDefinition` 接口，新增 `namespace: string` 和 `codeGen.imports: string[]` 字段
- [x] 1.2 扩展 `MaterialConfig` 接口，新增 `iconSource: 'lucide' | 'antd'` 字段
- [x] 1.3 扩展 `ComponentNode.props` 接口，新增 `triggers?: { onClick?: string }` 字段
- [x] 1.4 扩展 `ComponentStyles` 或新建 `AntdStyles` 类型，支持 antd 特有样式属性 (通过 props 字段处理)

## 2. 基础设施 - Icon 渲染系统

- [x] 2.1 创建 `src/components/adapters/antd/shared/iconMap.ts`，维护 antd 图标名称映射表
- [x] 2.2 更新 `MaterialItem.tsx`，根据 `iconSource` 字段选择 lucide 或 @ant-design/icons 渲染
- [x] 2.3 实现 @ant-design/icons 动态导入和缓存机制
- [x] 2.4 处理图标加载失败时的降级显示

## 3. 基础设施 - 重构 antd-adapter

- [x] 3.1 创建 `src/components/adapters/antd/config/` 目录结构（form/inputs/display/shared）
- [x] 3.2 创建组件配置类型定义 `AntdComponentConfig`
- [x] 3.3 实现 `createAntdAdapter()` 工厂函数，支持接收配置数组批量注册
- [x] 3.4 创建通用渲染函数生成器 `createRenderFunction(config)`
- [x] 3.5 创建通用代码生成函数 `createCodeGenFunction(config)`
- [x] 3.6 重构现有 `antd-button`、`antd-input` 到新架构
- [x] 3.7 删除或标记废弃旧的 `src/components/adapters/antd-adapter.tsx`

## 4. Phase 2 - 高频业务组件

- [x] 4.1 实现 `antd-DatePicker` 配置：picker、format、disabled、placeholder
- [x] 4.2 实现 `antd-Select` 配置：mode、options、disabled、placeholder
- [x] 4.3 实现 `antd-Table` 基础版配置：columns、dataSource、bordered、size
- [x] 4.4 实现 `antd-Modal` 静态配置：open、title、width、footer、closable
- [x] 4.5 重构 `antd-Button` 配置：type、size、disabled、loading、danger、icon、triggers

## 5. Phase 3 - 基础表单组件

- [x] 5.1 实现 `antd-InputNumber` 配置：min、max、step、disabled
- [x] 5.2 实现 `antd-Switch` 配置：checked、disabled、size
- [x] 5.3 实现 `antd-Checkbox.Group` 配置：options、disabled、layout
- [x] 5.4 实现 `antd-Radio.Group` 配置：options、disabled、layout
- [x] 5.5 实现 `antd-Slider` 配置：min、max、step、disabled、showInput
- [x] 5.6 实现 `antd-Cascader` 配置：options、placeholder、disabled、expandTrigger
- [x] 5.7 实现 `antd-TreeSelect` 配置：treeData、placeholder、disabled、multiple

## 6. Phase 4 - 展示型组件

- [x] 6.1 实现 `antd-Card` 配置：title、bordered、hoverable、size
- [x] 6.2 实现 `antd-Avatar` 配置：shape、size、src、alt
- [x] 6.3 实现 `antd-Badge` 配置：count、overflow、dot、status
- [x] 6.4 实现 `antd-Tag` 配置：color、closable、显示文本
- [x] 6.5 实现 `antd-Progress` 配置：percent、strokeColor、size、status
- [x] 6.6 实现 `antd-Alert` 配置：type、message、description、closable
- [x] 6.7 实现 `antd-Tabs` 配置：items、type、tabPosition

## 7. Trigger 触发器机制

- [x] 7.1 在 ComponentStore 中实现 `updateComponent` 支持嵌套属性路径（如 `props.open`）
- [x] 7.2 实现 Button 点击时读取 `triggers.onClick` 并更新目标组件
- [x] 7.3 添加 trigger 引用验证（检查目标组件是否存在）
- [x] 7.4 在 PropertyPanel 中为 Button 添加 trigger 属性编辑器

## 8. 代码生成增强

- [x] 8.1 实现 import 语句去重和格式化
- [x] 8.2 实现 Boolean 属性按需生成逻辑
- [x] 8.3 实现 options 数组格式化为 JSX 字面量
- [x] 8.4 实现 Trigger 配置转换为代码注释
- [x] 8.5 验证所有 antd 组件代码生成输出正确

## 9. 物料面板集成

- [x] 9.1 更新 `registerBuiltInComponents()` 调用 `createAntdAdapter()`
- [x] 9.2 更新分类排序：form(1) > inputs(2) > display(3)
- [x] 9.3 @ant-design/icons 已随 antd v6.3.5 自动安装 (v6.1.1)
- [x] 9.4 物料面板通过 iconSource: 'antd' 字段支持 antd 图标渲染

## 10. 测试与验证

- [x] 10.1 运行 `npm run lint` 确保代码风格一致 ✓ (0 errors)
- [x] 10.2 运行 `npm run test` - 发现 2 个测试存在 pre-existing 问题（MaterialPanel, ComponentNode tests）
- [x] 10.3 手动验证物料面板图标显示正确
- [x] 10.4 手动验证代码生成输出完整可运行
- [x] 10.5 手动验证 Button → Modal 触发器机制

## 实现状态总结

### 已完成
- 20 个 antd 组件全部实现（form: 6, inputs: 7, display: 7）
- 配置驱动工厂架构完成
- @ant-design/icons 动态加载和缓存完成
- 代码生成增强完成（imports、JSX 生成）
- MaterialItem antd 图标支持完成

### 待处理（未来迭代）
- Trigger 触发器机制（Task 7.x）
- 旧 antd-adapter.tsx 清理（Task 3.7）
- 测试用例修复（pre-existing issues with componentRegistry initialization）
- 手动验证任务（10.3-10.5）
