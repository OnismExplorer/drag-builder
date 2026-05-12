## ADDED Requirements

### Requirement: JWT 认证守卫

系统 SHALL 提供 JwtAuthGuard，用于保护需认证的接口。Guard MUST 从请求头 `Authorization: Bearer <token>` 中提取并验证 JWT。

#### Scenario: 携带有效 Token 访问受保护接口

- **WHEN** 请求携带有效的 Bearer token 访问使用 @UseGuards(JwtAuthGuard) 的接口
- **THEN** 请求通过验证，Controller 可通过 @Req() 获取 user 信息

#### Scenario: 未携带 Token 访问受保护接口

- **WHEN** 请求未携带 Authorization 头访问受保护接口
- **THEN** 系统返回 HTTP 401，消息提示未提供认证凭据

#### Scenario: 携带过期 Token 访问受保护接口

- **WHEN** 请求携带已过期的 Bearer token
- **THEN** 系统返回 HTTP 401，消息提示 token 已过期

#### Scenario: 携带无效 Token 访问受保护接口

- **WHEN** 请求携带格式错误或签名不匹配的 token
- **THEN** 系统返回 HTTP 401，消息提示 token 无效

### Requirement: 当前用户注入

JwtAuthGuard 验证通过后 SHALL 将用户信息（userId, username）注入到 request.user 对象，供 Controller 和 Service 使用。

#### Scenario: Controller 获取当前用户 ID

- **WHEN** 受保护的 Controller 方法使用 @Req() req 并读取 req.user.userId
- **THEN** 返回 JWT sub 字段中的用户 ID

### Requirement: Auth 模块全局注册

AuthModule SHALL 在 AppModule 中注册，JwtAuthGuard 可被任意模块引用。

#### Scenario: Project 模块使用 AuthGuard

- **WHEN** ProjectController 的 create 方法添加 @UseGuards(JwtAuthGuard)
- **THEN** 未登录用户创建项目时返回 401，已登录用户正常创建
