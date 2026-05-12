## ADDED Requirements

### Requirement: 用户名登录

系统 SHALL 提供用户名+密码登录接口 `POST /auth/login`，验证成功后签发 JWT access token。

#### Scenario: 用户名登录成功

- **WHEN** 用户发送 `POST /auth/login` 请求体为 `{ "username": "testuser", "password": "12345678" }`
- **THEN** 系统返回 HTTP 200，响应体包含 `{ "accessToken": "<jwt>", "user": { "id", "username", "email", "displayName" } }`

#### Scenario: 用户名不存在

- **WHEN** 用户发送登录请求但 username 不存在
- **THEN** 系统返回 HTTP 401，消息提示用户名或密码错误（不暴露具体哪个字段错误）

#### Scenario: 密码错误

- **WHEN** 用户发送登录请求但密码不匹配
- **THEN** 系统返回 HTTP 401，消息提示用户名或密码错误

### Requirement: 邮箱登录

系统 SHALL 支持使用邮箱+密码登录，通过同一接口 `POST /auth/login`，email 字段优先匹配。

#### Scenario: 邮箱登录成功

- **WHEN** 用户发送 `POST /auth/login` 请求体为 `{ "email": "user@example.com", "password": "12345678" }`
- **THEN** 系统返回 HTTP 200，响应体包含 accessToken 和用户信息

#### Scenario: 邮箱不存在

- **WHEN** 用户发送登录请求但 email 不存在
- **THEN** 系统返回 HTTP 401，消息提示用户名或密码错误

### Requirement: 至少提供用户名或邮箱用于登录

登录请求 MUST 至少提供 username 或 email 其一。

#### Scenario: 用户名和邮箱都未提供

- **WHEN** 用户发送登录请求体仅包含 `{ "password": "12345678" }`
- **THEN** 系统返回 HTTP 400，消息提示至少提供用户名或邮箱

### Requirement: JWT Token 规范

签发的 JWT access token MUST 包含 sub（用户 ID）和 username 字段，有效期 MUST 为 24 小时。签名算法 MUST 为 HS256，密钥从环境变量 JWT_SECRET 读取。

#### Scenario: Token 包含正确的载荷

- **WHEN** 用户登录成功获得 accessToken
- **THEN** 解码后 `{ "sub": "<userId>", "username": "testuser", "iat": ..., "exp": ... }`，exp 与 iat 差值为 86400 秒

### Requirement: 获取当前用户信息

系统 SHALL 提供接口 `GET /auth/profile`，需认证，返回当前登录用户信息。

#### Scenario: 获取个人资料成功

- **WHEN** 已认证用户发送 `GET /auth/profile` 携带有效 Authorization 头
- **THEN** 系统返回 HTTP 200，响应体包含用户信息（id, username, email, displayName, createdAt）
