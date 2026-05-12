## ADDED Requirements

### Requirement: 用户名注册

系统 SHALL 提供用户名+密码注册接口 `POST /auth/register`，允许用户使用用户名和密码创建账户。username 长度 MUST 在 3-30 字符之间，只能包含字母、数字和下划线。密码长度 MUST 至少 8 个字符。

#### Scenario: 用户名注册成功

- **WHEN** 用户发送 `POST /auth/register` 请求体为 `{ "username": "testuser", "password": "12345678" }`
- **THEN** 系统返回 HTTP 201，响应体包含用户信息（id, username, displayName, createdAt），密码不返回

#### Scenario: 用户名已被占用

- **WHEN** 用户发送注册请求但 username 已存在
- **THEN** 系统返回 HTTP 409，消息提示用户名已被占用

#### Scenario: 用户名格式不合法

- **WHEN** 用户发送注册请求但 username 包含特殊字符或长度不足 3 位
- **THEN** 系统返回 HTTP 400，验证失败消息说明约束

### Requirement: 邮箱注册

系统 SHALL 提供邮箱+密码注册方式，通过同一接口 `POST /auth/register`，email 字段为有效邮箱格式。邮箱 MUST 符合标准邮箱格式校验。

#### Scenario: 邮箱注册成功

- **WHEN** 用户发送 `POST /auth/register` 请求体为 `{ "email": "user@example.com", "password": "12345678" }`
- **THEN** 系统返回 HTTP 201，响应体包含用户信息（id, email, displayName, createdAt），密码不返回

#### Scenario: 邮箱已被注册

- **WHEN** 用户发送注册请求但 email 已存在
- **THEN** 系统返回 HTTP 409，消息提示邮箱已被注册

#### Scenario: 邮箱格式无效

- **WHEN** 用户发送注册请求但 email 格式不合法
- **THEN** 系统返回 HTTP 400，验证失败消息说明约束

### Requirement: 至少提供用户名或邮箱

注册请求 MUST 至少提供 username 或 email 其一，两者都为空时 SHALL 拒绝注册。

#### Scenario: 用户名和邮箱都未提供

- **WHEN** 用户发送注册请求体仅包含 `{ "password": "12345678" }`
- **THEN** 系统返回 HTTP 400，消息提示至少提供用户名或邮箱

#### Scenario: 同时提供用户名和邮箱

- **WHEN** 用户发送注册请求体包含 `{ "username": "testuser", "email": "user@example.com", "password": "12345678" }`
- **THEN** 系统返回 HTTP 201，用户信息同时包含 username 和 email

### Requirement: 密码安全存储

系统 MUST 使用 bcrypt 对密码进行哈希存储，MUST NOT 以明文形式存储密码。bcrypt salt rounds MUST 至少为 10。

#### Scenario: 数据库中密码为哈希值

- **WHEN** 用户注册成功后查询数据库
- **THEN** passwordHash 字段存储的是 bcrypt 哈希值，非明文密码
