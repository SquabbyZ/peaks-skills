# Peaks SDD 全新项目蜂群设计

## 目标

将 `peaks-sdd` skill 升级为面向全新项目的端到端蜂群工作流。用户可以用自然语言描述一个产品想法，系统通过结构化脑暴逐步细化需求，在用户确认产品、设计和技术决策后，由受控 agent 蜂群完成项目开发，最后启动并检查实际效果。

第一版重点聚焦全新项目。存量项目迭代和 Bug 修复仍继续走当前 router 支持的路径，但它们的蜂群化扩展先预留接口，暂不作为第一版主目标。

## 主要用户流程

```text
/peaks-sdd 我想做一个 <产品想法>
```

当当前目录为空或几乎为空时，skill 执行以下流程：

```text
意图路由
  -> 全新项目工作区初始化
  -> Product 脑暴
  -> PRD 确认
  -> 设计探索与确认
  -> 技术栈和架构确认
  -> 基于 OpenSpec 的 change/spec 记录
  -> 蜂群任务图
  -> 子 agent brief
  -> 基于 wave 的开发
  -> 集成
  -> Code Review 和安全审查
  -> QA 和 E2E 验证
  -> 开发服务器预览
  -> 最终报告
```

## 第一版非目标

- 不做无限制自主循环，不允许 agent 无限编辑下去。
- 初始化阶段不强制安装外部 skills。
- 未经用户明确确认，不自动部署到共享或外部基础设施。
- 第一版不要求实时 dashboard；静态状态产物已经足够。
- 不完整重写现有 `peaks-sdd` router，而是在全新项目流程周围扩展。
- 不把一个 skill 做成大而全的巨型入口；核心能力应拆成多个可组合子 skill / 子流程。

## 架构

### 1. 意图路由器

入口将用户请求分类为三种场景：

| 场景 | 第一版行为 |
| --- | --- |
| 全新项目 | 完整蜂群 pipeline |
| 存量项目新功能 | 保留当前初始化 + OpenSpec 路径；预留蜂群任务图接口 |
| Bug 修复 | 保留当前 dispatcher bug flow；预留 diagnosis-to-task-graph 接口 |

当目录为空，或没有真实源码树时，将其视为全新项目。如果需要项目名，dispatcher 在创建文件前先询问用户或从产品描述中推导。

### 2. Dispatcher 分层

蜂群采用分层架构：

```text
顶层 dispatcher
  -> product agent
  -> design agent
  -> architecture / tech planning agent
  -> frontend R&D dispatcher
      -> frontend child agents
  -> backend R&D dispatcher
      -> backend child agents
  -> postgres / data agent
  -> tauri / desktop agent
  -> integration agent
  -> code review agents
  -> security reviewer
  -> QA dispatcher
      -> QA child agents
  -> devops / preview agent
```

顶层 dispatcher 不负责写大部分业务代码。它负责路由、阶段门禁、任务图生成、产物校验、wave 调度、恢复和最终报告。

### 3. Artifact Bus

所有持久状态都写入 `.peaks/`，不依赖对话上下文。`.peaks/` 必须区分项目级长期信息和每次 change/feature/bug 的阶段产物，避免多次迭代后目录不可维护。

```text
.peaks/
  project/
    overview.md                 # 当前产品总览
    product-knowledge.md        # 跨迭代稳定知识
    roadmap.md                  # 可选，阶段规划
    decisions.md                # 跨 change 的长期决策索引
  current-change                # 当前活跃 change 的相对路径，例如 changes/2026-05-12-initial-product
  changes/
    2026-05-12-initial-product/
      product/
        brainstorm.md
        prd.md
      design/
        ux-flow.md
        ui-direction.md
        design-spec.md
        approved-preview.html
        screenshots/
      architecture/
        tech-stack.md
        system-design.md
        decisions.md
      openspec/
        change-name.txt
        summary.md
      enhancements.md
      swarm/
        task-graph.json
        waves.json
        status.json
        file-ownership.json
        briefs/
        reports/
      dispatch/
        frontend-task-graph.json
        backend-task-graph.json
      qa/
        test-plan.md
        e2e-report.md
        screenshots/
      review/
        code-review.md
        security-review.md
      checkpoints/
      final-report.md
    2026-06-01-user-auth/
      product/
        brainstorm.md
        prd.md
      ...
```

规则：

- 全新项目第一版也是一个 change，默认命名为 `YYYY-MM-DD-initial-product`。
- 后续迭代、功能开发和 bugfix 都创建新的 `.peaks/changes/<date>-<slug>/`。
- `.peaks/project/` 只保存跨迭代稳定信息，不保存某次 change 的过程产物。
- `.peaks/current-change` 指向当前活跃 change，dispatcher 和 child agents 通过它解析默认产物路径。
- 每个 agent 都拿到明确的 change-scoped 文件路径。每个阶段在进入下一阶段前都必须写报告。

## 全新项目阶段设计

### Phase 0：工作区初始化

只创建最小控制文件：

- `.peaks/`
- `.peaks/project/`
- `.peaks/changes/<change-id>/`
- `.peaks/current-change`
- 从 `skills/peaks-sdd/templates/agents/` 复制 `.claude/agents/`
- 仅在不存在或可安全合并时写入 `.claude/settings.json`
- `.gitnexus/` 用于决策和历史追踪
- 在产品和技术决策完成后，写入精简的 `CLAUDE.md` 项目说明

不得覆盖用户已有文件。如果文件已存在，写入 merge note，而不是直接覆盖。

### Phase 1：Product 脑暴

product agent 执行深度结构化脑暴流程。脑暴不是形式化问答，也不是快速把用户一句话改写成 PRD；它必须像一个认真负责的产品合伙人一样，帮助用户把模糊想法打磨成可开发、可验证、可取舍的产品方案。

必须覆盖：

- 澄清目标用户、待完成任务、核心工作流、约束、成功指标和首版范围
- 追问真实使用场景、用户痛点、现有替代方案、为什么现在要做
- 挑战薄弱假设，指出需求里的矛盾、风险、过大范围和伪需求
- 提出至少 2-3 个产品方向或切入点，并说明取舍
- 帮用户收敛 MVP：哪些必须做、哪些延后、哪些不做
- 把抽象描述转成具体用户故事、关键路径、核心对象和验收标准
- 记录被放弃的方向和原因，避免后续反复
- 产出 `.peaks/changes/<change-id>/product/brainstorm.md`
- 产出 `.peaks/changes/<change-id>/product/prd.md`

脑暴质量门禁：

- 不少于 5 轮有效交互，除非用户明确要求跳过。
- 每轮必须产生新的信息、决策或收敛，不允许重复套话。
- 必须包含“建设性挑战”部分，指出至少 3 个潜在问题或更好选择。
- 必须包含“产品选择记录”，说明为什么选当前 MVP。
- PRD 生成前必须得到用户对目标用户、核心流程、MVP 范围和成功标准的明确确认。
- 如果用户描述仍然模糊，product agent 必须继续追问，不得为了推进流程而假装已经清楚。

门禁：PRD 未确认或脑暴质量门禁未满足，不进入技术规划。

### Phase 2：设计探索

如果产品包含 UI，design agent 产出：

- UX flow
- 信息架构
- 视觉方向
- 组件清单
- 静态 HTML 预览或 mockup 产物
- 在浏览器验证可用时产出截图
- 第一版设计稿确认后的设计规范 `.peaks/changes/<change-id>/design/design-spec.md`

设计风格探索可以推荐用户参考 `awesome-design-md`：https://github.com/voltagent/awesome-design-md

- design agent 可基于该资源提示用户选择或组合视觉风格方向。
- 不强制依赖该仓库；如果无法访问，则使用内置风格方向和 design dials。
- 用户确认第一版设计稿后，必须生成设计规范，再进入前端技术文档。

设计阶段优先使用 `design-taste-frontend` 和 `ui-ux-pro-max` 两个技能能力：

- `design-taste-frontend` 用于提升视觉审美、避免模板感、校准风格方向和组件层次。
- `ui-ux-pro-max` 用于强化 UX flow、信息架构、交互细节、状态设计和可用性检查。
- 如果对应 skill 未安装或不可用，design agent 使用内置 Design Dials、Anti-Slop 规则、HTML 预览和截图验证作为 fallback。

设计规范必须包含：

- 设计目标和情绪关键词
- 色彩 token、字体策略、间距/圆角/阴影规则
- 页面布局原则和响应式断点
- 核心组件规范和状态（hover、focus、active、disabled、loading、empty、error）
- 动效原则和 reduced-motion 要求
- 可访问性要求
- shadcn/ui 或其他组件库的主题映射（如适用）

门禁：设计未确认或 `.peaks/changes/<change-id>/design/design-spec.md` 未生成，不进入前端技术文档。

### Phase 3：技术栈和架构

dispatcher 提出并确认：

- 包管理器
- 前端框架
- 如需要，后端框架
- 如需要，数据库类型
- 测试框架
- monorepo 或单应用结构
- 是否需要桌面应用目标；如需要，优先支持 Tauri
- 本地开发命令

数据库必须优先使用 Docker 形式运行：

- 如果项目需要数据库，默认生成 `docker-compose.yml` 或等价本地容器配置。
- 开发数据库运行在用户本机 Docker Desktop 中，而不是要求用户手动安装本地数据库服务。
- 在进入数据库相关开发或验证前，必须检查 Docker Desktop 是否已启动。
- 如果 Docker Desktop 未启动，流程应提示用户启动 Docker Desktop，并在数据库任务上返回 `BLOCKED` 或 `NEEDS_CONTEXT`，不得静默切换到本地裸机数据库。
- 只有用户明确选择外部托管数据库时，才跳过本地 Docker 数据库。

桌面应用目标支持 Tauri：

- 如果用户选择桌面应用，技术方案可以选择 Tauri，并生成 `src-tauri/`、Rust 工具链检查和 Tauri 开发命令。
- Tauri 任务由 `tauri` agent 或专门 child agent 拥有，避免普通前端 agent 修改 Rust/native 配置。
- Tauri 项目仍可共用前端栈，例如 React + Vite + shadcn/ui，但必须额外验证 `cargo` / Rust / Tauri CLI 相关命令。
- 如果本机缺少 Rust 或 Tauri 前置条件，桌面打包任务返回 `BLOCKED`，Web 预览可继续作为 fallback。

architecture agent 写入：

- `.peaks/changes/<change-id>/architecture/tech-stack.md`
- `.peaks/changes/<change-id>/architecture/system-design.md`
- `.peaks/changes/<change-id>/architecture/decisions.md`

门禁：架构未确认，不启动实现蜂群。

### Phase 4：OpenSpec 集成

OpenSpec 是可构建行为的规格账本，不是脑暴界面。

对全新项目，在 PRD、设计和架构确认后执行：

```text
openspec init
openspec new change initial-product
根据 .peaks 产物编写 proposal/specs/design/tasks
实现开始前执行 openspec apply
QA 通过后才 archive
```

如果 OpenSpec CLI 不可用，dispatcher 写入 `.peaks/changes/<change-id>/openspec/summary.md`，并继续使用内置产物推进。OpenSpec 是推荐能力，但不是首次开发的硬阻塞。

### Phase 5：蜂群任务图

dispatcher 将已确认的规格转换为一个全局任务图：

```typescript
interface SwarmTaskNode {
  id: string;
  title: string;
  domain: 'scaffold' | 'frontend' | 'backend' | 'database' | 'desktop' | 'integration' | 'qa' | 'review' | 'devops';
  agent: string;
  mayModify: string[];
  readOnly: string[];
  mustNotTouch: string[];
  dependsOn: string[];
  acceptanceCriteria: string[];
  requiredTests: string[];
  outputReport: string;
}

interface SwarmTaskGraph {
  projectName: string;
  generatedFrom: string[];
  nodes: SwarmTaskNode[];
  waves: string[][];
}
```

规则：

- 每个 wave 最多 5 个 child agents
- 第一版最多 10 个开发 child agents
- 同一 wave 内不能有重叠的 `mayModify` 文件
- 共享配置文件由 dispatcher 或专门的 integration task 拥有
- 依赖生成 contract、types、schema 的下游任务必须等待生产者任务完成
- 每个实现任务必须包含对应单元测试或明确说明无法单测的原因
- 新增业务逻辑、工具函数、hooks、服务层、数据访问层必须优先写或同步补齐单元测试
- 单元测试命令必须进入 brief 的 `requiredTests`，child agent report 必须记录测试结果

### Phase 6：子 agent Brief

每个任务在 `.peaks/changes/<change-id>/swarm/briefs/` 下得到一份 brief，包含：

- 状态契约：`DONE`、`DONE_WITH_CONCERNS`、`NEEDS_CONTEXT`、`BLOCKED`
- 目标和非目标
- 必需上下文路径
- may-modify / read-only / must-not-touch 文件边界
- 实施步骤
- 验收标准
- 必跑测试，至少包含该任务相关单元测试；如无单元测试，必须说明不可测试原因
- 输出报告路径
- 响应格式

子 agent 不得依赖父对话上下文。

### Phase 7：Wave 执行

脚手架和 UI 库规则：

- 如果前端选择 shadcn/ui，必须优先按 shadcn/ui 官方安装文档创建和初始化：https://ui.shadcn.com/docs/installation
- dispatcher 根据前端项目类型选择对应安装路径，例如 Next.js、Vite 或其他官方支持的框架。
- 不手写复制一套 shadcn/ui 初始化逻辑；只在官方 CLI 或官方文档路径无法满足项目约束时，才记录原因并采用 fallback。
- shadcn/ui 组件生成和主题配置由 frontend/design-system 任务拥有，避免多个 child agents 同时修改 `components.json`、Tailwind 配置或全局 CSS。

第一版推荐的 wave 形态：

```text
Wave 0：项目脚手架和工具链
Wave 1：设计系统、前端 shell、后端 shell、必要时数据库/schema
Wave 2：核心功能模块 + 对应单元测试
Wave 3：集成、路由、contracts、seed data + 集成测试
Wave 4：Code Review、安全审查、QA 计划
Wave 5：单元测试全量回归、E2E/smoke tests、启动修复 wave、最终预览
```

如果任务返回：

| 状态 | Dispatcher 动作 |
| --- | --- |
| DONE | 继续 |
| DONE_WITH_CONCERNS | 只有 concerns 被接受或转成后续任务后才继续 |
| NEEDS_CONTEXT | 补齐缺失产物并重跑该任务 |
| BLOCKED | 停止依赖它的下游任务并写 blocker report |

### Phase 8：Review 和 QA 循环

Code Review 和安全审查在集成后执行，并且可以并行。

- CRITICAL 或 HIGH 问题会创建 fix brief。
- fix brief 在新的 wave 中执行。
- review 重复执行，直到没有 CRITICAL/HIGH 问题，或达到最多 10 次循环。
- 条件允许时，QA 执行三轮：smoke、功能行为、regression/e2e。

### Phase 9：运行和预览

只有实际跑过结果后，流程才算完成。

对于 Web 项目：

- 从 `.peaks/current-change` 解析当前 change，并把预览证据写入该 change 目录
- 使用已确认的包管理器安装依赖
- 启动 dev server
- 在浏览器工具可用时打开应用
- 验证首页和核心 happy path
- 捕获截图，或写明为什么无法截图
- 如果启动失败，创建 startup-fix brief 并重跑相关 wave

部署是可选动作，并且因为会影响共享或外部系统，必须得到用户明确确认后才能执行。

## 集成点

### MCP

MCP servers 是可选能力提供者。它们按阶段选择，不做全局默认假设。

| MCP 类型 | 使用方 | 用途 | 是否阻塞 |
| --- | --- | --- | --- |
| Browser / Playwright | design、QA、preview | 截图、交互检查、E2E 证据 | 否；回退到本地命令和书面报告 |
| Supabase / database | postgres、backend、QA | schema 检查、migration、数据检查 | 只有用户选择该后端且已认证时才阻塞 |
| GitHub / GitLab | dispatcher、devops | issue/PR 上下文、release notes | 本地构建不阻塞；只有明确远程操作时才需要 |
| Design tool MCP | design | 检查外部设计稿 | 否；可要求用户提供素材或使用生成设计 |
| Context7 docs MCP | dispatcher、architecture、frontend、backend、tauri | 查询框架/库官方文档、安装方式、版本差异和 API 用法 | 否；无法使用时回退到内置规则或用户提供文档 |
| Context / memory MCP | dispatcher | 如已配置，检索项目事实 | 否；`.peaks/` 仍是事实源 |

项目级 MCP 配置写入 `.claude/settings.json`。如果需要认证，dispatcher 只在实际需要该能力时询问。

细粒度 MCP server 策略：

| MCP server | 默认策略 | 使用阶段 | 细粒度规则 |
| --- | --- | --- | --- |
| `gitnexus` | 初始化可配置，阶段门禁触发 | Product、Design、Architecture、Swarm、Review、Final | 只记录关键决策和审计摘要，不记录 child-agent 高频状态 |
| `claude-mem` | 初始化可配置，按长期记忆事件触发 | Product、Architecture、用户偏好确认 | 只写长期偏好、稳定项目事实、外部引用；不写 wave 状态或临时 blocker |
| `context7` | 初始化可配置，按文档查询触发 | Tech selection、shadcn/ui、Tauri、ORM/API、框架用法 | 每次只查询当前阶段需要的库；摘要写入技术文档或 `enhancements.md` |
| `fs` | 谨慎启用，优先使用 Claude Code 原生文件工具 | Initialization、Artifact validation、报告读取 | 只允许项目目录内读写；不得绕过 file ownership 和 brief 边界 |
| `claude-md-management` | 按需启用 | 初始化、规则压缩、CLAUDE.md 更新 | 只管理 `CLAUDE.md` / `CLAUDE.local.md` / rules 摘要；不得写入阶段产物 |
| `code-review` | Review 阶段启用 | Code Review、fix wave 验证 | 只读取本 change 涉及 diff 和相关上下文；输出到当前 change 的 `review/` |
| `typescript-lsp` | TypeScript 项目启用 | Frontend、Backend TS、Review | 用于定义跳转、引用分析、类型诊断；不替代测试和 typecheck 命令 |
| `superpowers` | 流程增强，按需启用 | Brainstorm、Planning、Verification | 用于流程门禁和方法论参考；不替代 peaks-sdd 自己的 artifact bus |
| `frontend-design` | UI 项目按需启用 | Design、Frontend implementation、Preview | 用于高质量 UI 设计和实现建议；必须落到 design spec 和 frontend briefs |

默认启用建议：

- `gitnexus`、`claude-mem`、`context7` 可以写入初始化配置，但只按事件触发。
- `typescript-lsp` 仅在检测到 TypeScript/JavaScript 项目时启用。
- `frontend-design` 仅在项目有 UI 时推荐启用。
- `fs`、`claude-md-management`、`code-review`、`superpowers` 应按阶段使用，不应成为所有 agent 的默认工具。

权限与边界：

- child agent 的 MCP 使用必须继承 brief 的 may-modify / read-only / must-not-touch 边界。
- 会写文件或影响项目规则的 MCP 调用必须记录在当前 change 的 report 中。
- 任何可能访问项目外文件系统、远程服务或用户全局配置的 MCP，必须先说明用途并获得用户同意。
- dispatcher 应把 MCP 能力注入到具体阶段 brief，而不是让所有 agent 默认拥有全部 MCP。

Context7 使用策略：

- 选择技术栈、安装 shadcn/ui、配置 Tauri、接入数据库 ORM、使用新框架 API 前，优先通过 Context7 查询当前官方文档。
- Context7 查询结果应摘要写入当前 change 的 `.peaks/changes/<change-id>/enhancements.md` 或对应技术文档，避免只留在对话里。
- Context7 不是记忆系统，不保存当前项目状态；项目状态仍以 `.peaks/` 为准。
- 如果 Context7 不可用，dispatcher 可以继续使用内置模板，但必须在相关报告中说明未能查询官方文档。

### Hook 脚本

Hooks 用来约束蜂群工作的安全和质量。

推荐生成的 hooks：

- pre-edit boundary guard：阻止 child agents 编辑 brief 之外的文件
- post-edit formatter：对变更文件运行项目 formatter
- post-edit lint/typecheck：对支持的技术栈运行 lint/typecheck
- context monitor：context 过高时写 checkpoint
- final verification hook：在配置存在时运行 build/test 命令

Hooks 应该是本地的、确定性的、项目自带的。默认不得调用远程 one-off package execution。

### 外部 Skills 与最佳实践生态

外部 skills 和 Claude Code best-practice 仓库用于增强深度，但不是硬依赖。它们应作为“增强源注册表”接入 peaks-sdd，而不是初始化时全部安装或复制进项目。

策略：

1. 初始化时不批量安装 skills。
2. 每个阶段只推荐最小必要集合。
3. 说明来源、收益、适用阶段和 fallback。
4. 用户拒绝、安装失败或网络不可用时继续执行。
5. 外部仓库内容必须经过 allowlist、版本记录和最小摘取，不直接无审查覆盖本地规则。
6. 每次使用外部增强源，都在当前 change 的 `.peaks/changes/<change-id>/enhancements.md` 记录来源、用途和是否安装。

增强源注册表建议：

| 来源 | 用途 | 适用阶段 |
| --- | --- | --- |
| `forrestchang/andrej-karpathy-skills` | Karpathy 风格 AI 编程、自动研究、简洁工程习惯 | Product、Architecture、Implementation |
| `shanraisshan/claude-code-best-practice` | Claude Code 工作流、上下文、工具使用最佳实践 | Dispatcher、Swarm、Quality |
| `affaan-m/everything-claude-code` | Claude Code 能力索引、命令/配置/生态参考 | Initialization、Dispatcher、DevEx |
| `AMap-Web/amap-skills` | 地图、位置服务、AMap Web 能力 | Product、Frontend、Integration |
| `pbakaus/impeccable` | 更严格的 vibe coding / agentic engineering 质量实践 | Implementation、Review、Quality |
| `mattpocock/skills` | TypeScript、类型设计、前端工程实践 | Frontend、Testing、Review |
| `MiniMax-AI/skills` | 多模态、AI 应用、模型能力相关技能 | Product、AI feature、Integration |
| `garrytan/gstack` | 浏览器验证、设计/部署/QA/创业产品工作流 | Product、Design、QA、Preview、Deploy |
| `obra/superpowers` | skill 化工作流、强制流程门禁、brainstorm/plan/verify 方法论 | Dispatcher、Product、Planning、Quality |

推荐映射：

| 阶段 | 可选 skills / 增强源 |
| --- | --- |
| Product | `brainstorming`、`office-hours`、gstack product/design workflows、Karpathy-style product challenge、superpowers brainstorming discipline |
| Design | `design-taste-frontend`、`ui-ux-pro-max`、`design-shotgun`、`design-html`、`frontend-design`、`design-md`、awesome-design-md |
| Architecture | `improve-codebase-architecture`、`plan-eng-review`、Claude Code best practices、Karpathy skills、superpowers planning discipline |
| Implementation | `subagent-driven-development`、`dispatching-parallel-agents`、framework-specific pattern skills、Matt Pocock TypeScript skills、impeccable practices |
| Frontend / UI | shadcn/ui 官方文档、Matt Pocock skills、gstack browse/design QA、AMap skills（仅地图场景） |
| AI / Multimodal | MiniMax-AI skills、Claude API skills（仅 AI 功能场景） |
| Testing | `test-driven-development`、`webapp-testing`、`e2e-testing-patterns`、gstack QA/browser workflows |
| Review | `code-review`、`security-review`、`cso`、impeccable review practices |
| Preview / deploy | `browse`、`canary`、`deployment-patterns`、gstack deploy/canary workflows |

使用模式：

```text
阶段开始
  -> dispatcher 根据 PRD/技术栈/任务类型匹配增强源
  -> 输出“推荐增强源清单”给用户
  -> 用户选择允许的增强源
  -> 只安装或引用被允许的最小集合
  -> 在 enhancements.md 记录版本、用途和 fallback
  -> agent brief 中引用具体增强源产物，而不是泛泛说“参考外部最佳实践”
```

增强源必须有三种接入等级：

| 等级 | 行为 | 适用场景 |
| --- | --- | --- |
| Reference | 只记录链接和建议，不安装 | 网络不可用、用户只想参考 |
| Import | 摘取少量规则/模板到 `.peaks/changes/<change-id>/enhancements.md` | 某阶段需要具体指导 |
| Install | 安装为 Claude skill 或复制到 `.claude/skills/` | 用户明确批准并且会重复使用 |

### OpenSpec

OpenSpec 在产品、设计和架构决策确认后使用。它为蜂群提供行为规格和归档路径。

- 全新项目：记录 initial product change。
- 存量功能：默认走 OpenSpec 路径。
- Bug 修复：通常跳过 OpenSpec，除非修复改变了预期行为。

dispatcher 不应混用多套 spec 状态机。如果 OpenSpec 已启用，当前 change 目录下的 `.peaks/changes/<change-id>/openspec/` 应链接到 OpenSpec 路径，而不是复制一套重复状态。

### Persistence Policy：GitNexus 与 Claude Memory / claude-mem

GitNexus 和 claude-mem 不需要高频触发，也不能假设完全自动进行。它们应作为轻量、阶段性、事件驱动的持久化层，由 dispatcher 在关键门禁点触发。

状态归属：

| 信息类型 | 写入位置 |
| --- | --- |
| 实时运行状态 | `.peaks/changes/<change-id>/swarm/status.json` |
| 阶段产物 | `.peaks/changes/<change-id>/` |
| 跨迭代产品知识 | `.peaks/project/` |
| 决策原因和阶段审计 | `.gitnexus/` |
| 长期用户/项目偏好 | claude-mem / memory |

GitNexus 记录“为什么这样决策”，不记录每个小动作。推荐触发点：

- Product 脑暴结束：记录 MVP 选择、放弃方向、关键产品决策。
- 设计稿确认：记录视觉方向、设计规范版本。
- 技术栈确认：记录为什么选 Next/Vite/Tauri/Docker DB 等。
- swarm task graph 生成：记录任务图版本和文件边界策略。
- review/QA 完成：记录质量门禁结果。
- final report：记录最终验收摘要。

不建议每个 child agent 完成后写 GitNexus；child agent 状态只写 `.peaks/changes/<change-id>/swarm/status.json`。

Claude Memory / claude-mem 用于持久的用户/项目事实，不用于临时任务状态。适合写入 memory 的内容：

- 用户表达长期偏好，例如“脑暴不要敷衍”。
- 用户确认未来项目也应遵守的规则。
- 从代码和当前产物中看不出来的稳定产品决策。
- 外部资源引用和团队约定。

不适合写入 memory 的内容：

- 当前 wave 状态
- child-agent 进度
- 当前 PRD 草稿
- 临时 blocker
- 文件所有权

这些应写入当前 change 目录中的 `.peaks/changes/<change-id>/swarm/status.json`、`.peaks/changes/<change-id>/checkpoints/` 和 `.peaks/changes/<change-id>/final-report.md`。

### Skill 拆分策略

Claude skill 不应该做成一个大而全的巨型说明文件。`peaks-sdd` 应保留为总入口和路由器，把蜂群能力拆成多个小 skill 或可独立引用的子流程。

建议拆分：

| 子能力 | 职责 |
| --- | --- |
| `peaks-sdd` | 总入口、意图路由、场景选择、加载必要子流程 |
| `peaks-sdd-new-project` | 全新项目从脑暴到预览的主流程 |
| `peaks-sdd-swarm` | 任务图、brief、wave 调度、状态恢复 |
| `peaks-sdd-design` | 产品 UI/UX、design-taste、ui-ux-pro-max、awesome-design-md 风格选择、HTML 预览、设计规范 |
| `peaks-sdd-data-docker` | 数据库 Docker Compose、Docker Desktop 检查、migration 验证 |
| `peaks-sdd-frontend-shadcn` | shadcn/ui 官方安装路径、组件生成、主题边界 |
| `peaks-sdd-tauri` | Tauri 桌面目标、Rust/Tauri 前置检查、桌面预览 |
| `peaks-sdd-quality` | 单元测试、集成测试、review、安全、QA gates |
| `peaks-sdd-enhancements` | 外部 skills / best-practice 源注册表、按阶段推荐、安装与引用记录 |

拆分原则：

- 总入口只做路由和关键门禁，不塞满所有领域细节。
- 每个子 skill 能独立解释一个阶段或能力，方便未来单独优化。
- 共享协议（artifact bus、brief、status contract）放在 `peaks-sdd-swarm`，其他子 skill 引用它。
- 外部 skills 仍是增强层，由 `peaks-sdd-enhancements` 统一推荐、记录和治理，不和其他 peaks-sdd 子 skill 强绑定。

### GitNexus

GitNexus 是本地决策和可追踪性层。

使用 `.gitnexus/` 记录：

- 阶段决策
- 已确认的 PRD / 设计 / 架构 checkpoint
- 任务图版本
- review 循环
- 最终验证摘要

GitNexus 不替代 git 历史。GitNexus 记录蜂群为什么做这些决策；git 记录实际改了什么。GitNexus 的写入由 Persistence Policy 的阶段触发点控制，不在每个 child-agent 小步骤中触发。

## 安全和恢复

### 文件所有权

每个实现 wave 前生成 `file-ownership.json`：

```json
{
  "src/app/page.tsx": "FE-001",
  "src/components/theme.css": "FE-002",
  "package.json": "INTEGRATION-001"
}
```

dispatcher 根据该映射校验 child reports。

### Checkpoints

每个阶段结束时，以及上下文压力较大的操作前：

- 写入当前 change 的 `.peaks/changes/<change-id>/checkpoints/[phase].md`
- 包含当前目标、已完成任务、阻塞项、关键文件、下一条命令
- compact 或中断后，从 checkpoint 恢复，而不是依赖对话记忆

### 失败处理

| 失败 | 恢复方式 |
| --- | --- |
| 缺少上下文 | 写入 `NEEDS_CONTEXT`，创建或补齐缺失产物，重跑任务 |
| 文件冲突 | 停止 wave，指定 integration owner，重新生成 briefs |
| 测试失败 | 创建 scoped 到失败行为的 fix brief |
| 构建失败 | 创建 startup/build-fix brief |
| 外部 skill 不可用 | 继续使用内置模板 |
| MCP 认证不可用 | 使用本地 fallback 继续，或只在确实需要时询问 |

## 成功标准

第一版成功的标准是，一次全新项目运行可以：

1. 从自然语言中识别全新项目请求。
2. 通过深度脑暴质量门禁，并产出确认后的 PRD、设计和架构产物。
3. 生成全局蜂群任务图和子 agent briefs。
4. 以受控 wave 执行实现。
5. 通过 fix briefs 执行 review、安全和 QA 循环。
6. 启动生成的应用，或产出精确 blocker report。
7. 写入最终报告，并链接所有产物和验证证据。

## 实施备注

可能需要更新的文件：

- `skills/peaks-sdd/SKILL.md`
- `skills/peaks-sdd/references/empty-project-workflow.md`
- `skills/peaks-sdd/references/dispatch-quickref.md`
- `skills/peaks-sdd/references/optional-skills.md`
- `skills/peaks-sdd/references/openspec-workflow.md`
- `skills/peaks-sdd/references/memory-and-context.md`
- `skills/peaks-sdd/references/resource-index.md`
- `skills/peaks-sdd/references/rd-dispatcher-protocol.md`
- `skills/peaks-sdd/templates/agents/dispatcher.md`
- `skills/peaks-sdd/templates/agents/product.md`
- `skills/peaks-sdd/templates/agents/design.md`
- `skills/peaks-sdd/templates/agents/qa/qa-child.md`
- `skills/peaks-sdd/scripts/lib/dispatcher-engine.mjs`
- `skills/peaks-sdd/scripts/workflow-continuer.mjs`
- `skills/peaks-sdd/scripts/verify-artifacts.mjs`

优先围绕现有 dispatcher engine 增加一层小的 `swarm` 能力，而不是整体替换当前实现。
