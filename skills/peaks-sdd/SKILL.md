---
name: peaks-sdd
description: |
  Spec-Driven Development workflow for TypeScript projects. Use when user mentions 初始化项目, setup project, constitution, PRD, bug, 报错, 修复, or needs to develop features or fix bugs.
  Triggers: /peaksinit, /peaksfeat, /peaksbug slash commands; or keywords: 初始化, 新项目, 功能开发, bug修复, 需求分析

user-invocable: true
model: sonnet
tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - Agent
skills:
  - improve-codebase-architecture
  - systematic-debugging
  - test-driven-development
  - find-skills
maxTurns: 100
memory: project
hooks:
  - require-code-review
---

# Peaks SDD (Spec-Driven Development)

## 自动决策 (Auto-Detection)

当用户运行 `/peaks-sdd` 时:

| 检测关键词 | 工作流 |
|-----------|--------|
| 初始化项目、setup project、init | **首次使用** - 扫描技术栈,生成 `.claude/agents/` 配置 |
| bug、报错、修复、登录按钮没反应、接口返回 500、没反应 | **Bug 修复** - 使用生成的 Agent 执行 8 阶段调试 |
| 添加功能、需求、PRD、技术计划、实现计划 | **功能开发** - 使用生成的 Agent 执行 Constitution → PRD → Design → Develop → QA |

**首次使用自动初始化,之后直接使用生成的 agents!**

生成的 agents 示例:
```
.claude/agents/
├── frontend.md       # 前端专家(根据 React/Vue 检测结果生成)
├── backend.md        # 后端专家(根据 Node/ NestJS 检测结果生成)
├── product.md        # 产品需求
├── qa.md             # 测试专家
└── ...
```

## 使用方式

```
/peaks-sdd 初始化我的项目
/peaks-sdd 登录按钮点击没反应
/peaks-sdd 添加用户注册功能
```

A Spec-Driven Development workflow for **任意 TypeScript 项目**. 自动检测项目技术栈并动态生成对应的 Agent 配置。

## 核心架构

A Spec-Driven Development workflow for **任意 TypeScript 项目**。自动检测项目技术栈并动态生成对应的 Agent 配置。

## 核心架构

### 文件层次关系

```
SKILL.md (本文件：自动决策 + 工作流入口)
    ↓ 自动检测输入类型
templates/agents/*.md (完整工作流定义)
    ↓ 产出物
.peaks/ (PRD, Plan, Swagger, 测试, 报告等)
```

### 初始化流程

```
peaks-sdd skill (模板定义)
    ↓ 初始化时
扫描项目 (Bash/Read 或 @bunas/fs-mcp)
    ↓
自动检测技术栈：React / NextJS / NestJS / Tauri / Node.js 等
    ↓
动态生成 .claude/agents/ (基于检测到的技术栈)
    ↓
生成 .claude/hookify.*.local.md
    ↓
生成 .claude/session-state.json
```

## Memory 管理

### 记忆文件位置

| 文件 | 作用域 | 用途 | 是否入 Git |
|------|--------|------|-----------|
| `CLAUDE.md` | 项目级 | 项目说明、上下文、规则 | ✅ 必入 |
| `CLAUDE.local.md` | 个人偏好 | 本地偏好设置 | ❌ 需 .gitignore |
| `.claude/rules/*.md` | 规则文件 | 懒加载规则（按路径触发） | ✅ 必入 |
| `.peaks/` | 工作目录 | PRD、Plan、报告等产出物 | ✅ 必入 |
| `~/.claude/CLAUDE.md` | 全局 | 所有项目的通用规则 | N/A |
| `~/.claude/projects/<project>/memory/` | 项目记忆 | claude-mem 持久化 | ❌ |

### 懒加载规则（Paths Frontmatter）

使用 `paths` YAML frontmatter 实现按文件路径懒加载规则：

```yaml
---
name: react-patterns
description: React 开发规范
paths:
  - "**/*.tsx"
  - "**/*.jsx"
---

# React Patterns

当检测到 .tsx/.jsx 文件时加载此规则...
```

### 保持 CLAUDE.md 精简

> **原则**：CLAUDE.md 应 < 200 行。超过时归档到 `.peaks/`。

| 文件 | 行数限制 | 超过时 |
|------|---------|--------|
| `CLAUDE.md` | < 200 行 | 归档到 `.peaks/context/` |
| `.claude/rules/*.md` | 无限制 | 懒加载，不占主上下文 |

### Agent Memory 作用域

| 作用域 | 用途 | 生命周期 |
|--------|------|---------|
| `memory: project` | 项目上下文（技术栈、架构） | 跨 Agent 调用保持 |
| `memory: user` | 用户偏好、工作方式 | 跨项目保持 |
| `memory: local` | 单次任务临时数据 | 仅当前 Agent |

### peaks-sdd Memory 策略

1. **项目初始化后**：CLAUDE.md 包含技术栈、目录结构、开发命令
2. **Phase 1-6 产出**：归档到 `.peaks/prds/`、`.peaks/plans/` 等
3. **跨会话记忆**：claude-mem MCP 自动持久化关键上下文
4. **定期 Compact**：`/compact` 触发时自动清理冗余上下文

### Context 估算与 Compact

| Context 占用 | 动作 |
|-------------|------|
| < 50% | 正常继续 |
| 50-70% | 关注，产出中间文件减轻 context 压力 |
| >= 70% | **强制**：产出当前阶段文件 → 执行 `/compact` → 继续 |
| >= 85% | **阻断**：停止当前工作 → `/compact` → 用户确认后继续 |

**自动管理机制**（通过 hook 实现）：
- PreToolUse hook 在每次工具调用前检查 contextEstimate
- >= 70%：输出警告但允许继续（用户可选择先 compact）
- >= 85%：阻断工具调用，强制先 compact

**与 /loop 配合**：
- 长任务使用 `/loop` 动态唤醒，每次唤醒检查 context 状态
- 每个 loop 迭代优先产出文件（.peaks/ 目录），而非依赖 context 传递
- context 过高时 loop 自动触发 compact 流程

### /loop 集成策略

peaks-sdd 利用 Claude Code 的 `/loop`（ScheduleWakeup）实现长任务自治：

**适用场景**：

| 场景 | loop 用法 | 收益 |
|------|----------|------|
| peaksfeat Step 9（多模块开发） | 每个模块一次 loop 迭代 | 独立 context，避免溢出 |
| peaksbug Phase 3（diagnose 探测） | 自动重试假设验证循环 | 无需人工等待 |
| 长任务中断恢复 | loop 从 .peaks/ 产出文件恢复 | 跨 session 持续 |

**loop 执行原则**：
1. **产出优先**：每次 loop 迭代必须将中间结果写入 `.peaks/` 文件
2. **上下文最小化**：loop prompt 只包含当前任务描述 + .peaks/ 中的必要文件路径
3. **context 守门**：loop 唤醒时第一件事检查 contextEstimate，>= 70% 先 compact
4. **渐进精化**：复杂任务拆分为多个 loop，每个 loop 完成一个可验证的子目标

---

## 开发原则（Karpathy Guidelines）

源自 [Andrej Karpathy 的 LLM 编码陷阱观察](https://x.com/karpathy/status/2015883857489522876)，用于减少常见的 LLM 编码错误。

**权衡**：这些原则偏向谨慎而非速度。对于简单任务，请自行判断。

### 1. 编码前先思考

**不要假设。不要隐藏困惑。公开权衡。**

实现前：

- 明确陈述你的假设。如果不确定，先问。
- 如果存在多种解释，全部呈现——不要默默选择其一。
- 如果存在更简单的方法，指出它。在合理时反驳。
- 如果有不清楚的地方，停下来。说出什么让你困惑。先问。

### 2. 简单优先

**用最少的代码解决问题。不要投机。**

- 不要添加需求之外的功能。
- 不要为一次性代码创建抽象。
- 不要添加未被请求的"灵活性"或"可配置性"。
- 不要为不可能的场景添加错误处理。
- 如果你写了 200 行而可以用 50 行完成，重写它。

问自己："高级工程师会说这太复杂了吗？"如果是，简化。

### 3. 精准修改

**只触碰必须改动的。清理自己造成的混乱。**

编辑现有代码时：

- 不要"改进"相邻的代码、注释或格式。
- 不要重构没坏的部分。
- 匹配现有风格，即使你会有不同做法。
- 如果注意到无关的死代码，提出它——不要删除它。

当你的修改造成孤立代码时：

- 删除因你的修改而不再使用的 import/变量/函数。
- 不要删除预先存在的死代码，除非被要求。

检验标准：每一行修改都应该能直接追溯到用户的请求。

### 4. 目标驱动执行

**定义成功标准。循环验证直到完成。**

将任务转化为可验证的目标：

- "添加验证" → "为无效输入编写测试，然后让它们通过"
- "修复 bug" → "编写能复现问题的测试，然后让测试通过"
- "重构 X" → "确保重构前后测试都通过"

对于多步骤任务，简要说明计划：

```
1. [步骤] → 验证: [检查]
2. [步骤] → 验证: [检查]
3. [步骤] → 验证: [检查]
```

强有力的成功标准让你能独立循环。弱标准（"让它工作"）需要不断确认。

---

## Phase 0: 项目初始化（动态生成 Agent 配置）

当用户说"初始化项目"、"setup project"、"dynamically generate agents"时，执行：

### Step 0.1: 扫描项目

优先使用 `mcp__bunas__fs_mcp__` 工具：

- `read_directory`: 读取项目根目录结构
- `read_file`: 读取 package.json, CLAUDE.md, CONFIG.md 等

如 MCP 不可用，降级为 Bash (`ls`, `find`) + Read 工具手动扫描。

**示例调用**：
```
mcp__bunas__fs_mcp__read_directory(path: "/path/to/project")
mcp__bunas__fs_mcp__read_file(path: "/path/to/project/package.json")
```

### Step 0.2: 自动检测技术栈

根据 package.json 和目录结构，检测：

| 检测项   | 文件/目录                                 | 说明        |
| -------- | ----------------------------------------- | ----------- |
| 前端框架 | package.json 的 dependencies.react        | React 项目  |
| 后端框架 | package.json 的 dependencies.@nestjs/\*   | NestJS 后端 |
| 桌面应用 | packages/\*/src-tauri/ 或 tauri.conf.json | Tauri 项目  |
| 全栈框架 | package.json 的 dependencies.next         | Next.js     |
| 数据库   | typeorm / prisma / drizzle                | 数据库 ORM  |
| 测试框架 | @playwright/test / vitest / jest          | 测试框架    |
| UI 库    | antd / @mui/material / @chakra-ui/react / radix-ui | UI 组件库 |

### Step 0.3: 替换模板变量

根据检测结果，替换模板中的变量：

| 变量                     | 说明         | 示例                         |
| ------------------------ | ------------ | ---------------------------- |
| `{{PROJECT_NAME}}`       | 项目目录名   | my-project                   |
| `{{PROJECT_PATH}}`       | 项目根目录   | /path/to/project             |
| `{{PACKAGES}}`           | 检测到的子包 | frontend, api, client        |
| `{{TECH_STACK}}`         | 技术栈描述   | React 18 + TypeScript + Vite |
| `{{FRONTEND_FRAMEWORK}}` | 前端框架     | react / vue / next           |
| `{{BACKEND_FRAMEWORK}}`  | 后端框架     | nestjs / express / fastify   |
| `{{UI_LIBRARY}}`          | UI 组件库    | antd / mui / chakra / radix  |
| `{{HAS_TAURI}}`          | 是否有 Tauri | true / false                 |
| `{{HAS_DATABASE}}`       | 是否有数据库 | postgresql / mysql / none    |
| `{{TEST_FRAMEWORK}}`     | 测试框架     | playwright / vitest / jest   |
| `{{DEV_PORT}}`           | 开发端口     | 3000 / 5173 / 1420           |

### Step 0.4: 动态选择 Agent 模板

根据检测到的技术栈，选择对应的 Agent：

| 条件                    | 生成 Agent                                                                                       | 说明       |
| ----------------------- | ------------------------------------------------------------------------------------------------ | ---------- |
| 检测到 React/Vue        | frontend                                                                                         | 前端专家   |
| 检测到 NestJS           | backend                                                                                          | 后端专家   |
| 检测到 Tauri            | tauri                                                                                            | Tauri 专家 |
| 检测到 PostgreSQL/MySQL | postgres                                                                                         | 数据库专家 |
| 始终生成                | peaksfeat, product, qa, devops, security-reviewer, code-reviewer-frontend, code-reviewer-backend | 基础 Agent |

### Step 0.5: 生成配置文件

#### Agent 配置（从模板生成）

根据检测到的技术栈，从 `templates/agents/` 目录选择对应模板，替换变量后写入 `.claude/agents/`：

| 来源                    | 目标                                          |
| ----------------------- | --------------------------------------------- |
| `templates/agents/*.md` | `.claude/agents/*.md`（增量添加，不覆盖已有） |

#### CLAUDE.md / CONFIG.md（动态识别生成）

**不复制模板**，而是基于项目扫描结果动态生成：

1. **读取已有文件**：使用 @bunas/fs-mcp 读取现有的 CLAUDE.md 和 CONFIG.md
2. **提取项目信息**：从已有文件中提取技术栈、配置值、目录结构
3. **生成/补充**：基于检测结果生成或补充内容

| 文件      | 生成逻辑                                             |
| --------- | ---------------------------------------------------- |
| CLAUDE.md | 汇总检测到的技术栈、目录结构、开发命令，补充缺失部分 |
| CONFIG.md | 汇总数据库配置、服务端口、启动命令等，补充缺失部分   |

**增量原则**：两个文件都只补充不覆盖，已有内容完全保留。

#### 其他文件

| 文件                                       | 处理方式                                     |
| ------------------------------------------ | -------------------------------------------- |
| `.claude/hookify.context-monitor.local.md` | 如不存在则生成（已存在则跳过）               |
| `.claude/session-state.json`               | 如不存在则生成（已存在则跳过）               |
| `.peaks/` 目录                             | 创建标准子目录（plans/, prds/, reports/ 等），已存在则跳过 |
| `.gitnexus/` 目录                          | gitnexus 数据目录（项目根目录），已存在则跳过 |
| `.claude-mem/` 目录                        | claude-mem 数据目录（项目根目录），已存在则跳过 |
| `.context7/` 目录                           | context7 缓存目录（项目根目录），已存在则跳过 |

### Step 0.6: 验证初始化结果

生成完成后，验证：

- `.claude/agents/` 目录下已有对应技术的 Agent 配置
- `CLAUDE.md` 包含正确的技术栈描述
- `CONFIG.md` 包含正确的服务配置（可选，如项目需要）

**验证命令**：
```bash
# 检查 Agent 配置是否生成
ls -la .claude/agents/

# 检查 CLAUDE.md 是否包含技术栈
grep -E "(React|NestJS|Tauri)" CLAUDE.md

# 检查 .peaks 目录结构
find .peaks -type d
```

**成功输出示例**：
```
.claude/agents/
├── frontend.md
├── backend.md
├── product.md
├── qa.md
└── ...

.peaks/
├── plans/
├── prds/
├── reports/
└── ...
```

### Step 0.7: 集成 MCP 服务器（增量更新 settings.json）

读取现有 `settings.json`，**增量添加**以下 MCP 到 `mcpServers` 字段。

**注意**：部分 MCP 需要使用项目根目录存储数据，使用 `{{PROJECT_PATH}}` 变量自动替换为实际项目路径：

| MCP             | 用途                         | 配置                                      | 数据目录            |
| --------------- | ---------------------------- | --------------------------------------- | ----------------- |
| gitnexus        | 代码库知识图谱索引           | `npx -y gitnexus@latest mcp --repo {{PROJECT_PATH}}` | `.gitnexus/`      |
| claude-mem      | 跨 session 持久化记忆        | `npx -y @the.dot/mem`                  | `.claude-mem/`    |
| fs              | 文件系统扫描（项目初始化用） | `@bunas/fs-mcp`                        | -                 |
| playwright      | E2E 测试                     | `@playwright/mcp`                      | -                 |
| chrome-devtools | Chrome 调试                  | `chrome-devtools-mcp`                  | -                 |
| context7        | 文档检索（RAG）              | `@upstash/context7-mcp@latest`         | `.context7/`      |
| fetch           | HTTP 请求                    | `mcp-fetch-server`                     | -                 |
| websearch       | 网页搜索                     | `websearch-mcp`                        | -                 |
| docker          | Docker 容器管理              | `@alisaitteke/docker-mcp`              | -                 |
| shadcn          | UI 组件生成                  | `shadcn@latest mcp`                    | -                 |

```json
{
  "mcpServers": {
    "gitnexus": {
      "command": "npx",
      "args": ["-y", "gitnexus@latest", "mcp", "--repo", "{{PROJECT_PATH}}"]
    },
    "claude-mem": {
      "command": "npx",
      "args": ["-y", "@the.dot/mem"]
    },
    "fs": {
      "command": "npx",
      "args": ["-y", "@bunas/fs-mcp"]
    },
    "playwright": {
      "command": "npx",
      "args": ["-y", "@playwright/mcp", "start"]
    },
    "chrome-devtools": {
      "command": "chrome-devtools-mcp"
    },
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp@latest"]
    },
    "fetch": {
      "command": "npx",
      "args": ["mcp-fetch-server"]
    },
    "websearch": {
      "command": "npx",
      "args": ["websearch-mcp"]
    },
    "docker": {
      "command": "npx",
      "args": ["@alisaitteke/docker-mcp"]
    },
    "shadcn": {
      "command": "npx",
      "args": ["shadcn@latest", "mcp"]
    }
  }
}
```

**逻辑**：

1. 读取现有 `settings.json`
2. 如果不存在 `mcpServers` 字段，创建它
3. 对于每个 MCP：已存在则跳过，不存在则添加
4. **自动替换 `{{PROJECT_PATH}}`** 为实际项目根目录路径
4. **不覆盖任何已有的 MCP 配置**

### Step 0.8: 安装 Skills（使用 skills CLI + symlink）

使用 `npx skills add` 命令安装 skills，通过 symlink 方式链接，方便自动更新。

#### Superpowers Skills（17个）

```bash
npx skills add https://github.com/obra/superpowers --skill brainstorming
npx skills add https://github.com/obra/superpowers --skill dispatching-parallel-agents
npx skills add https://github.com/obra/superpowers --skill executing-plans
npx skills add https://github.com/obra/superpowers --skill finishing-a-development-branch
npx skills add https://github.com/obra/superpowers --skill receiving-code-review
npx skills add https://github.com/obra/superpowers --skill requesting-code-review
npx skills add https://github.com/obra/superpowers --skill subagent-driven-development
npx skills add https://github.com/obra/superpowers --skill systematic-debugging
npx skills add https://github.com/obra/superpowers --skill test-driven-development
npx skills add https://github.com/obra/superpowers --skill using-git-worktrees
npx skills add https://github.com/obra/superpowers --skill using-superpowers
npx skills add https://github.com/obra/superpowers --skill verification-before-completion
npx skills add https://github.com/obra/superpowers --skill writing-plans
npx skills add https://github.com/obra/superpowers --skill writing-skills
# npx skills add removed: build-error-resolver not available
# npx skills add removed: silent-failure-hunter not available
# npx skills add removed: performance-optimizer not available
```

#### 其他常用 Skills

```bash
npx skills add https://github.com/vercel-labs/skills --skill find-skills
npx skills add https://github.com/vercel-labs/skills --skill brainstorming
npx skills add https://github.com/vercel-labs/skills --skill frontend-design
npx skills add https://github.com/vercel-labs/skills --skill component-scaffold-generator
npx skills add https://github.com/vercel-labs/skills --skill design-md
```

#### Browser Skills

```bash
npx skills add https://github.com/browserbase/skills --skill browser
```

#### Design Skills

```bash
npx skills add https://github.com/anthropics/skills --skill frontend-design
npx skills add https://github.com/leonxlnx/taste-skill --skill design-taste-frontend
```

#### Frontend Framework Skills

```bash
npx skills add https://github.com/vercel-labs/agent-skills --skill vercel-react-best-practices
npx skills add https://github.com/vercel-labs/agent-skills --skill vercel-react-native-skills
npx skills add https://github.com/vercel-labs/agent-skills --skill vercel-react-view-transitions
npx skills add https://github.com/google-labs-code/stitch-skills --skill react:components
npx skills add https://github.com/hyf0/vue-skills --skill vue-best-practices
npx skills add https://github.com/antfu/skills --skill vue
npx skills add https://github.com/hyf0/vue-skills --skill vue-debug-guides
```

#### Agent 用到的 Skills（检查是否已存在）

检查以下 skills 是否已安装，未安装则添加：

| Skill | 用途 |
|-------|------|
| improve-codebase-architecture | 代码库架构分析与改进（所有 agent 模板引用） |
| karpathy-guidelines | Karpathy 开发原则 |
| hookify | Hook 配置管理 |
| skill-creator | Skill 创建工具 |
| shadcn | UI 组件 |
| postgres | PostgreSQL |
| tauri-v2 | Tauri 桌面应用 |
| browser | Browserbase 浏览器自动化（frontend/peaksbug 依赖） |
| design-taste-frontend | 设计品味评估（design agent 必须优先调用） |
| frontend-design | 前端设计方法论（design agent 组合使用） |
| systematic-debugging | 系统化调试（peaksbug 依赖） |
| test-driven-development | 测试驱动开发（peaksbug 依赖） |

#### 架构改进 Skill

```bash
npx skills add https://github.com/mattpocock/skills --skill improve-codebase-architecture
```


**逻辑**：

1. 运行 `npx skills add <url> --skill <name>` 安装每个 skill
2. Skills 使用 symlink 方式链接到 `~/.agents/skills/`
3. 原始仓库更新后，可通过 `npx skills update` 自动同步

#### OpenSpec CLI（用于存量项目迭代）

OpenSpec 是 spec-driven development 工具，适合存量项目的功能迭代：

```bash
npm install -g @fission-ai/openspec@latest
```

**使用场景对比**：

| 维度 | Spec-It (peaks-sdd) | OpenSpec |
|------|---------------------|----------|
| 项目阶段 | 0→1 新项目，复杂项目 | 1→n 存量项目，功能迭代 |
| 工作流 | 阶段门禁：PRD → 设计 → 开发 | 流体迭代：propose → apply → archive |
| 变更方式 | 完整规格说明 | Delta 变更（对现有系统的修改） |
| 工具 | AI Agent 调度 | Slash commands (`/opsx:*`) |

**决策逻辑**：

```
收到任务
    ↓
检查项目状态
    ↓
┌─ 是新项目（无代码或几乎无代码）？ ─────────────────┐
│                                                    │
│  ✅ 是 → 使用 Spec-It (peaksfeat)                  │
│         Constitution → PRD → 设计 → 开发 → 测试     │
│                                                    │
│  ❌ 否 → 检查是否复杂项目                           │
│         ↓                                          │
│  ┌─ 是复杂项目（多模块/多团队）？ ──────────────┐   │
│  │                                              │   │
│  │  ✅ 是 → 使用 Spec-It (peaksfeat)            │   │
│  │          完整的工作流确保各方对齐              │   │
│  │                                              │   │
│  │  ❌ 否 → 检查是功能迭代还是 bug 修复          │   │
│  └──────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────┘
    ↓
┌─ 功能迭代（存量项目）？ ─────────────────────────────┐
│                                                    │
│  ✅ 是 → 使用 OpenSpec                             │
│         openspec init                              │
│         /opsx:propose <idea>                       │
│         /opsx:apply → /opsx:archive                │
│                                                    │
│  ❌ 否 → 检查是否是 bug 修复                        │
└────────────────────────────────────────────────────┘
    ↓
┌─ Bug 修复？ ───────────────────────────────────────┐
│                                                    │
│  ✅ 是 → 使用 peaksbug                              │
│         systematic-debugging → 修复 → 回归测试     │
└────────────────────────────────────────────────────┘
```

**Spec-It vs OpenSpec 边界对照表**：

| 维度 | Spec-It (peaksfeat) | OpenSpec |
|------|---------------------|----------|
| **项目阶段** | 0→1 新项目，复杂项目 | 1→n 存量项目，功能迭代 |
| **工作流** | 阶段门禁：PRD → 设计 → 开发 → 测试 | 流体迭代：propose → apply → archive |
| **变更方式** | 完整规格说明（What & Why） | Delta 变更（对现有系统的修改） |
| **适用场景** | 新功能、系统重构、多团队协作 | 单个小功能、快速迭代 |
| **工具** | AI Agent 调度 | Slash commands (`/opsx:*`) |
| **输出** | .peaks/ 目录 | openspec/ 目录 |
| ** tranch** | 大型功能（>1周）| 小型功能（<1天～1周）|

**边界场景判断**：

```
场景 1: 存量项目中添加全新模块（如：从零开始添加支付系统）
→ Spec-It，因为涉及跨多个现有系统的变更

场景 2: 存量项目中修改登录流程的样式
→ OpenSpec，因为只是界面层面的迭代

场景 3: 存量项目中添加新的 API 端点
→ OpenSpec，因为只是增量变更

场景 4: 重构整个认证系统
→ Spec-It，因为影响多个子系统

场景 5: Bug 修复
→ peaksbug，与 Spec-It/OpenSpec 独立
```

**OpenSpec 常用命令**：

| 命令 | 说明 |
|------|------|
| `openspec init` | 初始化 OpenSpec |
| `/opsx:propose <idea>` | 创建变更提案 |
| `/opsx:explore` | 探索代码库 |
| `/opsx:apply` | 实施任务 |
| `/opsx:archive` | 归档并合并到 specs |
| `/opsx:new` | 创建新变更（完整工作流） |
| `/opsx:verify` | 验证实施 |

**OpenSpec 目录结构**：

```
openspec/
├── specs/              # 系统当前行为（真理来源）
│   └── **/*.md
├── changes/           # 变更提案
│   ├── [change-name]/
│   │   ├── proposal.md
│   │   ├── specs/
│   │   ├── design.md
│   │   └── tasks.md
│   └── archive/
└── .openspec/
```

---

## 技术栈检测规则

### 前端检测

```json
// package.json 检测
{ "dependencies": { "react": "^18.x" } } → FRONTEND_FRAMEWORK=react
{ "dependencies": { "vue": "^3.x" } } → FRONTEND_FRAMEWORK=vue
{ "dependencies": { "next": "^14.x" } } → FRONTEND_FRAMEWORK=next
```

### UI 库检测

```json
// package.json 检测（按优先级）
// React UI 库
{ "dependencies": { "antd": "^5.x" } } → UI_LIBRARY=antd
{ "dependencies": { "@mui/material": "^5.x" } } → UI_LIBRARY=mui
{ "dependencies": { "@chakra-ui/react": "^3.x" } } → UI_LIBRARY=chakra
{ "dependencies": { "@radix-ui/react-dialog": "^1.x" } } → UI_LIBRARY=radix
{ "dependencies": { "shadcn": "^1.x" } } → UI_LIBRARY=shadcn
{ "dependencies": { "antd": "^4.x" } } → UI_LIBRARY=antd

// Vue UI 库
{ "dependencies": { "element-plus": "^2.x" } } → UI_LIBRARY=element-plus
{ "dependencies": { "naive-ui": "^2.x" } } → UI_LIBRARY=naive-ui
{ "dependencies": { "vuetify": "^3.x" } } → UI_LIBRARY=vuetify
{ "dependencies": { "quasar": "^2.x" } } → UI_LIBRARY=quasar
{ "dependencies": { "@ant-design/vue": "^5.x" } } → UI_LIBRARY=ant-design-vue
{ "dependencies": { "primevue": "^3.x" } } → UI_LIBRARY=primevue

// Vue 2 UI 库
{ "dependencies": { "element-ui": "^2.x" } } → UI_LIBRARY=element-ui
{ "dependencies": { "iview": "^3.x" } } → UI_LIBRARY=iview
{ "dependencies": { "vuetify": "^2.x" } } → UI_LIBRARY=vuetify2
{ "dependencies": { "bootstrap-vue": "^2.x" } } → UI_LIBRARY=bootstrap-vue
{ "dependencies": { "buefy": "^0.x" } } → UI_LIBRARY=buefy
{ "dependencies": { "muse-ui": "^3.x" } } → UI_LIBRARY=muse-ui
{ "dependencies": { "vue-material": "^1.x" } } → UI_LIBRARY=vue-material
```

**UI 库对应模板变量**：

| UI_LIBRARY | 说明 | 模板后缀 | 框架 |
|------------|------|---------|------|
| antd | Ant Design 5 | _antd | React |
| mui | Material UI 5 | _mui | React |
| chakra | Chakra UI | _chakra | React |
| radix | Radix UI (headless) | _radix | React |
| shadcn | shadcn/ui | _shadcn | React |
| element-plus | Element Plus | _element | Vue 3 |
| naive-ui | Naive UI | _naive | Vue 3 |
| vuetify | Vuetify 3 | _vuetify | Vue 3 |
| quasar | Quasar | _quasar | Vue 3 |
| ant-design-vue | Ant Design Vue | _ant-design-vue | Vue 3 |
| primevue | PrimeVue | _primevue | Vue 3 |
| element-ui | Element UI | _element-ui | Vue 2 |
| iview | iView | _iview | Vue 2 |
| vuetify2 | Vuetify 2 | _vuetify2 | Vue 2 |
| bootstrap-vue | Bootstrap Vue | _bootstrap-vue | Vue 2 |
| buefy | Buefy | _buefy | Vue 2 |
| muse-ui | Muse UI | _muse-ui | Vue 2 |
| vue-material | Vue Material | _vue-material | Vue 2 |
| none | 未检测到 | (无后缀) | - |

### 后端检测

```json
{ "dependencies": { "@nestjs/core": "^10.x" } } → BACKEND_FRAMEWORK=nestjs
{ "dependencies": { "express": "^4.x" } } → BACKEND_FRAMEWORK=express
```

### 桌面应用检测

```
存在 src-tauri/Cargo.toml → HAS_TAURI=true
存在 tauri.conf.json → HAS_TAURI=true
```

### 数据库检测

```json
{ "dependencies": { "typeorm": "^0.3.x" } } → HAS_DATABASE=postgresql
{ "dependencies": { "@prisma/client": "^5.x" } } → HAS_DATABASE=postgresql
```

---

## Agent 模板说明

### Spec-It vs OpenSpec 选择

| 场景 | 工具 | 说明 |
|------|------|------|
| 新项目 (0→1) | peaksfeat | 完整工作流：Constitution → PRD → 设计 → 开发 → 测试 |
| 复杂项目 | peaksfeat | 多团队/多模块需要完整对齐 |
| 存量项目功能迭代 | OpenSpec | 轻量级工作流：propose → apply → archive |
| Bug 修复 | peaksbug | 系统化调试 → 修复 → 回归测试 |
| Issue 管理 | triage | 状态机流转 → Agent Brief |

### 通用 Agent（始终生成）

| Agent                  | 说明 | Matt Pocock 技能 |
| ---------------------- | ---------------------------------------------- | ---------------- |
| peaksfeat              | 需求开发流程，产品需求分析 + 设计 + 前后端开发 | grill-me, prototype, zoom-out |
| peaksbug               | Bug 修复流程，根因分析 + 修复 + 回归测试 | diagnose (Phase 1-6) |
| product                | 产品需求分析，brainstorming + PRD + CONTEXT.md | grill-with-docs |
| qa                     | 测试工程，E2E + 自动化 + TDD | tdd, caveman |
| triage                 | Issue 分类，状态机流转，Agent Brief | triage |
| devops                 | 运维部署，Docker + 环境配置 | - |
| security-reviewer       | 安全审查，OWASP Top 10 | - |
| code-reviewer-frontend | 前端代码审查 | - |
| code-reviewer-backend  | 后端代码审查 | - |

### 技术栈相关 Agent（按需生成）

| Agent    | 触发条件                      |
| -------- | ----------------------------- |
| frontend | 检测到 React/Vue/Next         |
| backend  | 检测到 NestJS/Express/Fastify |
| tauri    | 检测到 Tauri                  |
| postgres | 检测到 PostgreSQL/MySQL       |

---

## 输出目录结构

### Spec-It (peaks-sdd) 目录

```
.peaks/
├── plans/          # 开发计划
├── prds/           # PRD 文档
├── designs/        # 设计稿截图
├── test-docs/      # 测试用例
├── reports/        # 各类报告
├── auto-tests/     # 自动化测试脚本
├── deploys/        # 部署脚本
├── bugs/           # Bug 分析报告 (peaksbug)
└── fixes/          # 修复记录 (peaksbug)

.claude/
├── agents/         # 动态生成的 Agent 配置
├── hookify.*.local.md  # Hook 配置
└── session-state.json  # 会话状态
```

### OpenSpec 目录（存量项目迭代）

```
openspec/
├── specs/              # 系统当前行为（真理来源）
│   └── **/*.md
├── changes/            # 变更提案
│   ├── [change-name]/
│   │   ├── proposal.md
│   │   ├── specs/
│   │   ├── design.md
│   │   └── tasks.md
│   └── archive/
└── .openspec/
```

**选择规则**：
- **新项目 (0→1)**：使用 `.peaks/` 目录（Spec-It）
- **存量项目迭代 (1→n)**：使用 `openspec/` 目录（OpenSpec）

---

## 异常处理与边界条件

### 异常场景与处理

| 场景 | 触发条件 | 处理动作 |
|------|---------|---------|
| 在主分支开发 | 当前分支是 main/master/develop/release/*/hotfix/* | 创建新分支：feature/<功能名> 或 bugfix/<功能名> |
| 项目不是 git 仓库 | `git rev-parse` 失败 | 提示用户"建议先 git init"，若拒绝则继续但不创建分支 |
| 模板文件缺失 | `templates/agents/*.md` 不存在 | 跳过该模板，记录警告，继续处理其他模板 |
| context window 不足 | session-state.json 显示 contextEstimate >= 85% | 先 Compact，再继续 |
| 用户中断流程 | 用户明确表示停止 | 暂停，保存当前进度到 `.peaks/state.json` |
| @bunas/fs-mcp 不可用 | MCP 工具调用失败 | 降级为 Bash/Read 工具手动扫描项目 |
| settings.json 不存在 | `.claude/settings.json` 不存在 | 跳过 MCP 配置步骤，提示用户可稍后手动配置 |
| 模板变量替换失败 | 检测到未定义的变量 | 使用空字符串作为默认值，继续处理 |
| npm/npx 安装失败 | `npx skills add` 或 `npx @fission-ai/openspec` 超时/报错 | 重试 1 次；仍失败则跳过该 skill，记录警告继续 |
| 网络超时 | MCP 启动或 npx 下载超时 | 增加超时等待（30s）；仍失败则降级或跳过 |
| 权限不足 | 写入 `.claude/` 或 `.peaks/` 失败 | 提示用户检查目录权限，建议 `chmod -R u+w .claude/` |
| 磁盘空间不足 | 写入文件时报 ENOSPC | 提示用户清理磁盘空间后重试 |

### 决策树

```
收到任务
    ↓
检查 git 仓库状态
    ↓
┌─ 是 git 仓库？ ─────────────────────┐
│  ✅ 是 → 继续                        │
│  ❌ 否 → 提示 git init 或跳过分支    │
└─────────────────────────────────────┘
    ↓
检查当前分支
    ↓
┌─ 分支是 main/master/develop 或 release/* / hotfix/*？ ─┐
│                                                    │
│  ✅ 是 → 创建新分支继续                              │
│        - 功能开发：feature/<功能名>                  │
│        - Bug 修复：bugfix/<功能名>                   │
│                                                    │
│  ❌ 否 → 继续（在当前分支上开发）                    │
└────────────────────────────────────────────────────┘
    ↓
检查 contextEstimate
    ↓
┌─ context >= 85%？ ─────────────────┐
│  ✅ 是 → 先 Compact 再继续            │
│  ❌ 否 → 继续                        │
└─────────────────────────────────────┘
    ↓
执行主流程
```

---

## SDD 工作流

### ⚠️ 关键检查点（防止自主失控）

> **执行任何 Phase 前，必须经过对应检查点。未获确认不继续。**

| 检查点 | 触发时机 | 确认内容 |
|--------|---------|---------|
| **Checkpoint 0** | 工作流开始前 | 确认使用 Spec-It 还是 OpenSpec |
| **Checkpoint 1** | Phase 1 结束后 | Constitution 是否符合预期 |
| **Checkpoint 2** | Phase 2 结束后 | PRD 是否完整、无遗漏 |
| **Checkpoint 3** | Phase 3 结束后 | Plan 是否可行、风险是否可控 |
| **Checkpoint 4** | Phase 4 结束后 | 任务分配是否合理、依赖是否正确 |
| **Checkpoint 5** | Phase 5 结束后 | 代码变更是否满足 PRD、测试是否通过 |
| **Checkpoint 6** | 部署完成后 | 服务是否可达、功能是否正常、数据是否完整 |

**peaksbug 专用检查点**：

| 检查点 | 触发时机 | 确认内容 |
|--------|---------|---------|
| **Bug-Checkpoint 1** | 根因分析完成后 | Root cause 是否正确、假设是否可验证 |
| **Bug-Checkpoint 2** | 修复方案制定后 | 修复方案是否最小改动、是否影响其他功能 |
| **Bug-Checkpoint 3** | Code Review 后 | 修复代码质量、是否通过安全检查 |
| **Bug-Checkpoint 4** | 回归测试后 | 所有测试通过、无回归、产出报告已生成 |

**检查点模板**：
```
┌─ [检查点名称] ─────────────────────────────────────┐
│                                                    │
│  产出：[阶段产出物列表]                            │
│                                                    │
│  请确认：                                          │
│  - [ ] 确认项 1                                  │
│  - [ ] 确认项 2                                  │
│                                                    │
│  ✅ 确认 → 进入下一 Phase                          │
│  ❌ 有问题 → 描述问题 → 修复后重新确认             │
└────────────────────────────────────────────────────┘
```

### Checkpoint 6: 部署后验证（部署完成）

```
┌─ Checkpoint 6: 部署后验证 ─────────────────────────┐
│                                                    │
│  产出：                                            │
│  - .peaks/deploys/deploy-[环境]-[日期].log         │
│  - 部署验证报告                                    │
│                                                    │
│  请确认：                                          │
│  - [ ] 所有服务端口可达                           │
│  - [ ] 健康检查端点返回正常                       │
│  - [ ] 数据库迁移完成（无数据丢失）               │
│  - [ ] 关键功能可正常访问                         │
│  - [ ] 日志无 ERROR 级别错误                      │
│                                                    │
│  ✅ 确认 → 部署完成，通知用户                      │
│  ❌ 有问题 → 回滚或修复后重新验证                 │
└────────────────────────────────────────────────────┘
```

---

### 选择正确的工作流

```
收到任务
    ↓
┌─ Checkpoint 0: 确认工作流 ──────────────────────┐
│                                                    │
│  [ ] 已有项目代码 (>1个月历史)                   │
│      → 存量项目 → OpenSpec                       │
│         /opsx:propose → /opsx:specs → /opsx:apply │
│                                                    │
│  [ ] 新项目 (0→1) 或 复杂项目                    │
│      → Spec-It (peaks-sdd)                       │
│         Phase 1-5: Constitution → PRD → Plan     │
│                                                    │
│  [ ] Bug 修复                                     │
│      → peaksbug                                  │
│         systematic-debugging → 修复 → 回归测试   │
└────────────────────────────────────────────────────┘
    ↓
用户确认工作流后执行
```

**快速决策规则**：
- 有 `.git/` 且最近 30 天有 commit → **OpenSpec**
- 无 git 或空白项目 → **Spec-It**
- 报错/崩溃/行为异常 → **peaksbug**

### Spec-It 工作流 (新项目)

**输入**：用户需求描述
**输出**：`.peaks/constitution.md`

#### Phase 1: Constitution

**Step 1.1** — 定义治理原则
- 确定代码规范、提交约定、审查流程
- 确定 Agent 调度策略

**Step 1.2** — 输出 Constitution

**Constitution 输出格式示例**：
```markdown
# Constitution - [项目名]

## 代码规范
- TypeScript strict mode
- ESLint + Prettier
- 组件 PascalCase，工具函数 camelCase

## 提交约定
- Conventional Commits (feat/fix/refactor)
- PR 必须经过 Code Review

## Agent 调度策略
- 前端变更 → frontend agent → code-reviewer-frontend
- 后端变更 → backend agent → code-reviewer-backend
- 所有变更 → security-reviewer → qa

## 质量门禁
- Code Review → 安全检查 → QA 验证
```

输出路径：`.peaks/constitution.md`

**过渡**：用户确认 Constitution → Phase 2

---

**输入**：Constitution + 用户需求
**输出**：`.peaks/prds/prd-[功能名]-[日期].md`

#### Phase 2: Specify

**Step 2.1** — 需求分析
- 使用 brainstorming 分析深层需求
- 考虑边界场景

**Step 2.2** — 编写 PRD
- 使用 `[NEW]` / `[CHANGED]` / `[DEPRECATED]` 标识
- 明确功能点和验收标准

**PRD 输出格式示例**：
```markdown
# PRD - 用户登录功能

## 概述
### 背景
用户需要一个安全的登录入口来访问个人数据。

### 目标
提供邮箱+密码登录，支持记住登录状态。

## 功能列表

### [NEW] 邮箱登录
- 用户输入邮箱和密码
- 系统验证凭证
- 成功后跳转首页

### [CHANGED] 记住登录
- 原：7天有效期
- 新：30天有效期

## 非功能性需求
- 登录响应时间 < 500ms
- 密码加密存储（bcrypt）
```

**过渡**：用户确认 PRD → Phase 3

---

**输入**：PRD
**输出**：`.peaks/plans/plan-[功能名]-[日期].md`

#### Phase 3: Plan

**Step 3.1** — 技术方案设计
- 确定技术栈、架构、API 设计

**Step 3.2** — 产出实现计划
- 分解为可验证的里程碑

**Plan 输出格式示例**：
```markdown
# Plan - 用户登录功能

## 技术方案
- 前端：React + React Hook Form + Zod
- 后端：NestJS + JWT + bcrypt
- 数据库：PostgreSQL (users 表)

## 里程碑
| # | 里程碑 | 依赖 | 预计工时 |
|---|--------|------|---------|
| M1 | 数据库表设计 | 无 | 0.5d |
| M2 | 后端登录 API | M1 | 1d |
| M3 | 前端登录页面 | 无 | 1d |
| M4 | 前后端联调 | M2, M3 | 0.5d |

## 风险
- JWT 刷新机制需额外设计
```

输出路径：`.peaks/plans/plan-[功能名]-[日期].md`

**过渡**：用户确认 Plan → Phase 4

---

**输入**：Plan
**输出**：`.peaks/tasks/task-[功能名]-[日期].md`

#### Phase 4: Tasks

**Step 4.1** — 任务拆分
- 按依赖关系排序
- 标记并行/顺序任务

**Tasks 输出格式示例**：
```markdown
# Tasks - 用户登录功能

## 并行任务（无依赖）
- [ ] T1: [frontend] 创建 LoginForm 组件 (React Hook Form + Zod)
- [ ] T2: [backend] 创建 POST /api/auth/login 端点

## 顺序任务
- [ ] T3: [backend] 实现 JWT 签发和验证 (依赖 T2)
- [ ] T4: [frontend] 对接登录 API (依赖 T1, T2)
- [ ] T5: [qa] E2E 测试登录流程 (依赖 T4)
```

**Step 4.2** — 分配任务
- 前端任务 → frontend agent
- 后端任务 → backend agent

**过渡**：任务分配完成 → Phase 5

---

**输入**：Tasks
**输出**：代码变更 + 测试报告

#### Phase 5: Implement

**Step 5.1** — 开发
- Agent 执行分配的任务（使用 `.claude/agents/peaksfeat.md` 中定义的工作流）

**Step 5.2** — 质量门禁
```
┌─ Code Review ──────────────────────┐
│  CR 通过 → 进入安全检查            │
│  CR 失败 → 打回修复 → 重新 CR      │
└─────────────────────────────────────┘
         ↓
┌─ 安全检查 ─────────────────────────┐
│  通过 → 进入 QA 验证               │
│  失败 → 修复                       │
└─────────────────────────────────────┘
         ↓
┌─ QA 验证 ──────────────────────────┐
│  测试通过 → 部署                   │
└─────────────────────────────────────┘
```

**Step 5.3** — 部署
- 执行部署脚本（使用 `.claude/agents/devops.md` 中定义的部署流程）
- 进入 **Checkpoint 6: 部署后验证**

### OpenSpec 工作流 (存量项目迭代)

OpenSpec 使用轻量级的流体工作流：

```
/opsx:propose ──► /opsx:specs ──► /opsx:design ──► /opsx:tasks ──► /opsx:apply ──► /opsx:archive
     ↓                ↓               ↓              ↓              ↓
  创建提案        编写规格        技术设计        任务拆分        实施           归档
```

**目录**：`openspec/changes/[change-name]/`

**完整示例**：

```bash
# 1. 初始化（首次使用）
openspec init

# 2. 创建变更提案
# 用户：/opsx:propose 给登录页添加"记住我"功能
# → 产出：openspec/changes/add-remember-me/proposal.md

# 3. 编写规格
# 用户：/opsx:specs
# → 产出：openspec/changes/add-remember-me/specs/login.md

# 4. 技术设计
# 用户：/opsx:design
# → 产出：openspec/changes/add-remember-me/design.md

# 5. 任务拆分
# 用户：/opsx:tasks
# → 产出：openspec/changes/add-remember-me/tasks.md

# 6. 实施
# 用户：/opsx:apply
# → 执行 tasks.md 中的各个任务

# 7. 归档
# 用户：/opsx:archive
# → 合并到 openspec/specs/，清理 changes/ 目录
```

---

## Slash Commands（用户入口）

peaks-sdd 提供三个快捷命令，覆盖主要开发场景：

| 命令 | 说明 | 输入 |
|------|------|------|
| `/peaksinit` | 初始化项目 | 无（扫描当前项目） |
| `/peaksfeat` | 功能开发 | 自然语言需求或 PRD |
| `/peaksbug` | Bug 修复 | bug 现象描述 |

### /peaksinit - 项目初始化

```
/peaksinit
```

扫描当前项目，检测技术栈，自动生成：
- `.claude/agents/` Agent 配置
- `.peaks/` 工作目录结构

**执行流程**：Phase 0: 项目初始化（详见上方 Step 0.1-0.8）

---

### /peaksfeat - 功能开发

```
/peaksfeat 添加用户登录功能，支持邮箱+密码
```

或者直接粘贴 PRD 内容，自动进入完整开发流程。

**执行流程**：Checkpoint 0 → Phase 1-5（详见上方 SDD 工作流章节）

---

### /peaksbug - Bug 修复

```
/peaksbug 登录按钮点击没反应
```

自动分析复现 → 根因分析 → 修复 → 测试 → 验证。

**执行流程**：Phase 1-6（使用 `.claude/agents/peaksbug.md` 中定义的调试工作流）

---

## ⚠️ Gotchas (Claude 失败点总结)

> 随着使用积累的 Claude Code 常见失败模式，触发时需特别注意：

### 工作流相关

| Gotcha | 触发条件 | 应对方式 |
|--------|---------|---------|
| **Agent 忘记上下文** | 多轮对话后 Agent 无法回忆早期决策 | Checkpoint 0-6 强制用户确认，每个 Phase 产出物归档 |
| **规格蔓延** | 用户不断添加未包含在 PRD 中的需求 | Phase 2 后新增需求必须走 Checkpoint 2 确认 |
| **Agent 自主代码生成** | Phase 5 中 Agent 跳过 Code Review 直接提交 | Checkpoint 5 强制门禁：CR → 安全检查 → QA |
| **Context 溢出** | 复杂项目多轮对话后 context 超过 85% | Phase 0 提示 `/compact`，自动触发 SessionStart 检查 |

### 命令相关

| Gotcha | 触发条件 | 应对方式 |
|--------|---------|---------|
| **命令未注册** | peaksinit 未执行时调用 /peaksfeat | Checkpoint 0 检测命令可用性，未注册则引导用户先说"初始化我的项目" |
| **命令注册路径错误** | 项目在子目录中，命令路径相对错误 | 使用绝对路径或相对于 `.claude/settings.json` 的路径 |
| **命令覆盖** | 多次执行 peaksinit 覆盖已有命令 | Step 0.7 增量添加逻辑：已存在则跳过 |

### 技术栈检测相关

| Gotcha | 触发条件 | 应对方式 |
|--------|---------|---------|
| **Monorepo 检测失败** | package.json 在 root 但实际代码在 packages/ | 同时检测 root + packages/*/package.json |
| **混用框架** | 同时检测到 React + NestJS | 生成 frontend + backend 两个 Agent |
| **遗漏隐式依赖** | 只检测 package.json，忽略 workspace 配置 | 检测 pnpm-workspace.yaml, lerna.json, turbo.json |

### Memory 相关

| Gotcha | 触发条件 | 应对方式 |
|--------|---------|---------|
| **跨会话丢失上下文** | claude-mem 未正确初始化 | peaksinit Step 0.7 验证 claude-mem 已注册 |
| **CLAUDE.md 膨胀** | 多轮迭代后 CLAUDE.md 超过 200 行 | 定期归档到 .peaks/，保持主文件精简 |

---

## 触发关键词

### Spec-It (peaks-sdd) - 新项目

- "初始化项目" / "setup project"
- "dynamically generate agents" / "动态生成 agents"
- "定义 constitution" / "constitution"
- "specify" / "规格" / "需求分析"
- "技术计划" / "implementation plan"
- "任务拆分" / "break down tasks"
- "/speckit.constitution" / "/speckit.specify" / "/speckit.plan" / "/speckit.tasks"
- "创建 PRD" / "需求文档"
- "SDD" / "spec-driven"

### OpenSpec - 存量项目迭代

- "迭代" / "iteration" / "feature"
- "添加功能" / "add feature"
- "openspec init"
- "/opsx:propose" / "/opsx:apply" / "/opsx:archive"
- "specs" / "变更提案"

---

## 关键原则

1. **动态生成** — 根据检测到的技术栈，动态生成对应的 Agent 配置
2. **通用框架** — 适用于任意 TypeScript 项目，不局限于特定框架
3. **Spec first, code second** — 规格在代码之前
4. **What & Why, not How** — 关注目标和价值
5. **Traceability** — 每个代码变更都可追溯到规格

---

## 资源文件索引

| 路径 | 用途 |
|------|------|
| `references/dispatch-quickref.md` | Agent 调度速查表、质量门禁、文件命名规范 |
| `templates/agents/*.md` | **初始化时使用** - 模板,根据技术栈生成 `.claude/agents/` |
| `.claude/agents/*.md` | **实际运行时使用** - 初始化后生成的 agents |
