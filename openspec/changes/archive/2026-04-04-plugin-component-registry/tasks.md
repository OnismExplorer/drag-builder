## 1. ComponentRegistry 基础设施

- [x] 1.1 创建 `src/store/componentRegistry.ts` 核心类型定义
  - ComponentDefinition 接口
  - PropertyDefinition 接口
  - PropertyGroup 接口
  - MaterialConfig 接口
  - AnimationConfig 相关类型
  - ComponentAdapter 接口
  - RegistryState 接口

- [x] 1.2 实现 ComponentRegistry 类
  - `register(definition)` 方法
  - `registerMany(definitions)` 方法
  - `unregister(type)` 方法
  - `registerAdapter(adapter)` 方法
  - `get(type)` 方法
  - `getAll()` 方法
  - `getByCategory(categoryId)` 方法
  - `getCategories()` 方法
  - `getMaterials()` 方法
  - `getMaterialsByCategory()` 方法
  - `setCategoryOrder(categories)` 方法
  - `createDefault(type, position)` 工厂方法

- [x] 1.3 导出单例 `componentRegistry`

## 2. 内置组件迁移

- [x] 2.1 创建 `src/components/built-in/index.ts`
  - 导出 `registerBuiltInComponents()` 函数
  - 调用 `componentRegistry.registerMany()` 注册所有内置组件

- [x] 2.2 创建 Div 组件定义
  - `type: 'div'`
  - `propertyGroups`: style (backgroundColor, borderColor, borderWidth, borderRadius)
  - `render()` 函数
  - `codeGen.generateJSX()` 和 `generateCSS()` 函数

- [x] 2.3 创建 Button 组件定义
  - `type: 'button'`
  - `propertyGroups`: style + content
  - `render()` 函数
  - `codeGen.generateJSX()` 函数

- [x] 2.4 创建 Text 组件定义
  - `type: 'text'`
  - `propertyGroups`: style + content

- [x] 2.5 创建 Image 组件定义
  - `type: 'image'`
  - `propertyGroups`: style + content (src, alt)

- [x] 2.6 创建 Input 组件定义
  - `type: 'input'`
  - `propertyGroups`: style + content (placeholder)

- [x] 2.7 创建 Radio/Checkbox/Tag 组件定义
  - `type: 'radio'`, `'checkbox'`, `'tag'`
  - 各自完整的 propertyGroups 和 render 函数

- [x] 2.8 设置内置组件分类顺序
  - basic: 基础组件
  - form: 表单组件

## 3. Canvas 渲染集成

- [x] 3.1 修改 `ComponentNode.tsx` 添加 Registry 渲染路径
  - 从 `componentRegistry.get(component.type)` 获取定义
  - 保留原有 switch-case 作为 fallback

- [x] 3.2 集成 framer-motion 动画渲染
  - 当 `component.animation` 存在时使用 `<motion.div>`
  - 传递 `initial`, `animate`, `transition` props

- [x] 3.3 保持交互功能不变
  - 拖拽 (useDraggable)
  - 选中边框 (2px solid #3B82F6)
  - 调整手柄 (ResizeHandles)
  - 多选同步移动

- [x] 3.4 修改 `EditorPage.tsx` 初始化 Registry
  - 在应用启动时调用 `registerBuiltInComponents()`

## 4. MaterialPanel 动态化

- [x] 4.1 修改 `MaterialPanel.tsx` 从 Registry 获取组件
  - 替换 `MATERIAL_CATEGORIES` 为 `componentRegistry.getMaterialsByCategory()`
  - 保持分类折叠动画

- [x] 4.2 移除 `materialConfig.ts` 中的静态配置
  - 删除 `MATERIAL_CATEGORIES`
  - 删除 `MATERIAL_CONFIGS`
  - 保留 `createDefaultComponent` 函数作为向后兼容（内部调用 Registry）

## 5. PropertyPanel 动态表单

- [x] 5.1 创建 `src/components/PropertyPanel/DynamicPropertyEditor.tsx`
  - 根据 `propertyGroups` 动态渲染属性编辑器
  - 实现 `PropertyInput` 组件支持所有类型 (number, color, string, select, checkbox)

- [x] 5.2 修改 `PropertyPanel.tsx` 使用动态编辑器
  - 当组件被选中时，从 Registry 获取 definition
  - 渲染 `DynamicPropertyEditor`

- [x] 5.3 创建动画配置面板
  - `AnimationEditor.tsx` 组件
  - 支持 enable/disable、initial state、duration、delay、easing
  - "预览动画" 按钮触发重播

## 6. 代码生成器扩展

- [x] 6.1 修改 `CodeGenerator` 支持动画序列化
  - 在 `generateImports()` 中根据组件是否有动画添加 framer-motion import
  - 在 `generateComponentJSX()` 中使用 `<motion.div>` 包装

- [x] 6.2 实现 `generateCSS()` 方法
  - 生成 `.comp-{id}` 类名规则
  - 包含 position 和 visual styles
  - 不包含 animation/transition

- [x] 6.3 修改 `generateTSXCode` 支持 CSS 模式
  - 添加 `mode: 'inline' | 'css'` 参数
  - CSS 模式下生成 `className` 而非 inline styles
  - 添加 CSS import 语句

- [x] 6.4 扩展 `generateClassName` 方法
  - 为每个组件生成唯一的 `comp-{id}` 类名

## 7. Ant Design 适配器

- [x] 7.1 创建 `src/components/adapters/antd-adapter.ts`
  - `createAntdAdapter()` 函数返回 ComponentAdapter
  - 包含 `antd-button` 和 `antd-input` 组件定义

- [x] 7.2 实现 Button 适配
  - 默认样式配置
  - 使用动态 import 懒加载 antd
  - Placeholder 渲染
  - `codeGen.generateJSX()` 输出 `<Button type="...">`

- [x] 7.3 在开发环境注册适配器
  - 在 `main.tsx` 或 `EditorPage.tsx` 初始化时注册

## 8. 验证与测试

- [x] 8.1 运行 `npm run lint` 确保无 lint 错误

- [x] 8.2 测试 Registry API
  - register/get/unregister 正常工作
  - createDefault 生成正确的 ComponentNode

- [x] 8.3 测试内置组件迁移
  - 所有内置组件在画布上正常渲染
  - 物料面板显示所有组件

- [x] 8.4 测试动画预览
  - 有动画配置的组件播放 framer-motion 动画
  - 无动画配置的组件正常渲染

- [x] 8.5 测试代码导出
  - inline 模式生成带 motion 的 TSX
  - CSS 模式生成 .tsx + .css 两个文件

- [x] 8.6 测试 AntD 适配器
  - antd-button 在 MaterialPanel 中显示
  - 拖放到画布后渲染 antd Button
