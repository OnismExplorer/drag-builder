## Why

当前系统没有任何用户认证机制，所有项目和画布数据完全开放，无法区分不同用户的数据，也无法保护用户创作内容。需要引入用户注册与登录功能，为后续的多用户协作、权限控制和数据隔离奠定基础。

## What Changes

- 新增用户注册接口，支持用户名+密码注册和邮箱+密码注册两种方式
- 新增用户登录接口，支持用户名登录和邮箱登录
- 后端新增 Auth 模块（Entity、Service、Controller、Guard）
- 使用 JWT 作为认证令牌，登录后签发 access token
- 密码使用 bcrypt 哈希存储
- 前端新增登录/注册页面与路由
- 前端新增 auth store 管理登录状态与 token
- 后端 Project 模块增加用户关联，项目归属于创建者
- 受保护接口使用 AuthGuard 进行身份验证

## Capabilities

### New Capabilities

- `user-registration`: 用户注册功能，支持用户名注册和邮箱注册两种方式，包含输入校验和密码加密存储
- `user-login`: 用户登录功能，支持用户名/邮箱+密码登录，签发 JWT 令牌
- `auth-guard`: 后端认证守卫，验证请求携带的 JWT 令牌，保护需登录的接口
- `auth-ui`: 前端登录/注册页面、表单组件、认证状态管理与路由守卫

### Modified Capabilities

- `project`: Project 实体新增 userId 字段关联创建者，受保护接口需登录后访问

## Impact

- **后端**：新增 auth 模块（entities、DTOs、service、controller、guard、strategy）；Project 模块需修改 entity 和 controller 以关联用户；需安装 @nestjs/jwt、@nestjs/passport、passport、passport-jwt、bcrypt 等依赖
- **前端**：新增登录/注册页面及路由；新增 auth store；需安装 JWT 解码库（如 jose）；现有页面路由需增加登录守卫逻辑
- **数据库**：新增 users 表；projects 表新增 user_id 外键列
- **API**：新增 POST /auth/register、POST /auth/login、GET /auth/profile 端点；现有 /api/projects 端点需 Authorization header
