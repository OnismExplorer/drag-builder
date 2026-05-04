# AGENTS.md — DragBuilder 速查

> 本文件是 OpenCode 会话的快速上下文补充。完整 AI 行为规范见 `CLAUDE.md`；API/领域/安全细节见 `docs/`。

## 项目边界

```
drag-builder-react/    # React 19 + Vite 7 + Tailwind CSS 4 前端 (端口 5173)
drag-builder-server/   # NestJS 11 + TypeORM 0.3 后端 (端口 3000)
drag-builder-sql/      # PostgreSQL 16+ 脚本
```

根目录 `package.json` 仅含 `shadcn` CLI，**不是 workspace**。前后端独立 `npm install`。

## 每次修改后必执行

```bash
# 前端（lint 报错数必须为 0 才能交付）
cd drag-builder-react && npm run lint
cd drag-builder-react && npx tsc --noEmit        # 类型检查
cd drag-builder-react && npm run test            # vitest --run

# 后端（lint 默认带 --fix，会修改文件；若只想检查需留意）
cd drag-builder-server && npm run lint
cd drag-builder-server && npx tsc --noEmit
cd drag-builder-server && npm run test:e2e       # 必须连接真实 PostgreSQL
```

**交付纪律**：禁止提交带 lint 报错或类型错误的代码。

## 技术栈陷阱

- **React 19** + **Tailwind CSS 4** — 禁用旧 API（如 `forwardRef` 包裹模式），禁用 Tailwind 3 类名写法
- 前端 `tsconfig.json` 是 **composite references**（仅含 `references`），实际编译看 `tsconfig.app.json`
- Prettier 规则：**单引号、分号、2 空格、`trailingComma: es5`、`printWidth: 100`、`endOfLine: lf`**
- 两个子项目的 ESLint 都把 `prettier/prettier` 设为 **error**
- 后端 ESLint 额外开启 `@typescript-eslint/no-floating-promises: error`

## 测试与验证

| 范围 | 命令 | 前提 / 注意 |
|------|------|-------------|
| 前端单元 | `cd drag-builder-react && npm test` | Vitest + jsdom，setup 在 `./tests/setup.ts` |
| 前端 E2E | `cd drag-builder-react && npm run test:e2e` | Cypress，`baseUrl: http://localhost:5173`，元素定位必须用 `data-testid` |
| 后端单元 | `cd drag-builder-server && npm test` | Jest + ts-jest |
| 后端 E2E | `cd drag-builder-server && npm run test:e2e` | **必须连接真实 PostgreSQL**，严禁 Mock Repository |

**测试禁区**：不要在 Vitest/JSDOM 里深度 Mock `@dnd-kit` 的拖拽事件。

## 组件注册机制

`main.tsx` 启动时调用 `registerBuiltInComponents()` 和 `componentRegistry.registerAdapter(...)`。新增组件类型必须同步更新注册表，否则画布不渲染。

## 数据库与 JSONB

- 初始化：`drag-builder-sql/setup.sh`（交互式 bash）
- TypeORM `synchronize: true` 仅在 `NODE_ENV=development` 时启用
- **更新 `canvas_config` / `components_tree` 时必须做 merge**，严禁直接全量覆盖导致属性丢失
- **禁止重命名 `ComponentNode` 核心字段**（`id`、`type`、`position`、`styles`、`content`）

## 状态管理

- 三个 Store：`componentStore`（组件树/选中/撤销重做）、`canvasStore`（画布/缩放/平移）、`uiStore`（UI 交互）
- **必须使用 Immer 中间件**：`set(state => { state.xxx = ... })`
- 路由变化用 React Router DOM 7 的 `useNavigate` / `<Link>`，**严禁直接操作 `window.location`**

## 画布引擎绝对禁忌

修改 `EditorPage.tsx`、`Canvas.tsx`、`ComponentNode.tsx`、`ResizeHandles.tsx` 或 `utils/snapping.ts` 前必读 `docs/DOMAIN.md`。

1. **禁止直接操作 DOM 样式更新组件位置**。必须通过 `updateComponent()` 更新 Store。
2. **禁止在坐标转换中省略 `/ zoom`**。`delta.x / zoom` 才是画布坐标偏移。
3. **禁止在连续操作（拖拽/调整尺寸）中遗漏 `pushHistory()`**。必须在 `onDragStart`/`onResizeStart` 时调用，确保撤销能回到原位。

## API 契约陷阱

- **无全局路径前缀**。端点直接挂在根路径，如 `POST /api/projects`。
- `ValidationPipe` 配置：`whitelist: true` + `forbidNonWhitelisted: true`。请求体含 DTO 未定义字段会 **400**。
- 单体资源响应**直接返回实体**，无 `{ code, data }` 包装；分页接口才包 `PaginatedResult`。
- 后端 Entity 用 camelCase（如 `canvasConfig`），数据库列是 snake_case（`canvas_config`）。

## 文档路由

| 任务涉及 | 先读 |
|----------|------|
| API 接口变更 | `docs/API.md` |
| 画布坐标/吸附算法/Zustand 状态 | `docs/DOMAIN.md` |
| 富文本/XSS/输入渲染 | `docs/SECURITY.md` |
| 完整 AI 行为规范 | `CLAUDE.md` |

## 语言与提交

- **全部输出（注释、解释、commit message）使用中文**
- Commit 规范：`<type>: <简短描述>`（`feat` / `fix` / `docs` / `style` / `refactor` / `test` / `chore`）
- 功能开发走 OpenSpec 流程，规划文档在 `openspec/`
