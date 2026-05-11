# Empty Directory Initialization

> peaks-sdd 从零创建项目的完整指南

## 1. 核心设计原则

### 1.1 使用官方 CLI 而非手动生成

**拒绝**：手动创建 `package.json`、`vite.config.ts` 等文件
**采用**：使用官方项目创建 CLI 工具

### 1.2 默认技术栈

| 层级 | 默认选项 | 说明 |
|------|---------|------|
| 前端 | Vite + shadcn/ui | 官方推荐的方式 (https://ui.shadcn.com/docs/installation/vite) |
| 后端 | NestJS | TypeScript 全栈首选 |
| 数据库 | PostgreSQL | 关系型数据库首选 |
| 包管理器 | pnpm | 更快的依赖安装 |

## 2. Frontend 创建 CLI 映射表

### 2.1 React 框架

| 工具 | 命令 | 适用场景 |
|------|------|---------|
| **Next.js (推荐)** | `pnpm create next-app@latest {{PROJECT_NAME}} --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-pnpm` | App Router, 正式项目 |
| **Vite** | `pnpm create vite@latest {{PROJECT_NAME}} --template react-ts` | 简单项目, SPA |
| **shadcn/ui** | `npx shadcn@latest init` (在已有 Next.js/Vite 项目内) | 组件库 |
| **Tauri** | `pnpm create tauri-app@latest {{PROJECT_NAME}} --template react-ts --manager pnpm` | 桌面应用 |

### 2.2 Vue 框架

| 工具 | 命令 | 适用场景 |
|------|------|---------|
| **Vue 3 + Vite** | `pnpm create vue@latest {{PROJECT_NAME}} --typescript --router --pinia --vitest --playwright --eslint` | Vue 3 官方 |
| **Nuxt** | `pnpx nuxi@latest init {{PROJECT_NAME}} --packageManager pnpm` | SSR/SSG |

### 2.3 UI 库安装（创建后）

shadcn/ui 可以直接通过 CLI 创建完整的 React + Vite 项目：

```bash
# 方式一：直接创建完整项目（推荐）
npx shadcn@latest init my-app --yes
# 自动创建 Vite + React + Tailwind + shadcn/ui 项目

# 方式二：先创建 Vite 项目，再安装 shadcn
pnpm create vite@latest {{PROJECT_NAME}} --template react-ts
cd {{PROJECT_NAME}}
npx shadcn@latest init
npx shadcn@latest add button card dialog form input label

# 常用组件
npx shadcn@latest add button card dialog form input label table tabs dropdown-menu sonner toast avatar badge calendar checkbox command popover progress scroll-area select separator skeleton switch textarea textarea
```

### 2.4 其他 UI 库

```bash
# Ant Design
pnpm add antd @ant-design/icons
pnpm add @ant-design/cssinjs

# Tailwind CSS (如需单独安装)
pnpm add -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

## 3. Backend 创建 CLI 映射表

### 3.1 Node.js 框架

| 工具 | 命令 | 适用场景 |
|------|------|---------|
| **NestJS (推荐)** | `pnpm i -g @nestjs/cli && nest new {{PROJECT_NAME}} --package-manager pnpm --skip-git` | 企业级 API |
| **Express/Fastify** | `pnpm create express-app {{PROJECT_NAME}} --ts` | 轻量 API |
| **Next.js API Routes** | (Next.js 内置) | 全栈项目 |

### 3.2 其他语言

| 语言 | 命令 | 说明 |
|------|------|------|
| **Java (Spring Boot)** | `spring init --build maven {{PROJECT_NAME}}` | 企业级 |
| **Python (FastAPI)** | `pip install fastapi uvicorn` | Python API |
| **Go (Gin)** | `go mod init {{PROJECT_NAME}}` | Go 服务 |

## 4. 数据库初始化

### 4.1 PostgreSQL (默认)

```bash
# Docker 启动 PostgreSQL
docker run --name {{PROJECT_NAME}}-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB={{PROJECT_NAME}} \
  -p 5432:5432 \
  -d postgres:16-alpine

# Prisma 初始化
pnpm add -D prisma
pnpm exec prisma init
pnpm exec prisma db push
```

### 4.2 其他数据库（按需）

| 数据库 | 安装命令 | ORM |
|--------|---------|------|
| PostgreSQL | Docker 或云服务 | Prisma / TypeORM / Drizzle |
| MySQL | Docker 或云服务 | Prisma / TypeORM |
| SQLite | 内置 | Prisma / Drizzle |
| MongoDB | Docker 或云服务 | Mongoose |

## 5. 空目录初始化流程（4 步）

### 5.1 流程概览

```
Step 1: AskUserQuestion 确认项目名称
   └─ 用户确认项目名（如 "AI Chat"）

Step 2: 调用 product agent 进行脑暴
   └─ 输出：.peaks/prds/brainstorm-[日期].md
   └─ 交互式问答，澄清需求细节

Step 3: AskUserQuestion 确认技术栈
   └─ 前端: React + Vite + shadcn/ui (推荐) / Next.js / Vue 3 / Tauri
   └─ 后端: NestJS (推荐) / Express / Spring Boot / FastAPI / Gin
   └─ 数据库: PostgreSQL (推荐) / MySQL / MongoDB / SQLite

Step 4: CLI 创建项目 + 初始化
   ├─ npx shadcn@latest init {{PROJECT_NAME}} --yes
   ├─ mkdir -p .peaks/{prds,plans,swagger,designs,test-docs,reports,auto-tests,checkpoints,bugs}
   ├─ mkdir -p .claude/agents
   ├─ 扫描技术栈并生成 Agent 配置
   ├─ 配置 .claude/settings.json
   └─ 创建 .claude/session-state.json
```

### 5.2 Step 1: 确认项目名称

使用 AskUserQuestion 询问项目名称：

```
请确认项目名称：

默认：AI Chat
💡 可以选择 "Other" 手动输入项目名称
```

### 5.3 Step 2: 调用 product agent 脑暴

交互式问答示例：

```
🟦 [product] 产品需求分析

我理解你想创建一个 AI 对话助手。为了更好地理解需求，我有几个问题：

1. 这个 AI 对话助手是做什么的？
   - 客服机器人
   - AI 助手/ChatGPT 类应用
   - 角色扮演/游戏

2. 需要用户登录吗？
   - 需要注册/登录
   - 匿名可用
   - 可选登录

3. 对话历史需要持久化吗？
   - 需要保存到数据库
   - 只保存在本地
   - 不需要历史记录

💡 请选择或描述你的想法
```

产出：`.peaks/prds/brainstorm-[日期].md`

### 5.4 Step 3: 确认技术栈

```
请确认技术栈：

前端框架:
- A: React + Vite + shadcn/ui (推荐)
- B: Next.js + shadcn/ui
- C: Vue 3 + Element Plus
- D: Tauri (桌面应用)

后端框架:
- A: NestJS (推荐)
- B: Express
- C: Spring Boot (Java)
- D: FastAPI (Python)
- E: Gin (Go)

数据库:
- A: PostgreSQL (推荐)
- B: MySQL
- C: MongoDB
- D: SQLite

💡 可以选择 "Other" 手动指定
```

### 5.5 Step 4: CLI 创建 + 初始化

根据技术栈选择执行对应 CLI 命令。

### 5.6 单包项目初始化流程

```
1. 创建项目目录
   └─ mkdir my-app && cd my-app

2. 使用 CLI 创建项目（选择一种）
   ├─ shadcn CLI（推荐）: npx shadcn@latest init --yes
   ├─ Vite: pnpm create vite@latest . --template react-ts
   └─ Next.js: pnpm create next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-pnpm --yes

3. 安装 shadcn/ui 组件（如使用 shadcn）
   └─ npx shadcn@latest add button card dialog form input label

4. 安装依赖
   └─ pnpm install

5. 初始化数据库（如需要 PostgreSQL）
   ├─ Docker 启动: docker run --name my-app-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=my-app -p 5432:5432 -d postgres:16-alpine
   └─ Prisma 初始化: pnpm add prisma @prisma/client && pnpm exec prisma init

6. 创建 .peaks/ 目录结构
   └─ mkdir -p .peaks/{prds,plans,swagger,designs,test-docs,reports,auto-tests,checkpoints,bugs}

7. 扫描技术栈并生成 .claude/agents/
   ├─ 检测 package.json 确定项目类型（前端/后端/全栈）
   ├─ 从 templates/agents/ 复制对应模板
   └─ 替换变量：{{PROJECT_NAME}}, {{PROJECT_PATH}}, {{TECH_STACK}} 等

8. 配置 .claude/settings.json（MCP 服务器）
   └─ 写入 gitnexus, claude-mem, fs, playwright, context7 等 MCP

9. 创建 .claude/session-state.json
   └─ 初始化 contextEstimate=0, projectType, techStack 等

10. 验证
    ├─ pnpm dev 可启动
    ├─ .peaks/ 目录结构正确
    └─ .claude/agents/ 已生成
```

### 5.7 Monorepo 项目初始化流程

```
1. 创建项目目录
   └─ mkdir my-app && cd my-app

2. 初始化 pnpm workspace
   └─ echo '{"packages": ["packages/*"]}' > pnpm-workspace.yaml

3. 创建 packages/ 子包

   前端（React + Vite + shadcn/ui）:
   ├─ npx shadcn@latest init packages/web --yes
   └─ 或: pnpm create vite@latest packages/web --template react-ts

   后端（NestJS）:
   ├─ pnpm i -g @nestjs/cli
   └─ nest new packages/server --package-manager pnpm --skip-git

   共享包（可选）:
   └─ mkdir packages/shared && echo '{"name": "@my-app/shared", "version": "0.0.1"}' > packages/shared/package.json

4. 安装根目录依赖
   └─ pnpm install

5. 数据库初始化（如需要）
   └─ 同 5.2 步骤 5

6. 创建 .peaks/ 目录结构（根目录）
   └─ mkdir -p .peaks/{prds,plans,swagger,designs,test-docs,reports,auto-tests,checkpoints,bugs}

7. 为每个包扫描技术栈并生成 .claude/agents/
   ├─ packages/web/: frontend, design, qa, product, peaksfeat, security-reviewer, code-reviewer-frontend
   ├─ packages/server/: backend, qa, product, peaksfeat, security-reviewer, code-reviewer-backend, postgres
   └─ packages/shared/: （通常不需要独立 Agent）

8. 配置 .claude/settings.json（根目录）
   └─ 写入全局 MCP 配置

9. 创建 .claude/session-state.json
   └─ projectType: "multi-package"

10. 验证
    ├─ pnpm -r dev 或分别在各包目录运行 pnpm dev
    ├─ .peaks/ 目录结构正确
    └─ 每个包的 .claude/agents/ 已生成
```

## 6. CLI 命令速查表

### 前端（推荐：直接用 shadcn CLI 创建完整项目）

```bash
# ★★★★★ 推荐：shadcn CLI 直接创建完整项目（Vite + React + Tailwind + shadcn/ui）
npx shadcn@latest init my-app --yes

# 常用组件一键安装
npx shadcn@latest add button card dialog form input label table tabs dropdown-menu sonner toast avatar badge calendar checkbox command popover progress scroll-area select separator skeleton switch textarea

# 传统方式：手动创建 Vite 项目
pnpm create vite@latest my-app --template react-ts
npx shadcn@latest init

# Next.js
pnpm create next-app@latest my-app --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-pnpm --yes

# Vue 3
pnpm create vue@latest my-app --typescript --router --pinia

# Tauri (桌面应用)
pnpm create tauri-app@latest my-app --template react-ts --manager pnpm
```

### 后端

```bash
# NestJS
pnpm i -g @nestjs/cli
nest new server --package-manager pnpm --skip-git

# Fastify
pnpm create express-app my-server --ts
```

### Monorepo

```bash
# pnpm workspace
echo '{"packages": ["packages/*"]}' > pnpm-workspace.yaml

# Turborepo (可选)
pnpm add -Dw turbo
```

## 7. 交互式创建流程

### 7.1 AskUserQuestion 选项设计

使用 AskUserQuestion 工具让用户选择，避免手动输入：

```
请确认项目配置：

前端框架:
- A: React + Vite + shadcn/ui (推荐) ← https://ui.shadcn.com/docs/installation/vite
- B: Next.js + shadcn/ui
- C: Vue 3 + Element Plus
- D: Tauri (桌面应用)

后端框架:
- A: NestJS (推荐)
- B: Express
- C: Spring Boot (Java)
- D: FastAPI (Python)
- E: Gin (Go)

数据库:
- A: PostgreSQL (推荐)
- B: MySQL
- C: MongoDB
- D: SQLite

💡 可以选择 "Other" 手动指定
```

### 7.2 默认选择逻辑

```
用户描述 → 分析关键词:
- "做个博客" / "文章系统" → 单包
- "企业内部系统" / "管理系统" → 单包
- "saas" / "多租户" → monorepo
- "我要做个淘宝" → monorepo

用户明确指定 → 使用指定:
- "用 monorepo" → monorepo
- "前后端分离" → 单包 + 分别创建
- "Next.js + NestJS" → 指定技术栈
```

## 8. 产物清单

### 单包项目

```
{{PROJECT_NAME}}/
├── src/
│   ├── app/           (Next.js)
│   ├── components/
│   ├── lib/
│   └── ...
├── prisma/
│   └── schema.prisma  (如使用数据库)
├── .claude/
│   ├── agents/
│   └── settings.json
├── .peaks/
│   ├── prds/
│   ├── plans/
│   └── reports/
├── package.json
└── ...配置文件
```

### Monorepo 项目

```
{{PROJECT_NAME}}/
├── packages/
│   ├── web/           (前端 Next.js/Vite)
│   ├── server/        (后端 NestJS)
│   └── shared/        (共享类型)
├── pnpm-workspace.yaml
├── .claude/
│   ├── agents/
│   └── settings.json
├── .peaks/
├── package.json (workspace root)
└── ...配置文件
```

## 9. 验证清单

初始化完成后，验证以下内容：

- [ ] `pnpm dev` 可正常启动前端
- [ ] `pnpm start:dev` 可正常启动后端（如有）
- [ ] 数据库连接正常
- [ ] `.claude/agents/` 包含正确的 Agent 配置
- [ ] `.peaks/` 目录结构正确
- [ ] 可以运行 `/peaks-sdd 添加xxx功能`

## 10. 错误处理

| 错误 | 解决方案 |
|------|---------|
| CLI 创建失败 | 检查 Node.js/pnpm 版本，查看 CLI 文档 |
| 依赖安装失败 | 删除 node_modules 和 lockfile，重试 |
| 数据库连接失败 | 检查 Docker 是否运行，端口是否冲突 |
| shadcn/ui 安装失败 | 确保在 Next.js/Vite 项目内，Node >= 18 |