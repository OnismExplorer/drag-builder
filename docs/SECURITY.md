# Security.md — 安全防御与编码规范

> 本文件定义了 DragBuilder 项目的安全防御策略和强制编码规范。
> 所有 AI 助手在新增组件类型、修改数据库存储逻辑、或涉及用户内容渲染时，**必须进行安全检查（Security Check）**。

---

## 1. 强制安全纪律

### 1.1 安全检查前置要求

> **⚠️ 任何 AI 助手在执行以下操作前，必须进行安全检查（Security Check）：**
> - 新增组件类型（修改 `ComponentNode` 渲染逻辑）
> - 修改 `codeGenerator.ts` 代码生成逻辑
> - 修改 `project.dto.ts` 或 `project.entity.ts` 数据验证逻辑
> - 新增任何涉及用户输入内容存储或渲染的功能
>
> **检查清单：**
> 1. 该操作是否涉及将用户输入插入到 DOM/JSX 中？
> 2. 该操作是否涉及存储大对象或深层嵌套结构到数据库？
> 3. 该操作是否引入了新的认证/授权逻辑？

### 1.2 违反安全规范的后果

- **XSS 类漏洞**：可能导致用户会话被盗、敏感信息泄露
- **JSONB 注入/溢出**：可能导致服务崩溃或内存耗尽
- **越权访问**：可能导致用户数据被非法访问或篡改

---

## 2. 前端画布 XSS 防护

### 2.1 核心原则：永远不要信任用户输入

`ComponentNode.content.text` 以及所有 `content` 字段中的文本内容，都是**用户可控输入**。在渲染和代码生成时必须进行严格消毒。

### 2.2 React 渲染时的文本安全

**✅ 正确做法：使用 JSX 插值**

```tsx
// ComponentNode.tsx - renderContent 方法
case 'text':
  return (
    <p className={className} style={{ ...style }}>
      {component.content.text || 'Text'}  {/* ✅ 安全：React 会自动转义 */}
    </p>
  );
```

**❌ 错误做法：使用 dangerouslySetInnerHTML**

```tsx
// 绝对禁止！
<div dangerouslySetInnerHTML={{ __html: userContent }} />
```

> **原因**：`dangerouslySetInnerHTML` 会直接将字符串作为 HTML 插入 DOM，如果字符串包含 `<script>` 标签，会被执行。

⚠️ 特殊豁免： 未来若明确需要开发“富文本组件（Rich Text）”，并且必须使用 dangerouslySetInnerHTML 时，绝对禁止直接插入原始输入，必须引入并使用 DOMPurify.sanitize(userContent) 进行严格洗碗消毒。

### 2.3 代码生成时的 XSS 防护（codeGenerator.ts）

**⚠️ 严重漏洞位置：`generateContent()` 方法**

当前实现直接拼接用户文本到 JSX 字符串：

```typescript
// ❌ 当前实现 - 危险！
private generateContent(component: ComponentNode): string {
  return component.content.text || '';
}
```

生成的代码存在 XSS 风险：

```tsx
// 恶意输入：<script>alert('xss')</script>
// 生成的代码（危险）：
<p>{<script>alert('xss')</script>}</p>
```

**✅ 修复方案：转义 HTML 特殊字符**

```typescript
/**
 * 转义 HTML 特殊字符
 * 防止 XSS 攻击
 * @param text 未转义的文本
 * @returns 转义后的安全文本
 */
private escapeHtml(text: string): string {
  const escapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
  };
  return text.replace(/[&<>"']/g, char => escapeMap[char]);
}

/**
 * 生成组件内容
 * ✅ 安全版本：转义 HTML 特殊字符
 */
private generateContent(component: ComponentNode): string {
  const text = component.content.text || '';
  return this.escapeHtml(text);
}
```

### 2.4 图片 URL 验证

**⚠️ 图片 src 必须验证**

用户输入的图片 URL 可能指向恶意资源。`codeGenerator.ts` 生成的 `<img>` 标签：

```tsx
// 当前实现（需要改进）
<img src="${component.content.src || '/placeholder.png'}" ... />
```

**✅ 最佳实践**

1. **URL 白名单验证**（如果已知可信图床）：
```typescript
private isAllowedImageUrl(url: string): boolean {
  const allowedDomains = ['cdn.example.com', 'images.unsplash.com'];
  try {
    const hostname = new URL(url).hostname;
    return allowedDomains.some(domain => hostname === domain || hostname.endsWith(`.${domain}`));
  } catch {
    return false;
  }
}
```

2. **占位符兜底**：当 URL 非法或为空时，使用本地占位图。

---

## 3. 后端 JSONB 注入防御

### 3.1 问题背景

`componentsTree` 字段存储为 `jsonb` 类型，接收来自前端的任意 JSON 结构。当前 DTO 验证使用 `any[]`，**无法限制嵌套深度和字段大小**。

### 3.2 威胁场景

| 威胁 | 描述 | 后果 |
|------|------|------|
| **深度嵌套攻击** | 发送嵌套层级超过 100 层的组件树 | 递归解析导致栈溢出或 CPU 耗尽 |
| **字段放大攻击** | 单个组件节点包含超长字符串（>1MB） | 内存耗尽或存储膨胀 |
| **类型混淆攻击** | componentsTree 数组中混入非对象元素 | 后端解析错误或类型推断异常 |

### 3.3 防御措施

#### 3.3.1 深度验证装饰器（MaxDepth）

**必须添加 MaxDepth 验证**：限制组件树的最大嵌套层级。

```typescript
// src/common/decorators/max-depth.decorator.ts
import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

/**
 * 验证嵌套对象的最大深度
 * @param maxDepth 最大深度（默认为 10）
 * @param validationOptions class-validator 选项
 */
export function MaxDepth(maxDepth: number = 10, validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'maxDepth',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments): boolean {
          if (!Array.isArray(value)) return true;

          let maxFound = 0;

          function measureDepth(arr: any[], depth: number): void {
            for (const item of arr) {
              if (typeof item !== 'object' || item === null) continue;
              if (item.children && Array.isArray(item.children)) {
                measureDepth(item.children, depth + 1);
              } else {
                maxFound = Math.max(maxFound, depth);
              }
            }
          }

          measureDepth(value, 1);
          return maxFound <= maxDepth;
        },
        defaultMessage(args: ValidationArguments): string {
          return `组件树嵌套深度不能超过 ${maxDepth} 层`;
        },
      },
    });
  };
}
```

**在 DTO 中应用**：

```typescript
// project.dto.ts
import { MaxDepth } from '../../common/decorators/max-depth.decorator';

export class CreateProjectDto {
  @MaxDepth(10, { message: '组件树嵌套深度不能超过 10 层' })
  @IsArray({ message: '组件树必须是数组' })
  componentsTree!: any[];
}
```

#### 3.3.2 单节点大小限制

**验证单个组件节点的字段长度**：

```typescript
// 在 CreateProjectDto 中添加
@ValidateNested({ each: true })
@Type(() => ComponentNodeDto)
componentsTree!: ComponentNodeDto[];

// 新增 ComponentNodeDto
export class ComponentNodeDto {
  @IsString()
  @MaxLength(50, { message: '组件 ID 不能超过 50 字符' })
  id!: string;

  @IsString()
  @IsIn(['div', 'button', 'text', 'image', 'input', 'radio', 'checkbox', 'tag'])
  type!: string;

  @IsObject()
  @ValidateNested()
  @Type(() => PositionDto)
  position!: PositionDto;

  // 限制 text 字段长度（防止放大攻击）
  @IsOptional()
  @IsString()
  @MaxLength(10000, { message: '文本内容不能超过 10000 字符' })
  text?: string;
}
```

#### 3.3.3 TypeORM JSONB 存储安全

**使用 TypeORM 参数化查询**，避免 SQL 注入：

```typescript
// ✅ 正确：TypeORM 自动参数化
await this.projectRepository.find({ where: { name: Like(`%${search}%`) } });

// ❌ 错误：字符串拼接 SQL（绝对禁止）
const query = `SELECT * FROM projects WHERE name LIKE '%${search}%'`;
```

**JSONB 字段写入前验证类型**：

```typescript
// project.service.ts - create/update 方法中
async create(createProjectDto: CreateProjectDto): Promise<ProjectEntity> {
  // 验证 componentsTree 是数组
  if (!Array.isArray(createProjectDto.componentsTree)) {
    throw new BadRequestException('componentsTree 必须是数组');
  }

  // 验证 canvasConfig 是对象
  if (typeof createProjectDto.canvasConfig !== 'object') {
    throw new BadRequestException('canvasConfig 必须是对象');
  }

  // ... 继续创建逻辑
}
```

---

## 4. 越权与鉴权

⚠️ 注意： 本章节（越权）属于未来版本的架构规划。除非人类明确下达指令要求实现认证或限流功能，否则严禁在当前代码中擅自添加相关防护逻辑。

### 4.1 当前安全状态

> **⚠️ 警告**：当前版本**没有实现用户认证和项目隔离**。任何知道项目 UUID 的人都可以查看、修改、删除该项目。

### 4.2 资源隔离策略（未来版本）

#### 4.2.1 认证机制

必须实现基于 JWT 的用户认证：

```typescript
// 请求头格式
Authorization: Bearer <jwt_token>
```

#### 4.2.2 项目所有权验证

**每次访问项目时，必须验证所有权**：

```typescript
// project.service.ts - findOne 方法
async findOne(id: string, userId: string): Promise<ProjectEntity> {
  const project = await this.projectRepository.findOne({ where: { id } });

  if (!project) {
    throw new NotFoundException(`项目 ${id} 不存在`);
  }

  // ⚠️ 必须验证：项目是否属于当前用户
  if (project.userId !== userId) {
    throw new ForbiddenException('无权访问此项目');
  }

  return project;
}
```

#### 4.2.3 未来鉴权装饰器

```typescript
// src/common/decorators/current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);
```

### 4.3 CORS 配置规范

**当前配置**（仅允许本地开发）：

```typescript
app.enableCors({
  origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'], // ⚠️ 生产环境应包含 CSRF token
});
```

**生产环境要求**：
- `origin` 必须指定具体域名，不使用通配符 `*`
- 考虑添加 `credentials: true` 和 `maxAge` 配置

---

## 5. CSRF 防护

⚠️ 注意： 本章节（CSRF）属于未来版本的架构规划。除非人类明确下达指令要求实现认证或限流功能，否则严禁在当前代码中擅自添加相关防护逻辑。

### 5.1 风险说明

当前 API 使用 `Authorization` Header 传递认证信息，但**没有 CSRF 防护**。如果攻击者诱导已登录用户访问恶意站点，可能导致跨站请求伪造。

### 5.2 防护方案

#### 5.2.1 SameSite Cookie

确保认证 Cookie 设置 `SameSite=Strict` 或 `SameSite=Lax`：

```typescript
// 如果使用 cookie-based session
app.use(
  session({
    cookie: {
      sameSite: 'strict',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    },
  }),
);
```

#### 5.2.2 CSRF Token（如果实现 cookie-based 认证）

```typescript
// 前端：请求时从 cookie 中读取 CSRF token
const csrfToken = document.cookie.match(/csrf-token=([^;]+)/)?.[1];

// 请求头包含 CSRF token
headers: {
  'Content-Type': 'application/json',
  'X-CSRF-Token': csrfToken,
}
```

---

## 6. 速率限制（Rate Limiting）

⚠️ 注意： 本章节（限流）属于未来版本的架构规划。除非人类明确下达指令要求实现认证或限流功能，否则严禁在当前代码中擅自添加相关防护逻辑。

### 6.1 风险

没有速率限制的 API 可能被滥用进行：
- DDoS 攻击
- 暴力破解
- 资源耗尽

### 6.2 NestJS 速率限制配置

```typescript
// 使用 @nestjs/throttler
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: 60000,  // 60 秒窗口
      limit: 100,  // 最多 100 请求
    }]),
  ],
})
export class AppModule {}
```

**API 级别限制**：

```typescript
@Controller('api/projects')
@UseGuards(ThrottlerGuard)
export class ProjectController {
  // 创建项目限制更严格
  @Post()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async create(@Body() createProjectDto: CreateProjectDto) { ... }
}
```

---

## 7. 日志与审计

### 7.1 安全日志要求

所有安全相关事件必须记录：

| 事件 | 日志级别 | 记录内容 |
|------|----------|----------|
| 认证失败 | WARN | 用户 ID、IP、时间戳 |
| 越权访问尝试 | WARN | 用户 ID、项目 ID、尝试的操作 |
| 异常大请求 | WARN | 请求大小、IP、时间戳 |
| 项目删除 | INFO | 项目 ID、操作用户、时间戳 |

### 7.2 NestJS 日志配置

```typescript
// main.ts
const logger = new Logger('Security', {
  logLevels: ['error', 'warn', 'log'],
});

app.useLogger(logger);
```

---

## 8. 依赖安全

### 8.1 定期审计

```bash
# 前端
cd drag-builder-react && npm audit

# 后端
cd drag-builder-server && npm audit
```

### 8.2 禁止使用已知漏洞版本

| 依赖 | 最低安全版本 |
|------|--------------|
| axios | >= 1.7.0 |
| class-validator | >= 0.14.0 |
| TypeORM | >= 0.3.17 |

---

## 9. 环境变量安全

### 9.1 敏感变量清单

| 变量名 | 说明 | 存储位置 |
|--------|------|----------|
| `DATABASE_URL` | 数据库连接字符串 | `.env`（不提交到 git） |
| `JWT_SECRET` | JWT 签名密钥 | `.env`（不提交到 git） |
| `CORS_ORIGIN` | CORS 白名单 | `.env` 或环境变量 |

### 9.2 .gitignore 检查

确保以下文件**永远不提交**：

```
.env
.env.*
*.log
node_modules/
dist/
```

---

## 10. 安全检查清单（新增代码时必须执行）

⚠️ 交付纪律： 当 AI 助手完成涉及上述高危区域的任务时，必须在最终回复中，以 Markdown 格式复制并逐项打勾（[x]）展示本清单，向人类证明已完成安全审查。

```markdown
- [ ] 是否将用户输入插入到 DOM/HTML/JSX 中？若是，是否经过转义或消毒？
- [ ] 是否使用了 dangerouslySetInnerHTML？若使用，是否有充足理由且经过安全审查？
- [ ] codeGenerator.ts 生成代码时，是否对用户文本进行了 HTML 转义？
- [ ] componentsTree 的嵌套深度是否有验证？
- [ ] 单个组件字段（如 text）是否有长度限制？
- [ ] 是否引入了新的认证/授权逻辑？若是，是否正确验证所有权？
- [ ] API 响应是否暴露了敏感信息（如数据库错误详情）？
```

---

## 附录：关键文件安全映射

| 文件路径 | 安全要点 |
|----------|----------|
| `drag-builder-react/src/components/Canvas/ComponentNode.tsx` | 渲染用户内容时不使用 dangerouslySetInnerHTML |
| `drag-builder-react/src/utils/codeGenerator.ts` | 生成 JSX 时转义 HTML 特殊字符 |
| `drag-builder-server/src/modules/project/project.dto.ts` | 添加 MaxDepth 验证和字段长度限制 |
| `drag-builder-react/src/api/client.ts` | 请求/响应拦截器不暴露敏感信息 |
| `drag-builder-server/src/main.ts` | CORS 配置使用具体域名 |
