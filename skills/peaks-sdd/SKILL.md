---
name: peaks-sdd
description: |
  Spec-Driven Development workflow for TypeScript projects. Handles project initialization, feature development, and bug fixing via natural language input.
  Use when the user invokes /peaks-sdd, asks to initialize a project with SDD/agents/swarm workflow, or describes a feature/bug to run through the peaks-sdd process.
  Triggers: /peaks-sdd <any natural language description>, peaks-sdd, SDD 初始化, 初始化项目, 自动初始化, 配置蜂群, setup agents, spec-driven development.

user-invocable: true
tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - Agent
maxTurns: 100
memory: project
hooks:
  - require-code-review
---

# Peaks SDD (Spec-Driven Development)

Peaks SDD 是 `/peaks-sdd <自然语言>` 的统一入口。入口文件只负责**理解意图、选择工作流、加载必要参考**；不要把完整流程塞进上下文。

## Intent Routing

收到 `/peaks-sdd <用户输入>` 后，按顺序判断：

1. **空目录创建项目**：当前目录为空或几乎为空，且用户描述想做一个产品/应用（包括“初始化我的项目”这类 0→1 表达） → 使用全新项目蜂群工作流。
2. **初始化已有项目**：预留场景。当前版本只做技术栈扫描、共享 `.peaks/changes/<change-id>/` 结构和 agent 初始化，不完整执行存量迭代蜂群。
3. **Bug 修复**：预留场景。当前版本只复用 artifact/MCP/agent 基础设施，不完整执行 bugfix 蜂群。
4. **功能开发**：如果不是空目录，当前版本提示该能力将在后续迭代接入；不要假装已支持完整存量功能开发。

核心原则：用户运行 `/peaks-sdd <任何内容>` 一定有对应工作流；不要要求用户记关键词。

## Execution Rules

- 进入本 skill 后，第一句必须明确回应：`已进入 peaks-sdd 工作流：<场景>`，并说明接下来会读取哪份参考或执行哪个初始化脚本；不要用泛化话术替代 peaks-sdd 身份确认。
- **进度可见性要求**：进入工作流后，每执行一个实质性步骤（读取文件、执行脚本、调用 agent、进入下一阶段前）都必须向用户报告当前进展，格式为 `▶ [步骤名] - [具体动作]`。例如：`▶ 初始化中 - 执行 init.mjs 扫描技术栈`、`▶ Product脑暴 - 正在调用 product.md 进行第3轮对话`。阶段切换时必须明确告知用户并等待确认。
- 如果用户提供任何凭证、密钥、认证材料或敏感配置（例如 API key、token、password、私钥、JWT、cookie、session、OAuth code、连接串、webhook secret、client secret、`.env` 内容或 signed URL），只能提示其改用环境变量和立即轮换已暴露密钥；不得复述、存储、转换、摘要或写入 `.peaks/`、生成文档、agent prompt、review 产物、代码、配置、日志或终端输出。
- 先判断场景，再按需读取参考文件，不要一次性加载全部文档。
- 0→1 空项目必须先完成初始化基线，再进入 brainstorming/PRD：运行初始化脚本，确认核心 agent（`dispatcher.md`、`product.md`、`design.md`、`qa.md`、`triage.md`）、`.claude/settings.json`、`.claude/session-state.json`、`.claude/hookify/`、`.peaks/`、`openspec/` 已存在。
- 0→1 初始化阶段不得生成最终实施专项 agent；`frontend.md`、`frontend-child.md`、`backend.md`、`backend-child.md`、`qa-child.md`、`devops.md`、`postgres.md`、`tauri.md`、`code-reviewer-*.md`、`security-reviewer.md` 必须在 PRD、设计稿和技术方案确认后，基于确认产物动态生成或补强。
- 每次进入工作流前检查目标项目 `.claude/agents/`；目录不存在、为空或缺少应有 agent 时，先从 `templates/agents/` 补齐，且不得覆盖用户已有 agent。
- 初始化不得批量下载外部 skills；外部 skills 是可选增强。agent 应说明当前任务是否建议安装、安装后收益，并只在用户同意后安装；缺失、拒绝或下载失败不得阻断流程。
- **安全测试环节不得省略**：所有任务必须触发 `security-reviewer` agent 并产出 `security/security-report.md` 和 `security/security-smoke.md`。API/后端任务中必须包含 SQL 注入防护、认证授权测试、CSRF 防护、OWASP Top 10 检查；前端任务中必须包含 XSS 防护、CSP 验证、OWASP Top 10 检查。安全报告必须包含：漏洞清单（含严重级别）、修复建议、复测结果。
- **性能测试环节不得省略**：所有任务必须产出 `qa/performance-report.md`。后端任务必须包含 QPS（>100）、响应时间（p95<500ms）、慢查询（>1s需优化）测试；前端任务必须包含 LCP（<2.5s）、INP（<200ms）、CLS（<0.1）、FCP（<1.5s）、TBT（<200ms）测试。性能报告必须包含：指标实测值、阈值对比、瓶颈定位、优化建议。
- 初始化后必须按 `.peaks/changes/<change-id>/checkpoints/*-phase-handoff.md` 调度项目内生成的 `.claude/agents/*.md`；如果主会话直接完成 product/design/architecture/qa 工作，必须记录为 deviation，不能当作 agent 已执行。
- 产品想法、UI 讨论或方向认同不等于 PRD 确认；PRD、设计、技术方案必须分别有明确用户确认产物。
- UI 设计确认后，如果设计影响范围、页面、状态、文案或验收标准，先同步 PRD，再明确询问是否进入技术方案。
- 技术方案确认后才能进入开发；生成技术文档本身不等于确认。
- Bug 修复必须先复现和根因分析，再写修复。完整 Bug 流程：复现问题 → 收集证据（截图/日志/步骤）→ 根因分析 → 假设验证 → 最小修复 → 回归测试 → 产出 Bug 报告（`.peaks/changes/<change-id>/qa/bug-report.md` 或 `.peaks/bugs/<bug-id>.md`）。报告必须包含：问题描述、复现步骤、根因、修复方案、验证结果。
- 完成前必须可见执行 code review、安全审查、单元测试/覆盖率、QA 功能/业务/性能报告。**三轮QA是三轮完整的全流程测试，每轮都必须覆盖功能测试、业务逻辑测试、性能测试（不得拆分执行）**；每轮 QA 完成后必须产出 `qa/qa-round-{n}-report.md`；三轮 QA 全部通过后才能进入运行时冒烟和用户 UX 验证。
- **单元测试环节不得省略**：所有任务必须触发单元测试并产出 `qa/unit-test-report.md` 和 `.peaks/ut/coverage-summary.json`。
  - 每个功能模块必须生成对应的单元测试文件（`xxx.test.ts` 或 `xxx.spec.ts`）
  - 单元测试必须覆盖：核心业务逻辑、工具函数、组件（针对 UI 项目）
  - 测试框架根据项目技术栈自动检测：Vitest（检测到 `vitest`）> Jest（检测到 `jest`）> Mocha（检测到 `mocha`）
  - 覆盖率要求：业务/应用项目 >= 80%，开源组件库 >= 60%
  - `qa/unit-test-report.md` 必须包含：测试覆盖率数据、失败用例列表、修复情况说明
  - `qa/coverage-summary.json` 必须包含：line/branch/function/statement 各维度覆盖率
  - 覆盖率低于阈值时阻塞完成，不得使用 `--force` 绕过
- 自动阶段要把中间结果写入 `.peaks/`，避免依赖长上下文。

## Workflow Quick Reference

| 场景 | 主要动作 | 必读参考 |
| --- | --- | --- |
| 空目录创建项目 | 新项目蜂群：深度 product 脑暴 → PRD → 设计稿和设计规范 → 技术栈/架构 → OpenSpec → swarm waves → CR/安全/QA → 预览 | `references/new-project-swarm-workflow.md`, `references/artifact-layout.md`, `references/mcp-policy.md` |
| 已有项目初始化 | 预留：扫描项目 → 检测技术栈 → 生成 `.claude/agents/` 和 change-scoped `.peaks/` | `references/existing-project-initialization.md`, `references/artifact-layout.md` |
| 功能开发 | 预留：后续接入 OpenSpec + swarm；当前版本不宣称完整支持 | `references/openspec-workflow.md`, `references/dispatch-quickref.md` |
| Bug 修复 | 预留：后续接入 diagnosis-to-task-graph；当前版本不宣称完整支持 | `.claude/agents/dispatcher.md`（初始化后） |
| 技术栈识别 | 从 package.json / workspace / 目录结构检测框架、UI 库、数据库、monorepo | `references/tech-stack-detection.md` |
| 产出物格式 | PRD、Plan、Bug 报告、测试报告模板 | `references/artifact-templates.md` |
| 异常/失败点 | 主分支、非 git、MCP 不可用、context 过高、模板缺失等 | `references/error-handling-and-gotchas.md` |

## Output Directories

```text
.peaks/
├── project/                 # 跨迭代稳定知识
├── current-change           # 当前活跃 change 指针
└── changes/<change-id>/     # 每次新项目、功能迭代或 bugfix 的产物
    ├── product/
    ├── design/
    ├── architecture/
    ├── openspec/
    ├── swarm/
    ├── qa/
    ├── review/
    ├── checkpoints/
    └── final-report.md

.claude/agents/     # 初始化后生成的实际执行 agents
openspec/           # 后续存量功能迭代规格预留
```

## Minimal Command Behavior

### `/peaks-sdd <任意>` - 自动初始化

首次使用任意命令时，自动检测并初始化：

1. **检查初始化状态**：核心 agents、`.peaks/`、`.claude/settings.json`、`.claude/session-state.json`、`.claude/hookify/`、`openspec/` 是否存在
2. **未初始化时自动执行**：
   ```
   node <peaks-sdd-skill-dir>/scripts/init.mjs <projectPath>
   ```
3. **初始化完成后继续原命令流程**
4. **PRD/设计/技术方案确认后**：再基于确认产物动态生成或补强前端、后端、QA 执行、DevOps、数据库、Tauri、代码审查和安全审查 agent

### `/peaks-sdd 初始化`

1. 读取 `references/existing-project-initialization.md`。
2. 扫描当前项目。
3. 检测技术栈。
4. 生成或增量补齐 `.claude/agents/`、`.peaks/`、必要配置。
5. 验证初始化结果。

### `/peaks-sdd <功能需求>`

1. 若项目未初始化，先执行 `node <peaks-sdd-skill-dir>/scripts/init.mjs <projectPath>`。
2. 读取 OpenSpec / dispatcher 相关参考。
3. 创建或更新规格产物。
4. 按技术方案调度对应 agents 实现。
5. 执行 code review、安全检查、测试和 QA。

### `/peaks-sdd <异常描述>`

1. 若项目未初始化，先执行 `node <peaks-sdd-skill-dir>/scripts/init.mjs <projectPath>`。
2. 使用 `.claude/agents/dispatcher.md` 的 bug flow。
3. 复现问题并收集证据。
4. 定位根因。
5. 做最小修复。
6. 回归测试并写入当前 change 的 `qa/`、`review/` 或 `final-report.md`。

## Reference Index

| 路径 | 用途 |
| --- | --- |
| `references/new-project-swarm-workflow.md` | 全新项目蜂群端到端流程 |
| `references/artifact-layout.md` | `.peaks/project` 和 change-scoped 产物目录规范 |
| `references/mcp-policy.md` | 细粒度 MCP 使用、默认启用和阶段注入策略 |
| `references/model-routing.md` | agent 按职责选择 haiku/sonnet/opus 的模型路由策略 |
| `references/empty-project-workflow.md` | 从空目录创建新项目的完整 0→1 流程 |
| `references/existing-project-initialization.md` | 已有项目初始化、MCP 增量配置、Skills 按需安装 |
| `references/openspec-workflow.md` | 存量项目功能开发的 OpenSpec 工作流 |
| `references/tech-stack-detection.md` | 前端、后端、UI 库、数据库、monorepo 检测规则 |
| `references/artifact-templates.md` | `.peaks/` 产出物格式模板 |
| `references/memory-and-context.md` | memory、context、loop 管理策略 |
| `references/optional-skills.md` | 各 agent 可选增强 skills、收益说明、用户同意后安装策略 |
| `references/rd-dispatcher-protocol.md` | 前端/后端研发调度 agent 的技术文档、任务图、brief、wave 调度协议 |
| `references/karpathy-guidelines.md` | 编码原则和执行纪律 |
| `references/error-handling-and-gotchas.md` | 异常处理和 Claude 失败点 |
| `references/resource-index.md` | templates、agents、scripts 资源说明 |
| `references/dispatch-quickref.md` | Agent 调度、质量门禁、文件命名速查 |
| `templates/agents/*.md` | 初始化时复制到目标项目的 agent 模板 |
| `scripts/` | 初始化、OpenSpec、质量门禁、格式化和检查脚本 |

## Non-Negotiables

1. 不把大段参考内容复制回主上下文；按场景读取最小必要文件。
2. 不覆盖用户已有 `.claude/agents/`、`CLAUDE.md`、`settings.json`，只做增量更新。
3. 不跳过 PRD / specs / design / tasks 等规格产物直接写代码。
4. 不在未确认设计稿时进入前端实现。
5. 不在未完成 code review、安全检查和测试时宣称完成。
