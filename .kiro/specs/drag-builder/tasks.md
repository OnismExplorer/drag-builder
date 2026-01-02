# 实现计划 - DragBuilder 可视化编程工具

## 概述

本实现计划将 DragBuilder 的设计转换为可执行的开发任务。任务按照前后端并行开发的方式组织，优先实现核心功能，然后逐步添加高级特性。每个任务都包含明确的实现目标和需求引用。

标记为 `*` 的任务为可选任务，可以跳过以加快 MVP 开发。

---

## 任务列表

### 阶段 1：项目初始化与基础架构

- [-] 1. 初始化项目结构
  - 创建三个项目目录：drag-builder-react, drag-builder-server, drag-builder-sql
  - 配置 Git 仓库和 .gitignore
  - 创建 README.md 文档
  - _需求：项目结构规范_

- [ ] 2. 初始化前端项目（drag-builder-react）
  - 使用 Vite 创建 React + TypeScript 项目
  - 安装依赖：Tailwind CSS, Zustand, @dnd-kit/core, Framer Motion, Axios, Prism.js
  - 配置 Tailwind CSS（包含自定义颜色：slate 系列和 #C2410C）
  - 配置 TypeScript 严格模式
  - 创建基础目录结构（components, store, types, utils, api, hooks）
  - _需求：2. 技术栈约束_

- [ ] 3. 初始化后端项目（drag-builder-server）
  - 使用 Nest CLI 创建 NestJS 项目
  - 安装依赖：TypeORM, pg, class-validator, class-transformer, @nestjs/swagger
  - 配置 TypeScript 严格模式
  - 创建基础目录结构（modules, common, config）
  - 配置环境变量（.env 和 .env.example）
  - _需求：2. 技术栈约束_

- [ ] 4. 初始化数据库（drag-builder-sql）
  - 创建 init.sql 脚本（创建 projects 表和索引）
  - 创建 seed.sql 脚本（插入示例数据）
  - 配置 PostgreSQL 连接（用户：onism，密码：123456，端口：5432）
  - _需求：12. 数据库 Schema 设计_



### 阶段 2：核心数据模型与状态管理

- [ ] 5. 定义 TypeScript 类型（前端）
  - 创建 types/component.ts（ComponentNode, ComponentType, Position, ComponentStyles, ComponentContent, AnimationConfig）
  - 创建 types/canvas.ts（CanvasState, CanvasConfig, CanvasPreset）
  - 创建 types/project.ts（Project）
  - 导出所有类型到 types/index.ts
  - _需求：DSL 数据结构_

- [ ] 6. 实现 Zustand Store（前端）
  - [ ] 6.1 实现 canvasStore（画布状态管理）
    - 状态：config, zoom, pan
    - 方法：setConfig, setZoom, setPan, resetCanvas
    - 添加 immer 中间件确保不可变更新
    - 缩放范围限制在 0.1 - 2.0
    - _需求：2.1, 2.2, 2.3_
  
  - [ ] 6.2 实现 componentStore（组件树状态管理）
    - 状态：components, selectedId
    - 查询方法：getComponentById, getSelectedComponent
    - 操作方法：addComponent, updateComponent, deleteComponent, selectComponent
    - 层级方法：bringToFront, sendToBack, moveUp, moveDown
    - 批量方法：clearAll, importComponents
    - _需求：3.4, 4.1, 8.2, 8.3, 8.4, 8.5_
  
  - [ ] 6.3 实现 uiStore（UI 状态管理）
    - 状态：isCodePreviewOpen, isCanvasSizeModalOpen, toast, isLoading
    - 方法：openCodePreview, closeCodePreview, showToast, hideToast, setLoading
    - _需求：1.2, 9.2, 15.1_

- [ ]* 6.4 编写 Store 的属性测试
  - **属性 1**：画布缩放边界不变量
  - **属性 16**：zIndex 非负不变量
  - _需求：2.3, 8.6_

- [ ] 7. 定义后端实体和 DTO
  - [ ] 7.1 创建 ProjectEntity（project.entity.ts）
    - 字段：id, name, canvasConfig, componentsTree, createdAt, updatedAt
    - 使用 TypeORM 装饰器
    - _需求：12.1_
  
  - [ ] 7.2 创建 DTO（project.dto.ts）
    - CreateProjectDto（包含验证规则）
    - UpdateProjectDto（所有字段可选）
    - CanvasConfigDto（嵌套验证）
    - _需求：11.2_

- [ ]* 7.3 编写 DTO 验证的单元测试
  - 测试必需字段验证
  - 测试数值范围验证
  - 测试格式验证（颜色 HEX 格式）
  - _需求：11.2, 11.3_



### 阶段 3：画布系统与基础交互

- [ ] 8. 实现画布规格选择模态框
  - [ ] 8.1 创建 Modal 基础组件（components/Modal/Modal.tsx）
    - 支持打开/关闭动画（Framer Motion）
    - 点击遮罩层关闭
    - 使用 Linear/Vercel 风格（rounded-2xl, shadow-sm）
    - _需求：1.2, 13. UI 视觉规范_
  
  - [ ] 8.2 创建 CanvasSizeModal 组件（components/Modal/CanvasSizeModal.tsx）
    - 显示四个预设选项（手机/平板/桌面/自定义）
    - 自定义选项显示宽高输入框
    - 输入验证（100-5000px）
    - 确认按钮创建画布
    - _需求：1.3, 1.4, 1.5, 1.6_

- [ ]* 8.3 编写 CanvasSizeModal 的单元测试
  - 测试四个预设选项渲染
  - 测试自定义选项显示输入框
  - 测试输入验证错误提示
  - _需求：1.3, 1.4, 1.5_

- [ ] 9. 实现画布核心组件
  - [ ] 9.1 创建 CanvasGrid 组件（components/Canvas/CanvasGrid.tsx）
    - 绘制网格背景（20px 间距，#F1F5F9）
    - 根据缩放比例显示/隐藏网格（<50% 隐藏）
    - _需求：2.6, 2.7_
  
  - [ ] 9.2 创建 Canvas 组件（components/Canvas/Canvas.tsx）
    - 渲染画布容器（应用 zoom 和 pan 变换）
    - 渲染所有组件节点
    - 处理画布点击（取消选中）
    - 支持鼠标中键拖拽平移
    - 支持 Ctrl + 滚轮缩放
    - 显示当前缩放比例（右下角）
    - _需求：2.1, 2.2, 2.3, 2.4, 2.5, 4.6_
  
  - [ ] 9.3 创建 ComponentNode 组件（components/Canvas/ComponentNode.tsx）
    - 根据 type 动态渲染不同元素（div/button/text/image/input）
    - 应用位置和样式
    - 集成 @dnd-kit 拖拽功能
    - 显示选中边框和调整手柄
    - _需求：3.4, 3.5, 3.6, 4.1, 4.2, 4.3, 4.4_

- [ ]* 9.4 编写 Canvas 的属性测试
  - **属性 4**：组件拖拽位置更新
  - **属性 5**：Shift 键约束拖拽
  - _需求：4.4, 4.5_

- [ ] 10. 实现组件调整功能
  - [ ] 10.1 创建 ResizeHandles 组件（components/Canvas/ResizeHandles.tsx）
    - 渲染 8 个调整手柄（四角 + 四边中点）
    - 处理手柄拖拽事件
    - 角落手柄：同时调整宽高
    - 边缘手柄：仅调整对应方向
    - Shift 键：保持宽高比
    - 限制最小尺寸（20x20px）和最大尺寸（画布尺寸 * 2）
    - _需求：5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [ ]* 10.2 编写调整功能的属性测试
  - **属性 6**：组件尺寸边界不变量
  - **属性 7**：角落手柄调整行为
  - **属性 8**：边缘手柄调整行为
  - **属性 9**：Shift 键保持宽高比
  - _需求：5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 11. 检查点 - 画布基础功能
  - 确保画布可以创建、平移、缩放
  - 确保组件可以拖拽和调整尺寸
  - 确保所有测试通过
  - 询问用户是否有问题



### 阶段 4：物料库与属性编辑面板

- [ ] 12. 实现物料库面板
  - [ ] 12.1 创建 MaterialPanel 组件（components/MaterialPanel/MaterialPanel.tsx）
    - 固定在左侧，宽度 280px
    - 使用毛玻璃效果（backdrop-blur-lg, bg-white/80）
    - 显示标题"组件库"（tracking-tight）
    - _需求：3.1, 3.2, 13. UI 视觉规范_
  
  - [ ] 12.2 创建 MaterialItem 组件（components/MaterialPanel/MaterialItem.tsx）
    - 显示组件图标和名称
    - 实现拖拽源（@dnd-kit）
    - 悬停效果（hover:bg-slate-100）
    - _需求：3.3_
  
  - [ ] 12.3 创建物料配置（components/MaterialPanel/materialConfig.ts）
    - 定义 5 个基础组件的默认样式
    - Div: 200x100px, 边框 1px slate-200, 圆角 16px
    - Button: 120x40px, 背景 #C2410C, 文字白色, 圆角 8px
    - Text: 字体 16px, 颜色 slate-900
    - Image: 200x200px, 占位符灰色背景
    - Input: 240x40px, 边框 1px slate-200, 圆角 8px
    - _需求：3.6_

- [ ]* 12.4 编写物料库的属性测试
  - **属性 2**：组件创建完整性
  - **属性 3**：组件选中状态一致性
  - _需求：3.4, 3.5, 3.6, 3.7, 3.8, 4.1, 4.2, 4.3, 4.7_

- [ ] 13. 实现属性编辑面板
  - [ ] 13.1 创建 PropertyPanel 组件（components/PropertyPanel/PropertyPanel.tsx）
    - 固定在右侧，宽度 320px
    - 使用毛玻璃效果（backdrop-blur-lg, bg-white/80）
    - 空状态显示"请选择一个组件"
    - 有选中组件时显示编辑区域
    - _需求：7.1, 7.2, 7.3, 7.4_
  
  - [ ] 13.2 创建 PositionEditor 组件（components/PropertyPanel/PositionEditor.tsx）
    - 输入框：X, Y, Width, Height
    - 实时验证（0-5000）
    - 使用防抖优化（300ms）
    - _需求：7.5, 14.4_
  
  - [ ] 13.3 创建 StyleEditor 组件（components/PropertyPanel/StyleEditor.tsx）
    - 颜色选择器（背景色、边框色、文字色）
    - 预设色板（Slate 系列 + #C2410C）
    - 数值输入（边框宽度、圆角、字体大小）
    - _需求：7.6_
  
  - [ ] 13.4 创建 ContentEditor 组件（components/PropertyPanel/ContentEditor.tsx）
    - 文本输入框（Text/Button 组件）
    - URL 输入框（Image 组件）
    - 占位符输入框（Input 组件）
    - _需求：7.4_
  
  - [ ] 13.5 创建 LayerControl 组件（components/PropertyPanel/LayerControl.tsx）
    - 四个按钮：置于顶层、上移一层、下移一层、置于底层
    - 使用图标按钮（↑↑ ↑ ↓ ↓↓）
    - 按钮样式：bg-slate-100 hover:bg-slate-200 rounded-lg p-2
    - _需求：8.1, 8.2, 8.3, 8.4, 8.5_

- [ ]* 13.6 编写属性面板的属性测试
  - **属性 10**：属性面板实时同步
  - **属性 11**：输入验证错误处理
  - **属性 12-15**：层级操作
  - _需求：7.5, 7.7, 8.2, 8.3, 8.4, 8.5_



### 阶段 5：吸附系统与辅助功能

- [ ] 14. 实现吸附算法
  - [ ] 14.1 创建 SnappingEngine 类（utils/snapping.ts）
    - 实现 detectSnapping 方法（检测对齐关系）
    - 实现 checkHorizontalAlignment 方法（左/右/水平居中对齐）
    - 实现 checkVerticalAlignment 方法（顶/底/垂直居中对齐）
    - 吸附阈值：5px
    - _需求：6.1, 6.2, 6.3, 6.4_
  
  - [ ] 14.2 创建 SnappingGuides 组件（components/Canvas/SnappingGuides.tsx）
    - 使用 SVG 绘制辅助线
    - 辅助线颜色：#EC4899（粉色）
    - 辅助线宽度：1px
    - 拖拽结束后隐藏
    - _需求：6.2, 6.5_

- [ ]* 14.3 编写吸附系统的属性测试
  - **属性 17**：吸附系统完整性
  - _需求：6.1, 6.2, 6.4_

- [ ] 15. 实现 Toast 提示组件
  - [ ] 15.1 创建 Toast 组件（components/Toast/Toast.tsx）
    - 固定在右上角
    - 三种类型：success（绿色）、error（红色）、info（蓝色）
    - 自动在 3 秒后消失
    - 使用 Framer Motion 实现进入/退出动画
    - _需求：15.1, 15.2, 15.6_

- [ ]* 15.2 编写 Toast 的单元测试
  - 测试三种类型的样式
  - 测试自动消失功能
  - _需求：15.2_

- [ ] 16. 实现顶部工具栏
  - [ ] 16.1 创建 Toolbar 组件（components/Toolbar/Toolbar.tsx）
    - 固定在顶部，高度 64px
    - 左侧：Logo 和项目名称
    - 右侧：保存按钮、查看代码按钮
    - 使用 Linear/Vercel 风格
    - _需求：9.1, 10.1_
  
  - [ ] 16.2 创建 ZoomControl 组件（components/Toolbar/ZoomControl.tsx）
    - 显示当前缩放比例（例如："100%"）
    - 提供缩放按钮（+/-）
    - _需求：2.4_

- [ ] 17. 检查点 - 前端核心功能完成
  - 确保物料库、属性面板、吸附系统正常工作
  - 确保 UI 符合 Linear/Vercel 风格
  - 确保所有测试通过
  - 询问用户是否有问题



### 阶段 6：代码生成引擎

- [ ] 18. 实现代码生成器
  - [ ] 18.1 创建 CodeGenerator 类（utils/codeGenerator.ts）
    - 实现 generateTSXCode 方法（生成完整 TSX 文件）
    - 实现 generateImports 方法（生成 import 语句）
    - 实现 generateComponent 方法（生成组件代码）
    - 实现 generateJSX 方法（递归生成 JSX）
    - 实现 generateComponentJSX 方法（生成单个组件 JSX）
    - 实现 generateInlineStyle 方法（生成内联样式对象）
    - 实现 generateClassName 方法（生成 Tailwind 类名）
    - 实现 mapBorderRadiusToTailwind 方法（映射圆角值）
    - _需求：9.7_
  
  - [ ] 18.2 创建 CodePreview 组件（components/CodePreview/CodePreview.tsx）
    - 模态窗口展示代码
    - 使用 Prism.js 语法高亮
    - 提供"复制代码"按钮
    - 复制成功显示 Toast 提示
    - 空画布显示空组件模板
    - _需求：9.2, 9.3, 9.4, 9.5, 9.6, 9.8_

- [ ]* 18.3 编写代码生成器的属性测试
  - **属性 18**：代码生成有效性
  - 测试生成的代码是否为有效的 TypeScript
  - 测试生成的代码是否包含必要的 import
  - 测试空画布生成空模板
  - _需求：9.3, 9.7, 9.8_

- [ ]* 18.4 编写代码生成器的单元测试
  - 测试各种组件类型的代码生成
  - 测试样式转换（内联样式和 Tailwind 类名）
  - 测试边界情况（空画布、单个组件、多个组件）
  - _需求：9.7_



### 阶段 7：后端 API 实现

- [ ] 19. 实现数据库配置
  - [ ] 19.1 创建数据库配置（src/config/database.config.ts）
    - 配置 TypeORM 连接参数
    - 使用环境变量（DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_DATABASE）
    - 开发环境启用 synchronize 和 logging
    - _需求：12. 数据库配置_
  
  - [ ] 19.2 创建 .env 和 .env.example 文件
    - 配置数据库连接信息
    - 配置应用端口和 CORS
    - _需求：12. 数据库配置_
  
  - [ ] 19.3 在 AppModule 中注册 TypeORM
    - 导入 TypeOrmModule.forRoot
    - 使用 databaseConfig
    - _需求：12. 数据库配置_

- [ ] 20. 实现 Project 模块
  - [ ] 20.1 创建 ProjectService（src/modules/project/project.service.ts）
    - 实现 create 方法（创建项目）
    - 实现 findAll 方法（获取项目列表，支持分页和搜索）
    - 实现 findOne 方法（获取单个项目）
    - 实现 update 方法（更新项目）
    - 实现 remove 方法（删除项目）
    - _需求：11.1, 11.4, 11.7_
  
  - [ ] 20.2 创建 ProjectController（src/modules/project/project.controller.ts）
    - POST /api/projects（创建项目）
    - GET /api/projects（获取项目列表）
    - GET /api/projects/:id（获取单个项目）
    - PUT /api/projects/:id（更新项目）
    - DELETE /api/projects/:id（删除项目）
    - 使用 DTO 验证
    - 使用 ParseUUIDPipe 验证 UUID
    - _需求：11.1, 11.2, 11.8_
  
  - [ ] 20.3 创建 ProjectModule（src/modules/project/project.module.ts）
    - 注册 ProjectEntity
    - 注册 ProjectService 和 ProjectController
    - _需求：11.1_

- [ ]* 20.4 编写 Project 模块的属性测试
  - **属性 19**：项目持久化完整性
  - **属性 20**：API 输入验证
  - **属性 21**：项目数据往返一致性
  - _需求：11.2, 11.3, 11.4, 11.5, 11.6, 10.8_

- [ ]* 20.5 编写 Project 模块的单元测试
  - 测试 CRUD 操作
  - 测试分页和搜索功能
  - 测试错误处理（404, 400）
  - _需求：11.1, 11.7, 11.8_

- [ ] 21. 实现全局错误处理
  - [ ] 21.1 创建 HttpExceptionFilter（src/common/filters/http-exception.filter.ts）
    - 捕获所有 HttpException
    - 统一错误响应格式
    - 记录错误日志
    - _需求：15.5_
  
  - [ ] 21.2 创建 ValidationPipe 配置（src/main.ts）
    - 配置全局验证管道
    - 自定义验证错误格式
    - _需求：11.2, 11.3_
  
  - [ ] 21.3 在 main.ts 中注册全局过滤器和管道
    - app.useGlobalFilters(new HttpExceptionFilter())
    - app.useGlobalPipes(new ValidationPipe(...))
    - _需求：11.2, 15.1_

- [ ] 22. 实现健康检查模块
  - [ ] 22.1 创建 HealthController（src/modules/health/health.controller.ts）
    - GET /api/health（返回服务状态）
    - 检查数据库连接
    - _需求：非功能性需求_

- [ ] 23. 检查点 - 后端 API 完成
  - 确保所有 API 端点正常工作
  - 确保数据库连接正常
  - 确保错误处理正确
  - 确保所有测试通过
  - 询问用户是否有问题



### 阶段 8：前后端集成

- [ ] 24. 实现前端 API 客户端
  - [ ] 24.1 创建 Axios 实例（src/api/client.ts）
    - 配置 baseURL（http://localhost:3000）
    - 配置超时时间（5000ms）
    - 添加请求拦截器（添加 headers）
    - 添加响应拦截器（统一错误处理）
    - _需求：10.2, 14.6, 15.1_
  
  - [ ] 24.2 创建 Project API（src/api/projectApi.ts）
    - createProject 方法（POST /api/projects）
    - getProjects 方法（GET /api/projects）
    - getProject 方法（GET /api/projects/:id）
    - updateProject 方法（PUT /api/projects/:id）
    - deleteProject 方法（DELETE /api/projects/:id）
    - _需求：10.2, 10.3, 10.7_

- [ ] 25. 实现项目保存功能
  - [ ] 25.1 在 Toolbar 中添加"保存项目"按钮
    - 点击按钮调用 createProject API
    - 显示加载动画
    - 成功显示绿色 Toast
    - 失败显示红色 Toast
    - _需求：10.1, 10.2, 10.4, 10.5, 14.5_

- [ ]* 25.2 编写保存功能的单元测试
  - 测试成功保存流程
  - 测试错误处理
  - 测试加载状态
  - _需求：10.4, 10.5, 14.5_

- [ ] 26. 实现项目列表页面
  - [ ] 26.1 创建 ProjectList 组件（src/components/ProjectList/ProjectList.tsx）
    - 显示"我的项目"标题
    - 显示项目卡片列表
    - 每个卡片显示：项目名称、创建时间、预览缩略图
    - 点击卡片加载项目
    - 提供"创建新项目"按钮
    - _需求：10.6_
  
  - [ ] 26.2 实现项目加载功能
    - 点击项目卡片调用 getProject API
    - 恢复画布配置（config, zoom, pan）
    - 恢复组件树（importComponents）
    - 显示加载动画
    - _需求：10.7, 10.8_

- [ ]* 26.3 编写项目列表的单元测试
  - 测试项目列表渲染
  - 测试项目加载流程
  - _需求：10.6, 10.7_

- [ ] 27. 实现路由系统
  - [ ] 27.1 安装 React Router（react-router-dom）
    - 配置路由：/ (首页), /editor (编辑器)
    - 首页显示 ProjectList
    - 编辑器显示 Canvas + MaterialPanel + PropertyPanel
    - _需求：项目结构_

- [ ] 28. 检查点 - 前后端集成完成
  - 确保项目可以保存到数据库
  - 确保项目可以从数据库加载
  - 确保数据往返一致性
  - 确保所有测试通过
  - 询问用户是否有问题



### 阶段 9：UI 优化与性能提升

- [ ] 29. 实现性能优化
  - [ ] 29.1 添加虚拟化渲染（react-window）
    - 当组件数量 > 50 时启用虚拟化
    - 仅渲染可视区域内的组件
    - _需求：14.1_
  
  - [ ] 29.2 优化 React 渲染
    - 为 Canvas、ComponentNode、PropertyPanel 添加 React.memo
    - 为事件处理函数使用 useCallback
    - 为计算结果使用 useMemo
    - _需求：14.2, 14.3_
  
  - [ ] 29.3 添加防抖和节流
    - 属性输入框：防抖 300ms
    - 画布拖拽：节流 16ms
    - 窗口 resize：防抖 200ms
    - _需求：14.4_

- [ ]* 29.4 编写性能测试
  - 测试虚拟化渲染是否正确启用
  - 测试防抖和节流是否生效
  - _需求：14.1, 14.4_

- [ ] 30. 实现 UI 细节优化
  - [ ] 30.1 添加加载动画
    - 项目保存时显示 Spinner
    - 项目加载时显示 Skeleton
    - _需求：14.5_
  
  - [ ] 30.2 添加空状态
    - 项目列表为空时显示"暂无项目"
    - 画布为空时显示"从左侧拖拽组件开始设计"
    - _需求：用户体验_
  
  - [ ] 30.3 添加键盘快捷键
    - Delete 键：删除选中组件
    - Ctrl+Z：撤销（可选）
    - Ctrl+S：保存项目
    - _需求：用户体验_
  
  - [ ] 30.4 添加响应式提示
    - 屏幕宽度 < 1280px 时显示"请使用更大的屏幕"
    - _需求：非功能性需求 - 兼容性_

- [ ] 31. 实现错误边界
  - [ ] 31.1 创建 ErrorBoundary 组件（src/components/ErrorBoundary/ErrorBoundary.tsx）
    - 捕获组件渲染错误
    - 显示友好的错误页面
    - 提供"刷新页面"按钮
    - 记录错误日志
    - _需求：15.5_

- [ ] 32. 检查点 - UI 优化完成
  - 确保性能优化生效
  - 确保 UI 细节完善
  - 确保错误处理完善
  - 询问用户是否有问题



### 阶段 10：测试与文档

- [ ] 33. 完善测试覆盖
  - [ ]* 33.1 编写集成测试（前端）
    - 测试完整的拖拽 → 创建 → 编辑流程
    - 测试保存 → 加载流程
    - 测试代码生成流程
    - _需求：所有功能需求_
  
  - [ ]* 33.2 编写集成测试（后端）
    - 测试完整的 CRUD 流程
    - 测试数据库事务
    - 测试错误处理
    - _需求：11. 后端 API_
  
  - [ ]* 33.3 编写 E2E 测试（Cypress）
    - 测试用户完整流程：创建项目 → 设计页面 → 保存 → 加载 → 导出代码
    - 测试错误场景：网络错误、验证错误
    - _需求：所有功能需求_

- [ ] 34. 编写文档
  - [ ] 34.1 编写前端 README（drag-builder-react/README.md）
    - 项目介绍
    - 技术栈
    - 安装和运行
    - 目录结构
    - 开发指南
    - _需求：项目文档_
  
  - [ ] 34.2 编写后端 README（drag-builder-server/README.md）
    - 项目介绍
    - 技术栈
    - 安装和运行
    - API 文档
    - 数据库配置
    - _需求：项目文档_
  
  - [ ] 34.3 编写数据库 README（drag-builder-sql/README.md）
    - 数据库 Schema 说明
    - 初始化脚本使用方法
    - 示例数据说明
    - _需求：项目文档_
  
  - [ ] 34.4 编写根目录 README（README.md）
    - 项目整体介绍
    - 快速开始指南
    - 架构图
    - 技术栈
    - 贡献指南
    - _需求：项目文档_

- [ ] 35. 代码质量检查
  - [ ] 35.1 配置 ESLint 和 Prettier
    - 前端和后端统一代码风格
    - 配置自动格式化
    - _需求：非功能性需求 - 可维护性_
  
  - [ ] 35.2 运行代码质量检查
    - 运行 ESLint 检查
    - 运行 TypeScript 类型检查
    - 确保没有 any 类型（严格模式）
    - _需求：非功能性需求 - 可维护性_
  
  - [ ] 35.3 检查测试覆盖率
    - 前端单元测试覆盖率 ≥ 80%
    - 后端单元测试覆盖率 ≥ 80%
    - 所有属性测试通过
    - _需求：测试策略_



### 阶段 11：部署准备

- [ ] 36. 配置生产环境构建
  - [ ] 36.1 配置前端生产构建
    - 配置 Vite 生产构建（vite build）
    - 优化打包体积（代码分割、Tree Shaking）
    - 配置环境变量（VITE_API_URL）
    - _需求：非功能性需求 - 性能_
  
  - [ ] 36.2 配置后端生产构建
    - 配置 NestJS 生产构建（nest build）
    - 配置环境变量（NODE_ENV=production）
    - 禁用 TypeORM synchronize
    - _需求：非功能性需求 - 安全性_
  
  - [ ] 36.3 创建 Docker 配置（可选）
    - 创建 Dockerfile（前端、后端、数据库）
    - 创建 docker-compose.yml
    - 配置容器网络
    - _需求：部署架构_

- [ ] 37. 配置 CORS 和安全
  - [ ] 37.1 配置 CORS
    - 允许前端域名访问后端 API
    - 配置允许的 HTTP 方法
    - _需求：非功能性需求 - 安全性_
  
  - [ ] 37.2 配置安全头
    - 添加 Helmet 中间件
    - 配置 CSP（Content Security Policy）
    - _需求：非功能性需求 - 安全性_
  
  - [ ] 37.3 配置 HTTPS（生产环境）
    - 配置 SSL 证书
    - 强制 HTTPS 重定向
    - _需求：非功能性需求 - 安全性_

- [ ] 38. 最终检查点
  - 确保所有功能正常工作
  - 确保所有测试通过
  - 确保代码质量达标
  - 确保文档完整
  - 删除不必要(已完成)的测试代码/文档
  - 确保生产构建成功
  - 询问用户是否准备好部署

---

## 注意事项

### 可选任务说明
- 标记为 `*` 的任务为可选任务，主要是测试相关任务
- 可以跳过这些任务以加快 MVP 开发
- 但强烈建议在正式发布前完成所有测试任务

### 开发顺序建议
1. **前后端并行开发**：前端和后端可以同时进行，使用 Mock 数据进行前端开发
2. **增量开发**：每完成一个阶段就进行测试和验证
3. **频繁检查点**：在关键节点停下来检查进度和质量

### 测试策略
- **单元测试**：测试单个函数和组件
- **属性测试**：测试通用属性（每个测试 100 次迭代）
- **集成测试**：测试模块间协作
- **E2E 测试**：测试完整用户流程

### 代码规范
- **TypeScript 严格模式**：禁止使用 any 类型
- **中文注释**：所有代码必须包含详尽的中文注释
- **组件化**：React 组件独立文件夹，NestJS 模块化
- **UI 规范**：严格遵循 Linear/Vercel 风格

---

## 总结

本实现计划包含 **38 个主要任务**，分为 **11 个阶段**：

1. ✅ 项目初始化与基础架构（4 个任务）
2. ✅ 核心数据模型与状态管理（3 个任务）
3. ✅ 画布系统与基础交互（4 个任务）
4. ✅ 物料库与属性编辑面板（2 个任务）
5. ✅ 吸附系统与辅助功能（3 个任务）
6. ✅ 代码生成引擎（1 个任务）
7. ✅ 后端 API 实现（5 个任务）
8. ✅ 前后端集成（5 个任务）
9. ✅ UI 优化与性能提升（4 个任务）
10. ✅ 测试与文档（3 个任务）
11. ✅ 部署准备（3 个任务）

**预计开发时间**：
- 核心功能（阶段 1-8）：约 2-3 周
- 优化和测试（阶段 9-10）：约 1 周
- 部署准备（阶段 11）：约 2-3 天

**下一步**：开始执行任务 1 - 初始化项目结构

