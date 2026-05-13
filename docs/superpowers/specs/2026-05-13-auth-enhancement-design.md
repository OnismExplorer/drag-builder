# 登录系统增强设计文档

**日期：** 2026-05-13
**状态：** 已批准

---

## 1. 概述

本次变更旨在完善登录系统，添加 GitHub OAuth 登录、邮箱验证码注册，并修复现有问题。

### 1.1 解决的问题

| 问题 | 描述 |
|------|------|
| 问题 1 | 系统启动时默认打开登录界面 |
| 问题 2 | 刷新页面登录状态丢失 |
| 问题 3 | 登录错误提示不统一 |
| 问题 4 | 邮箱注册缺少验证码校验 |

### 1.2 新增功能

- **GitHub OAuth 登录**：用户可使用 GitHub 账号登录
- **邮箱验证码注册**：注册时需通过邮箱验证码验证
- **人机验证**：使用 Cloudflare Turnstile 防止恶意刷验证码

---

## 2. 首页路由重构

### 2.1 变更说明

| 路由 | 变更前 | 变更后 |
|------|--------|--------|
| `/` | 受 AuthGuard 保护，未登录重定向到 `/login` | 公开 Landing Page，未登录显示产品介绍，已登录显示项目列表 |
| `/login` | 登录页 | 保持不变 |
| `/register` | 注册页 | 保持不变 |
| `/auth/github/callback` | 不存在 | 新增：GitHub OAuth 回调处理页 |

### 2.2 实现方式

将 `HomePage` 拆分为两个组件：
- `LandingPage`：面向未登录用户，展示产品介绍和入口按钮
- `DashboardPage`：面向已登录用户，展示项目列表

`/` 路由根据 `isAuthenticated` 渲染对应组件：

```tsx
<Route path="/" element={
  isAuthenticated ? <DashboardPage /> : <LandingPage />
} />
```

---

## 3. 刷新页面登录状态丢失修复

### 3.1 问题根因

`AuthGuard` 在 store 的 `loadFromStorage` 执行前就检查了 `isAuthenticated`，导致误判为未登录。

### 3.2 解决方案

**步骤 1：** 在 `authStore` 初始化时同步从 localStorage 恢复状态：

```typescript
// authStore.ts
const initialToken = loadToken();
const initialUser = loadUser();

export const useAuthStore = create<AuthStore>()(
  immer((set) => ({
    token: initialToken,
    user: initialUser,
    isAuthenticated: !!(initialToken && initialUser),
    // ...
  }))
);
```

**步骤 2：** `AuthGuard` 增加 loading 状态：

```tsx
export function AuthGuard({ children }) {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 短暂延迟确保 store 初始化完成
    setIsLoading(false);
  }, []);

  if (isLoading) return null;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
```

---

## 4. 统一错误提示

### 4.1 解决方案

利用已有的 `Toast` 组件和 `apiClient` 响应拦截器统一处理错误：

1. 在 `App.tsx` 中初始化 `useApiErrorHandler`
2. `apiClient` 拦截到 401 等错误时，通过 `useUIStore.showToast()` 显示错误
3. 登录/注册页移除内联错误处理逻辑（`setError` 相关代码）

---

## 5. 邮箱注册验证码

### 5.1 接口设计

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/auth/email/send-code` | 发送邮箱验证码 |
| POST | `/auth/email/register-with-code` | 验证码注册 |

#### 5.1.1 发送验证码

**请求：**
```json
POST /auth/email/send-code
{
  "email": "user@example.com",
  "turnstileToken": "xxx"
}
```

**响应：**
```json
{
  "success": true
}
```

**错误码：**
- `400`：邮箱格式错误
- `422`：Turnstile 验证失败
- `429`：发送次数超限

#### 5.1.2 验证码注册

**请求：**
```json
POST /auth/email/register-with-code
{
  "email": "user@example.com",
  "code": "123456",
  "password": "password123",
  "username": "optional_username",
  "displayName": "Optional Display Name"
}
```

**响应：**
```json
{
  "accessToken": "jwt_token_here",
  "user": {
    "id": "uuid",
    "username": "optional_username",
    "email": "user@example.com",
    "displayName": "Optional Display Name",
    "createdAt": "2026-05-13T00:00:00Z",
    "updatedAt": "2026-05-13T00:00:00Z"
  }
}
```

### 5.2 频率限制

| 限制项 | 阈值 |
|--------|------|
| 每个 IP 每天发送次数 | 10 次 |
| 每个邮箱每天发送次数 | 10 次 |
| 验证码有效期 | 5 分钟 |
| 连续验证失败锁定 | 3 次失败后锁定 30 分钟 |

### 5.3 数据存储

使用 Redis（或内存 Map 模拟）存储：

```
email_code:{email} → { code: string, attempts: number, lockedUntil?: number }
ip_count:{ip} → { count: number, resetAt: timestamp }
```

### 5.4 Cloudflare Turnstile 验证

**前端：** 在发送验证码前渲染 Turnstile widget，获取 `turnstileToken`

**后端：** 在 `/auth/email/send-code` 接口验证 token 的有效性

**配置：**
- Site Key：`VITE_TURNSTILE_SITE_KEY`
- Secret Key：`TURNSTILE_SECRET_KEY`

---

## 6. GitHub OAuth 登录

### 6.1 接口设计

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/auth/github` | 重定向到 GitHub 授权页面 |
| GET | `/auth/github/callback` | GitHub 回调处理页（前端） |
| POST | `/auth/github/exchange` | 换取 access token 并登录 |

#### 6.1.1 GitHub 授权

**请求：** `GET /auth/github`

**响应：** 302 重定向到 GitHub 授权页面

```
https://github.com/login/oauth/authorize?client_id=xxx&redirect_uri=xxx&scope=read:user,user:email&state=xxx
```

#### 6.1.2 GitHub 回调（前端页面）

**URL：** `/auth/github/callback?code=xxx&state=xxx`

前端 `GithubCallbackPage` 接收 code，调用 `/auth/github/exchange`：

```tsx
POST /auth/github/exchange
{
  "code": "github_authorization_code",
  "state": "csrf_token"
}
```

**响应：**
```json
{
  "accessToken": "jwt_token_here",
  "user": { ... }
}
```

### 6.2 用户匹配策略

GitHub 回调后按以下顺序匹配用户：

```
1. 通过 githubId 查找用户
   → 找到 → 直接登录，颁发 token

2. 未找到，通过 GitHub 返回的 email 查找用户
   → 找到 → 绑定 githubId，颁发 token

3. 都未找到 → 创建新用户
```

**流程图：**
```
GitHub 回调
    │
    ▼
┌─────────────────┐
│ 查询 githubId   │
└─────────────────┘
    │ 找到
    ▼ 是 → 颁发 token，登录成功
    │
    │ 未找到
    ▼
┌─────────────────┐
│ 通过 email 查找 │
└─────────────────┘
    │ 找到
    ▼ 是 → 绑定 githubId，颁发 token，登录成功
    │
    │ 未找到
    ▼
┌─────────────────┐
│ 创建新用户      │
│ 记录 githubId   │
└─────────────────┘
    │
    ▼
  颁发 token，登录成功
```

### 6.3 数据库变更

```sql
ALTER TABLE users ADD COLUMN github_id VARCHAR(255) NULL;
CREATE UNIQUE INDEX idx_users_github_id ON users(github_id) WHERE github_id IS NOT NULL;
```

### 6.4 GitHub OAuth App 配置

- **Homepage URL：** `http://localhost:5173`
- **Callback URL：** `http://localhost:3000/auth/github/callback`

### 6.5 环境变量

```env
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
```

---

## 7. 文件变更清单

### 7.1 后端 (`drag-builder-server`)

| 文件 | 变更 |
|------|------|
| `src/modules/auth/auth.controller.ts` | 新增 GitHub、邮箱验证码接口 |
| `src/modules/auth/auth.service.ts` | 新增 `sendEmailCode`, `registerWithEmailCode`, `handleGithubCallback` |
| `src/modules/auth/user.entity.ts` | 新增 `githubId` 字段 |
| `src/modules/auth/email-code.service.ts` | 新增：验证码发送、频率限制、Turnstile 验证 |
| `src/modules/auth/github.service.ts` | 新增：GitHub OAuth 逻辑 |
| `src/app.module.ts` | 引入新模块 |
| `.env.example` | 新增 `GITHUB_*`, `TURNSTILE_SECRET_KEY` |

### 7.2 前端 (`drag-builder-react`)

| 文件 | 变更 |
|------|------|
| `src/pages/HomePage.tsx` | 重构为根据登录状态渲染不同内容 |
| `src/pages/LandingPage.tsx` | 新增：公开首页 |
| `src/pages/DashboardPage.tsx` | 新增：已登录首页 |
| `src/pages/GithubCallbackPage.tsx` | 新增：GitHub 回调处理 |
| `src/pages/LoginPage.tsx` | 移除内联错误，新增 GitHub 登录按钮 |
| `src/pages/RegisterPage.tsx` | 移除内联错误，新增验证码发送 UI |
| `src/hooks/useApiErrorHandler.ts` | 新增：统一 API 错误处理 |
| `src/api/authApi.ts` | 新增 GitHub、邮箱验证码 API |
| `src/api/client.ts` | 拦截 401 时通过 Toast 提示 |
| `src/App.tsx` | 路由调整，新增 `/auth/github/callback` |
| `src/store/authStore.ts` | 初始化时同步恢复登录状态 |

---

## 8. 测试要点

### 8.1 邮箱验证码注册

- [ ] 正确的验证码能成功注册
- [ ] 错误的验证码被拒绝
- [ ] 验证码过期后被拒绝
- [ ] 3 次验证失败后锁定 30 分钟
- [ ] IP 每天发送超过 10 次被拒绝
- [ ] Turnstile token 无效时被拒绝

### 8.2 GitHub OAuth 登录

- [ ] 新用户通过 GitHub 登录成功创建账号
- [ ] 已注册用户（通过 githubId）登录成功
- [ ] 已注册用户（通过 email 匹配）登录成功并绑定 githubId
- [ ] CSRF state 不匹配时被拒绝
- [ ] githubId 已绑定到其他账号时拒绝

### 8.3 路由和状态

- [ ] 未登录访问 `/` 显示 LandingPage
- [ ] 已登录访问 `/` 显示 DashboardPage
- [ ] 刷新页面后登录状态保持
- [ ] 401 错误显示 Toast 提示

---

## 9. 环境变量清单

### 9.1 后端

```env
# GitHub OAuth
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# Cloudflare Turnstile
TURNSTILE_SECRET_KEY=
```

### 9.2 前端

```env
VITE_TURNSTILE_SITE_KEY=
```