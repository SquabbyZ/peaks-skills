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
│  ✓ 检测项目技术栈（React / Vue / NextJS 等）        │
│  ✓ 生成 .claude/agents/ Agent 配置                  │
│  ✓ 创建 .peaks/ 工作目录                            │
│  ✓ 注册 /peaksinit /peaksfeat /peaksbug 命令        │
│  ✓ 安装 improve-codebase-architecture + find-skills │
│  ✓ 自动检查 peaks-sdd 更新                          │
│                                                       │
│  命令注册完成后，五个 slash commands 将全局可用：    │
│  /peaksinit  /peaksfeat  /peaksbug                  │
│  /peaksupdate  /peakscheck（自动触发）              │
│                                                       │
└───────────────────────────────────────────────────────┘
```

---

## 执行流程

### Step 0.0: 检测是否已初始化

检测项目是否已完成初始化：

```bash
# 检查是否存在已有配置
ls -la .claude/agents/ 2>/dev/null && echo "AGENTS_EXIST"
ls -la .peaks/ 2>/dev/null && echo "PEAKS_EXIST"
cat .claude/settings.json 2>/dev/null | grep -q "peaksinit" && echo "COMMANDS_REGISTERED"
```

**三种状态**：

| 状态 | 含义 | 处理方式 |
|------|------|---------|
| 未初始化 | 无 `.claude/agents/` | 执行完整初始化（Step 0.1 - Step 0.9） |
| 已初始化 | 有 `.claude/agents/` 但模板有更新 | 执行增量更新（跳过 Step 0.5.2/0.5.3/0.7，已存在则跳过） |
| 同步最新 | 已初始化且模板无更新 | 报告「已是最新」，询问是否强制重置 |

**增量更新逻辑**：
1. 读取 `peaks-sdd/templates/agents/` 下的模板
2. 读取 `.claude/agents/` 下的已生成文件
3. 对比每个 Agent 的模板版本与已生成版本
4. 如果模板更新，询问用户「是否更新 [Agent名称]」
5. 批量更新时逐个替换

### Step 0.1: 检查项目类型

```
项目路径: {{cwd}}
```

- 如果是 git 仓库：记录分支和状态
- 如果不是：提示用户先 `git init`（可选跳过）

### ⚡ 并行检查更新

**在执行主流程前先检查 peaks-sdd 版本，不阻塞初始化流程**：

```bash
cd ~/.claude/skills/peaks-sdd && git fetch origin --quiet 2>/dev/null
LOCAL=$(git rev-parse --short HEAD 2>/dev/null || echo "NONE")
REMOTE=$(git rev-parse --short origin/main 2>/dev/null || echo "NONE")

if [ "$LOCAL" = "$REMOTE" ] || [ "$REMOTE" = "NONE" ]; then
  echo "✅ peaks-sdd 已是最新版本 ($LOCAL)"
else
  echo "🔔 peaks-sdd 有新版本: $REMOTE (当前: $LOCAL)"
  echo "如需更新请运行: /peaksupdate"
fi
```

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

### Step 0.3.1: 使用 improve-codebase-architecture 分析项目架构

**关键：在生成 Agent 配置之前，必须先使用 `improve-codebase-architecture` Skill 深度理解项目结构**

1. 优先使用 `@bunas/fs-mcp` 读取关键文件：
```
mcp__bunas__fs_mcp__read_directory(path: "{{cwd}}")
mcp__bunas__fs_mcp__read_file(path: "{{cwd}}/package.json")
mcp__bunas__fs_mcp__read_file(path: "{{cwd}}/CLAUDE.md")
mcp__bunas__fs_mcp__read_file(path: "{{cwd}}/tsconfig.json")
mcp__bunas__fs_mcp__read_directory(path: "{{cwd}}/src")
mcp__bunas__fs_mcp__read_directory(path: "{{cwd}}/.claude")
```

2. 然后调用 `improve-codebase-architecture` Skill 分析项目架构：
```
Skill: improve-codebase-architecture
args: "分析 {{cwd}} 项目的整体架构，包括：目录结构、技术栈、模块划分、依赖关系。输出结构化的架构报告用于指导 Agent 生成。"
```

3. 架构分析结果将用于：
   - 细化 Agent 模板中的项目路径和模块信息
   - 确定哪些 Agent 需要调整调度策略
   - 识别项目特有的开发规范和约定

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
- `{{PROJECT_ARCHITECTURE}}` → improve-codebase-architecture 输出的架构分析结果（目录结构、模块划分、依赖关系）
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

### Step 0.5.1: 安装全局 Skills（improve-codebase-architecture + find-skills）

**关键：这两个 Skill 必须安装到全局（.claude/skills/），所有 Agent 都会使用！**

```bash
# 安装 improve-codebase-architecture（项目架构分析）
npx skills add https://github.com/mattpocock/skills --skill improve-codebase-architecture

# 安装 find-skills（技能查找）
npx skills add https://github.com/vercel-labs/skills --skill find-skills
```

**说明**：
- 这两个 Skill 会被所有 Agent 引用，在执行任何任务前先分析项目架构
- `improve-codebase-architecture` 帮助 Agent 理解项目结构，生成更准确的代码
- `find-skills` 帮助 Agent 在遇到不熟悉的技术时快速查找合适的 Skill

**增量更新处理**：
- 如果 Skill 已安装，跳过（输出「✅ [Skill名称] 已安装」）
- 如果安装失败，记录到报告，继续后续步骤

### Step 0.5.2: 创建目录结构

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

### Step 0.5.3: 初始化 OpenSpec（用于存量项目迭代）

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
| `/peaksupdate` | peaks-sdd/commands/peaksupdate.md | 更新 peaks-sdd |
| `/peakscheck` | peaks-sdd/commands/peakscheck.md | 检查更新（自动触发） |

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
    "peaksbug": "peaks-sdd/commands/peaksbug.md",
    "peaksupdate": "peaks-sdd/commands/peaksupdate.md",
    "peakscheck": "peaks-sdd/commands/peakscheck.md"
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

确认五个命令都已注册（peaksinit, peaksfeat, peaksbug, peaksupdate, peakscheck）。

### Step 0.9: 生成初始化报告

**初始化完成后，必须向用户出具完整报告，汇总所有执行操作。**

将报告同时输出到控制台（用户可见）和保存到文件。

**报告文件路径**：`.peaks/reports/init-report-[YYYYMMDD].md`

**报告模板**：

```markdown
# peaks-sdd 初始化报告

**项目**: {{PROJECT_NAME}}
**路径**: {{PROJECT_PATH}}
**时间**: [当前时间]
**模式**: [首次初始化 / 增量更新]
**npm**: https://www.npmjs.com/package/peaks-skills

---

## 1. 技术栈检测

| 检测项 | 结果 |
|--------|------|
| 前端框架 | [检测结果，如 React 18 / Vue 3 / 未检测到] |
| 后端框架 | [检测结果，如 NestJS / 未检测到] |
| 桌面应用 | [检测结果，如 Tauri / 未检测到] |
| 数据库 | [检测结果，如 PostgreSQL (Prisma) / 未检测到] |
| 测试框架 | [检测结果，如 Vitest / Playwright / 未检测到] |
| 项目类型 | [纯前端 / 纯后端 / 混合项目] |

## 2. 项目架构分析（improve-codebase-architecture）

| 维度 | 分析结果 |
|------|----------|
| 目录结构 | [src/, pages/, components/, hooks/, stores/ 等] |
| 模块划分 | [按功能/按页面/按层] |
| 依赖关系 | [主要模块间依赖] |
| 技术债 | [如有] |

## 3. 更新的 Agent 配置

已更新到 `.claude/agents/`：

| Agent | 状态 | 说明 |
|-------|------|------|
| peaksfeat | ✅ 更新 | 功能开发流程管理 |
| peaksbug | ✅ 更新 | Bug 修复流程管理 |
| product | ✅ 更新 | 产品需求分析 |
| qa | ✅ 更新 | 测试工程 |
| frontend | ✅ 更新 / ❌ 不适用 | 前端开发专家（含 Vue2/Vue3 支持） |
| ... | ... | ... |

**增量更新说明**：
- 新增的 Agent：从模板生成并写入
- 已存在的 Agent：检测到模板更新则重新生成
- 未变化的 Agent：保留现有配置

## 4. 已安装的 Skills

| Skill | 状态 |
|-------|------|
| improve-codebase-architecture | ✅ 已安装 / ⏭️ 已跳过 |
| find-skills | ✅ 已安装 / ⏭️ 已跳过 |

## 5. 已注册的 Commands

| 命令 | 说明 |
|------|------|
| `/peaksinit` | 项目初始化 |
| `/peaksfeat` | 功能开发（Spec-It / OpenSpec） |
| `/peaksbug` | Bug 修复 |
| `/peaksupdate` | 更新 peaks-sdd |
| `/peakscheck` | 检查更新（自动触发） |

**npm 包**: https://www.npmjs.com/package/peaks-skills

## 6. 创建的目录结构

```
.peaks/
├── plans/          # 开发计划
├── prds/           # PRD 文档
├── swagger/        # API 规范
├── designs/        # 设计稿
├── test-docs/      # 测试用例
├── reports/        # 各类报告
├── auto-tests/     # 自动化测试
├── deploys/        # 部署脚本
├── bugs/           # Bug 分析
└── fixes/          # 修复记录

.claude/
├── agents/         # [数量] 个 Agent 配置
└── settings.json   # Command 注册
```

## 7. 快速开始

初始化完成！你现在可以使用以下命令：

| 命令 | 用途 | 示例 |
|------|------|------|
| `/peaksinit` | 初始化/更新项目 | `/peaksinit` |
| `/peaksfeat` | 开发新功能 | `/peaksfeat 添加用户登录` |
| `/peaksbug` | 修复 Bug | `/peaksbug 登录按钮点击没反应` |
| `/peaksupdate` | 更新 peaks-sdd | `/peaksupdate` |

**下一步建议**：
- 使用 `/peaksfeat <需求描述>` 开始第一个功能开发
- 运行 `/peaksupdate` 更新到最新版本
- 查看 `.peaks/` 目录了解工作流产出物结构
```

**执行要求**：
1. 将上述模板中的 `[占位符]` 替换为实际检测结果
2. 保存报告到 `.peaks/reports/init-report-[YYYYMMDD].md`
3. 在控制台输出**精简版报告**给用户（包含技术栈、Agent 列表、Commands 列表、快速开始）
4. 报告中的 Skills 列表必须包含所有实际安装的 skill

## 输出示例（控制台精简版）

```
✅ peaks-sdd 初始化完成

技术栈: React 18 + TypeScript + Vite | 纯前端项目

Agent 配置 (8 个):
  ✅ peaksfeat          功能开发流程管理
  ✅ peaksbug           Bug 修复流程管理
  ✅ product            产品需求分析
  ✅ qa                 测试工程
  ✅ frontend           前端开发专家
  ✅ design             UI/UX 设计
  ✅ code-reviewer-frontend  前端代码审查
  ✅ security-reviewer  安全审查

Commands 已注册:
  /peaksinit  /peaksfeat  /peaksbug

Skills 已安装: 28 个

📄 完整报告: .peaks/reports/init-report-20260508.md
```

## 提示

- 如果需要安装额外 Skills，稍后可使用 `/peaksfeat` 或 `/peaksbug` 自动处理
- Agent 配置会根据项目后续修改自动更新
