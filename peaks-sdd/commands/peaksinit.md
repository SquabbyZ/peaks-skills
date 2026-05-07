---
name: peaksinit
description: |
  PROACTIVELY scan project tech stack and dynamically generate .claude/agents/ configuration.
  Use when user says "初始化项目", "setup project", "init" or needs to register slash commands.

when_to_use: |
  初始化项目、setup project、init、动态生成 agents、dynamically generate agents、注册命令

argument-hint: "[无参数]"
arguments: []

user-invocable: true

paths:
  - "**/package.json"
  - "**/CLAUDE.md"
  - "**/.claude/**"

allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - Agent
  - mcp__bunas__fs_mcp__read_directory
  - mcp__bunas__fs_mcp__read_file

context: inherit

model: sonnet

effort: medium

hooks:
  PostToolUse:
    - matcher: "Bash"
      command: "echo 'Checking initialization status...'"
---

# /peaksinit - 项目初始化

扫描当前项目，检测技术栈，自动生成 `.claude/agents/` 配置和技能安装。

## 首次使用引导

```
┌─ 首次使用引导 ──────────────────────────────────────┐
│                                                       │
│  首次使用？请先说：                                   │
│  "初始化我的项目" 或 "setup this project"            │
│                                                       │
│  这将触发 peaksinit 工作流，并自动完成：             │
│  ✓ 检测项目技术栈（React / NextJS / NestJS 等）     │
│  ✓ 生成 .claude/agents/ Agent 配置                  │
│  ✓ 创建 .peaks/ 工作目录                            │
│  ✓ 注册 /peaksinit /peaksfeat /peaksbug 命令        │
│  ✓ 安装常用 Skills 和 MCP 服务器                     │
│                                                       │
│  命令注册完成后，三个 slash commands 将全局可用：    │
│  /peaksinit  /peaksfeat  /peaksbug                  │
│                                                       │
└───────────────────────────────────────────────────────┘
```

---

## 执行流程

### Step 0.1: 检查项目类型

```
项目路径: {{cwd}}
```

- 如果是 git 仓库：记录分支和状态
- 如果不是：提示用户先 `git init`（可选跳过）

### Step 0.2: 扫描项目（使用 MCP 或 Bash）

优先使用 `@bunas/fs-mcp`：
```
mcp__bunas__fs_mcp__read_directory(path: "{{cwd}}")
mcp__bunas__fs_mcp__read_file(path: "{{cwd}}/package.json")
```

如果 MCP 不可用，降级为 Bash：
```bash
ls -la
cat package.json
find . -name "*.json" -maxdepth 2 | head -20
```

### Step 0.3: 检测技术栈

| 检测项 | 文件/目录 | 说明 |
|--------|-----------|------|
| 前端框架 | package.json dependencies.react | React 项目 |
| 后端框架 | package.json dependencies.@nestjs/* | NestJS 后端 |
| 桌面应用 | src-tauri/ 或 tauri.conf.json | Tauri 项目 |
| 全栈框架 | package.json dependencies.next | Next.js |
| 数据库 | typeorm / prisma / drizzle | 数据库 ORM |
| 测试框架 | @playwright/test / vitest / jest | 测试框架 |

### Step 0.4: 生成 Agent 配置

**关键：必须读取模板、替换变量、写入实际文件，不能使用 symlink！**

根据检测结果，生成**所有 Agent 模板**，并根据项目类型动态调整。

### Step 0.4: 生成 Agent 配置

**策略：生成所有 Agent，根据项目类型动态标记适用性**

**所有 Agent 模板列表**：
| Agent | 说明 | 默认状态 |
|-------|------|---------|
| peaksfeat | 功能开发流程管理 | ✅ 始终生成 |
| peaksbug | Bug 修复流程管理 | ✅ 始终生成 |
| product | 产品需求分析 | ✅ 始终生成 |
| qa | 测试工程 | ✅ 始终生成 |
| design | UI/UX 设计 | ⚠️ 仅前端项目 |
| frontend | 前端开发专家 | ⚠️ 仅前端项目 |
| backend | 后端开发专家 | ⚠️ 仅后端项目 |
| tauri | Tauri 桌面应用 | ⚠️ 仅 Tauri 项目 |
| postgres | PostgreSQL 专家 | ⚠️ 仅数据库项目 |
| code-reviewer-frontend | 前端代码审查 | ✅ 始终生成（前端项目启用） |
| code-reviewer-backend | 后端代码审查 | ⚠️ 后端项目启用 |
| security-reviewer | 安全审查 | ✅ 始终生成 |
| devops | 运维部署 | ⚠️ 按需生成 |
| triage | Issue 分类 | ⚠️ 按需生成 |

**动态调整逻辑**：
```
读取模板 → 替换项目变量 → 检查项目类型 → 添加适用性标记 → 写入
```

**适用性标记**（在 agent 文件开头添加）：
```markdown
## 适用性

- **项目类型**: 纯前端项目
- **状态**: ✅ 启用（可用于本项目）
```

或者对于不适用的 agent：
```markdown
## 适用性

- **项目类型**: 纯前端项目
- **状态**: ❌ 不适用（本项目为纯前端，无后端代码）
```

**替换的变量**：
- `{{PROJECT_PATH}}` → 项目根目录（如 `/Users/xxx/prompt-project`）
- `{{PROJECT_NAME}}` → 项目目录名（如 `prompt-project`）
- `{{TECH_STACK}}` → 检测到的技术栈描述
- `{{FRONTEND_FRAMEWORK}}` → react / vue / next
- `{{TEST_FRAMEWORK}}` → jest / vitest / playwright
- `{{DEV_PORT}}` → 开发端口

**执行步骤**：
1. 读取模板文件内容（使用 Read 工具）
2. 替换所有 `{{VARIABLE}}` 占位符
3. 将替换后的内容写入 `.claude/agents/<name>.md`（使用 Write 工具，**不是 symlink**）

```bash
# ❌ 错误：创建 symlink（不替换变量，agent 无法获取项目上下文）
ln -s /path/to/template agents/frontend.md

# ✅ 正确：读取模板、替换变量、写入文件
# 1. Read /path/to/templates/agents/frontend.md
# 2. 替换 {{PROJECT_PATH}} 等变量
# 3. Write .claude/agents/frontend.md
```

### Step 0.5: 创建目录结构

```
.peaks/                     # SDD 工作目录
├── plans/
├── prds/
├── reports/
├── test-docs/
├── auto-tests/
├── deploys/
├── bugs/
└── fixes/
```

### Step 0.5.1: 初始化 OpenSpec（用于存量项目迭代）

**重要：OpenSpec 必须初始化，不能跳过！**

```bash
cd {{PROJECT_PATH}}
npx -y @fission-ai/openspec@latest init
```

这会自动创建 OpenSpec 目录结构：
```
openspec/
├── specs/              # 系统当前行为（真理来源）
├── changes/           # 变更提案
│   └── archive/
└── .openspec/
```

**注意**：
- OpenSpec 是给存量项目迭代使用的，初始化后 `/opsx:*` 命令才可用
- 如果 npm 安装失败，尝试：`npm install -g @fission-ai/openspec@latest`

### Step 0.6: 验证结果

```bash
ls -la .claude/agents/
ls -la .peaks/
```

---

### Step 0.7: 注册 Slash Commands

读取现有的 `.claude/settings.json`，**增量添加** peaks-sdd 的三个 commands：

```bash
cat .claude/settings.json 2>/dev/null || echo '{}'
```

**需要注册的 commands**：

| 命令 | 来源 | 说明 |
|------|------|------|
| `/peaksinit` | peaks-sdd/commands/peaksinit.md | 项目初始化 |
| `/peaksfeat` | peaks-sdd/commands/peaksfeat.md | 功能开发 |
| `/peaksbug` | peaks-sdd/commands/peaksbug.md | Bug 修复 |

**注册逻辑**：

1. 读取现有 `settings.json`
2. 如果不存在 `commands` 字段，创建它
3. 对于每个 command：已存在则跳过，不存在则添加
4. **不覆盖任何已有的 command 配置**
5. 写回 `.claude/settings.json`

**settings.json 示例结构**：

```json
{
  "commands": {
    "peaksinit": "peaks-sdd/commands/peaksinit.md",
    "peaksfeat": "peaks-sdd/commands/peaksfeat.md",
    "peaksbug": "peaks-sdd/commands/peaksbug.md"
  }
}
```

**注意**：
- peaks-sdd 目录使用相对路径（如 `peaks-sdd/commands/peaksfeat.md`）
- 路径相对于 `.claude/settings.json` 所在目录（即项目根目录）
- 如果 peaks-sdd 目录不在项目根目录，需要使用绝对路径

---

### Step 0.8: 验证 Command 注册

```bash
cat .claude/settings.json | grep -A 10 '"commands"'
```

确认三个命令都已注册。

## 输出示例

```
✅ 项目扫描完成

技术栈检测结果:
  - React 18 + TypeScript + Vite
  - Jest 测试框架

生成的 Agent 配置:
  .claude/agents/
  ├── frontend.md
  ├── peaksfeat.md
  ├── product.md
  ├── qa.md
  └── triage.md

.peaks/ 目录已创建

Slash Commands 已注册:
  - /peaksinit  ✓
  - /peaksfeat  ✓
  - /peaksbug   ✓
```

## 提示

- 如果需要安装额外 Skills，稍后可使用 `/peaksfeat` 或 `/peaksbug` 自动处理
- Agent 配置会根据项目后续修改自动更新
