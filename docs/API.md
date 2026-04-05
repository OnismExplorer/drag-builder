# DragBuilder API 接口契约文档

> **⚠️ AI 助手必读警告**
>
> 本文档是 DragBuilder 项目后端 API 的**唯一权威来源**。
>
> **AI 助手在开发前端 API 请求时，必须严格遵守本文件的字段定义**，包括：
> - 严格使用本文档列出的字段名（大小写敏感）
> - 严格遵守各字段的类型约束和枚举值
> - 严禁擅自修改入参结构或猜测未列出的字段
> - 严禁省略必填字段
>
> 任何对 API 契约的擅自修改都将导致数据解析错误或后端验证失败。

---

## 1. 基础配置

### 1.1 Base URL

```
开发环境：http://localhost:3000
```

> 本后端**未设置全局路径前缀**（无 `setGlobalPrefix`），所有端点均直接挂载在根路径下。

### 1.2 CORS 配置

| 配置项 | 值 |
|--------|-----|
| 允许来源 | `http://localhost:5173`（开发默认，可通过 `CORS_ORIGIN` 环境变量覆盖） |
| 允许方法 | `GET`, `POST`, `PUT`, `DELETE`, `OPTIONS` |
| 允许头部 | `Content-Type`, `Authorization` |

### 1.3 全局请求头

```
Content-Type: application/json
```

### 1.4 全局响应包装

除**分页列表接口**（返回 `PaginatedResult` 包含 `data` 外层）之外，其余所有单体资源（如创建、查询详情、更新）的成功响应，均**直接返回资源实体本身**，无统一的业务外层包装（如无 `{ code: 200, data: {...} }` 这种包裹）。

### 1.5 全局错误响应格式

所有异常由 `HttpExceptionFilter` 统一拦截，格式如下：

```json
{
  "statusCode": 400,
  "error": "Validation Failed",
  "message": ["name 不能为空", "canvasConfig.width 必须是数字"],
  "path": "/api/projects",
  "timestamp": "2026-03-28T10:00:00.000Z"
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `statusCode` | `number` | HTTP 状态码 |
| `error` | `string` | 错误类型名称 |
| `message` | `string \| string[]` | 验证错误消息数组或单个字符串 |
| `path` | `string` | 请求路径 |
| `timestamp` | `string` | ISO 8601 时间戳 |

### 1.6 ValidationPipe 配置（请求体验证）

| 配置项 | 值 | 说明 |
|--------|-----|------|
| `whitelist: true` | 剥离非 DTO 字段 | 请求体中包含 DTO 未定义的字段将触发 400 错误 |
| `forbidNonWhitelisted: true` | 禁止白名单外字段 | 增强模式，更严格 |
| `transform: true` | 自动类型转换 | Query 参数（`page`, `limit`）会自动从字符串转为数字 |

---

## 2. 接口列表

| 方法 | 路径 | 描述 | 鉴权 | 返回状态码 |
|------|------|------|------|-----------|
| `POST` | `/api/projects` | 创建项目 | 无 | `201` |
| `GET` | `/api/projects` | 获取项目列表（分页+搜索） | 无 | `200` |
| `GET` | `/api/projects/:id` | 获取单个项目 | 无 | `200` |
| `PUT` | `/api/projects/:id` | 更新项目（部分更新） | 无 | `200` |
| `DELETE` | `/api/projects/:id` | 删除项目 | 无 | `204` |
| `GET` | `/api/health` | 健康检查 | 无 | `200` |

---

## 3. 通用类型定义

### 3.1 分页结果 `PaginatedResult<T>`

```typescript
interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `data` | `T[]` | 当前页的数据数组 |
| `total` | `number` | 符合条件的总记录数 |
| `page` | `number` | 当前页码（从 1 开始） |
| `limit` | `number` | 每页记录数 |

---

## 4. 详细接口说明

### 4.1 `POST /api/projects` — 创建项目

**功能：** 创建一个新的 DragBuilder 项目。

**请求头：**

```
Content-Type: application/json
```

**Request Body：**

```typescript
interface CreateProjectDto {
  name: string;              // 必填，最大 255 字符
  canvasConfig: CanvasConfigDto;  // 必填
  componentsTree: any[];     // 必填，ComponentNode[]（见 §5.2）
}
```

**`CanvasConfigDto` 验证规则：**

| 字段 | 类型 | 验证规则 | 错误消息 |
|------|------|---------|---------|
| `width` | `number` | `@IsNumber()`，`@Min(100)`，`@Max(5000)` | `画布宽度必须至少为 100px` / `画布宽度不能超过 5000px` |
| `height` | `number` | `@IsNumber()`，`@Min(100)`，`@Max(5000)` | `画布高度必须至少为 100px` / `画布高度不能超过 5000px` |
| `preset` | `'mobile' \| 'tablet' \| 'desktop' \| 'custom'` | `@IsString()`，`@IsIn(...)` | `预设类型必须是 mobile, tablet, desktop 或 custom` |
| `backgroundColor` | `string` | `@IsString()`，`@Matches(/^#[0-9A-Fa-f]{6}$/)` | `背景颜色必须是有效的 HEX 格式（例如：#FFFFFF）` |

**Request Body 示例：**

```json
{
  "name": "我的落地页项目",
  "canvasConfig": {
    "width": 375,
    "height": 812,
    "preset": "mobile",
    "backgroundColor": "#FFFFFF"
  },
  "componentsTree": []
}
```

**Response：** `201 Created`，返回完整的 `ProjectEntity` 对象。

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "我的落地页项目",
  "canvasConfig": {
    "width": 375,
    "height": 812,
    "preset": "mobile",
    "backgroundColor": "#FFFFFF"
  },
  "componentsTree": [],
  "createdAt": "2026-03-28T10:00:00.000Z",
  "updatedAt": "2026-03-28T10:00:00.000Z"
}
```

**字段说明：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | `UUID v4` | 后端自动生成，无需传入 |
| `createdAt` | `ISO 8601 timestamp` | 后端自动生成 |
| `updatedAt` | `ISO 8601 timestamp` | 后端自动生成 |

---

### 4.2 `GET /api/projects` — 获取项目列表

**功能：** 获取分页的项目列表，支持按名称搜索。

**Query 参数：**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `page` | `number` | `1` | 页码，从 1 开始。类型自动转换（`ParseIntPipe`） |
| `limit` | `number` | `10` | 每页数量。类型自动转换。最大值未限制 |
| `search` | `string` | `undefined` | 按项目名称模糊搜索（`LIKE %search%`） |

**示例请求：**

```
GET /api/projects?page=1&limit=5
GET /api/projects?search=落地页
```

**Response：** `200 OK`

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "我的落地页项目",
      "canvasConfig": {
        "width": 375,
        "height": 812,
        "preset": "mobile",
        "backgroundColor": "#FFFFFF"
      },
      "componentsTree": [],
      "createdAt": "2026-03-28T10:00:00.000Z",
      "updatedAt": "2026-03-28T10:00:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10
}
```

> **排序规则：** 按 `createdAt DESC` 倒序排列。

---

### 4.3 `GET /api/projects/:id` — 获取单个项目

**功能：** 根据 UUID 获取项目详情。

**路径参数：**

| 参数 | 类型 | 验证规则 |
|------|------|---------|
| `id` | `string` (UUID) | `@ParseUUIDPipe({ version: '4' })`，必须是 UUID v4 格式，否则返回 `400 Bad Request` |

**示例请求：**

```
GET /api/projects/550e8400-e29b-41d4-a716-446655440000
```

**Response：** `200 OK`，返回单个 `ProjectEntity`。

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "我的落地页项目",
  "canvasConfig": {
    "width": 375,
    "height": 812,
    "preset": "mobile",
    "backgroundColor": "#FFFFFF"
  },
  "componentsTree": [
    {
      "id": "comp-001",
      "type": "div",
      "position": {
        "x": 0,
        "y": 0,
        "width": 375,
        "height": 100,
        "zIndex": 0
      },
      "styles": {
        "backgroundColor": "#3B82F6",
        "borderRadius": 8
      },
      "content": {
        "text": "Hello World"
      }
    }
  ],
  "createdAt": "2026-03-28T10:00:00.000Z",
  "updatedAt": "2026-03-28T10:00:00.000Z"
}
```

**错误响应：** `404 Not Found` — 项目不存在。

```json
{
  "statusCode": 404,
  "error": "Not Found",
  "message": "项目 550e8400-e29b-41d4-a716-446655440000 不存在",
  "path": "/api/projects/550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2026-03-28T10:00:00.000Z"
}
```

---

### 4.4 `PUT /api/projects/:id` — 更新项目

**功能：** 部分更新项目（支持只更新部分字段）。

**路径参数：**

| 参数 | 类型 | 验证规则 |
|------|------|---------|
| `id` | `string` (UUID) | `@ParseUUIDPipe({ version: '4' })` |

**Request Body：**

```typescript
interface UpdateProjectDto {
  name?: string;                      // 可选，最大 255 字符
  canvasConfig?: CanvasConfigDto;     // 可选
  componentsTree?: any[];             // 可选，ComponentNode[]
}
```

> **所有字段均为可选**，但一旦提供，必须满足与 `CreateProjectDto` 相同的验证规则。
> 后端采用**字段级别合并**策略：只更新传入的字段，未传入的字段保持不变。

**Request Body 示例（只更新 name）：**

```json
{
  "name": "新的项目名称"
}
```

**Request Body 示例（只更新 componentsTree）：**

```json
{
  "componentsTree": [
    {
      "id": "comp-001",
      "type": "button",
      "position": { "x": 10, "y": 20, "width": 100, "height": 40, "zIndex": 0 },
      "styles": { "backgroundColor": "#EF4444", "borderRadius": 4 },
      "content": { "text": "点击我" }
    }
  ]
}
```

**Response：** `200 OK`，返回更新后的完整 `ProjectEntity`。

**错误响应：** `404 Not Found` — 项目不存在（同 §4.3）。

---

### 4.5 `DELETE /api/projects/:id` — 删除项目

**功能：** 删除指定项目。

**路径参数：**

| 参数 | 类型 | 验证规则 |
|------|------|---------|
| `id` | `string` (UUID) | `@ParseUUIDPipe({ version: '4' })` |

**示例请求：**

```
DELETE /api/projects/550e8400-e29b-41d4-a716-446655440000
```

**Response：** `204 No Content`，**无响应体**。

**错误响应：** `404 Not Found` — 项目不存在（同 §4.3）。

---

### 4.6 `GET /api/health` — 健康检查

**功能：** 检查服务状态和数据库连接是否正常。

**示例请求：**

```
GET /api/health
```

**Response：** `200 OK`

```json
{
  "status": "ok",
  "timestamp": "2026-03-28T10:00:00.000Z",
  "services": {
    "database": {
      "status": "ok",
      "message": "数据库连接正常"
    }
  }
}
```

**字段说明：**

| 字段 | 说明 |
|------|------|
| `status` | `"ok"` 或 `"error"` |
| `services.database.status` | `"ok"` 或 `"error"` |

---

## 5. JSONB 字段详细定义

### 5.1 `canvas_config` — 画布配置

**数据库列名：** `canvas_config`（snake_case）
**Entity 属性名：** `canvasConfig`（camelCase）
**JSONB 存储格式：** 直接存储 JSON 对象

```typescript
// canvasConfig 完整类型
interface CanvasConfig {
  width: number;       // 画布宽度（px），范围 100-5000
  height: number;      // 画布高度（px），范围 100-5000
  preset: 'mobile' | 'tablet' | 'desktop' | 'custom';
  backgroundColor: string;  // HEX 格式，如 "#FFFFFF"
}
```

**约束规则：**

| 字段 | 类型 | 约束 |
|------|------|------|
| `width` | `number` | `100 ≤ width ≤ 5000` |
| `height` | `number` | `100 ≤ height ≤ 5000` |
| `preset` | enum | 仅允许 `mobile`, `tablet`, `desktop`, `custom` |
| `backgroundColor` | `string` | 必须匹配正则 `/^#[0-9A-Fa-f]{6}$/` |

---

### 5.2 `components_tree` — 组件树 DSL

**数据库列名：** `components_tree`（snake_case）
**Entity 属性名：** `componentsTree`（camelCase）
**JSONB 存储格式：** `ComponentNode[]`（组件节点数组）

#### 核心类型定义

```typescript
// 组件类型枚举
type ComponentType =
  | 'div'
  | 'button'
  | 'text'
  | 'image'
  | 'input'
  | 'radio'
  | 'checkbox'
  | 'tag';

// 位置和尺寸
interface Position {
  x: number;      // 画布相对 X 坐标（px）
  y: number;      // 画布相对 Y 坐标（px）
  width: number;  // 宽度（px）
  height: number;  // 高度（px）
  zIndex: number;  // 层级（0-999）
}

// 阴影配置
interface ShadowConfig {
  x: number;       // X 偏移（px）
  y: number;       // Y 偏移（px）
  blur: number;    // 模糊半径（px）
  color: string;  // 阴影颜色（HEX）
}

// 样式配置
interface ComponentStyles {
  backgroundColor?: string;  // HEX
  borderColor?: string;     // HEX
  borderWidth?: number;     // px
  borderRadius?: number;    // px
  textColor?: string;       // HEX
  fontSize?: number;        // px
  fontWeight?: number;      // 100-900
  padding?: number;        // px
  shadow?: ShadowConfig;
}

// 单选/多选选项
interface RadioCheckboxOption {
  id: string;       // UUID
  label: string;
  checked: boolean;
  disabled?: boolean;
}

// 内容配置
interface ComponentContent {
  text?: string;           // 文本内容
  src?: string;             // 图片 URL
  placeholder?: string;    // 占位符
  alt?: string;             // 图片替代文本
  options?: RadioCheckboxOption[];  // 单选/多选选项
}

// 动画配置（Framer Motion）
interface AnimationConfig {
  initial?: Record<string, string | number | boolean>;
  animate?: Record<string, string | number | boolean>;
  transition?: {
    duration: number;  // 秒
    delay: number;    // 秒
    ease: string;     // 缓动函数
  };
}

// 组件节点（核心 DSL 节点）
interface ComponentNode {
  id: string;                // UUID v4
  type: ComponentType;       // 组件类型
  position: Position;         // 必填
  styles: ComponentStyles;    // 必填（至少空对象 `{}`）
  content: ComponentContent;  // 必填（至少空对象 `{}`）
  animation?: AnimationConfig;
  children?: ComponentNode[];  // 支持嵌套
}
```

#### `components_tree` 验证规则（后端 DTO 层）

| 规则 | 说明 |
|------|------|
| `@IsArray()` | `componentsTree` 必须是数组类型 |
| `any[]`（宽松验证） | 后端 DTO 对数组内部元素**未做深度验证**，由前端负责保证结构合法 |
| **向后兼容性要求** | 严禁修改已有节点的必填字段（`id`, `type`, `position`, `styles`, `content`），扩展字段必须可选 |

#### `components_tree` 完整 JSON 示例

```json
[
  {
    "id": "comp-001",
    "type": "div",
    "position": {
      "x": 0,
      "y": 0,
      "width": 375,
      "height": 100,
      "zIndex": 0
    },
    "styles": {
      "backgroundColor": "#3B82F6",
      "borderRadius": 8,
      "padding": 16
    },
    "content": {
      "text": "DragBuilder 演示"
    },
    "children": [
      {
        "id": "comp-002",
        "type": "button",
        "position": {
          "x": 10,
          "y": 30,
          "width": 100,
          "height": 40,
          "zIndex": 1
        },
        "styles": {
          "backgroundColor": "#EF4444",
          "borderRadius": 4,
          "textColor": "#FFFFFF",
          "fontSize": 14
        },
        "content": {
          "text": "点击我"
        }
      }
    ]
  },
  {
    "id": "comp-003",
    "type": "image",
    "position": {
      "x": 0,
      "y": 100,
      "width": 375,
      "height": 200,
      "zIndex": 0
    },
    "styles": {
      "borderRadius": 0
    },
    "content": {
      "src": "https://example.com/image.png",
      "alt": "示例图片"
    }
  }
]
```

---

## 6. 数据库字段映射速查

| 数据库列名（snake_case） | Entity 属性名（camelCase） | JSONB | TypeScript 类型 |
|--------------------------|---------------------------|-------|----------------|
| `id` | `id` | 否 | `string` (UUID) |
| `name` | `name` | 否 | `string` |
| `canvas_config` | `canvasConfig` | **是** | `CanvasConfig` |
| `components_tree` | `componentsTree` | **是** | `ComponentNode[]` |
| `created_at` | `createdAt` | 否 | `Date` |
| `updated_at` | `updatedAt` | 否 | `Date` |

---

## 7. 错误状态码汇总

| 状态码 | 含义 | 触发场景 |
|--------|------|---------|
| `200` | OK | 成功获取/更新数据 |
| `201` | Created | 成功创建项目 |
| `204` | No Content | 成功删除（无响应体） |
| `400` | Bad Request | 参数验证失败（ValidationPipe）、UUID 格式错误 |
| `404` | Not Found | 项目 ID 不存在 |
| `500` | Internal Server Error | 未捕获的服务器异常 |

---

## 8. 环境变量参考

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `PORT` | `3000` | 服务监听端口 |
| `CORS_ORIGIN` | `http://localhost:5173` | CORS 允许来源 |
| `DB_HOST` | `localhost` | PostgreSQL 主机 |
| `DB_PORT` | `5432` | PostgreSQL 端口 |
| `DB_USERNAME` | `onism` | 数据库用户名 |
| `DB_PASSWORD` | `123456` | 数据库密码 |
| `DB_DATABASE` | `drag_builder` | 数据库名 |
