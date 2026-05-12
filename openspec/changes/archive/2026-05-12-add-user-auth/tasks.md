## 1. 后端依赖安装与基础搭建

- [x] 1.1 安装后端认证相关依赖：@nestjs/jwt、@nestjs/passport、passport、passport-jwt、bcrypt、@types/passport-jwt、@types/bcrypt
- [x] 1.2 创建 auth 模块目录结构：`drag-builder-server/src/modules/auth/`

## 2. 后端 User 实体与数据库

- [x] 2.1 创建 UserEntity（id、username nullable unique、email nullable unique、passwordHash、displayName、createdAt、updatedAt），PostgreSQL partial unique index 处理 nullable 唯一约束
- [x] 2.2 创建 users 表的 SQL 迁移脚本放在 `drag-builder-sql/` 目录

## 3. 后端 Auth DTO

- [x] 3.1 创建 RegisterDto（username 可选、email 可选、password 必填、displayName 可选），自定义验证器确保至少提供 username 或 email
- [x] 3.2 创建 LoginDto（username 可选、email 可选、password 必填），自定义验证器确保至少提供 username 或 email

## 4. 后端 Auth Service

- [x] 4.1 实现 AuthService.register：校验唯一性、bcrypt 哈希密码、保存用户、返回用户信息（不含密码）
- [x] 4.2 实现 AuthService.login：查找用户、bcrypt 比对密码、签发 JWT（HS256、24h、sub=userId）、返回 token 和用户信息
- [x] 4.3 实现 AuthService.getProfile：根据 userId 查询用户信息

## 5. 后端 Auth Controller 与 Guard

- [x] 5.1 创建 AuthController：POST /auth/register、POST /auth/login、GET /auth/profile
- [x] 5.2 创建 JwtStrategy（passport-jwt）：从 Authorization Bearer 提取 token、验证签名和过期、注入 request.user
- [x] 5.3 创建 JwtAuthGuard，基于 @nestjs/passport 的 AuthGuard('jwt')
- [x] 5.4 创建 AuthModule 注册 UserEntity、JwtModule、PassportModule、JwtStrategy、AuthService、AuthController

## 6. 后端 Project 模块改造

- [x] 6.1 ProjectEntity 新增 userId 字段和 ManyToOne 关联到 UserEntity
- [x] 6.2 ProjectController 添加 @UseGuards(JwtAuthGuard)，create 方法从 req.user.userId 填充 userId
- [x] 6.3 ProjectService.findAll 添加 userId 过滤，仅返回当前用户的项目
- [x] 6.4 ProjectService.findOne/update/remove 校验项目归属当前用户，非归属返回 403
- [x] 6.5 AppModule 注册 AuthModule

## 7. 前端认证 Store

- [x] 7.1 创建 authStore（Zustand + Immer）：token、user、isAuthenticated 状态，login/register/logout actions，token 持久化到 localStorage，页面刷新恢复状态

## 8. 前端 API 层

- [x] 8.1 创建 auth API 模块：register、login、getProfile 方法，请求/响应类型定义
- [x] 8.2 修改现有 API 客户端，自动在请求头注入 Authorization: Bearer token，401 响应自动清除认证状态

## 9. 前端页面与路由

- [x] 9.1 创建 LoginPage 组件：用户名/邮箱输入框、密码输入框、登录按钮、跳转注册链接、错误提示
- [x] 9.2 创建 RegisterPage 组件：用户名输入框（可选）、邮箱输入框（可选）、密码和确认密码输入框、注册按钮、跳转登录链接、表单校验
- [x] 9.3 创建 AuthGuard 组件：检查 isAuthenticated，未登录重定向 /login?redirect=原路径
- [x] 9.4 App.tsx 添加 /login 和 /register 路由，用 AuthGuard 包裹 /editor 和 / 路由
- [x] 9.5 顶部导航栏显示用户名/登录链接和登出按钮

## 10. 测试

- [x] 10.1 后端 Auth 模块单元测试：AuthService（register 唯一性校验、login 密码验证、getProfile）
- [x] 10.2 后端 Auth 模块 E2E 测试：注册成功/失败、登录成功/失败、token 验证、profile 获取
- [x] 10.3 后端 Project 模块 E2E 测试：认证保护、用户数据隔离、403 归属校验
- [x] 10.4 前端 authStore 单元测试
- [x] 10.5 前端 LoginPage 和 RegisterPage 组件测试

## 11. 环境变量与配置

- [x] 11.1 后端 .env 添加 JWT_SECRET 变量，config 模块注册 jwt 配置
- [x] 11.2 后端 .env.example 添加 JWT_SECRET 示例
