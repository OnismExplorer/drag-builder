## Why

当前 DragBuilder 的组件系统采用硬编码的 switch-case 方式扩展，每新增一种组件类型都需要修改核心渲染代码（ComponentNode.tsx）、物料配置（materialConfig.ts）、属性面板（PropertyPanel）和代码生成器（codeGenerator.ts）。这种模式在引入 Ant Design 等第三方组件库时会遇到严重瓶颈：**无法在不修改核心代码的情况下添加新组件**。

同时，动画系统虽然已经定义了 `AnimationConfig` 接口并引入了 framer-motion，但组件渲染层（ComponentNode）并未实际使用动画配置，导致用户无法在画布上预览动画效果，导出的代码也不包含动画信息。

## What Changes

1. **引入 ComponentRegistry 组件注册表**
   - 建立统一的组件定义存储（Map<string, ComponentDefinition>）
   - 提供 register/unregister/get/getAll 等标准 API
   - 支持组件定义的热插拔（运行时注册/注销）

2. **重构 ComponentNode 渲染引擎**
   - 从硬编码 switch-case 迁移到基于 Registry 的动态渲染
   - 集成 framer-motion 实现动画预览（initial/animate/transition）
   - 保持拖拽、选中、调整手柄等交互能力不变

3. **动态化 MaterialPanel**
   - 从静态配置的 MATERIAL_CATEGORIES 改为从 Registry 动态获取
   - 支持按分类分组展示组件

4. **动态化 PropertyPanel**
   - 基于 ComponentDefinition.propertyGroups 动态生成属性编辑器
   - 新增动画配置面板（duration, delay, ease, initial state, animate state）

5. **扩展 CodeGenerator**
   - 支持导出 framer-motion 动画代码
   - 新增 CSS 文件导出模式（生成 .css 文件而非内联样式）
   - 通过 ComponentDefinition.codeGen.generateCSS 支持组件级 CSS 生成

6. **创建 Ant Design 适配器示例**
   - 演示如何封装第三方组件库为 PluginDefinition
   - 包含 Button、Input 等基础组件的适配实现

## Capabilities

### New Capabilities

- `component-registry`: 组件注册表核心 API 和架构
- `animation-preview`: 画布实时动画预览系统
- `animation-export`: 导出代码携带 framer-motion 动画配置
- `css-export-mode`: CSS 文件分离导出模式
- `dynamic-property-panel`: 基于 Schema 的动态属性编辑器
- `antd-adapter`: Ant Design 组件库适配器示例

### Modified Capabilities

- 无（现有 specs 目录为空，无需修改现有需求规范）

## Impact

**前端架构影响：**
- `src/store/componentRegistry.ts` — 新增注册表模块
- `src/components/Canvas/ComponentNode.tsx` — 重构渲染逻辑
- `src/components/MaterialPanel/MaterialPanel.tsx` — 改为动态获取
- `src/components/PropertyPanel/PropertyPanel.tsx` — 新增动态表单生成
- `src/utils/codeGenerator.ts` — 扩展 CSS 和动画导出
- `src/components/built-in/` — 新增内置组件目录
- `src/components/adapters/` — 新增适配器目录

**依赖变更：**
- 无新增依赖（framer-motion 已在项目中使用）

**数据库影响：**
- 无（纯前端重构，不涉及数据模型变更）
