---
name: peaks-sdd
description: |
  Spec-Driven Development workflow for TypeScript projects. Handles project initialization, feature development, and bug fixing via natural language input.
  Trigger: /peaks-sdd <any natural language description> — routes to init, feature dev, or bug fix based on user intent.

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

- 先判断场景，再按需读取参考文件，不要一次性加载全部文档。
- 首次在项目中使用时，如果 `.claude/agents/` 不存在，先初始化生成 agents。
- 初始化不得批量下载外部 skills；外部 skills 是可选增强。agent 应说明当前任务是否建议安装、安装后收益，并只在用户同意后安装；缺失、拒绝或下载失败不得阻断流程。
- 初始化后优先使用生成的 `.claude/agents/*.md` 执行具体工作，而不是继续依赖本入口文件。
- 规格先于代码：PRD / OpenSpec / 技术方案确认后再实现。
- Bug 修复必须先复现和根因分析，再写修复。
- UI 设计必须经过预览和用户确认后，才能进入后续技术文档和开发。
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

### `/peaks-sdd 初始化`

1. 读取 `references/existing-project-initialization.md`。
2. 扫描当前项目。
3. 检测技术栈。
4. 生成或增量补齐 `.claude/agents/`、`.peaks/`、必要配置。
5. 验证初始化结果。

### `/peaks-sdd <功能需求>`

1. 若项目未初始化，先初始化。
2. 读取 OpenSpec / dispatcher 相关参考。
3. 创建或更新规格产物。
4. 按技术方案调度对应 agents 实现。
5. 执行 code review、安全检查、测试和 QA。

### `/peaks-sdd <异常描述>`

1. 若项目未初始化，先初始化。
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
| `docs/empty-dir-initialization.md` | 空目录初始化设计说明 |
| `docs/multi-agent-dispatcher-design.md` | 多 agent dispatcher 设计说明 |
| `templates/agents/*.md` | 初始化时复制到目标项目的 agent 模板 |
| `scripts/` | 初始化、OpenSpec、质量门禁、格式化和检查脚本 |

## Non-Negotiables

1. 不把大段参考内容复制回主上下文；按场景读取最小必要文件。
2. 不覆盖用户已有 `.claude/agents/`、`CLAUDE.md`、`settings.json`，只做增量更新。
3. 不跳过 PRD / specs / design / tasks 等规格产物直接写代码。
4. 不在未确认设计稿时进入前端实现。
5. 不在未完成 code review、安全检查和测试时宣称完成。
