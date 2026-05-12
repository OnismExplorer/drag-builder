## Context

DragBuilder 是一个拖拽式页面构建器，当前后端（NestJS + TypeORM）仅包含 Project 和 Health 模块，前端（React 19 + Tailwind CSS 4）有首页和编辑器页面。系统没有任何用户概念，所有项目数据全局公开。后端 CORS 已允许 `Authorization` 头，ValidationPipe 配置了 `whitelist + forbidNonWhitelisted`。

## Goals / Non-Goals

**Goals:**

- 实现完整的用户注册与登录闭环，支持用户名注册和邮箱注册两种方式
- 使用 JWT 无状态认证，签发 access token
- 密码使用 bcrypt 安全存储
- 后端提供 AuthGuard 保护需登录的接口
- 前端提供登录/注册页面，管理认证状态
- 将 Project 实体关联到用户，实现数据归属

**Non-Goals:**

- 不实现邮箱验证/激活流程
- 不实现 refresh token 机制（后续迭代）
- 不实现 OAuth 第三方登录
- 不实现忘记密码/重置密码
- 不实现角色权限系统（RBAC）
- 不实现多因素认证（MFA）

## Decisions

### 1. 认证方案：JWT + Passport

**选择**：Passport + passport-jwt 策略，签发 JWT access token。

**理由**：
- NestJS 官方推荐 @nestjs/passport 集成，与 Guard 体系无缝配合
- JWT 无状态，不需要服务端存储 session，适合当前单体架构
- 前端存储 token 在 localStorage，请求时通过 Authorization: Bearer 头传递

**备选**：
- Session-based：需要服务端状态管理，不适合后续扩展
- 自定义 Guard 不用 Passport：需要手动解析和验证 token，代码量大

### 2. 密码哈希：bcrypt

**选择**：使用 bcrypt 进行密码哈希，salt rounds 设为 10。

**理由**：bcrypt 是当前最推荐的密码哈希算法，自带 salt，抗彩虹表和暴力破解。

**备选**：argon2 更安全但需要原生编译，在 Windows 环境可能有兼容问题。

### 3. 用户模型设计

**选择**：username 和 email 均为可选字段，但至少填写其一。两者均唯一索引。

```
users 表：
- id (UUID PK)
- username (varchar 255, nullable, unique)
- email (varchar 255, nullable, unique)
- passwordHash (varchar 255, not null)
- displayName (varchar 255, nullable)
- createdAt, updatedAt
```

**理由**：
- 支持用户名注册和邮箱注册两种流程
- nullable + unique 需要数据库层特殊处理（PostgreSQL 的 NULL 不参与唯一约束，需加 WHERE 过滤的唯一索引）
- displayName 供前端展示用

### 4. 前端认证状态管理

**选择**：新增 `authStore`（Zustand + Immer），存储 token 和用户信息。token 持久化到 localStorage。

**理由**：与项目现有 store 模式一致（componentStore、canvasStore、uiStore 均用 Zustand + Immer）。

### 5. 前端路由守卫

**选择**：创建 `AuthGuard` 组件包裹需登录的路由，未登录重定向到 /login。

**理由**：声明式路由守卫，与 React Router DOM 7 的 Route element 模式配合，代码简洁。

### 6. Project 关联用户

**选择**：ProjectEntity 新增 `userId` 字段（外键关联 users.id），创建项目时从 JWT 中提取用户 ID 自动填充。

**理由**：TypeORM 原生支持外键关联，数据归属清晰。

## Risks / Trade-offs

- **[JWT 无 refresh token]** → access token 设较长有效期（24h），后续迭代添加 refresh token
- **[username/email nullable unique]** → PostgreSQL 需使用 partial unique index 处理 NULL 值，TypeORM 的 @Unique 装饰器不支持此场景，需手写 migration
- **[bcrypt 同步性能]** → 使用 bcrypt 的异步 API（genSalt/hash 的 async 版本），避免阻塞事件循环
- **[localStorage XSS 风险]** → token 存 localStorage 有 XSS 攻击风险，当前阶段可接受，后续可迁移至 httpOnly cookie
- **[用户名和邮箱至少填其一的校验]** → 需要在 DTO 层自定义验证器确保至少提供一个标识
