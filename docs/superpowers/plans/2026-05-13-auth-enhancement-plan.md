# 登录系统增强实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 完善登录系统，添加 GitHub OAuth 登录、邮箱验证码注册，修复刷新页面状态丢失和错误提示不统一问题。

**Architecture:** 后端新增邮件验证码服务和 GitHub OAuth 服务，前端拆分首页为 Landing/Dashboard，重构 AuthGuard 和错误处理。

**Tech Stack:** NestJS 11, React 19, Zustand, Cloudflare Turnstile, GitHub OAuth

---

## 文件结构

```
backend:
├── src/modules/auth/
│   ├── auth.module.ts              # 导入新服务
│   ├── auth.controller.ts          # 新增 GitHub、邮箱验证码端点
│   ├── auth.service.ts             # 新增 registerWithEmailCode, handleGithubCallback
│   ├── user.entity.ts              # 新增 githubId 字段
│   ├── email-code.service.ts       # 新增：验证码发送、频率限制、Turnstile 验证
│   ├── github.service.ts           # 新增：GitHub OAuth 逻辑
│   └── dtos/
│       ├── send-code.dto.ts        # POST /auth/email/send-code DTO
│       └── register-with-code.dto.ts # POST /auth/email/register-with-code DTO
├── src/config/
│   └── github.config.ts            # GitHub OAuth 配置
└── .env.example                    # 新增 GITHUB_*, TURNSTILE_SECRET_KEY

frontend:
├── src/store/
│   └── authStore.ts                # 同步初始化修复
├── src/hooks/
│   └── useApiErrorHandler.ts       # 统一错误处理 Hook
├── src/api/
│   ├── authApi.ts                  # 新增 GitHub、邮箱验证码 API 方法
│   └── client.ts                   # 401 时 Toast 提示
├── src/pages/
│   ├── HomePage.tsx                # 重构：根据登录状态渲染不同内容
│   ├── GithubCallbackPage.tsx      # 新增：GitHub OAuth 回调处理
│   ├── LoginPage.tsx               # 新增 GitHub 登录按钮，移除内联错误
│   └── RegisterPage.tsx            # 新增验证码 UI，移除内联错误
└── src/App.tsx                     # 路由调整，新增 /auth/github/callback
```

---

## Task 1: 后端 - 用户实体添加 githubId 字段

**Files:**
- Modify: `drag-builder-server/src/modules/auth/user.entity.ts`
- Test: `drag-builder-server/test/auth.e2e-spec.ts`

- [ ] **Step 1: 修改 UserEntity 添加 githubId 字段**

```typescript
// user.entity.ts 新增字段
@Column({ type: 'varchar', length: 255, nullable: true, name: 'github_id' })
githubId!: string | null;
```

- [ ] **Step 2: 添加数据库迁移（如果使用 TypeORM migrations）**

```bash
cd drag-builder-server && npx typeorm migration:generate -n AddGithubIdToUser
```

Expected: 迁移文件生成到 `src/migrations/`

- [ ] **Step 3: 提交**

```bash
git add src/modules/auth/user.entity.ts src/migrations/0xxx-AddGithubIdToUser.ts
git commit -m "feat(auth): 添加 githubId 字段到用户实体"
```

---

## Task 2: 后端 - 邮箱验证码服务 (email-code.service.ts)

**Files:**
- Create: `drag-builder-server/src/modules/auth/email-code.service.ts`
- Create: `drag-builder-server/src/modules/auth/dtos/send-code.dto.ts`
- Create: `drag-builder-server/src/modules/auth/dtos/register-with-code.dto.ts`
- Modify: `drag-builder-server/src/modules/auth/auth.module.ts`
- Test: `drag-builder-server/test/email-code.service.spec.ts`

---

### Task 2.1: 创建发送验证码 DTO

**Files:**
- Create: `drag-builder-server/src/modules/auth/dtos/send-code.dto.ts`

- [ ] **Step 1: 创建 SendCodeDto**

```typescript
import { IsEmail, IsString, MaxLength } from 'class-validator';

export class SendCodeDto {
  @IsEmail({}, { message: '邮箱格式不合法' })
  @MaxLength(255)
  email!: string;

  @IsString()
  turnstileToken!: string;
}
```

- [ ] **Step 2: 创建 RegisterWithCodeDto**

**Files:**
- Create: `drag-builder-server/src/modules/auth/dtos/register-with-code.dto.ts`

```typescript
import { IsEmail, IsString, IsOptional, MinLength, MaxLength, Matches } from 'class-validator';

export class RegisterWithCodeDto {
  @IsEmail({}, { message: '邮箱格式不合法' })
  @MaxLength(255)
  email!: string;

  @IsString()
  @MinLength(6, { message: '验证码为 6 位数字' })
  @MaxLength(6)
  @Matches(/^\d{6}$/, { message: '验证码必须为 6 位数字' })
  code!: string;

  @IsString()
  @MinLength(8, { message: '密码长度至少 8 个字符' })
  @MaxLength(128)
  password!: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @Matches(/^[a-zA-Z0-9_]+$/, { message: '用户名只能包含字母、数字和下划线' })
  username?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  displayName?: string;
}
```

- [ ] **Step 3: 提交**

```bash
git add src/modules/auth/dtos/send-code.dto.ts src/modules/auth/dtos/register-with-code.dto.ts
git commit -m "feat(auth): 添加邮箱验证码 DTO"
```

---

### Task 2.2: 创建 EmailCodeService

**Files:**
- Create: `drag-builder-server/src/modules/auth/email-code.service.ts`

- [ ] **Step 1: 编写 EmailCodeService 测试**

```typescript
// test/email-code.service.spec.ts
import { EmailCodeService, EmailCodeData } from '../src/modules/auth/email-code.service';

describe('EmailCodeService', () => {
  let service: EmailCodeService;

  beforeEach(() => {
    service = new EmailCodeService();
  });

  describe('generateAndStoreCode', () => {
    it('应为指定邮箱生成 6 位数字验证码', async () => {
      await service.generateAndStoreCode('test@example.com', '0.0.0.0');
      const data = service['codeStore'].get('test@example.com');
      expect(data).toBeDefined();
      expect(data!.code).toMatch(/^\d{6}$/);
    });

    it('同一邮箱应生成不同的验证码', async () => {
      await service.generateAndStoreCode('test@example.com', '0.0.0.0');
      await new Promise(resolve => setTimeout(resolve, 10));
      await service.generateAndStoreCode('test@example.com', '0.0.0.0');
      const codes = Array.from(service['codeStore'].values()).map(v => v.code);
      expect(codes.length).toBe(2);
      expect(codes[0]).not.toBe(codes[1]);
    });
  });

  describe('verifyCode', () => {
    it('正确验证码应验证通过', async () => {
      await service.generateAndStoreCode('test@example.com', '0.0.0.0');
      const data = service['codeStore'].get('test@example.com')!;
      const result = await service.verifyCode('test@example.com', data.code);
      expect(result).toBe(true);
    });

    it('错误验证码应验证失败', async () => {
      await service.generateAndStoreCode('test@example.com', '0.0.0.0');
      const result = await service.verifyCode('test@example.com', '000000');
      expect(result).toBe(false);
    });

    it('过期验证码应验证失败', async () => {
      service = new EmailCodeService(); // 使用默认 5 分钟过期
      await service.generateAndStoreCode('test@example.com', '0.0.0.0');
      service['codeStore'].get('test@example.com')!.expiresAt = Date.now() - 1000;
      const result = await service.verifyCode('test@example.com', service['codeStore'].get('test@example.com')!.code);
      expect(result).toBe(false);
    });

    it('3 次验证失败应锁定邮箱', async () => {
      await service.generateAndStoreCode('test@example.com', '0.0.0.0');
      const code = service['codeStore'].get('test@example.com')!.code;
      await service.verifyCode('test@example.com', '000000');
      await service.verifyCode('test@example.com', '000000');
      await service.verifyCode('test@example.com', '000000');
      const data = service['codeStore'].get('test@example.com');
      expect(data?.lockedUntil).toBeDefined();
      expect(data!.lockedUntil! > Date.now()).toBe(true);
    });
  });

  describe('IP 频率限制', () => {
    it('同一 IP 每天发送超过 10 次应被拒绝', async () => {
      for (let i = 0; i < 10; i++) {
        const result = await service.canSendFromIp('0.0.0.0');
        expect(result).toBe(true);
        await service.generateAndStoreCode(`user${i}@example.com`, '0.0.0.0');
      }
      const canSend = await service.canSendFromIp('0.0.0.0');
      expect(canSend).toBe(false);
    });
  });
});
```

- [ ] **Step 2: 运行测试验证失败**

```bash
cd drag-builder-server && npm run test -- --testPathPattern=email-code.service.spec.ts
```

Expected: FAIL (EmailCodeService 未定义)

- [ ] **Step 3: 实现 EmailCodeService**

```typescript
// email-code.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export interface EmailCodeData {
  code: string;
  attempts: number;
  createdAt: number;
  expiresAt: number;
  lockedUntil?: number;
}

export interface IpRateLimitData {
  count: number;
  resetAt: number;
}

@Injectable()
export class EmailCodeService {
  private readonly logger = new Logger(EmailCodeService.name);
  private readonly codeStore = new Map<string, EmailCodeData>();
  private readonly ipStore = new Map<string, IpRateLimitData>();

  private readonly CODE_EXPIRY_MS = 5 * 60 * 1000; // 5 分钟
  private readonly MAX_ATTEMPTS = 3;
  private readonly LOCK_DURATION_MS = 30 * 60 * 1000; // 30 分钟
  private readonly MAX_IP_DAILY = 10;

  constructor(private readonly httpService: HttpService) {}

  async verifyTurnstile(token: string): Promise<boolean> {
    const secretKey = process.env.TURNSTILE_SECRET_KEY;
    if (!secretKey) {
      this.logger.warn('TURNSTILE_SECRET_KEY 未配置，跳过人机验证');
      return true;
    }

    try {
      const response = await this.httpService.axiosRef.post(
        TURNSTILE_VERIFY_URL,
        new URLSearchParams({
          secret: secretKey,
          response: token,
        }),
        { timeout: 5000 }
      );
      return response.data.success === true;
    } catch (error) {
      this.logger.error(`Turnstile 验证失败: ${error}`);
      return false;
    }
  }

  async canSendFromIp(ip: string): Promise<boolean> {
    this.cleanupIpStore();
    const data = this.ipStore.get(ip);
    if (!data) return true;
    if (Date.now() > data.resetAt) {
      this.ipStore.delete(ip);
      return true;
    }
    return data.count < this.MAX_IP_DAILY;
  }

  async generateAndStoreCode(email: string, ip: string): Promise<void> {
    this.cleanupCodeStore();

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const now = Date.now();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);

    const ipData = this.ipStore.get(ip) || { count: 0, resetAt: midnight.getTime() };
    ipData.count += 1;
    this.ipStore.set(ip, ipData);

    this.codeStore.set(email, {
      code,
      attempts: 0,
      createdAt: now,
      expiresAt: now + this.CODE_EXPIRY_MS,
    });

    this.logger.log(`验证码已生成 for ${email}, IP: ${ip}`);
    // TODO: 实际发送邮件，暂时用日志替代
    this.logger.warn(`[模拟邮件] 验证码: ${code} -> ${email}`);
  }

  async verifyCode(email: string, code: string): Promise<boolean> {
    this.cleanupCodeStore();

    const data = this.codeStore.get(email);
    if (!data) return false;

    if (data.lockedUntil && Date.now() < data.lockedUntil) {
      this.logger.warn(`邮箱 ${email} 已被锁定`);
      return false;
    }

    if (Date.now() > data.expiresAt) {
      this.logger.warn(`验证码已过期 for ${email}`);
      return false;
    }

    data.attempts += 1;

    if (data.attempts >= this.MAX_ATTEMPTS) {
      data.lockedUntil = Date.now() + this.LOCK_DURATION_MS;
      this.logger.warn(`邮箱 ${email} 验证失败次数过多，已锁定`);
      this.codeStore.set(email, data);
      return false;
    }

    if (data.code !== code) {
      this.codeStore.set(email, data);
      return false;
    }

    this.codeStore.delete(email);
    return true;
  }

  private cleanupCodeStore(): void {
    const now = Date.now();
    for (const [email, data] of this.codeStore.entries()) {
      if (data.expiresAt < now || (data.lockedUntil && data.lockedUntil < now)) {
        this.codeStore.delete(email);
      }
    }
  }

  private cleanupIpStore(): void {
    const now = Date.now();
    for (const [ip, data] of this.ipStore.entries()) {
      if (data.resetAt < now) {
        this.ipStore.delete(ip);
      }
    }
  }
}
```

- [ ] **Step 4: 运行测试验证通过**

```bash
cd drag-builder-server && npm run test -- --testPathPattern=email-code.service.spec.ts
```

Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/modules/auth/email-code.service.ts test/email-code.service.spec.ts
git commit -m "feat(auth): 添加邮箱验证码服务和频率限制"
```

---

### Task 2.3: 集成 EmailCodeService 到 AuthModule

**Files:**
- Modify: `drag-builder-server/src/modules/auth/auth.module.ts`

- [ ] **Step 1: 更新 AuthModule 导入 EmailCodeService**

```typescript
// auth.module.ts 新增导入
import { EmailCodeService } from './email-code.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  providers: [EmailCodeService, AuthService],
  controllers: [AuthController],
  exports: [AuthService, EmailCodeService],
})
export class AuthModule {}
```

- [ ] **Step 2: 提交**

```bash
git add src/modules/auth/auth.module.ts
git commit -m "feat(auth): 集成 EmailCodeService 到 AuthModule"
```

---

## Task 3: 后端 - GitHub OAuth 服务

**Files:**
- Create: `drag-builder-server/src/modules/auth/github.service.ts`
- Create: `drag-builder-server/src/config/github.config.ts`
- Modify: `drag-builder-server/src/modules/auth/auth.module.ts`
- Test: `drag-builder-server/test/github.service.spec.ts`

---

### Task 3.1: 创建 GitHub 配置

**Files:**
- Create: `drag-builder-server/src/config/github.config.ts`

- [ ] **Step 1: 创建 GitHub 配置**

```typescript
import { registerAs } from '@nestjs/config';

export default registerAs('github', () => ({
  clientId: process.env.GITHUB_CLIENT_ID || '',
  clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
  callbackUrl: process.env.GITHUB_CALLBACK_URL || 'http://localhost:3000/auth/github/callback',
}));
```

- [ ] **Step 2: 提交**

```bash
git add src/config/github.config.ts
git commit -m "feat(auth): 添加 GitHub OAuth 配置"
```

---

### Task 3.2: 创建 GithubService

**Files:**
- Create: `drag-builder-server/src/modules/auth/github.service.ts`

- [ ] **Step 1: 编写 GithubService 测试**

```typescript
// test/github.service.spec.ts
import { GithubService, GithubUser } from '../src/modules/auth/github.service';
import { ConfigService } from '@nestjs/config';

describe('GithubService', () => {
  let service: GithubService;
  let mockHttpService: any;
  let mockConfigService: any;

  beforeEach(() => {
    mockHttpService = {
      axiosRef: {
        post: jest.fn(),
        get: jest.fn(),
      },
    };
    mockConfigService = {
      get: jest.fn().mockReturnValue({
        clientId: 'test_client_id',
        clientSecret: 'test_client_secret',
        callbackUrl: 'http://localhost:3000/auth/github/callback',
      }),
    };
    service = new GithubService(mockHttpService, mockConfigService);
  });

  describe('getAuthorizationUrl', () => {
    it('应返回正确的 GitHub 授权 URL', () => {
      const state = 'test_state_123';
      const url = service.getAuthorizationUrl(state);
      expect(url).toContain('https://github.com/login/oauth/authorize');
      expect(url).toContain('client_id=test_client_id');
      expect(url).toContain('scope=read:user,user:email');
      expect(url).toContain(`redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fauth%2Fgithub%2Fcallback`);
      expect(url).toContain(`state=${state}`);
    });
  });

  describe('exchangeCodeForToken', () => {
    it('应正确交换 code 获取 access_token', async () => {
      mockHttpService.axiosRef.post.mockResolvedValue({
        data: { access_token: 'test_access_token' },
      });

      const result = await service.exchangeCodeForToken('test_code');
      expect(result).toBe('test_access_token');
      expect(mockHttpService.axiosRef.post).toHaveBeenCalledWith(
        'https://github.com/login/oauth/access_token',
        expect.any(URLSearchParams),
        { headers: { Accept: 'application/json' } }
      );
    });
  });

  describe('getUserInfo', () => {
    it('应正确获取用户信息', async () => {
      const mockUser: GithubUser = {
        id: 12345,
        login: 'testuser',
        email: 'test@example.com',
        name: 'Test User',
        avatar_url: 'https://avatar.example.com/testuser',
      };
      mockHttpService.axiosRef.get.mockResolvedValue({ data: mockUser });

      const result = await service.getUserInfo('test_token');
      expect(result).toEqual(mockUser);
    });

    it('应处理 email 为 null 的情况并请求 emails', async () => {
      const mockUser: GithubUser = {
        id: 12345,
        login: 'testuser',
        email: null,
        name: 'Test User',
        avatar_url: 'https://avatar.example.com/testuser',
      };
      const mockEmails = [
        { email: 'primary@example.com', primary: true, verified: true },
      ];

      mockHttpService.axiosRef.get
        .mockResolvedValueOnce({ data: mockUser })
        .mockResolvedValueOnce({ data: mockEmails });

      const result = await service.getUserInfo('test_token');
      expect(result.email).toBe('primary@example.com');
    });
  });
});
```

- [ ] **Step 2: 运行测试验证失败**

```bash
cd drag-builder-server && npm run test -- --testPathPattern=github.service.spec.ts
```

Expected: FAIL (GithubService 未定义)

- [ ] **Step 3: 实现 GithubService**

```typescript
// github.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';

export interface GithubUser {
  id: number;
  login: string;
  email: string | null;
  name: string | null;
  avatar_url: string;
}

export interface GithubEmail {
  email: string;
  primary: boolean;
  verified: boolean;
}

@Injectable()
export class GithubService {
  private readonly logger = new Logger(GithubService.name);
  private readonly githubAuthorizeUrl = 'https://github.com/login/oauth/authorize';
  private readonly githubTokenUrl = 'https://github.com/login/oauth/access_token';
  private readonly githubApiUrl = 'https://api.github.com';

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  getAuthorizationUrl(state: string): string {
    const { clientId, callbackUrl } = this.configService.get('github');

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: callbackUrl,
      scope: 'read:user,user:email',
      state,
    });

    return `${this.githubAuthorizeUrl}?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string): Promise<string> {
    const { clientId, clientSecret, callbackUrl } = this.configService.get('github');

    const response = await this.httpService.axiosRef.post(
      this.githubTokenUrl,
      new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: callbackUrl,
      }),
      { headers: { Accept: 'application/json' } }
    );

    if (response.data.error) {
      throw new Error(`GitHub OAuth 错误: ${response.data.error_description}`);
    }

    return response.data.access_token;
  }

  async getUserInfo(accessToken: string): Promise<GithubUser> {
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github.v3+json',
    };

    const userResponse = await this.httpService.axiosRef.get(`${this.githubApiUrl}/user`, {
      headers,
    });

    const user: GithubUser = userResponse.data;

    if (!user.email) {
      const emailsResponse = await this.httpService.axiosRef.get(`${this.githubApiUrl}/user/emails`, {
        headers,
      });

      const emails: GithubEmail[] = emailsResponse.data;
      const primaryEmail = emails.find(e => e.primary && e.verified) || emails.find(e => e.verified);
      if (primaryEmail) {
        user.email = primaryEmail.email;
      }
    }

    return user;
  }

  generateState(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
}
```

- [ ] **Step 4: 运行测试验证通过**

```bash
cd drag-builder-server && npm run test -- --testPathPattern=github.service.spec.ts
```

Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add src/modules/auth/github.service.ts test/github.service.spec.ts
git commit -m "feat(auth): 添加 GitHub OAuth 服务"
```

---

### Task 3.3: 集成 GithubService 到 AuthModule

**Files:**
- Modify: `drag-builder-server/src/modules/auth/auth.module.ts`
- Modify: `drag-builder-server/src/app.module.ts`

- [ ] **Step 1: 更新 AuthModule 导入 GithubService**

```typescript
// auth.module.ts
import { GithubService } from './github.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  providers: [EmailCodeService, GithubService, AuthService],
  controllers: [AuthController],
  exports: [AuthService, EmailCodeService, GithubService],
})
export class AuthModule {}
```

- [ ] **Step 2: 更新 AppModule 加载 GitHub 配置**

```typescript
// app.module.ts
import githubConfig from './config/github.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, jwtConfig, githubConfig],
      envFilePath: '.env',
    }),
    // ...
  ],
})
export class AppModule {}
```

- [ ] **Step 3: 提交**

```bash
git add src/modules/auth/auth.module.ts src/app.module.ts
git commit -m "feat(auth): 集成 GithubService 到 AuthModule"
```

---

## Task 4: 后端 - AuthController 新增端点

**Files:**
- Modify: `drag-builder-server/src/modules/auth/auth.controller.ts`
- Modify: `drag-builder-server/src/modules/auth/auth.service.ts`
- Modify: `drag-builder-server/.env.example`

---

### Task 4.1: 新增邮件验证码和 GitHub OAuth 端点

- [ ] **Step 1: 修改 AuthController**

```typescript
// auth.controller.ts 新增端点
import { SendCodeDto } from './dtos/send-code.dto';
import { RegisterWithCodeDto } from './dtos/register-with-code.dto';
import { EmailCodeService } from './email-code.service';
import { GithubService } from './github.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly emailCodeService: EmailCodeService,
    private readonly githubService: GithubService,
  ) {}

  // ... 现有端点保持不变 ...

  @Post('email/send-code')
  @HttpCode(HttpStatus.OK)
  async sendCode(@Body() dto: SendCodeDto, @Ip() ip: string) {
    const canSend = await this.emailCodeService.canSendFromIp(ip);
    if (!canSend) {
      throw new TooManyRequestsException('发送次数超限，请明天再试');
    }

    const turnstileValid = await this.emailCodeService.verifyTurnstile(dto.turnstileToken);
    if (!turnstileValid) {
      throw new UnprocessableEntityException('人机验证失败，请重试');
    }

    await this.emailCodeService.generateAndStoreCode(dto.email, ip);
    return { success: true };
  }

  @Post('email/register-with-code')
  @HttpCode(HttpStatus.CREATED)
  async registerWithCode(@Body() dto: RegisterWithCodeDto) {
    const isValid = await this.emailCodeService.verifyCode(dto.email, dto.code);
    if (!isValid) {
      throw new ConflictException('验证码错误或已过期');
    }

    return this.authService.registerWithEmailCode(dto);
  }

  @Get('github')
  @HttpCode(HttpStatus.FOUND)
  githubLogin() {
    const state = this.githubService.generateState();
    const url = this.githubService.getAuthorizationUrl(state);
    return { url };
  }

  @Post('github/exchange')
  @HttpCode(HttpStatus.OK)
  async githubExchange(@Body() body: { code: string; state: string }) {
    const user = await this.authService.handleGithubCallback(body.code);
    const payload: JwtPayload = { sub: user.id, username: user.username };
    const accessToken = this.jwtService.sign(payload);
    return { accessToken, user };
  }
}
```

注意：需要添加 `TooManyRequestsException` 和 `UnprocessableEntityException` 的导入。

- [ ] **Step 2: 修改 AuthService 添加新方法**

```typescript
// auth.service.ts 新增方法
async registerWithEmailCode(dto: RegisterWithCodeDto): Promise<Omit<UserEntity, 'passwordHash'>> {
  const existing = await this.userRepository.findOne({ where: { email: dto.email } });
  if (existing) {
    throw new ConflictException('该邮箱已被注册');
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(dto.password, salt);

  const user = this.userRepository.create({
    username: dto.username ?? null,
    email: dto.email,
    passwordHash,
    displayName: dto.displayName ?? dto.username ?? dto.email ?? null,
  });

  const saved = await this.userRepository.save(user);
  this.logger.log(`邮箱验证码注册成功，ID：${saved.id}`);
  return stripPasswordHash(saved);
}

async handleGithubCallback(code: string): Promise<Omit<UserEntity, 'passwordHash'>> {
  const accessToken = await this.githubService.exchangeCodeForToken(code);
  const githubUser = await this.githubService.getUserInfo(accessToken);

  // 1. 通过 githubId 查找
  let user = await this.userRepository.findOne({ where: { githubId: String(githubUser.id) } });
  if (user) {
    this.logger.log(`GitHub 用户登录，ID：${user.id}`);
    return stripPasswordHash(user);
  }

  // 2. 通过 email 查找
  if (githubUser.email) {
    user = await this.userRepository.findOne({ where: { email: githubUser.email } });
    if (user) {
      user.githubId = String(githubUser.id);
      await this.userRepository.save(user);
      this.logger.log(`GitHub 用户绑定已有账号，ID：${user.id}`);
      return stripPasswordHash(user);
    }
  }

  // 3. 创建新用户
  const salt = await bcrypt.genSalt(10);
  const randomPassword = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
  const passwordHash = await bcrypt.hash(randomPassword, salt);

  const newUser = this.userRepository.create({
    username: null,
    email: githubUser.email,
    githubId: String(githubUser.id),
    passwordHash,
    displayName: githubUser.name || githubUser.login,
  });

  const saved = await this.userRepository.save(newUser);
  this.logger.log(`GitHub 新用户创建，ID：${saved.id}`);
  return stripPasswordHash(saved);
}
```

- [ ] **Step 3: 更新 .env.example**

```bash
# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=http://localhost:3000/auth/github/callback

# Cloudflare Turnstile
TURNSTILE_SECRET_KEY=your_turnstile_secret_key
```

- [ ] **Step 4: 运行 lint 检查**

```bash
cd drag-builder-server && npm run lint
```

Expected: 无错误

- [ ] **Step 5: 提交**

```bash
git add src/modules/auth/auth.controller.ts src/modules/auth/auth.service.ts .env.example
git commit -m "feat(auth): 新增 GitHub OAuth 和邮箱验证码端点"
```

---

## Task 5: 前端 - AuthStore 同步初始化修复

**Files:**
- Modify: `drag-builder-react/src/store/authStore.ts`

- [ ] **Step 1: 修改 AuthStore 实现同步初始化**

```typescript
// authStore.ts
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

const TOKEN_KEY = 'drag_builder_token';
const USER_KEY = 'drag_builder_user';

// 同步从 localStorage 恢复状态
function loadToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function loadUser(): UserInfo | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as UserInfo) : null;
  } catch {
    return null;
  }
}

// 初始化时同步恢复
const initialToken = loadToken();
const initialUser = loadUser();

export interface UserInfo {
  id: string;
  username: string | null;
  email: string | null;
  displayName: string | null;
  createdAt: string;
  updatedAt: string;
}

interface AuthStore {
  token: string | null;
  user: UserInfo | null;
  isAuthenticated: boolean;

  setAuth: (token: string, user: UserInfo) => void;
  logout: () => void;
  loadFromStorage: () => void;
}

function persistAuth(token: string, user: UserInfo) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    // ignore storage errors
  }
}

function clearAuth() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {
    // ignore storage errors
  }
}

export const useAuthStore = create<AuthStore>()(
  immer(set => ({
    // 初始化时同步恢复登录状态
    token: initialToken,
    user: initialUser,
    isAuthenticated: !!(initialToken && initialUser),

    setAuth: (token: string, user: UserInfo) => {
      persistAuth(token, user);
      set(state => {
        state.token = token;
        state.user = user;
        state.isAuthenticated = true;
      });
    },

    logout: () => {
      clearAuth();
      set(state => {
        state.token = null;
        state.user = null;
        state.isAuthenticated = false;
      });
    },

    loadFromStorage: () => {
      const token = loadToken();
      const user = loadUser();
      if (token && user) {
        set(state => {
          state.token = token;
          state.user = user;
          state.isAuthenticated = true;
        });
      }
    },
  }))
);
```

- [ ] **Step 2: 修改 App.tsx 移除冗余的 useEffect loadFromStorage**

```typescript
// App.tsx
function App() {
  useApiErrorHandler();
  // 不再需要 loadFromStorage useEffect，状态已在 store 初始化时恢复

  return (
    // ...
  );
}
```

- [ ] **Step 3: 提交**

```bash
git add src/store/authStore.ts src/App.tsx
git commit -m "fix(auth): 修复刷新页面登录状态丢失问题"
```

---

## Task 6: 前端 - 统一错误处理 Hook

**Files:**
- Create: `drag-builder-react/src/hooks/useApiErrorHandler.ts`
- Modify: `drag-builder-react/src/api/client.ts`

---

### Task 6.1: 创建 useApiErrorHandler Hook

- [ ] **Step 1: 创建 Hook**

```typescript
// hooks/useApiErrorHandler.ts
import { useEffect } from 'react';
import { useUIStore } from '@store/uiStore';
import { useAuthStore } from '@store/authStore';

const EXCLUDED_PATHS = ['/login', '/register', '/auth/github/callback'];

export function useApiErrorHandler() {
  const showToast = useUIStore(s => s.showToast);
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const logout = useAuthStore(s => s.logout);

  useEffect(() => {
    const currentPath = window.location.pathname;

    // 只在非登录相关页面显示全局错误 Toast
    if (EXCLUDED_PATHS.some(path => currentPath.startsWith(path))) {
      return;
    }

    // 全局错误处理（扩展用）
    const handleError = (event: ErrorEvent) => {
      // 可以在这里添加全局错误上报
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, [showToast, isAuthenticated, logout]);
}
```

- [ ] **Step 2: 修改 apiClient 响应拦截器添加 Toast 提示**

```typescript
// client.ts
import { useUIStore } from '@/store/uiStore';

// 在拦截器中使用
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    // ... 现有错误处理逻辑 ...

    // 如果是 401 且不在登录页，显示 Toast
    if (error.response?.status === 401 && window.location.pathname !== '/login') {
      const uiStore = useUIStore.getState();
      uiStore.showToast('登录已过期，请重新登录', 'error', 'top-right');
      clearStoredToken();

      // 延迟跳转让 Toast 显示
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    }

    return Promise.reject(apiError);
  }
);
```

- [ ] **Step 3: 提交**

```bash
git add src/hooks/useApiErrorHandler.ts src/api/client.ts
git commit -m "feat(auth): 添加统一错误处理和 Toast 提示"
```

---

## Task 7: 前端 - GitHub 回调页面

**Files:**
- Create: `drag-builder-react/src/pages/GithubCallbackPage.tsx`
- Modify: `drag-builder-react/src/App.tsx`
- Modify: `drag-builder-react/src/api/authApi.ts`

---

### Task 7.1: 添加 GitHub Exchange API

- [ ] **Step 1: 修改 authApi.ts**

```typescript
// authApi.ts 新增
export async function githubExchange(code: string): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>('/auth/github/exchange', { code });
  return response.data;
}
```

- [ ] **Step 2: 提交**

```bash
git add src/api/authApi.ts
git commit -m "feat(auth): 添加 GitHub exchange API"
```

---

### Task 7.2: 创建 GithubCallbackPage

- [ ] **Step 1: 创建页面**

```typescript
// pages/GithubCallbackPage.tsx
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { githubExchange } from '@/api/authApi';
import { useAuthStore } from '@/store/authStore';
import { Layers } from 'lucide-react';

export default function GithubCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const setAuth = useAuthStore(s => s.setAuth);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const code = searchParams.get('code');

    if (!code) {
      setStatus('error');
      setErrorMessage('未收到授权码');
      return;
    }

    githubExchange(code)
      .then(res => {
        setAuth(res.accessToken, res.user);
        setStatus('success');
        setTimeout(() => navigate('/', { replace: true }), 1000);
      })
      .catch(err => {
        setStatus('error');
        setErrorMessage(err.userMessage || 'GitHub 登录失败');
      });
  }, [searchParams, navigate, setAuth]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="relative w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden">
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(90deg, #fb923c 0%, #fb923c 10%, #f97316 20%, #f97316 30%, #ea580c 40%, #ea580c 50%, #c2410c 60%, #c2410c 70%, #9a3412 80%, #9a3412 90%, #fb923c 100%)',
                backgroundSize: '200% 100%',
                animation: 'gradient-wave 3s linear infinite',
              }}
            />
            <Layers className="relative z-10 w-6 h-6 text-white drop-shadow-md" />
          </div>
          <span className="font-bold text-xl text-white tracking-tight">DragBuilder</span>
        </div>

        {status === 'loading' && (
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-8">
            <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-slate-400">正在处理登录...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-8">
            <div className="text-green-500 text-4xl mb-4">✓</div>
            <p className="text-green-400">登录成功！即将跳转...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-8">
            <div className="text-red-500 text-4xl mb-4">✗</div>
            <p className="text-red-400 mb-4">{errorMessage}</p>
            <button
              onClick={() => navigate('/login')}
              className="text-orange-400 hover:text-orange-300 font-medium"
            >
              返回登录页
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: 修改 App.tsx 添加路由**

```typescript
// App.tsx
import GithubCallbackPage from '@/pages/GithubCallbackPage';

// Routes 中添加
<Route path="/auth/github/callback" element={<GithubCallbackPage />} />
```

- [ ] **Step 4: 提交**

```bash
git add src/pages/GithubCallbackPage.tsx src/App.tsx
git commit -m "feat(auth): 添加 GitHub OAuth 回调页面"
```

---

## Task 8: 前端 - LoginPage 和 RegisterPage 重构

**Files:**
- Modify: `drag-builder-react/src/pages/LoginPage.tsx`
- Modify: `drag-builder-react/src/pages/RegisterPage.tsx`

---

### Task 8.1: 重构 LoginPage

- [ ] **Step 1: 移除内联错误，使用 Toast，添加 GitHub 登录按钮**

```tsx
// pages/LoginPage.tsx
import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { login } from '@/api/authApi';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { Layers } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setAuth = useAuthStore(s => s.setAuth);
  const showToast = useUIStore(s => s.showToast);

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const redirect = searchParams.get('redirect') || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const isEmail = identifier.includes('@');
      const payload = isEmail
        ? { email: identifier, password }
        : { username: identifier, password };

      const res = await login(payload);
      setAuth(res.accessToken, res.user);
      showToast('登录成功', 'success');
      navigate(redirect, { replace: true });
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : typeof err === 'object' && err && 'userMessage' in err
            ? (err as { userMessage: string }).userMessage
            : '登录失败，请检查用户名和密码';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGithubLogin = async () => {
    try {
      const res = await fetch('http://localhost:3000/auth/github');
      const data = await res.json();
      window.location.href = data.url;
    } catch (err) {
      showToast('无法连接 GitHub 登录服务', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          {/* Logo 和标题 */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="relative w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 animate-gradient-wave" />
              <Layers className="relative z-10 w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-xl text-white">DragBuilder</span>
          </div>
          <h1 className="text-2xl font-bold text-white">登录</h1>
          <p className="text-slate-400 mt-2">登录以管理你的项目</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* GitHub 登录按钮 */}
          <button
            type="button"
            onClick={handleGithubLogin}
            className="w-full flex items-center justify-center gap-3 py-2.5 bg-white/10 hover:bg-white/15 border border-white/10 rounded-lg text-white font-medium transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path
                fillRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                clipRule="evenodd"
              />
            </svg>
            使用 GitHub 登录
          </button>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-white/10 w-full" />
            <span className="bg-black px-4 text-sm text-slate-500 absolute">或</span>
          </div>

          {/* 用户名/邮箱 */}
          <div>
            <label htmlFor="identifier" className="block text-sm font-medium text-slate-300 mb-1.5">
              用户名或邮箱
            </label>
            <input
              id="identifier"
              type="text"
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              required
              autoComplete="username"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-colors"
              placeholder="输入用户名或邮箱"
            />
          </div>

          {/* 密码 */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1.5">
              密码
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-colors"
              placeholder="输入密码"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 text-sm font-bold text-white bg-orange-600 rounded-lg hover:bg-orange-700 shadow-lg shadow-orange-900/40 transition-all disabled:opacity-50"
          >
            {loading ? '登录中...' : '登录'}
          </button>

          <p className="text-center text-sm text-slate-400">
            还没有账号？{' '}
            <Link to="/register" className="text-orange-400 hover:text-orange-300 font-medium">
              注册
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 运行 lint 检查**

```bash
cd drag-builder-react && npm run lint
```

Expected: 无错误

- [ ] **Step 3: 提交**

```bash
git add src/pages/LoginPage.tsx
git commit -m "feat(auth): LoginPage 添加 GitHub 登录和 Toast 提示"
```

---

### Task 8.2: 重构 RegisterPage 添加验证码

- [ ] **Step 1: 重构 RegisterPage**

```tsx
// pages/RegisterPage.tsx
import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '@/api/authApi';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { Layers } from 'lucide-react';

declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: object) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore(s => s.setAuth);
  const showToast = useUIStore(s => s.showToast);

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const turnstileRef = useRef<HTMLDivElement>(null);
  const turnstileWidgetId = useRef<string>('');

  // 渲染 Turnstile
  useState(() => {
    const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;
    if (siteKey && turnstileRef.current && window.turnstile) {
      turnstileWidgetId.current = window.turnstile.render(turnstileRef.current, {
        siteKey,
        callback: () => {},
        'error-callback': () => {},
        'expired-callback': () => {},
      });
    }
  });

  const handleSendCode = async () => {
    if (!email) {
      showToast('请输入邮箱', 'warning');
      return;
    }

    setSendingCode(true);
    try {
      const turnstileToken = window.turnstile?.getResponse(turnstileWidgetId.current) || '';
      await fetch('http://localhost:3000/auth/email/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, turnstileToken }),
      });
      setCodeSent(true);
      showToast('验证码已发送', 'success');
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : typeof err === 'object' && err && 'userMessage' in err
            ? (err as { userMessage: string }).userMessage
            : '发送验证码失败';
      showToast(msg, 'error');
    } finally {
      setSendingCode(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username && !email) {
      showToast('至少填写用户名或邮箱', 'warning');
      return;
    }

    if (password.length < 8) {
      showToast('密码长度至少 8 个字符', 'warning');
      return;
    }

    if (password !== confirmPassword) {
      showToast('两次密码输入不一致', 'warning');
      return;
    }

    if (!codeSent || !code) {
      showToast('请先发送并填写验证码', 'warning');
      return;
    }

    setLoading(true);

    try {
      // 先注册
      const registerRes = await register({
        username: username || undefined,
        email: email,
        password,
      });

      // 再验证邮箱
      const verifyRes = await fetch('http://localhost:3000/auth/email/register-with-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, password }),
      });

      if (!verifyRes.ok) {
        throw new Error('验证码验证失败');
      }

      const verifyData = await verifyRes.json();

      // 自动登录
      setAuth(verifyData.accessToken, verifyData.user);
      showToast('注册成功', 'success');
      navigate('/', { replace: true });
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : typeof err === 'object' && err && 'userMessage' in err
            ? (err as { userMessage: string }).userMessage
            : '注册失败，请稍后重试';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="relative w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 animate-gradient-wave" />
              <Layers className="relative z-10 w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-xl text-white">DragBuilder</span>
          </div>
          <h1 className="text-2xl font-bold text-white">注册</h1>
          <p className="text-slate-400 mt-2">创建账号开始使用</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 用户名 */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-slate-300 mb-1.5">
              用户名 <span className="text-slate-500 text-xs">（可选）</span>
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoComplete="username"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
              placeholder="3-30 位字母、数字、下划线"
            />
          </div>

          {/* 邮箱 + 验证码 */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1.5">
              邮箱
            </label>
            <div className="flex gap-2">
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                placeholder="example@email.com"
              />
              <button
                type="button"
                onClick={handleSendCode}
                disabled={sendingCode}
                className="px-3 py-2 bg-white/10 border border-white/10 rounded-lg text-white text-sm hover:bg-white/15 disabled:opacity-50"
              >
                {sendingCode ? '发送中...' : codeSent ? '重新发送' : '获取验证码'}
              </button>
            </div>
          </div>

          {/* 验证码 */}
          {codeSent && (
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-slate-300 mb-1.5">
                验证码
              </label>
              <input
                id="code"
                type="text"
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                required
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                placeholder="6 位数字验证码"
              />
            </div>
          )}

          {/* Turnstile */}
          <div ref={turnstileRef} className="flex justify-center" />

          {/* 密码 */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1.5">
              密码
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
              placeholder="至少 8 个字符"
            />
          </div>

          {/* 确认密码 */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300 mb-1.5">
              确认密码
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
              placeholder="再次输入密码"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 text-sm font-bold text-white bg-orange-600 rounded-lg hover:bg-orange-700 shadow-lg shadow-orange-900/40 transition-all disabled:opacity-50"
          >
            {loading ? '注册中...' : '注册'}
          </button>

          <p className="text-center text-sm text-slate-400">
            已有账号？{' '}
            <Link to="/login" className="text-orange-400 hover:text-orange-300 font-medium">
              登录
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 运行 lint 检查**

```bash
cd drag-builder-react && npm run lint
```

Expected: 无错误

- [ ] **Step 3: 提交**

```bash
git add src/pages/RegisterPage.tsx
git commit -m "feat(auth): RegisterPage 添加邮箱验证码功能"
```

---

## Task 9: 前端 - 首页拆分（Landing/Dashboard）

**Files:**
- Modify: `drag-builder-react/src/pages/HomePage.tsx`

- [ ] **Step 1: 重构 HomePage 根据登录状态渲染不同内容**

```tsx
// pages/HomePage.tsx
import { useAuthStore } from '@/store/authStore';
import ProjectList from '@/components/ProjectList/ProjectList';

/**
 * 未登录用户看到的首页 - Landing Page
 */
function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      <header className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-6 h-6 text-orange-600" />
          <span className="font-bold text-lg text-gray-900">DragBuilder</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-gray-600 hover:text-gray-900">
            登录
          </Link>
          <Link
            to="/register"
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            开始使用
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-6 py-16">
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            快速构建你的
            <span className="text-orange-600">网页应用</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            拖拽式页面构建器，无需编码即可创建精美的 React 页面
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              to="/register"
              className="px-8 py-3 bg-orange-600 text-white text-lg rounded-lg hover:bg-orange-700"
            >
              立即体验
            </Link>
            <a
              href="#features"
              className="px-8 py-3 bg-white text-gray-700 border border-gray-300 text-lg rounded-lg hover:bg-gray-50"
            >
              了解更多
            </a>
          </div>
        </div>

        <div id="features" className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard
            icon={<MousePointer className="w-8 h-8" />}
            title="拖拽设计"
            description="直观的拖拽界面，轻松移动和调整组件位置"
          />
          <FeatureCard
            icon={<Layers className="w-8 h-8" />}
            title="实时预览"
            description="所见即所得，实时查看页面效果"
          />
          <FeatureCard
            icon={<Code className="w-8 h-8" />}
            title="代码导出"
            description="一键导出 React 代码，可直接用于生产环境"
          />
        </div>
      </main>
    </div>
  );
}

/**
 * 已登录用户看到的首页 - Dashboard
 */
function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-6 h-6 text-orange-600" />
            <span className="font-bold text-lg text-gray-900">DragBuilder</span>
          </div>
          <button
            onClick={() => useAuthStore.getState().logout()}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            退出登录
          </button>
        </div>
      </header>

      <main className="p-6">
        <ProjectList />
      </main>
    </div>
  );
}

export default function HomePage() {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);

  if (!isAuthenticated) {
    return <LandingPage />;
  }

  return <DashboardPage />;
}
```

需要添加缺失的导入：`import { Layers, MousePointer, Code } from 'lucide-react';`
和 `import { Link } from 'react-router-dom';`
以及 `import FeatureCard from '@/components/FeatureCard/FeatureCard';`（如果已存在）

- [ ] **Step 2: 运行 lint 检查**

```bash
cd drag-builder-react && npm run lint
```

Expected: 无错误

- [ ] **Step 3: 提交**

```bash
git add src/pages/HomePage.tsx
git commit -m "feat(auth): HomePage 根据登录状态渲染 Landing/Dashboard"
```

---

## Task 10: 端到端测试

**Files:**
- Modify: `drag-builder-react/cypress/e2e/auth.cy.ts`

- [ ] **Step 1: 编写登录注册 E2E 测试**

```typescript
// cypress/e2e/auth.cy.ts
describe('认证系统', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  describe('未登录访问', () => {
    it('应显示 Landing Page', () => {
      cy.contains('快速构建你的网页应用').should('be.visible');
      cy.contains('立即体验').should('be.visible');
    });

    it('点击立即体验应跳转到注册页', () => {
      cy.contains('立即体验').click();
      cy.url().should('include', '/register');
    });

    it('点击登录应跳转到登录页', () => {
      cy.contains('登录').first().click();
      cy.url().should('include', '/login');
    });
  });

  describe('GitHub 登录', () => {
    it('登录页应显示 GitHub 登录按钮', () => {
      cy.visit('/login');
      cy.contains('使用 GitHub 登录').should('be.visible');
    });

    it('点击 GitHub 登录按钮应跳转到 GitHub 授权页', () => {
      cy.visit('/login');
      cy.contains('使用 GitHub 登录').click();
      cy.url().should('include', 'github.com');
    });
  });
});
```

- [ ] **Step 2: 运行 E2E 测试**

```bash
cd drag-builder-react && npm run dev &
sleep 5
npx cypress run --spec "cypress/e2e/auth.cy.ts"
```

Expected: 测试通过

- [ ] **Step 3: 提交**

```bash
git add cypress/e2e/auth.cy.ts
git commit -m "test(auth): 添加认证系统 E2E 测试"
```

---

## 实施完成检查清单

- [ ] Task 1: 用户实体添加 githubId 字段
- [ ] Task 2: 邮箱验证码服务
- [ ] Task 3: GitHub OAuth 服务
- [ ] Task 4: AuthController 新增端点
- [ ] Task 5: AuthStore 同步初始化修复
- [ ] Task 6: 统一错误处理 Hook
- [ ] Task 7: GitHub 回调页面
- [ ] Task 8: LoginPage 和 RegisterPage 重构
- [ ] Task 9: 首页拆分
- [ ] Task 10: E2E 测试
- [ ] 所有 lint 检查通过
- [ ] 所有单元测试通过