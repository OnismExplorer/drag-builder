# 404 兜底页 + 分页参数校验 设计文档

> 日期：2026-05-26

## 概述

解决两个问题：
1. 系统无 404 兜底页，未匹配路由显示空白
2. `GET /api/projects?page=-1&limit=9999` 导致 500 错误，`ParseIntPipe` 不做边界校验

## 问题一：404 兜底页

### 方案

新建 `NotFoundPage` 组件 + 在 `App.tsx` 添加 catch-all 路由。

### 组件设计

**文件**：`drag-builder-react/src/pages/NotFoundPage/NotFoundPage.tsx`

- 暗色系：`bg-black` 背景 + 居中玻璃拟态卡片
- 卡片样式：`bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl`
- 视觉元素：大号 "404" 标题（`text-orange-500`），副标题"页面未找到"
- 操作按钮：
  - 主按钮「返回首页」→ `navigate('/')`，橙色（`bg-orange-600 hover:bg-orange-700`）
  - 次按钮「返回上一页」→ `navigate(-1)`，幽灵按钮（`text-slate-300 hover:text-white`）
- 图标：`lucide-react` 的 `Home`、`ArrowLeft`
- 全屏居中布局，`min-h-screen` + `flex items-center justify-center`

### 路由注册

在 `App.tsx` 的 `<Routes>` 末尾添加：

```tsx
<Route path="*" element={<NotFoundPage />} />
```

### 不做的事

- 不引入新的全局状态或 store
- 不处理 API 层面的 404（已有 `errorHandler.ts` 处理）
- 不单独做 403/500 页面（后续可扩展为通用 `ErrorPage`，当前只需 404）

## 问题二：分页参数校验

### 方案

新建 `PaginationQueryDto`，用 class-validator 装饰器统一校验，与项目现有 DTO 模式一致。

### DTO 设计

**文件**：`drag-builder-server/src/common/dto/pagination.dto.ts`

```typescript
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationQueryDto {
  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  page?: number = 1;

  @IsInt()
  @Min(1)
  @Max(50)
  @Type(() => Number)
  @IsOptional()
  limit?: number = 10;
}
```

### Controller 改动

**文件**：`drag-builder-server/src/modules/project/project.controller.ts`

`findAll` 方法签名从：

```typescript
@Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
@Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
```

改为：

```typescript
@Query() query: PaginationQueryDto,
```

`search` 保持独立 `@Query('search')` 参数。

### 错误响应格式

与现有 auth DTO 校验错误格式一致：

```json
{
  "statusCode": 400,
  "error": "Validation Failed",
  "message": ["page must not be less than 1", "limit must not be greater than 50"],
  "path": "/api/projects",
  "timestamp": "2026-05-26T..."
}
```

无需额外代码，全局 `ValidationPipe` + `exceptionFactory` 自动处理。

### 不做的事

- 不创建自定义 Pipe（DTO 方式更一致）
- 不在 service 层做范围校验（属于 controller 层职责）
- 不影响其他 controller（当前只有 project controller 用到分页）

## 测试计划

### 前端

- 访问不存在的路由（如 `/nonexistent`）应显示 404 页面
- 404 页面「返回首页」按钮导航到 `/`
- 404 页面「返回上一页」按钮导航回上一页

### 后端

- `GET /api/projects?page=-1` → 400，错误消息包含 `page must not be less than 1`
- `GET /api/projects?page=0` → 400
- `GET /api/projects?limit=0` → 400
- `GET /api/projects?limit=51` → 400，错误消息包含 `limit must not be greater than 50`
- `GET /api/projects` → 200，默认 page=1, limit=10
- `GET /api/projects?page=2&limit=20` → 200，正常分页