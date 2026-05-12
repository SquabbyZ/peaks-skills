# 已有项目初始化

用于 `/peaks-sdd 初始化` 或首次在已有项目里执行 peaks-sdd。

## Step 0.1 扫描项目

读取项目根目录、`package.json`、`CLAUDE.md`、`CONFIG.md`、workspace 配置和主要源码目录。MCP 不可用时降级为 Bash/Read。

## Step 0.2 检测技术栈

按 `references/tech-stack-detection.md` 检测：

- 前端框架：React / Vue / Next.js
- 后端框架：NestJS / Express / Fastify
- 桌面应用：Tauri
- 数据库：Prisma / TypeORM / Drizzle 等
- 测试框架：Playwright / Vitest / Jest
- UI 库：Ant Design / MUI / Chakra / Radix / shadcn / Vue UI 库
- Monorepo：pnpm workspace / lerna / turbo / package workspaces

## Step 0.3 替换模板变量

常用变量：

| 变量 | 说明 |
| --- | --- |
| `{{PROJECT_NAME}}` | 项目目录名 |
| `{{PROJECT_PATH}}` | 项目根目录绝对路径 |
| `{{PACKAGES}}` | 检测到的子包 |
| `{{TECH_STACK}}` | 技术栈描述 |
| `{{FRONTEND_FRAMEWORK}}` | react / vue / next |
| `{{BACKEND_FRAMEWORK}}` | nestjs / express / fastify |
| `{{UI_LIBRARY}}` | antd / mui / chakra / radix / shadcn 等 |
| `{{HAS_TAURI}}` | true / false |
| `{{HAS_DATABASE}}` | postgresql / mysql / none |
| `{{TEST_FRAMEWORK}}` | playwright / vitest / jest |
| `{{DEV_PORT}}` | 开发端口 |

## Step 0.4 生成 Agent

从 `templates/agents/` 增量生成到 `.claude/agents/`，不覆盖已有用户文件。

| 条件 | Agent |
| --- | --- |
| 始终生成 | dispatcher, product, qa, devops, triage, security-reviewer, code-reviewer-* |
| 检测到 React/Vue/Next | frontend, design |
| 检测到后端框架 | backend |
| 检测到 Tauri | tauri |
| 检测到数据库 | postgres |

## Step 0.5 生成目录与配置

创建标准目录：

```text
.peaks/{plans,prds,swagger,reports,auto-tests,checkpoints,bugs,designs,tech,test-docs,deploys}
.claude/agents
.gitnexus
```

`CLAUDE.md` / `CONFIG.md` 只增量补充，不复制模板覆盖。

## Step 0.6 验证

- `.claude/agents/` 下有对应 Agent。
- `.peaks/` 标准目录存在。
- 项目说明包含可用技术栈和启动命令。

## MCP 配置原则

如需要更新 `.claude/settings.json`：

1. 读取现有配置。
2. 如果没有 `mcpServers`，创建该字段。
3. 只添加缺失 MCP。
4. 替换 `{{PROJECT_PATH}}` 为实际路径。
5. 不覆盖用户已有 MCP 配置。

常见 MCP：gitnexus、claude-mem、fs、playwright、context7、fetch、websearch、docker、shadcn。

## Skills 安装原则

初始化时不批量安装外部 skills，避免下载慢、网络失败和 429。peaks-sdd 的 agent 必须能依靠模板内置指令、本地 scripts 和 Claude Code 基础工具独立运行。

### 轻量默认

- 不在初始化阶段运行 `npx skills add ...`。
- 不因为外部 skill 缺失而中断初始化、开发、测试或 QA。
- Agent 模板不得使用 `skills:` frontmatter 表达硬依赖。
- 优先使用本仓库 `references/`、`templates/`、`scripts/` 中的本地能力。

### 按需增强

Agent 开始具体任务时，读取 `references/optional-skills.md`，只挑选与当前任务相关的增强 skills，并告知用户：

1. 是否建议安装。
2. 每个 skill 安装后带来的收益。
3. 不安装时会使用哪种内置降级流程。

用户同意后再安装；用户拒绝、未明确同意、下载失败或网络不可用时，继续使用内置流程。

### 推荐分层

| 层级 | 策略 | 示例 |
| --- | --- | --- |
| Core | 随 peaks-sdd 自带，必须可离线工作 | agent 模板、OpenSpec 脚本、质量门禁脚本 |
| Optional | 已安装时调用，未安装跳过 | frontend-design, browser-use, test-driven-development |
| Manual | 只在用户明确要求时安装 | 大型外部技能包、低频专业技能 |
