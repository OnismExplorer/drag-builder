## MODIFIED Requirements

### Requirement: 项目归属用户

ProjectEntity SHALL 新增 `userId` 字段（外键关联 users.id），创建项目时 MUST 自动从 JWT 中提取当前用户 ID 并填充。查询项目列表 MUST 默认过滤为当前用户的项目。

#### Scenario: 创建项目自动关联用户

- **WHEN** 已登录用户发送 `POST /api/projects` 创建项目
- **THEN** 创建的项目 userId 自动填充为当前登录用户的 ID

#### Scenario: 查询项目仅返回自己的

- **WHEN** 已登录用户发送 `GET /api/projects`
- **THEN** 仅返回该用户创建的项目列表

#### Scenario: 未登录创建项目被拒绝

- **WHEN** 未认证用户发送 `POST /api/projects`
- **THEN** 系统返回 HTTP 401

### Requirement: 项目接口需认证

ProjectController 的所有写操作（create、update、delete）MUST 使用 JwtAuthGuard 保护。读操作（findAll、findOne）MUST 也要求认证。

#### Scenario: 未认证访问项目列表

- **WHEN** 未携带 token 的请求访问 `GET /api/projects`
- **THEN** 系统返回 HTTP 401
