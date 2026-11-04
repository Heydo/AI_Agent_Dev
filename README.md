# AI_Agent_Dev Monorepo（Bun Workspaces + Turborepo）

基于 **Bun Workspaces** 的可扩展 monorepo，按三层拆分工程：

- `clients/`：客户端应用
- `services/`：服务进程
- `packages/`：共享子包

> 根目录 `package.json` 保持标准 JSON 格式（不写注释），其每个配置项的作用统一在本文档说明。

## 当前进度（截止教程 2.7）

> 本仓库对应教程《第二章：搭建智能体的工程底座》**2.4 → 2.7** 的完成状态；2.8（Docker / Compose 部署）及之后尚未开始。

| 阶段 | 内容 | 状态 |
| --- | --- | --- |
| 2.4 | monorepo 底座：Bun workspaces、isolated linker、`turbo.json`、`tsconfig.base.json`、`@autix/contracts` | ✅ 完成 |
| 2.5 | 客户端 `clients/chat-web`：Next.js 16 + React 19（端口 3002），`transpilePackages` 消费 contracts 源码 | ✅ 完成 |
| 2.6 | 服务端 `services/chat`：NestJS（端口 4001），提供 `GET /health`、`GET /hello` | ✅ 完成 |
| 2.7 | 前后端联通：页面按钮 `fetch` 后端 `/hello`，CORS + `NEXT_PUBLIC_API_BASE_URL` 打通 | ✅ 完成 |
| 2.8+ | Dockerfile / docker-compose 编排、生产部署 | ⏳ 未开始（`infra/compose` 仍为空） |

### 已完成的具体内容

- **工作区**：根 `package.json`（三层 `workspaces` + `packageManager: bun@1.4.4`）、`bunfig.toml`（`linker = "isolated"`）、`tsconfig.base.json`、`turbo.json`（`build` / `dev` / `typecheck` 三个任务）、根锁文件 `bun.lock`。
- **共享契约包** `packages/contracts`（`@autix/contracts`）：`APP_NAME` 常量；`exports` / `types` 直接指向 `src/index.ts`（零构建），前端与后端同时消费。
- **前端** `clients/chat-web`（`@autix/chat-web`）：Next.js 16.4.5 / React 19.3.0；`dev` = `wait-on tcp:4001 && next dev --port 3002`；`next.config.ts` 配置 `transpilePackages`、`output: "standalone"`、`outputFileTracingRoot`、`env.NEXT_PUBLIC_API_BASE_URL`。
- **后端** `services/chat`（`@autix/chat`）：NestJS 脚手架；`main.ts` 监听 4001、`enableCors({ origin: 3002 })`；`dev` / `build` 通过 `bun node_modules/.bin/nest ...` 调用 CLI（规避 Node 22 下 `ERR_REQUIRE_CYCLE_MODULE`）。
- **联通验收**：`bun run dev` 后打开 `http://localhost:3002`，页面显示共享 `APP_NAME`，点击按钮请求 `http://localhost:4001/hello` 并显示返回 message。
- **文档**：`docs/第二章项目讲义（截止到2.7）.md`（原理讲义）与 `docs/lecture（截止到2.7）/`（可交互动态网页版）。

### 与教程的差异（详见讲义）

- 教程写作时 `bunx @nestjs/cli` 拉到 11.x；当前安装到 12.0.11（依赖 Angular devkit 22 + ESM `ora`），在 Node 22 启动即报 `ERR_REQUIRE_CYCLE_MODULE`。处理方式：`services/chat` 的 `dev` / `build` 改为用 Bun 执行 Nest CLI，其余保持教程配置。
- `next` / `react` 等依赖版本比教程示例新（16.4.5 / 19.3.0），`next.config` 字段兼容。

## 目录结构

```text
AI_Agent_Dev/
├── clients/                    # 客户端应用层
│   └── chat-web/               # @autix/chat-web：Next.js 16 + React 19（端口 3002）
├── services/                   # 服务进程层
│   └── chat/                   # @autix/chat：NestJS API（端口 4001）
├── packages/                   # 共享子包层
│   └── contracts/              # @autix/contracts：共享常量 / 类型（APP_NAME）
├── docs/                       # 讲义与动态网页（截止 2.7）
├── infra/                      # 基础设施层（不参与 workspace 安装）
│   └── compose/                # 预置目录：Docker Compose（2.8 待做）
├── .gitignore                  # 忽略依赖 / 构建产物 / 环境变量
├── bunfig.toml                 # Bun 配置：isolated 依赖安装策略
├── turbo.json                  # Turborepo 任务与缓存配置
├── tsconfig.base.json          # TypeScript 基线配置与路径别名
├── package.json                # 根配置：workspace 聚合 + 统一脚本
├── bun.lock                    # 根锁文件（唯一）
└── README.md                   # 本文档
```

| 目录 | 职责 | 当前状态 |
| --- | --- | --- |
| `clients/chat-web` | 面向用户的 Web 客户端（Next.js） | ✅ 2.5 / 2.7 已完成 |
| `services/chat` | 独立部署的 API 服务（NestJS） | ✅ 2.6 / 2.7 已完成 |
| `packages/contracts` | 跨层复用的共享契约 | ✅ `APP_NAME` 已就绪 |
| `infra/compose` | Docker Compose 编排 | ⏳ 2.8 待建 |

约定：每个子目录都是一个**独立的 npm 包**（拥有自己的 `package.json` 和唯一的 `name`），由根 `package.json` 的 `workspaces` 统一管理；包之间直接以包名互相引用，Bun 安装时自动建立软链，无需本地发版。

## `bunfig.toml`（Bun 配置）

Bun 的配置文件，用于覆盖 Bun 的默认行为；当前内容只有一段安装策略：

```toml
[install]
linker = "isolated"
```

- `[install]`：作用于 `bun install` 的安装行为。
- `linker = "isolated"`：采用 **isolated 安装策略**（默认是 `hoisted`）。依赖不会全部提升到根 `node_modules`，而是安装到根 `node_modules/.bun` 内部存储；每个 workspace 子包只在自己的 `node_modules/` 里建立指向**其 `package.json` 中已声明的依赖**的软链。
  - 好处：依赖边界严格，未声明的包会直接解析失败，避免「幽灵依赖」；不同子包可各自解析同一依赖的不同版本。
  - 注意：根 `package.json` 自身要用的依赖（如 `turbo`、`wait-on`）必须写在根 `devDependencies` 中，不会从子包「提升」上来。

## 根 package.json 配置说明

根 `package.json` 只负责聚合与统一命令，不包含业务代码。

### 基础字段

| 配置 | 值 | 作用 |
| --- | --- | --- |
| `name` | `"root"` | 根包标识，仅用于 workspace 聚合；因为根包不发布，名字不需要作用域。 |
| `private` | `true` | 私有包标记，防止根包被误执行 `npm publish` 发布。 |
| `packageManager` | `"bun@1.4.4"` | 声明包管理器及版本：约定团队 / CI 统一使用 Bun 1.4.4；Turborepo 依据该字段和锁文件识别包管理器。 |

### `workspaces`：三层成员匹配

```json
"workspaces": [
  "clients/*",
  "services/*",
  "packages/*"
]
```

| 路径模式 | 对应层 | 说明 |
| --- | --- | --- |
| `clients/*` | 客户端应用 | 匹配 `clients/` 下每个子目录，每个子目录应包含自己的 `package.json`。 |
| `services/*` | 服务进程 | 匹配 `services/` 下每个子目录，每个子目录应包含自己的 `package.json`。 |
| `packages/*` | 共享子包 | 匹配 `packages/` 下每个子目录，为跨层复用的公共包。 |

`bun install` 时，根配置会把匹配到的子包统一安装：依赖进入根 `node_modules/.bun` 内部存储，各子包在自己的 `node_modules/` 中软链其已声明的依赖（子包之间也直接按包名软链）；整仓只在根目录生成/维护一份锁文件 `bun.lock`。具体安装策略由 `bunfig.toml` 控制（见上一节）。

### `scripts`：统一命令入口

| 脚本 | 作用 |
| --- | --- |
| `clean:ports` | 释放 `3002`、`4001` 这两个本地开发常用端口：用 `lsof -ti :端口` 找到占用进程并 `kill -9`，避免 dev 启动时端口冲突。依赖 `lsof`，适用于 macOS / Linux。 |
| `dev` | 一键开发：先执行 `clean:ports`，再用 Turbo 并行启动 `@autix/chat` 与 `@autix/chat-web` 两个包的 `dev` 任务。`--parallel` 表示并行执行（忽略任务依赖图，适合 dev 常驻进程）；`--filter` 按包名筛选目标包。 |
| `dev:chat-web` | 只启动 `@autix/chat-web`（Web 端）的 `dev` 任务。 |
| `dev:chat` | 只启动 `@autix/chat`（聊天应用）的 `dev` 任务。 |
| `build` | 用 Turbo 构建所有子包：按 `turbo.json` 中定义的依赖关系（如 `dependsOn: ["^build"]`）执行，并复用增量缓存。 |
| `typecheck` | 用 Turbo 对所有子包执行 TypeScript 类型检查。 |
| `lint` | 用 Turbo 对所有子包执行代码检查 / 格式校验。 |

注意：

- `turbo run <task>` 的任务必须在根目录 `turbo.json` 的 `tasks` 字段中声明（`dev` 已配置 `persistent: true`、`cache: false`）。
- `--filter=@autix/chat` / `--filter=@autix/chat-web` 是按**包名**匹配的，对应子包已创建并声明了各自的 `name`。
- 根 `dev` 中的 `--parallel` 在 Turbo 2.x 已标记为 deprecated（当前仍可用）；后续可改用 `turbo.json` 中 `persistent` 配置表达「常驻进程」，不影响 2.7 的验收。

### `devDependencies`：仅根仓库使用的开发工具

| 依赖 | 版本 | 作用 |
| --- | --- | --- |
| `turbo` | `^2.8.20` | Turborepo：monorepo 任务编排、依赖图调度、并行执行与增量构建缓存。 |
| `wait-on` | `^9.0.5` | 等待端口 / 文件 / URL 就绪的 CLI 工具，常用于多个服务并行启动时协调先后顺序；**当前脚本尚未使用**，属预置依赖。 |

## 常用命令

```bash
bun install            # 安装全部 workspace 依赖，生成/更新根 bun.lock

bun run dev            # 并行启动 @autix/chat 与 @autix/chat-web
bun run dev:chat-web   # 只启动 Web 端
bun run dev:chat       # 只启动聊天应用

bun run build          # 全仓构建（依赖 turbo.json）
bun run typecheck      # 全仓类型检查
bun run lint           # 全仓代码检查
```

## 补充说明

- **为什么 `package.json` 里没有注释**：`package.json` 是标准 JSON 格式。Bun 1.2+ 虽可将 `package.json` 按 JSONC 解析（支持 `//` 注释），但 Turbo 解析根 `package.json` 时使用严格 JSON，遇到注释会直接报 `package.json` 解析失败；npm 等严格 JSON 工具同理。为保证所有工具链兼容，配置说明统一放在本文档。
- **依赖安装原则（约定）**：构建 / 检查类工具放在根 `devDependencies`；业务运行时依赖放在各子包的 `dependencies`，避免根仓库捆绑子包依赖。
- **待补齐项**：`infra/compose` 下的 Docker Compose 编排，以及 2.8 之后的生产部署相关内容；其余基础配置、workspace 子包与根锁文件 `bun.lock` 均已就绪。
- **代码范围**：截至教程 2.7（前后端联通验收完成），2.8 尚未开始。
