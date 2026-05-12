## Requirements

### Requirement: 登录页面

系统 SHALL 提供登录页面，路由为 `/login`，包含用户名/邮箱输入框、密码输入框和登录按钮。

#### Scenario: 访问登录页面

- **WHEN** 用户访问 `/login`
- **THEN** 显示登录表单，包含标识（用户名或邮箱）输入框、密码输入框、登录按钮和跳转注册链接

#### Scenario: 登录成功跳转

- **WHEN** 用户填写正确凭据并点击登录按钮
- **THEN** 调用登录 API，成功后 authStore 存储 token 和用户信息，页面跳转至首页 `/`

#### Scenario: 登录失败提示

- **WHEN** 用户填写错误凭据并点击登录
- **THEN** 页面显示错误提示信息（如"用户名或密码错误"）

### Requirement: 注册页面

系统 SHALL 提供注册页面，路由为 `/register`，包含用户名输入框（可选）、邮箱输入框（可选）、密码输入框、确认密码输入框和注册按钮。

#### Scenario: 访问注册页面

- **WHEN** 用户访问 `/register`
- **THEN** 显示注册表单，包含用户名输入框、邮箱输入框、密码输入框、确认密码输入框、注册按钮和跳转登录链接

#### Scenario: 注册成功跳转

- **WHEN** 用户填写有效信息并点击注册按钮
- **THEN** 调用注册 API，成功后自动登录并跳转至首页 `/`

#### Scenario: 注册失败提示

- **WHEN** 用户填写信息校验不通过或 API 返回错误
- **THEN** 页面显示对应错误提示信息

#### Scenario: 密码不一致提示

- **WHEN** 用户输入的密码和确认密码不一致
- **THEN** 页面在提交前提示"两次密码输入不一致"

### Requirement: 认证状态 Store

前端 SHALL 提供 `authStore`（Zustand + Immer），管理 token、用户信息和登录状态。token MUST 持久化到 localStorage。

#### Scenario: 登录后 Store 更新

- **WHEN** 用户登录成功
- **THEN** authStore 中 token、user 信息已填充，isAuthenticated 为 true

#### Scenario: 刷新页面保持登录

- **WHEN** 用户刷新页面且 localStorage 中有有效 token
- **THEN** authStore 从 localStorage 恢复 token 和用户信息，isAuthenticated 为 true

#### Scenario: 登出清除 Store

- **WHEN** 用户点击登出
- **THEN** authStore 清空 token 和用户信息，isAuthenticated 为 false，localStorage 移除 token

### Requirement: 路由守卫

系统 SHALL 提供 `AuthGuard` 组件，包裹需登录的路由。未登录时 MUST 重定向到 `/login`。

#### Scenario: 未登录访问受保护路由

- **WHEN** 未登录用户访问 `/editor`
- **THEN** 页面重定向到 `/login?redirect=/editor`

#### Scenario: 登录后跳回原页面

- **WHEN** 用户从 `/login?redirect=/editor` 登录成功
- **THEN** 页面跳转至 `/editor`

#### Scenario: 已登录访问受保护路由

- **WHEN** 已登录用户访问 `/editor`
- **THEN** 正常渲染编辑器页面

### Requirement: 顶部导航用户状态

首页和编辑器的顶部导航 SHALL 显示当前用户信息（displayName 或 username）和登出按钮。

#### Scenario: 已登录显示用户名

- **WHEN** 用户已登录
- **THEN** 顶部导航显示用户名和登出按钮

#### Scenario: 未登录显示登录链接

- **WHEN** 用户未登录
- **THEN** 顶部导航显示"登录"链接

#### Scenario: 点击登出

- **WHEN** 用户点击登出按钮
- **THEN** 清除认证状态，跳转至首页