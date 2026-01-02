# 需求文档 - DragBuilder 可视化编程工具

## 简介

DragBuilder 是一个全栈前端拖拉式可视化编程工具，允许开发者通过类似 Figma 的自由画布快速构建 React 页面，并一键导出高质量代码。本文档定义 Phase 1 的核心功能需求，包括前端画布系统、后端 API 服务和数据库持久化。

## 术语表

- **System**: DragBuilder 系统（包含前端、后端和数据库）
- **Canvas**: 画布，用户进行组件拖拽和布局的工作区域
- **Component_Node**: 组件节点，画布上的可视化元素（Div/Button/Text/Image/Input）
- **Material_Panel**: 物料库面板，展示可拖拽组件的左侧面板
- **Property_Panel**: 属性编辑面板，编辑选中组件样式和内容的右侧面板
- **Code_Preview**: 代码预览窗口，实时展示生成的 TSX 代码
- **DSL**: 领域特定语言，描述画布状态的 JSON 数据结构
- **Project**: 项目，包含完整画布配置和组件树的可保存单元
- **Infinite_Canvas**: 无限画布，支持平移和缩放的可视化工作区
- **Snapping_Guide**: 吸附辅助线，帮助组件对齐的视觉辅助线
- **User**: 使用 DragBuilder 的开发者

---

## 需求

### 需求 1：画布初始化与规格选择

**用户故事**：作为开发者，我希望在创建新项目时选择画布规格，以便快速开始适配不同设备的页面设计。

#### 验收标准

1. WHEN User 打开应用首页，THE System SHALL 展示"创建新项目"按钮
2. WHEN User 点击"创建新项目"按钮，THE System SHALL 弹出画布规格选择模态框
3. THE Modal SHALL 提供四种预设规格选项：
   - 手机（375x667px）
   - 平板（768x1024px）
   - 桌面（1440x900px）
   - 自定义（用户输入宽高）
4. WHERE 用户选择"自定义"，THE System SHALL 展示宽度和高度输入框
5. WHEN 用户输入的宽度或高度小于 100px 或大于 5000px，THE System SHALL 显示错误提示"尺寸必须在 100-5000px 之间"
6. WHEN 用户确认规格选择，THE System SHALL 创建新的 Project 并初始化 Canvas
7. THE Canvas SHALL 使用纯白背景（#FFFFFF）和居中布局

---

### 需求 2：无限画布交互

**用户故事**：作为开发者，我希望在无限画布上自由平移和缩放，以便灵活查看和编辑大型页面布局。

#### 验收标准

1. THE Canvas SHALL 支持鼠标中键拖拽进行平移
2. THE Canvas SHALL 支持 Ctrl + 鼠标滚轮进行缩放
3. WHEN 用户缩放画布，THE System SHALL 限制缩放范围在 10% 到 200% 之间
4. THE System SHALL 在画布右下角显示当前缩放比例（例如："100%"）
5. WHEN 用户缩放或平移画布，THE System SHALL 实时更新所有 Component_Node 的视觉位置
6. THE Canvas SHALL 显示网格背景（1px 极浅灰色 #F1F5F9，间距 20px）
7. WHEN 画布缩放小于 50%，THE System SHALL 隐藏网格以保持视觉清晰

---

### 需求 3：物料库面板与组件拖拽

**用户故事**：作为开发者，我希望从物料库拖拽组件到画布，以便快速构建页面结构。

#### 验收标准

1. THE Material_Panel SHALL 固定在画布左侧，宽度为 280px
2. THE Material_Panel SHALL 使用毛玻璃效果（backdrop-blur-lg）和半透明白色背景（bg-white/80）
3. THE Material_Panel SHALL 展示 5 个基础组件：
   - Div（容器）
   - Button（按钮）
   - Text（文本）
   - Image（图片）
   - Input（输入框）
4. WHEN User 从 Material_Panel 拖拽组件到 Canvas，THE System SHALL 创建新的 Component_Node
5. THE Component_Node SHALL 在鼠标释放位置生成，坐标为画布相对坐标
6. WHEN 组件生成时，THE System SHALL 应用默认样式：
   - Div: 宽 200px，高 100px，边框 1px slate-200，圆角 16px
   - Button: 宽 120px，高 40px，背景 #C2410C，文字白色，圆角 8px
   - Text: 字体 16px，颜色 slate-900，内容"文本内容"
   - Image: 宽 200px，高 200px，占位符灰色背景
   - Input: 宽 240px，高 40px，边框 1px slate-200，圆角 8px
7. THE System SHALL 为新生成的 Component_Node 分配唯一 ID（UUID v4）
8. WHEN 组件生成后，THE System SHALL 自动选中该组件

---

### 需求 4：组件选中与移动

**用户故事**：作为开发者，我希望选中并移动画布上的组件，以便调整页面布局。

#### 验收标准

1. WHEN User 点击 Canvas 上的 Component_Node，THE System SHALL 选中该组件
2. WHEN 组件被选中，THE System SHALL 显示蓝色选中边框（2px solid #3B82F6）
3. WHEN 组件被选中，THE System SHALL 显示 8 个调整手柄（四角 + 四边中点）
4. WHEN User 拖拽选中的组件，THE System SHALL 实时更新组件位置
5. WHEN User 按住 Shift 键拖拽组件，THE System SHALL 锁定水平或垂直方向移动
6. WHEN User 点击画布空白区域，THE System SHALL 取消所有组件选中状态
7. THE System SHALL 在 Property_Panel 中显示选中组件的属性

---

### 需求 5：组件缩放与调整

**用户故事**：作为开发者，我希望通过拖拽手柄调整组件尺寸，以便精确控制布局。

#### 验收标准

1. WHEN User 拖拽组件的角落手柄，THE System SHALL 同时调整宽度和高度
2. WHEN User 拖拽组件的边缘手柄，THE System SHALL 仅调整对应方向的尺寸
3. WHEN User 按住 Shift 键拖拽角落手柄，THE System SHALL 保持组件宽高比
4. THE System SHALL 限制组件最小尺寸为 20x20px
5. THE System SHALL 限制组件最大尺寸为画布尺寸的 2 倍
6. WHEN 组件尺寸改变，THE System SHALL 实时更新 Property_Panel 中的宽高数值

---

### 需求 6：吸附辅助线

**用户故事**：作为开发者，我希望在移动组件时看到对齐辅助线，以便快速对齐多个组件。

#### 验收标准

1. WHEN User 拖拽组件，THE System SHALL 检测与其他组件的对齐关系
2. WHEN 组件边缘与其他组件边缘距离小于 5px，THE System SHALL 显示粉色辅助线（1px solid #EC4899）
3. THE System SHALL 检测以下对齐类型：
   - 左对齐
   - 右对齐
   - 顶部对齐
   - 底部对齐
   - 水平居中对齐
   - 垂直居中对齐
4. WHEN 检测到对齐，THE System SHALL 自动吸附组件到对齐位置（误差 ±2px）
5. WHEN User 释放鼠标，THE System SHALL 隐藏所有辅助线

---

### 需求 7：属性编辑面板

**用户故事**：作为开发者，我希望通过属性面板编辑组件样式和内容，以便精确控制组件外观。

#### 验收标准

1. THE Property_Panel SHALL 固定在画布右侧，宽度为 320px
2. THE Property_Panel SHALL 使用毛玻璃效果（backdrop-blur-lg）和半透明白色背景（bg-white/80）
3. WHEN 没有组件被选中，THE Property_Panel SHALL 显示提示文字"请选择一个组件"
4. WHEN 组件被选中，THE Property_Panel SHALL 显示以下编辑区域：
   - 位置与尺寸（X, Y, Width, Height）
   - 样式配置（背景色、边框、圆角、阴影）
   - 内容配置（文本内容、图片 URL、占位符）
   - 层级控制（Z-index 调整按钮）
5. WHEN User 修改任何属性值，THE System SHALL 实时更新 Canvas 上的组件渲染
6. THE System SHALL 为颜色选择器提供预设色板（包含 Slate 系列和主色调 #C2410C）
7. WHEN User 输入非法数值（如负数宽度），THE System SHALL 显示错误提示并阻止更新

---

### 需求 8：层级管理

**用户故事**：作为开发者，我希望调整组件的层级顺序，以便控制组件的遮挡关系。

#### 验收标准

1. THE Property_Panel SHALL 提供四个层级控制按钮：
   - 置于顶层
   - 上移一层
   - 下移一层
   - 置于底层
2. WHEN User 点击"置于顶层"，THE System SHALL 将选中组件的 zIndex 设置为当前最大值 + 1
3. WHEN User 点击"上移一层"，THE System SHALL 将选中组件的 zIndex 增加 1
4. WHEN User 点击"下移一层"，THE System SHALL 将选中组件的 zIndex 减少 1
5. WHEN User 点击"置于底层"，THE System SHALL 将选中组件的 zIndex 设置为 0
6. THE System SHALL 确保所有组件的 zIndex 值为非负整数

---

### 需求 9：代码预览窗口

**用户故事**：作为开发者，我希望实时查看当前画布生成的 TSX 代码，以便验证导出结果。

#### 验收标准

1. THE System SHALL 在顶部工具栏提供"查看代码"按钮
2. WHEN User 点击"查看代码"按钮，THE System SHALL 打开 Code_Preview 模态窗口
3. THE Code_Preview SHALL 展示当前画布生成的完整 TSX 代码
4. THE Code_Preview SHALL 使用语法高亮显示代码（使用 Prism.js 或类似库）
5. THE Code_Preview SHALL 提供"复制代码"按钮
6. WHEN User 点击"复制代码"，THE System SHALL 将代码复制到剪贴板并显示成功提示
7. THE System SHALL 生成符合以下规范的代码：
   - 使用 TypeScript + React 18 语法
   - 使用 Tailwind CSS 类名（内联模式）
   - 包含必要的 import 语句
   - 代码格式化（2 空格缩进）
8. WHEN 画布为空，THE Code_Preview SHALL 显示空组件模板

---

### 需求 10：项目保存与加载（后端集成）

**用户故事**：作为开发者，我希望保存当前项目到服务器，以便下次继续编辑。

#### 验收标准

1. THE System SHALL 在顶部工具栏提供"保存项目"按钮
2. WHEN User 点击"保存项目"按钮，THE System SHALL 将当前 DSL 数据发送到后端 API
3. THE System SHALL 发送 POST 请求到 `/api/projects`，包含以下数据：
   - 项目名称
   - 画布配置（宽高、缩放、平移）
   - 组件树（完整 DSL）
4. WHEN 后端返回成功响应（HTTP 201），THE System SHALL 显示"保存成功"提示
5. WHEN 后端返回错误响应（HTTP 4xx/5xx），THE System SHALL 显示错误信息
6. THE System SHALL 在首页展示"我的项目"列表
7. WHEN User 点击项目列表中的项目，THE System SHALL 发送 GET 请求到 `/api/projects/:id`
8. WHEN 后端返回项目数据，THE System SHALL 恢复画布状态和所有组件

---

### 需求 11：后端 API - 项目管理

**用户故事**：作为系统，我需要提供 RESTful API 来管理项目数据，以便前端进行持久化操作。

#### 验收标准

1. THE System SHALL 提供以下 API 端点：
   - `POST /api/projects` - 创建新项目
   - `GET /api/projects` - 获取项目列表
   - `GET /api/projects/:id` - 获取单个项目详情
   - `PUT /api/projects/:id` - 更新项目
   - `DELETE /api/projects/:id` - 删除项目
2. WHEN 接收到 POST 请求，THE System SHALL 验证请求体包含必需字段（name, canvas, components）
3. WHEN 验证失败，THE System SHALL 返回 HTTP 400 和错误详情
4. WHEN 验证成功，THE System SHALL 将项目数据存入 PostgreSQL 数据库
5. THE System SHALL 为每个项目生成唯一 UUID
6. THE System SHALL 记录项目的创建时间和更新时间
7. WHEN 接收到 GET 请求，THE System SHALL 返回 JSON 格式的项目数据
8. WHEN 请求的项目不存在，THE System SHALL 返回 HTTP 404

---

### 需求 12：数据库 Schema 设计

**用户故事**：作为系统，我需要设计合理的数据库表结构，以便高效存储项目数据。

#### 验收标准

1. THE System SHALL 创建 `projects` 表，包含以下字段：
   - `id` (UUID, Primary Key)
   - `name` (VARCHAR(255), NOT NULL)
   - `canvas_config` (JSONB, NOT NULL) - 存储画布配置
   - `components_tree` (JSONB, NOT NULL) - 存储组件树 DSL
   - `created_at` (TIMESTAMP, DEFAULT NOW())
   - `updated_at` (TIMESTAMP, DEFAULT NOW())
2. THE System SHALL 为 `name` 字段创建索引以优化搜索
3. THE System SHALL 为 `created_at` 字段创建索引以优化排序
4. THE System SHALL 使用 JSONB 类型存储 DSL 数据以支持高效查询
5. THE System SHALL 提供初始化 SQL 脚本（位于 `drag-builder-sql/init.sql`）

---

### 需求 13：UI 视觉规范

**用户故事**：作为开发者，我希望界面符合现代 SaaS 美学，以便获得专业的使用体验。

#### 验收标准

1. THE System SHALL 使用纯白背景（#FFFFFF）作为主背景色
2. THE System SHALL 使用 Slate-900 (#0F172A) 作为标题文字颜色
3. THE System SHALL 使用 Slate-500 (#64748B) 作为正文文字颜色
4. THE System SHALL 使用橙红色（#C2410C）作为主色调（按钮、链接、高亮）
5. THE System SHALL 为所有卡片使用 16px 圆角（rounded-2xl）
6. THE System SHALL 为所有边框使用 1px 极浅灰色（#F1F5F9）
7. THE System SHALL 为卡片使用极轻微阴影（shadow-sm）
8. THE System SHALL 为标题文字应用 `tracking-tight` 类（收紧字间距）
9. THE System SHALL 在布局中保持大量留白（padding 和 margin 使用 Tailwind 的 8/12/16 单位）
10. THE Material_Panel 和 Property_Panel SHALL 使用毛玻璃效果（backdrop-blur-lg + bg-white/80）

---

### 需求 14：响应式与性能

**用户故事**：作为开发者，我希望系统响应流畅，以便高效完成设计工作。

#### 验收标准

1. WHEN 画布包含超过 50 个组件，THE System SHALL 使用虚拟化渲染优化性能
2. WHEN User 拖拽组件，THE System SHALL 确保帧率不低于 30 FPS
3. WHEN User 修改属性，THE System SHALL 在 100ms 内更新画布渲染
4. THE System SHALL 使用防抖（debounce）处理属性输入框的实时更新（延迟 300ms）
5. THE System SHALL 在保存项目时显示加载动画
6. WHEN 网络请求超过 5 秒未响应，THE System SHALL 显示超时错误提示

---

### 需求 15：错误处理与用户反馈

**用户故事**：作为开发者，我希望系统在出错时提供清晰的反馈，以便快速定位问题。

#### 验收标准

1. WHEN 后端 API 返回错误，THE System SHALL 在右上角显示 Toast 错误提示
2. THE Toast SHALL 自动在 3 秒后消失
3. WHEN 用户输入非法数据，THE System SHALL 在输入框下方显示红色错误文字
4. WHEN 网络断开，THE System SHALL 显示"网络连接失败，请检查网络设置"提示
5. THE System SHALL 在控制台记录所有错误日志（包含时间戳和堆栈信息）
6. WHEN 项目保存成功，THE System SHALL 显示绿色成功 Toast

---

## 非功能性需求

### 性能要求
- 画布渲染帧率：≥30 FPS（50 个组件以内）
- API 响应时间：≤500ms（P95）
- 前端首屏加载时间：≤2s

### 兼容性要求
- 浏览器：Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- 屏幕分辨率：最小 1280x720px

### 安全性要求
- 所有 API 请求使用 HTTPS
- 输入数据进行 XSS 防护
- SQL 查询使用参数化防止注入

### 可维护性要求
- 代码注释覆盖率：≥30%
- 组件复用率：≥60%
- TypeScript 严格模式启用
