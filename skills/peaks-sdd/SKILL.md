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

## 自动决策 (Auto-Detection)

当用户运行 `/peaks-sdd` 时，**理解用户意图**，无需精确匹配关键词：

```
用户输入任何内容
    ↓
┌─ 是"初始化项目"？ ─────────────────────────────┐
│  ✅ 是 → Phase 0: 扫描技术栈,生成 .claude/agents/  │
│  ❌ 否 → 继续判断                                │
└────────────────────────────────────────────────┘
    ↓
┌─ 是"东西坏了/不工作"？ ──────────────────────────┐
│  意图特征：报错、崩溃、没反应、点击无响应、白屏、     │
│  接口报错、数据不对、样式错乱、任何"应该能用但不能用"   │
│  ✅ 是 → Bug 修复 (peaksbug 8阶段调试)              │
│  ❌ 否 → 功能开发 (OpenSpec 完整开发流程)           │
└────────────────────────────────────────────────┘
```

**核心原则**：用户说 `/peaks-sdd <任何内容>` 一定有对应的工作流。

- 初始化：明确说"初始化"、"setup"
- Bug 修复：用户描述的是**现有行为的异常**
- 功能开发：**所有其他情况**（默认兜底）

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

## 核心架构

A Spec-Driven Development workflow for **任意 TypeScript 项目**。自动检测项目技术栈并动态生成对应的 Agent 配置。

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

| 文件                                   | 作用域   | 用途                     | 是否入 Git       |
| -------------------------------------- | -------- | ------------------------ | ---------------- |
| `CLAUDE.md`                            | 项目级   | 项目说明、上下文、规则   | ✅ 必入          |
| `CLAUDE.local.md`                      | 个人偏好 | 本地偏好设置             | ❌ 需 .gitignore |
| `.claude/rules/*.md`                   | 规则文件 | 懒加载规则（按路径触发） | ✅ 必入          |
| `.peaks/`                              | 工作目录 | PRD、Plan、报告等产出物  | ✅ 必入          |
| `~/.claude/CLAUDE.md`                  | 全局     | 所有项目的通用规则       | N/A              |
| `~/.claude/projects/<project>/memory/` | 项目记忆 | claude-mem 持久化        | ❌               |

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

| 文件                 | 行数限制 | 超过时                   |
| -------------------- | -------- | ------------------------ |
| `CLAUDE.md`          | < 200 行 | 归档到 `.peaks/context/` |
| `.claude/rules/*.md` | 无限制   | 懒加载，不占主上下文     |

### Agent Memory 作用域

| 作用域            | 用途                       | 生命周期          |
| ----------------- | -------------------------- | ----------------- |
| `memory: project` | 项目上下文（技术栈、架构） | 跨 Agent 调用保持 |
| `memory: user`    | 用户偏好、工作方式         | 跨项目保持        |
| `memory: local`   | 单次任务临时数据           | 仅当前 Agent      |

### peaks-sdd Memory 策略

1. **项目初始化后**：CLAUDE.md 包含技术栈、目录结构、开发命令
2. **Phase 1-6 产出**：归档到 `.peaks/prds/`、`.peaks/plans/` 等
3. **跨会话记忆**：claude-mem MCP 自动持久化关键上下文
4. **定期 Compact**：`/compact` 触发时自动清理冗余上下文

### Context 估算与 Compact

| Context 占用 | 动作                                                 |
| ------------ | ---------------------------------------------------- |
| < 50%        | 正常继续                                             |
| 50-70%       | 关注，产出中间文件减轻 context 压力                  |
| >= 70%       | **强制**：产出当前阶段文件 → 执行 `/compact` → 继续  |
| >= 85%       | **阻断**：停止当前工作 → `/compact` → 用户确认后继续 |

**按阶段区分自动化级别**：

| 阶段类型   | 示例                              | context >= 75%                    | context >= 90%      |
| ---------- | --------------------------------- | --------------------------------- | ------------------- |
| **半自动** | Constitution、PRD、设计           | 警告 + 产出检查点 + 等待确认      | 阻断 + 等待确认     |
| **全自动** | 开发、Code Review、安全检测、测试 | **自动产出保护** → compact → 继续 | 自动 compact → 继续 |

**阈值优化**：

- 触发阈值：75%（比 70% 多 5% 缓冲，减少不必要的 compact）
- 阻断阈值：90%（给更多工作空间）

**工作保护机制**（全自动阶段触发前）：

1. 强制产出当前进度到 `.peaks/checkpoints/`
2. 保护未保存的工作（代码块、修改内容）
3. 产出检查点包含完整上下文恢复信息

**全自动阶段检测**：

- peaksfeat Step 9（前端/后端开发）
- peaksfeat Step 10（自动化测试）
- peaksfeat Step 11（报告生成）
- Code Review（前端/后端）
- Security Review
- QA 验证

**与 /loop 配合**：

- 长任务使用 `/loop` 动态唤醒，每次唤醒检查 context 状态
- 每个 loop 迭代优先产出文件（.peaks/ 目录），而非依赖 context 传递
- context 过高时 loop 自动触发 compact 流程

### /loop 集成策略

peaks-sdd 利用 Claude Code 的 `/loop`（ScheduleWakeup）实现长任务自治：

**适用场景**：

| 场景                              | loop 用法                    | 收益                   |
| --------------------------------- | ---------------------------- | ---------------------- |
| peaksfeat Step 9（多模块开发）    | 每个模块一次 loop 迭代       | 独立 context，避免溢出 |
| peaksbug Phase 3（diagnose 探测） | 自动重试假设验证循环         | 无需人工等待           |
| 长任务中断恢复                    | loop 从 .peaks/ 产出文件恢复 | 跨 session 持续        |

**loop 执行原则**：

1. **产出优先**：每次 loop 迭代必须将中间结果写入 `.peaks/` 文件
2. **上下文最小化**：loop prompt 只包含当前任务描述 + .peaks/ 中的必要文件路径
3. **context 守门**：loop 唤醒时第一件事检查 contextEstimate，>= 75% 先 compact
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

## 空目录初始化（从零创建项目）

当用户描述想要做什么，但目录是空的或几乎没有文件时，使用空目录初始化流程。

### 判断逻辑

```
当前目录为空或仅有少量配置文件（如 package.json 而无 src/）
    ↓
┌─ 用户是否描述了想要的东西？ ─────────────────┐
│  "我想做一个博客"、"做个管理后台"、"我要个聊天应用"   │
│  ✅ 是 → 进入空目录初始化流程                    │
│  ❌ 否 → 进入已有项目初始化（Phase 0）            │
└─────────────────────────────────────────────┘
```

### 空目录初始化流程（10 步：交互阶段 → 自动执行阶段）

```
┌─────────────────────────────────────────────────────────────────┐
│ [交互阶段 - 需用户确认]                                           │
├─────────────────────────────────────────────────────────────────┤
│ Step 1: AskUserQuestion 确认项目名称                              │
│   → AskUserQuestion 确认项目名称                                  │
│   → mkdir -p {{PROJECT_NAME}} && cd {{PROJECT_NAME}}           │
│   产出：项目目录                                                  │
├─────────────────────────────────────────────────────────────────┤
│ Step 1.5: 创建项目目录 + 初始化                                    │
│   → mkdir -p {{PROJECT_NAME}} && cd {{PROJECT_NAME}}           │
│   → 安装 peaks-sdd skill 和 MCP（如未安装）                       │
│   → 复制所有 agent 模板到 .claude/agents/                        │
│   产出：项目目录结构 + agent 模板                                  │
├─────────────────────────────────────────────────────────────────┤
│ Step 2: 调用 product agent 脑暴                                   │
│   → 调度 product agent 进行多轮 brainstorm（至少 5 轮）            │
│   → 使用 AskUserQuestion 多轮交互                                 │
│   产出：.peaks/prds/brainstorm-[日期].md                          │
│        .peaks/prds/prd-[功能名]-[日期].md                         │
├─────────────────────────────────────────────────────────────────┤
│ Step 2.5: [自动] 知识积累                                         │
│   → 调度 product agent 生成 product-knowledge.md                 │
│   产出：.peaks/knowledge/product-knowledge.md                    │
├─────────────────────────────────────────────────────────────────┤
│ Step 3: 确认技术栈                                                │
│   → AskUserQuestion 确认技术栈（前端/后端/数据库/Monorepo）        │
│   产出：技术栈确定                                                 │
├─────────────────────────────────────────────────────────────────┤
│ Step 4: 设计稿（如有前端）                                        │
│   → 调度 design agent                                             │
│   → 确认 Design Dials + 7种风格选择（必须用 AskUserQuestion）      │
│   → 生成 HTML 设计稿 + HTTP 服务器 + Playwright 预览              │
│   → 迭代修改直到用户选择"整体满意"                               │
│   → 截图保存 + 产出 design-spec                                   │
│   ⚠️ 用户未选择"整体满意"，禁止进入 Step 4.5                     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ [自动执行阶段 - 无需用户确认]                                     │
├─────────────────────────────────────────────────────────────────┤
│ Step 4.5: [确认后] 生成技术文档 + 测试用例                         │
│   前置条件：设计稿已通过用户确认                                   │
│   ├─ 研发 agent 生成技术文档 → .peaks/tech/tech-doc-[date].md    │
│   └─ qa-coordinator 生成详细测试用例                              │
│       产出：.peaks/test-docs/test-case-[功能名]-[日期].md        │
├─────────────────────────────────────────────────────────────────┤
│ Step 5: [自动] dispatcher 拆分子 agent 开发                        │
│   前置条件：技术文档 + 测试用例已完成                             │
│   dispatcher 流程：                                              │
│   1. dispatcher 读取 .claude/agents/dispatcher.md               │
│   2. dispatcher 分析任务涉及哪些模块                              │
│   3. dispatcher 生成执行计划（独立任务并行，有依赖串行）          │
│   4. dispatcher 调度子 agent 进行开发                             │
│      ├─ 各子 agent 基于技术文档开发                               │
│      ├─ 各子 agent 完成自测，产出 [module]-self-test-[date].md  │
│      └─ dispatcher 汇总所有自测报告 → dispatcher-summary-[date].md│
├─────────────────────────────────────────────────────────────────┤
│ Step 6: [自动] CodeReview + 安全检查（并行）                       │
│   前置条件：开发完成                                              │
│   [并行执行]                                                      │
│   ├─ code-reviewer-frontend（如有前端）                           │
│   ├─ code-reviewer-backend（如有后端）                            │
│   └─ security-reviewer                                           │
│                                                                  │
│   ┌─ 检查结果 ─────────────────────────────────────────┐        │
│   │  ✅ 全部通过 → 进入 Step 7                         │        │
│   │  ❌ 有问题 → 自动通知对应 agent 修复               │        │
│   │         → 修复后重新执行 Step 6                    │        │
│   │         → 循环直到全部通过（最多 10 次）           │        │
│   └────────────────────────────────────────────────────┘        │
├─────────────────────────────────────────────────────────────────┤
│ Step 7: [自动] 3 轮 QA 测试                                       │
│   前置条件：CodeReview + 安全检查全部通过                         │
│   qa-coordinator 流程：                                          │
│   1. 读取：PRD + 设计稿 + 测试用例 + dispatcher 汇总报告         │
│   2. 第 1 轮 QA：                                                │
│      ├─ qa-coordinator 分配任务给所有 QA 子 agent（并行）        │
│      │   ├─ qa-frontend                                         │
│      │   ├─ qa-backend                                          │
│      │   ├─ qa-frontend-perf                                    │
│      │   ├─ qa-backend-perf                                     │
│      │   ├─ qa-security                                         │
│      │   └─ qa-automation（执行存量自动化测试）                  │
│      ├─ qa-coordinator 汇总结果 → round-1-issues.md             │
│      └─ 决策：有/无问题 → 第 2 轮                                │
│   3. 第 2 轮 QA（重复流程）                                      │
│   4. 第 3 轮 QA（最终验证）                                      │
│   5. 生成最终报告 → .peaks/reports/final-report-[日期].md       │
├─────────────────────────────────────────────────────────────────┤
│ Step 8: [可选] 部署                                               │
│   前置条件：所有 QA 测试通过                                      │
│   devops 流程：                                                   │
│   1. Docker 构建                                                 │
│   2. 服务部署                                                     │
│   3. 健康检查                                                     │
│   4. 通知用户                                                     │
│   产出：.peaks/deploys/deploy-[环境]-[日期].log                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Step 1: 确认项目名称

使用 AskUserQuestion 询问项目名称，并提供"Other"选项支持自定义输入：

```
请选择项目名称：

- A: AI Chat（默认）
- B: 智能助手
- C: 对话平台
- D: 其他

💡 可以选择 "Other" 手动输入项目名称
```

**必须使用 AskUserQuestion 工具提供以上选项**

#### Step 1.5: 创建项目目录 + 初始化

**确认项目名称后，立即创建项目目录并复制 agent 模板**：

```bash
# 假设用户确认项目名为 "AI Chat"
# Step 1 只是确认名称，不创建目录

# Step 1.5 创建目录并初始化
mkdir -p {{PROJECT_NAME}}  # 如 "ai-chat"
cd {{PROJECT_NAME}}

# 复制所有 agent 模板到 .claude/agents/（重要：必须先复制再脑暴）
SKILL_PATH=$(find ~/.claude/skills/peaks-sdd/templates/agents -maxdepth 1 -name "*.md" | head -1 | sed 's|/[^/]*$||;s|/templates/agents||')
if [ -z "$SKILL_PATH" ] || [ ! -d "$SKILL_PATH/templates/agents" ]; then
  # 本地开发路径
  SKILL_PATH="/Users/yuanyuan/Desktop/peaks-skills/skills/peaks-sdd"
fi

# 创建目录结构
mkdir -p .peaks/prds
mkdir -p .peaks/designs
mkdir -p .peaks/knowledge
mkdir -p .peaks/tech
mkdir -p .peaks/swagger
mkdir -p .peaks/reports
mkdir -p .peaks/test-docs
mkdir -p .peaks/checkpoints
mkdir -p .peaks/deploys
mkdir -p .claude/agents

# 创建 .gitnexus 目录（用于 gitnexus MCP）
mkdir -p .gitnexus

# 复制所有 .md 文件
cp -f "$SKILL_PATH/templates/agents"/*.md .claude/agents/ 2>/dev/null || true

# 复制 qa 子目录（qa 是一个目录，包含多个 qa agent）
cp -rf "$SKILL_PATH/templates/agents/qa" .claude/agents/ 2>/dev/null || true

# 复制 sub-front 和 sub-back 子目录
cp -rf "$SKILL_PATH/templates/agents/sub-front" .claude/agents/ 2>/dev/null || true
cp -rf "$SKILL_PATH/templates/agents/sub-back" .claude/agents/ 2>/dev/null || true

# 创建 settings.json 初始化 MCP（增量更新）
if [ ! -f .claude/settings.json ]; then
  cat > .claude/settings.json << 'EOF'
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
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp@latest"]
    }
  }
}
EOF
fi

# 替换 {{PROJECT_PATH}} 为实际路径
PROJECT_ABS_PATH=$(pwd)
sed -i "s|{{PROJECT_PATH}}|$PROJECT_ABS_PATH|g" .claude/settings.json 2>/dev/null || true

# 确认 agent 模板已复制
ls .claude/agents/
```

**复制后确认**：
- `.claude/agents/` 下有所有 agent 文件（product.md, design.md, frontend.md, backend.md, qa.md, peaksfeat.md, peaksbug.md 等）
- `.claude/agents/qa/` 目录存在（包含 qa 子 agent）
- `.claude/agents/sub-front/` 和 `.claude/agents/sub-back/` 目录存在
- `.claude/settings.json` 已创建（包含 MCP 配置）
- `.gitnexus/` 目录已创建
- `.peaks/` 下已创建：prds, designs, knowledge, tech, swagger, reports, test-docs, checkpoints, deploys

**注意**：Step 1 只确认名称，Step 1.5 才创建目录。后续所有产出物都放在项目目录下，避免散落。

#### Step 2: 调用 product agent 脑暴 + 生成 PRD

**必须使用 peaksfeat 调度 `🟦 [product]` agent** 进行深度交互式脑暴。

**脑暴核心要求**：
1. 脑暴必须产出 `.peaks/prds/brainstorm-[日期].md` 文件
2. **没有 brainstorm 文件，不进入下一步**
3. 脑暴必须深入，**至少 5 轮以上交互**（使用 AskUserQuestion）
4. 必须提出**建设性建议**（安全性/UX/性能/监控）并记录用户选择

**Brainstorm 检查点**（每轮都要检查）：

- [ ] 文件存在：`.peaks/prds/brainstorm-[日期].md`
- [ ] 内容包含：业务类型、目标用户、核心流程、边界场景
- [ ] 脑暴轮次 >= 5 轮
- [ ] **已提出建设性建议并记录用户选择**
- [ ] 用户明确表示"没有需要补充的"或类似确认

**脑暴问题示例**（每轮只问一个核心问题）：

第 1 轮：
- "这个项目的核心定位是什么？是客服机器人、AI 助手、还是其他？"

第 2 轮：
- "目标用户是谁？是企业内部员工、C 端客户、还是开发者？"

第 3 轮：
- "核心功能有哪些？登录、对话、历史记录、还是其他？"

第 4 轮：
- "是否需要考虑安全性？如用户认证、内容审核、数据加密？"

第 5 轮：
- "有什么性能要求？如响应时间、并发数、数据量？"

**产出**：

```
.peaks/prds/brainstorm-[日期].md
.peaks/prds/prd-[功能名]-[日期].md  （PRD 确认后生成）
```

#### Step 2.5: [自动] 知识积累

**PRD 确认后自动执行，无需用户确认**

调度 product agent 更新知识积累：

1. **读取 PRD**：`.peaks/prds/prd-[功能名]-[日期].md`
2. **提取业务知识**：
   - 业务类型
   - 目标用户
   - 核心业务流程
   - 商业模式
   - 用户痛点
   - 竞品参考
   - 功能优先级
3. **更新知识文件**：`.peaks/knowledge/product-knowledge.md`

**知识文件格式**：
```markdown
# Product Agent 知识积累

## 业务理解
### 业务类型
- [从 PRD 提取]

### 目标用户
- [从 PRD 提取]

### 核心业务流程
- [从 PRD 提取]

## 功能优先级
- P0: [核心功能]
- P1: [次要功能]
- P2: [可延迟功能]

## 更新记录
| 日期 | 更新内容 | 来源 |
| ---- | -------- | ---- |
```

#### Step 3: 确认技术栈（基于 PRD）

使用 AskUserQuestion 让用户选择（结合 PRD 中的建议）：

```
请确认技术栈：

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

📦 项目结构：前后端项目默认使用 Monorepo（packages/web + packages/server）
```

**⚠️ 确认后先搜索官方创建方式**
确定技术栈后，必须先搜索对应技术的官方文档/CLI最佳实践，优先使用官方工具创建项目。

#### Step 5: 创建项目 + 设计确认（并行）

**⚠️ 重要原则：确定技术栈后，必须先搜索官方最佳实践**

- 不自己猜测命令
- 优先使用官方 CLI 工具
- 参考官网文档的创建方式
- 如有疑问，先查文档再执行

**⚠️ 包管理器：优先使用 pnpm，如未安装则使用 npm 全局安装**

```bash
# 确保 pnpm 已安装
if ! command -v pnpm &> /dev/null; then
  npm install -g pnpm
fi

[A] 项目创建命令（使用官方 CLI）：

Monorepo 结构（前后端项目默认）：
```bash
# 在项目目录下执行
echo '{"packages": ["packages/*"]}' > pnpm-workspace.yaml
echo '{"name": "{{PROJECT_NAME}}", "private": true}' > package.json

# 创建前端包（使用官方创建方式）
mkdir -p packages/web
pnpm exec shadcn@latest init packages/web --yes

# 创建后端包（使用 --directory 在 monorepo 中创建 NestJS 项目）
pnpm dlx @nestjs/cli new server --directory packages/server --skip-git --package-manager pnpm
```

单包结构（纯前端或纯后端项目）：
```bash
# 纯前端
pnpm exec shadcn@latest init . --yes

# 纯后端
pnpm dlx @nestjs/cli new . --skip-git --package-manager pnpm
```

[B] Design 完整流程（无前端则跳过）：
- **Step 4.1**: 确认 Design Dials（VARIANCE/MOTION/DENSITY）- 使用 AskUserQuestion
- **Step 4.2**: 选择 7 种视觉风格之一 - 使用 AskUserQuestion
- **Step 4.3**: 生成 HTML 设计稿
- **Step 4.4**: 启动 HTTP 服务器 + Playwright 实时预览
- **Step 4.5**: 迭代修改（使用 Playwright 快照定位）直到用户选择"整体满意"
- 产出：`.peaks/designs/[功能名]-[日期].html` + `.peaks/designs/[功能名]-[日期].png`

**⚠️ 设计确认必须完成才能进入下一步**：
- 必须使用 AskUserQuestion 让用户从 7 种风格中选择
- 生成 HTML 后必须用 Playwright 预览
- 用户必须选择"整体满意"才算确认
- 未确认设计稿，禁止进入 Step 4.5

**注意**：A 和 B 可并行执行，完成后汇合进入 Step 4.5

**⚠️ 设计确认必须完成才能进入下一步**
- 设计稿必须通过用户明确确认（使用 AskUserQuestion）
- 未确认设计稿，禁止进入 Step 4.5
- 设计稿截图必须保存到 `.peaks/designs/[功能名]-[日期].png`

#### Step 4.5: [并行] 生成技术文档 + 数据表 + 测试用例

**前置条件**：PRD 已确认、设计稿已通过用户确认
**必须使用 AskUserQuestion 确认设计稿后才能执行此步骤**

**[三个 agent 并行执行]**：

1. **frontend agent 生成前端技术文档**：
   - 读取 PRD + 设计稿
   - 分析前端技术方案（组件结构、状态管理、路由、API Mock方案）
   - 产出 `.peaks/tech/frontend-tech-doc-[功能名]-[日期].md`

2. **backend agent 生成后端技术文档**：
   - 读取 PRD + 设计稿
   - 分析后端技术方案（API设计、模块划分、业务逻辑）
   - 产出 `.peaks/tech/backend-tech-doc-[功能名]-[日期].md`

3. **postgres agent 生成数据库表设计**：
   - 读取 PRD + 设计稿
   - 设计数据模型（表结构、索引、约束）
   - 产出 `.peaks/tech/db-schema-[功能名]-[日期].md`

4. **qa-coordinator 生成测试用例**：
   - 读取 PRD + 设计稿
   - 编写详细测试用例（功能/边界/安全/性能/兼容性）
   - 产出 `.peaks/test-docs/test-case-[功能名]-[日期].md`

**[使用 AskUserQuestion 确认这四份文档]**：

```
请确认以下文档：

- A: 前端技术文档 ✅
- B: 后端技术文档 ✅
- C: 数据库表设计 ✅
- D: 测试用例 ✅

💡 全部确认后，进入开发阶段
**必须使用 AskUserQuestion 提供选项，确认全部文档后，才能进入 Step 5**
```

**文档格式要求**：

**前端技术文档格式**：
```markdown
# 前端技术方案 - [功能名]

## 概述
- 功能描述
- 前端技术目标

## 技术架构
- 组件结构
- 状态管理方案
- 路由设计

## API Mock 方案
### 接口列表
| 接口 | 方法 | 路径 | Mock 数据 |
|------|------|------|-----------|
| /api/xxx | GET | /api/xxx | {...} |

## 组件清单
| 组件名 | 用途 | 依赖 |
|--------|------|------|
| Button | 按钮 | - |

## 开发任务拆分
| 任务 | 优先级 | 依赖 |
|------|--------|------|
| 登录页面 | P0 | - |
```

**后端技术文档格式**：
```markdown
# 后端技术方案 - [功能名]

## 概述
- 功能描述
- 后端技术目标

## API 设计
### 接口列表
| 接口 | 方法 | 路径 | 请求 | 响应 |
|------|------|------|------|------|
| /api/xxx | POST | /api/xxx | {...} | {...} |

### swagger.json 生成
- 路径：`.peaks/swagger/swagger-[功能名].json`
- 使用 swagger 规范定义所有 API

## 模块划分
| 模块 | 职责 | 依赖 |
|------|------|------|
| auth | 认证 | - |

## 开发任务拆分
| 任务 | 优先级 | 依赖 |
|------|--------|------|
| 用户注册API | P0 | - |
```

**数据库表设计格式**：
```markdown
# 数据库表设计 - [功能名]

## 表结构
### user
| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| name | VARCHAR | NOT NULL | 用户名 |

## 索引设计
| 表名 | 字段 | 类型 |
|------|------|------|
| user | email | UNIQUE |

## 关联关系
[ER图]
```

**测试用例格式**（必须包含以下全部内容）：
```markdown
# 测试用例 - [功能名]

## 测试范围
- 测试模块
- 测试类型（功能/边界/性能/安全）

## 功能测试用例

### TC-001: [用例标题]
| 项目 | 内容 |
|------|------|
| 用例ID | TC-001 |
| 用例标题 | [具体功能点] |
| 测试模块 | [所属模块] |
| 前置条件 | 1. 用户已登录<br>2. 网络正常 |
| 测试步骤 | 1. 进入[页面]<br>2. 点击[按钮]<br>3. 输入[数据]<br>4. 提交 |
| 测试数据 | username: "test_user" |
| 预期结果 | 1. 页面跳转<br>2. 显示成功提示 |
| 优先级 | P0/P1/P2 |

## 边界测试用例
[详细边界测试用例...]

## 安全测试用例
[SQL注入、XSS测试...]

## 性能测试用例
[响应时间测试...]

## 兼容性测试用例
[浏览器兼容性...]
```

#### Step 5: [自动] 前端蜂群 + 后端蜂群 + 数据库并行开发

**前置条件**：四份文档已全部确认（前端技术文档、后端技术文档、数据库表设计、测试用例）
**无需用户确认，自动执行**

**⚠️ 子 agent 规则**：
- **最多创建 10 个子 agent**
- **分配任务时考虑细粒度**：任务拆分要合理，避免过于细碎或过于粗大
- **独立任务可并行**：无依赖的任务同时开发
- **依赖任务需等待**：等依赖的 agent 完成后，基于最新代码继续开发

**[并行执行三个开发任务]**：

1. **frontend 蜂群开发**（使用 `templates/agents/sub-front/` 中的 frontend agent）：
   - 读取 `.peaks/tech/frontend-tech-doc-[功能名]-[日期].md`
   - 基于 `.peaks/swagger/swagger-[功能名].json` 使用 msw/mock 模拟数据
   - 创建子 agent（最多 10 个），分配前端任务
   - 各子 agent 使用 `sub-agent.md` 模板开发
   - 完成后产出自测报告，**单元测试覆盖率 >= 95%**
   - 汇总到 `frontend-summary-[date].md`

2. **backend 蜂群开发**（使用 `templates/agents/sub-back/` 中的 backend agent）：
   - 读取 `.peaks/tech/backend-tech-doc-[功能名]-[日期].md`
   - 读取 `.peaks/swagger/swagger-[功能名].json`
   - 创建子 agent（最多 10 个），分配后端任务
   - 各子 agent 使用 `sub-agent.md` 模板开发
   - 完成后产出自测报告，**单元测试覆盖率 >= 95%**
   - 汇总到 `backend-summary-[date].md`

3. **postgres 数据库创建**：
   - 读取 `.peaks/tech/db-schema-[功能名]-[日期].md`
   - 执行 `npx prisma init` → 编写 schema → `npx prisma migrate`
   - 生成 `prisma/schema.prisma` 和迁移脚本
   - 汇总到 `db-summary-[date].md`

**[前后端联调]**（三个任务都完成后）：
- 前端切换 Mock → 真实 API
- 验证数据一致性
- 产出 `integration-report-[date].md`

**[汇总报告]**：
- 收集所有自测报告
- 生成 `dispatcher-summary-[date].md`
- 检查是否有 BLOCKER 问题

#### Step 6: [自动] CodeReview + 安全检查

**前置条件**：开发完成
**无需用户确认，自动执行**

**[并行执行]**：

1. **code-reviewer-frontend**（如有前端）
2. **code-reviewer-backend**（如有后端）
3. **security-reviewer**

**检查结果处理**：
- ✅ 全部通过 → 进入 Step 7
- ❌ 有问题 → 自动通知对应 agent 修复
  → 修复后重新执行 Step 6
  → 循环直到全部通过（**最多 10 次循环**）

**CR+安全循环终止条件**：
- 最大循环次数：10 次
- 每次循环记录问题到 `.peaks/checkpoints/cr-issues-[N].md`
- 超过限制：中断流程，通知用户手动处理

**自动返回开发的触发条件**：
- HIGH/CRITICAL 问题自动返回
- frontend 相关问题 → frontend agent
- backend 相关问题 → backend agent
- 安全问题 → 对应 agent

#### Step 7: [自动] 3 轮 QA 测试

**前置条件**：CodeReview + 安全检查全部通过
**无需用户确认，自动执行**

**qa-coordinator 工作流程**：

1. **读取文档**：PRD + 设计稿 + 测试用例 + dispatcher 汇总报告
2. **第 1 轮 QA**：
   - qa-coordinator 分配任务给所有 QA 子 agent（并行）
   - QA 子 agent：
     - qa-frontend（如有前端）
     - qa-backend（如有后端）
     - qa-frontend-perf
     - qa-backend-perf
     - qa-security
     - qa-automation（执行存量自动化测试）
   - qa-coordinator 汇总结果 → `.peaks/reports/round-1-issues.md`
   - 决策：有/无问题 → 第 2 轮 or 修复
3. **第 2 轮 QA**（重复流程）
4. **第 3 轮 QA**（最终验证）
5. **生成最终报告** → `.peaks/reports/final-report-[日期].md`

**QA 3 轮结构说明**：
- **不是**各子 agent 各自跑 3 轮
- **而是**qa-coordinator 统一调度，整体跑 3 轮
- 每轮包含：分配 → 并行执行 → 汇总 → 决策

#### Step 8: [可选] 部署

**前置条件**：所有 QA 测试通过
**需用户确认是否执行**

**devops 流程**：
1. Docker 构建
2. 服务部署
3. 健康检查
4. 通知用户

**产出**：`.peaks/deploys/deploy-[环境]-[日期].log`

---

**完整空目录初始化流程图**：

```
┌─────────────────────────────────────────────────────────────────┐
│ [交互阶段 - 需用户确认]                                           │
├─────────────────────────────────────────────────────────────────┤
│ Step 1: AskUserQuestion 确认项目名称                              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Step 1.5: 创建项目目录 + 初始化                                    │
│   mkdir -p {{PROJECT_NAME}} && cd {{PROJECT_NAME}}             │
│   创建 .peaks/ 和 .claude/agents/ 目录结构                        │
│   复制所有 agent 模板到 .claude/agents/                           │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Step 2: 调用 product agent 脑暴（至少 5 轮交互）                  │
│   → 产出 .peaks/prds/brainstorm-[日期].md（必须）                │
│   → 产出 .peaks/prds/prd-[功能名]-[日期].md                      │
│   → 提出建设性建议并记录用户选择                                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Step 2.5: [自动] 知识积累                                         │
│   → 调度 product agent 生成 product-knowledge.md                │
│   产出：.peaks/knowledge/product-knowledge.md                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Step 3: AskUserQuestion 确认技术栈（基于 PRD 建议）               │
│   前端/后端框架、数据库、Monorepo 或单包                          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Step 4: 创建项目 + 设计确认（并行）                               │
│   [A] 使用官方 CLI 创建项目（纯后端可跳过）                       │
│   [B] 设计完整流程（7步）：                                       │
│       - 4.1: 确认 Design Dials（用 AskUserQuestion）            │
│       - 4.2: 选择 7 种风格之一（用 AskUserQuestion）             │
│       - 4.3: 生成 HTML 设计稿                                    │
│       - 4.4: HTTP 服务器 + Playwright 预览                        │
│       - 4.5: 迭代修改直到用户选择"整体满意"                       │
│   注意：A 和 B 可并行，完成后进入 Step 4.5                       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ [自动执行阶段 - 无需用户确认]                                     │
├─────────────────────────────────────────────────────────────────┤
│ Step 4.5: [设计稿确认后] 生成技术文档 + 测试用例                     │
│   ⚠️ 设计稿未确认，禁止进入此步骤                                    │
│   ├─ 研发 agent 生成技术文档 → .peaks/tech/tech-doc-[date].md     │
│   └─ qa-coordinator 生成详细测试用例 → .peaks/test-docs/test-case-[date].md│
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Step 5: [自动] dispatcher 拆分子 agent 开发                       │
│   dispatcher 分析模块 → 调度子 agent → 汇总自测报告              │
│   产出：.peaks/reports/[module]-self-test-[date].md             │
│        .peaks/reports/dispatcher-summary-[date].md              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Step 6: [自动] CodeReview + 安全检查（并行）                       │
│   ├─ code-reviewer-frontend（如有前端）                          │
│   ├─ code-reviewer-backend（如有后端）                           │
│   └─ security-reviewer                                           │
│   ❌ 有问题 → 自动修复 → 重新检查（最多 10 次循环）               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Step 7: [自动] 3 轮 QA 测试                                       │
│   qa-coordinator 统一调度，整体跑 3 轮                           │
│   产出：round-1-issues.md, round-2-issues.md, round-3-issues.md │
│        final-report-[date].md                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ Step 8: [可选] 部署                                               │
│   devops: Docker 构建 → 服务部署 → 健康检查 → 通知用户           │
│   产出：.peaks/deploys/deploy-[环境]-[日期].log                  │
└─────────────────────────────────────────────────────────────────┘
```

**核心原则**：
- 交互阶段（Step 1-4）需用户确认
- 自动执行阶段（Step 2.5, 4.5, 5-8）无需用户确认
- 先规划（PRD）后实施（创建项目）
- Step 4 中创建项目和设计确认**并行执行**
- 无前端项目跳过 design 步骤
- 交互阶段 context >= 75% 警告、>= 90% 阻断
- 自动执行阶段 context >= 75% 自动 compact + 继续

**核心原则**：先规划（PRD）后实施（创建项目），确保创建项目前已有清晰的需求和技术方案。

---

## Phase 0: 项目初始化（已有项目）

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

| 检测项   | 文件/目录                                          | 说明        |
| -------- | -------------------------------------------------- | ----------- |
| 前端框架 | package.json 的 dependencies.react                 | React 项目  |
| 后端框架 | package.json 的 dependencies.@nestjs/\*            | NestJS 后端 |
| 桌面应用 | packages/\*/src-tauri/ 或 tauri.conf.json          | Tauri 项目  |
| 全栈框架 | package.json 的 dependencies.next                  | Next.js     |
| 数据库   | typeorm / prisma / drizzle                         | 数据库 ORM  |
| 测试框架 | @playwright/test / vitest / jest                   | 测试框架    |
| UI 库    | antd / @mui/material / @chakra-ui/react / radix-ui | UI 组件库   |

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
| `{{UI_LIBRARY}}`         | UI 组件库    | antd / mui / chakra / radix  |
| `{{HAS_TAURI}}`          | 是否有 Tauri | true / false                 |
| `{{HAS_DATABASE}}`       | 是否有数据库 | postgresql / mysql / none    |
| `{{TEST_FRAMEWORK}}`     | 测试框架     | playwright / vitest / jest   |
| `{{DEV_PORT}}`           | 开发端口     | 3000 / 5173 / 1420           |

### Step 0.4: 动态选择 Agent 模板

根据检测到的技术栈，选择对应的 Agent：

| 条件                    | 生成 Agent                                                                                       | 说明                |
| ----------------------- | ------------------------------------------------------------------------------------------------ | ------------------- |
| 检测到 React/Vue        | frontend, design                                                                                 | 前端专家 + 设计专家 |
| 检测到 NestJS           | backend                                                                                          | 后端专家            |
| 检测到 Tauri            | tauri                                                                                            | Tauri 专家          |
| 检测到 PostgreSQL/MySQL | postgres                                                                                         | 数据库专家          |
| 始终生成                | peaksfeat, product, qa, devops, security-reviewer, code-reviewer-frontend, code-reviewer-backend | 基础 Agent          |

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

| 文件/目录                                  | 处理方式                                                                                            |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| `.claude/hookify.context-monitor.local.md` | 如不存在则生成（已存在则跳过）                                                                      |
| `.claude/session-state.json`               | 如不存在则生成（已存在则跳过）                                                                      |
| `.peaks/` 目录                             | 创建标准子目录（plans/, prds/, swagger/, reports/, auto-tests/, checkpoints/, bugs/），已存在则跳过 |
| `.gitnexus/` 目录                          | gitnexus 数据目录（项目根目录），已存在则跳过                                                       |

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

| MCP             | 用途                         | 配置                                                 | 数据目录       |
| --------------- | ---------------------------- | ---------------------------------------------------- | -------------- |
| gitnexus        | 代码库知识图谱索引           | `npx -y gitnexus@latest mcp --repo {{PROJECT_PATH}}` | `.gitnexus/`   |
| claude-mem      | 跨 session 持久化记忆        | `npx -y @the.dot/mem`                                | 全局配置       |
| fs              | 文件系统扫描（项目初始化用） | `@bunas/fs-mcp`                                      | -              |
| playwright      | E2E 测试                     | `@playwright/mcp`                                    | -              |
| chrome-devtools | Chrome 调试                  | `chrome-devtools-mcp`                                | -              |
| context7        | 文档检索（RAG）              | `@upstash/context7-mcp@latest`                       | 全局配置       |
| fetch           | HTTP 请求                    | `mcp-fetch-server`                                   | -              |
| websearch       | 网页搜索                     | `websearch-mcp`                                      | -              |
| docker          | Docker 容器管理              | `@alisaitteke/docker-mcp`                            | -              |
| shadcn          | UI 组件生成                  | `shadcn@latest mcp`                                  | -              |

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
5. **不覆盖任何已有的 MCP 配置**

### Step 0.8: Skills 按需安装（避免 429）

**初始化时不安装 Skills**，改为在实际使用时由 Agent 动态安装，避免初始化时大量 API 调用触发 429 错误。

**安装原则**：

- 首次调用某个 Agent 时，如发现缺失 skill，自动安装
- 使用 `npx skills add <url> --skill <name>` 安装
- 已安装的 skill 跳过，不重复安装

**已预安装的 Skill**：用户可提前安装常用 skills 到 `~/.claude/skills/`，初始化时会跳过已安装的。

**常用 Skill 安装命令**（用户可选择性安装）：

```bash
# Superpowers（开发流程）
npx skills add https://github.com/obra/superpowers --skill brainstorming

# 前端开发
npx skills add https://github.com/vercel-labs/skills --skill frontend-design

# 架构改进
npx skills add https://github.com/mattpocock/skills --skill improve-codebase-architecture

# 测试相关
npx skills add https://github.com/anthropics/skills --skill webapp-testing
```

#### OpenSpec CLI（用于存量项目迭代）

OpenSpec 是 spec-driven development 工具，适合存量项目的功能迭代：

```bash
npm install -g @fission-ai/openspec@latest
```

**决策逻辑**：

```
收到任务
    ↓
┌─ Bug 修复？ ───────────────────────────────────────┐
│  ✅ 是 → 使用 peaksbug                              │
│         systematic-debugging → 修复 → 回归测试     │
│  ❌ 否 → 使用 OpenSpec                             │
└────────────────────────────────────────────────────┘
```

**OpenSpec 常用命令**：

| 命令                   | 说明                     |
| ---------------------- | ------------------------ |
| `openspec init`        | 初始化 OpenSpec          |
| `/opsx:propose <idea>` | 创建变更提案             |
| `/opsx:explore`        | 探索代码库               |
| `/opsx:apply`          | 实施任务                 |
| `/opsx:archive`        | 归档并合并到 specs       |
| `/opsx:new`            | 创建新变更（完整工作流） |
| `/opsx:verify`         | 验证实施                 |

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

| UI_LIBRARY     | 说明                | 模板后缀         | 框架  |
| -------------- | ------------------- | ---------------- | ----- |
| antd           | Ant Design 5        | \_antd           | React |
| mui            | Material UI 5       | \_mui            | React |
| chakra         | Chakra UI           | \_chakra         | React |
| radix          | Radix UI (headless) | \_radix          | React |
| shadcn         | shadcn/ui           | \_shadcn         | React |
| element-plus   | Element Plus        | \_element        | Vue 3 |
| naive-ui       | Naive UI            | \_naive          | Vue 3 |
| vuetify        | Vuetify 3           | \_vuetify        | Vue 3 |
| quasar         | Quasar              | \_quasar         | Vue 3 |
| ant-design-vue | Ant Design Vue      | \_ant-design-vue | Vue 3 |
| primevue       | PrimeVue            | \_primevue       | Vue 3 |
| element-ui     | Element UI          | \_element-ui     | Vue 2 |
| iview          | iView               | \_iview          | Vue 2 |
| vuetify2       | Vuetify 2           | \_vuetify2       | Vue 2 |
| bootstrap-vue  | Bootstrap Vue       | \_bootstrap-vue  | Vue 2 |
| buefy          | Buefy               | \_buefy          | Vue 2 |
| muse-ui        | Muse UI             | \_muse-ui        | Vue 2 |
| vue-material   | Vue Material        | \_vue-material   | Vue 2 |
| none           | 未检测到            | (无后缀)         | -     |

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

### Monorepo 检测

```json
// pnpm workspaces
{ "packages": ["*"] } in pnpm-workspace.yaml → IS_MONOREPO=true, PACKAGES=[各子包]

// Lerna
{ "packages": ["packages/*"] } in lerna.json → IS_MONOREPO=true, PACKAGES=[各子包]

// Turborepo
{ "pipeline": {} } in turbo.json → IS_MONOREPO=true, PACKAGES=[各子包]

// package.json workspaces
{ "workspaces": ["packages/*"] } in root package.json → IS_MONOREPO=true, PACKAGES=[各子包]
```

**Monorepo 特殊处理**：

- `PROJECT_PATH` → 根目录
- `PACKAGES` → 子包列表（如 `["frontend", "api", "shared"]`）
- 生成 Agent 时，需要确认针对哪个包开发
- 优先在子包内独立运行 `/peaks-sdd 初始化`

---

## Agent 模板说明

### 工作流选择

| 场景              | 工具     | 说明                                                      |
| ----------------- | -------- | --------------------------------------------------------- |
| 功能开发/需求迭代 | OpenSpec | 轻量级工作流：`openspec new change` → `apply` → `archive` |
| Bug 修复          | peaksbug | 系统化调试 → 修复 → 回归测试                              |
| Issue 管理        | triage   | 状态机流转 → Agent Brief                                  |

### 通用 Agent（始终生成）

| Agent                  | 说明                                     | Matt Pocock 技能                       |
| ---------------------- | ---------------------------------------- | -------------------------------------- |
| peaksbug               | Bug 修复流程，根因分析 + 修复 + 回归测试 | diagnose (Phase 1-6)                   |
| product                | 产品需求分析，brainstorming + OpenSpec   | grill-with-docs                        |
| qa                     | 测试工程，E2E + 自动化 + TDD             | tdd, caveman                           |
| triage                 | Issue 分类，状态机流转，Agent Brief      | triage                                 |
| devops                 | 运维部署，Docker + 环境配置              | -                                      |
| security-reviewer      | 安全审查，OWASP Top 10                   | -                                      |
| code-reviewer-frontend | 前端代码审查                             | -                                      |
| code-reviewer-backend  | 后端代码审查                             | -                                      |
| design _(前端项目)_    | UI/UX 设计，视觉设计 + 交互设计          | design-taste-frontend, frontend-design |

### 技术栈相关 Agent（按需生成）

| Agent    | 触发条件                      |
| -------- | ----------------------------- |
| frontend | 检测到 React/Vue/Next         |
| backend  | 检测到 NestJS/Express/Fastify |
| tauri    | 检测到 Tauri                  |
| postgres | 检测到 PostgreSQL/MySQL       |

---

## 输出目录结构

### OpenSpec 目录（存量项目迭代）

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

**选择规则**：

- **新项目 (0→1)** 和 **存量项目迭代 (1→n)**：使用 `openspec/` 目录

---

## 产出物格式标准化

所有 `.peaks/` 目录下的产出文件必须遵循以下格式模板：

### PRD 格式模板

```markdown
# PRD - [功能名]

## 概述

### 背景

[为什么需要这个功能。如：解决用户登录后需重复登录的问题]

### 目标

[要达成什么。如：添加记住密码功能，减少用户重复登录次数]

## 功能列表

### [NEW] [功能点名称]

- 描述：[功能的具体描述]
- 验收标准：
  - [可测试的验收条件1，如：勾选后7天内免登录]
  - [可测试的验收条件2，如：取消勾选则每次需重新登录]

### [CHANGED] [已有功能点名称]

- 原：[原来的行为]
- 新：[新的行为]

### [DEPRECATED] [废弃功能点名称]

- 原因：[为什么废弃]

## 非功能性需求

- 性能：[要求，如：接口响应时间<200ms]
- 安全：[要求，如：Token加密存储，不明文存储密码]
- 兼容性：[要求，如：支持iOS 12+和Android 8+]
```

### Plan 格式模板

```markdown
# Plan - [功能名] - YYYYMMDD

## 技术方案

- 前端：[技术栈，如：React 18 + TypeScript + Tailwind]
- 后端：[技术栈，如：NestJS + Prisma + PostgreSQL]
- 数据库：[如有，如：新增remember_token字段]

## 里程碑

| #   | 里程碑                  | 依赖 | 预计工时 |
| --- | ----------------------- | ---- | -------- |
| M1  | [描述，如：后端API实现] | 无   | 1d       |
| M2  | [描述，如：前端UI实现]  | M1   | 1d       |
| M3  | [描述，如：E2E测试]     | M2   | 0.5d     |

## 风险

- [风险描述，如：第三方登录SDK变更] → [应对策略，如：预留2天缓冲]
```

### Bug 报告格式模板

```markdown
# Bug 分析报告 - [问题描述] - YYYYMMDD

## 问题概述

[一句话描述]

## 复现步骤

1. [步骤1]
2. [步骤2]

## 预期行为

[期望]

## 实际行为

[实际]

## 根因分析

[详细分析]

## 证据
```

[错误日志/堆栈]

```

## 修复方案
[初步思路]
```

### 测试报告格式模板

```markdown
# 测试报告 - [功能名] - YYYYMMDD

## 测试概览

- **测试时间**: YYYY-MM-DD HH:mm
- **测试结果**: 通过 / 失败

## 测试结果汇总

| 测试项 | 状态    | 备注 |
| ------ | ------- | ---- |
| TC-001 | ✅ PASS |      |

## 发现的问题

| 优先级 | 问题描述 | 状态 |
| ------ | -------- | ---- |
| HIGH   | 描述     | OPEN |

## 结论

✅ 测试通过 / ❌ 测试失败
```

---

## 异常处理与边界条件

### 异常场景与处理

| 场景                        | 触发条件                                                 | 处理动作                                                                 |
| --------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------ |
| 在主分支开发                | 当前分支是 main/master/develop/release/_/hotfix/_        | 创建新分支：feature/<功能名> 或 bugfix/<功能名>                          |
| 项目不是 git 仓库           | `git rev-parse` 失败                                     | 提示用户"建议先 git init"，若拒绝则继续但不创建分支                      |
| 模板文件缺失                | `templates/agents/*.md` 不存在                           | 跳过该模板，记录警告，继续处理其他模板                                   |
| context window 不足         | session-state.json 显示 contextEstimate >= 85%           | 先 Compact，再继续                                                       |
| 用户中断流程                | 用户明确表示停止                                         | 暂停，保存当前进度到 `.peaks/state.json`                                 |
| @bunas/fs-mcp 不可用        | MCP 工具调用失败                                         | 降级为 Bash/Read 工具手动扫描项目                                        |
| claude-mem MCP 不可用       | `mcp__claude_mem__query` 调用失败                        | 降级为直接读取 CLAUDE.md，跳过跨 session 记忆查询                        |
| gitnexus MCP 不可用         | `mcp__gitnexus__query` 调用失败                          | 降级为 Bash git 命令（git log/diff），继续流程                           |
| OpenSpec 命令失败           | `openspec.mjs` 返回非零退出码                            | 输出错误信息，使用 Bash 直接调用 `npx @fission-ai/openspec` 或跳过该步骤 |
| settings.json 不存在        | `.claude/settings.json` 不存在                           | 跳过 MCP 配置步骤，提示用户可稍后手动配置                                |
| 模板变量替换失败            | 检测到未定义的变量                                       | 使用空字符串作为默认值，继续处理                                         |
| npm/npx 安装失败            | `npx skills add` 或 `npx @fission-ai/openspec` 超时/报错 | 重试 1 次；仍失败则跳过该 skill，记录警告继续                            |
| 网络超时                    | MCP 启动或 npx 下载超时                                  | 增加超时等待（30s）；仍失败则降级或跳过                                  |
| 权限不足                    | 写入 `.claude/` 或 `.peaks/` 失败                        | 提示用户检查目录权限，建议 `chmod -R u+w .claude/`                       |
| 磁盘空间不足                | 写入文件时报 ENOSPC                                      | 提示用户清理磁盘空间后重试                                               |
| npm 安装成功但 symlink 失败 | symlink 返回非零退出码                                   | 记录警告，使用 --force 或手动创建链接                                    |
| 同时检测到多个技术栈        | package.json 同时有 react 和 @nestjs/core                | 生成 frontend + backend 两个 Agent                                       |
| OpenSpec 目录已存在         | openspec/ 目录已存在                                     | 增量更新，不覆盖已有内容                                                 |
| Agent 模板生成失败          | 模板渲染报错                                             | 使用最小 Agent 配置，保证基本功能可用                                    |

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

### Checkpoint 0: 需求确认（peaksfeat 起点）

```
┌─ Checkpoint 0: 需求确认 ─────────────────────────┐
│                                                    │
│  输入：用户需求（自然语言或 PRD）                   │
│                                                    │
│  请确认：                                          │
│  - [ ] 需求清晰可测量                             │
│  - [ ] 范围明确无蔓延                             │
│  - [ ] 验收标准已定义                             │
│                                                    │
│  ✅ 确认 → 进入 Constitution → PRD → Design        │
│  ❌ 有问题 → 补充信息后重新确认                    │
└────────────────────────────────────────────────────┘
```

### peaksfeat 工作流（Phase 1-5）

| Phase   | 阶段         | 输入             | 输出         |
| ------- | ------------ | ---------------- | ------------ |
| Phase 1 | Constitution | 需求确认         | 团队约章     |
| Phase 2 | PRD          | Constitution     | 产品需求文档 |
| Phase 3 | Design       | PRD + 设计稿     | 设计规范     |
| Phase 4 | Develop      | Design + Swagger | 实现代码     |
| Phase 5 | QA           | 代码 + 测试用例  | 测试报告     |

### ⚠️ 关键检查点（防止自主失控）

> **OpenSpec 工作流使用 `/opsx:` 命令，Checkpoint 简化为关键节点确认。**

| 检查点               | 触发时机       | 确认内容                               |
| -------------------- | -------------- | -------------------------------------- |
| **Bug-Checkpoint 1** | 根因分析完成后 | Root cause 是否正确、假设是否可验证    |
| **Bug-Checkpoint 2** | 修复方案制定后 | 修复方案是否最小改动、是否影响其他功能 |
| **Bug-Checkpoint 3** | Code Review 后 | 修复代码质量、是否通过安全检查         |
| **Bug-Checkpoint 4** | 回归测试后     | 所有测试通过、无回归、产出报告已生成   |

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
│  ✅ 确认 → 进入下一步                              │
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

**理解用户意图，不要求关键词匹配**。判断逻辑：

1. **初始化**：用户明确要"初始化"、"setup"项目 → Phase 0
2. **Bug 修复**：用户描述的是**现有功能的异常行为**（报错、崩溃、没反应、白屏、数据不对、样式错乱等任何"应该能用但不能用"的情况）→ peaksbug
3. **功能开发**：**所有其他情况**（默认兜底）→ OpenSpec

```
收到 /peaks-sdd <用户输入>
    ↓
┌─ 是"初始化"？ ──────────────────────────────────┐
│  "初始化"、"setup"、"init"                      │
│  ✅ 是 → Phase 0: 项目初始化                      │
│  ❌ 否 → 下一步判断                               │
└────────────────────────────────────────────────┘
    ↓
┌─ 是"东西坏了"？ ────────────────────────────────┐
│  用户描述异常现象而非新需求：                       │
│  报错、崩溃、没反应、点击无效、白屏、               │
│  接口500、数据不对、样式错乱…                      │
│  ✅ 是 → peaksbug（系统化调试 → 修复 → 回归测试）   │
│  ❌ 否 → OpenSpec（功能开发，默认兜底）             │
└────────────────────────────────────────────────┘
```

**存量项目功能开发前准备**：

1. 调用 `mcp__claude_mem__query` 检索项目记忆，获取最近一次开发的上下文和技术栈状态
2. 调用 `mcp__gitnexus__query` 理解现有代码结构，确定影响范围

**OpenSpec 工作流**：

```
/opsx:propose → /opsx:specs → /opsx:design → /opsx:tasks → /opsx:apply → /opsx:archive
```

### OpenSpec 工作流

OpenSpec 是 peaks-sdd 的主要工作流，使用轻量级的流体迭代：

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
openspec new change add-remember-me

# 3. 编写规格
# 用户：/opsx:specs
# → 产出：openspec/changes/add-remember-me/specs/login.md
openspec spec

# 4. 技术设计
# 用户：/opsx:design
# → 产出：openspec/changes/add-remember-me/design.md
# (直接在 specs/ 目录下创建设计文档)

# 5. 任务拆分
# 用户：/opsx:tasks
# → 产出：openspec/changes/add-remember-me/tasks.md
# (通过 openspec instructions tasks 获取任务指南)

# 6. 实施
# 用户：/opsx:apply
# → 执行 tasks.md 中的各个任务
openspec apply

# 7. 归档
# 用户：/opsx:archive
# → 合并到 openspec/specs/，清理 changes/ 目录
openspec archive add-remember-me
```

**OpenSpec 检查点模板**：

| 检查点                | 触发时机           | 确认内容                              |
| --------------------- | ------------------ | ------------------------------------- |
| **Spec-Checkpoint 1** | `/opsx:propose` 后 | 提案目标清晰、范围明确、价值论证充分  |
| **Spec-Checkpoint 2** | `/opsx:specs` 后   | 规格完整、行为可测、无歧义            |
| **Spec-Checkpoint 3** | `/opsx:design` 后  | 技术方案可行、风险可控、依赖明确      |
| **Spec-Checkpoint 4** | `/opsx:apply` 后   | 代码通过 CR、测试覆盖达标、安全无漏洞 |
| **Spec-Checkpoint 5** | `/opsx:archive` 前 | 规格已更新、文档已同步、产出物完整    |

**OpenSpec 检查点示例**：

```
┌─ Spec-Checkpoint 1: 提案确认 ───────────────────────┐
│                                                    │
│  产出：openspec/changes/[change-name]/proposal.md  │
│                                                    │
│  请确认：                                          │
│  - [ ] 目标清晰可测量                             │
│  - [ ] 范围无蔓延                                 │
│  - [ ] 价值 > 成本                                │
│                                                    │
│  ✅ 确认 → 进入规格编写                            │
│  ❌ 有问题 → 修改 proposal.md 后重新确认            │
└────────────────────────────────────────────────────┘
```

---

## /peaks-sdd 命令（用户入口）

peaks-sdd 提供统一的 `/peaks-sdd` 命令入口，**用户输入任何内容都会被正确路由**：

| 命令                            | 说明       | 输入                                                       |
| ------------------------------- | ---------- | ---------------------------------------------------------- |
| `/peaks-sdd 初始化`             | 初始化项目 | 无（扫描当前项目）                                         |
| `/peaks-sdd <任何自然语言描述>` | 功能开发   | 自然语言需求，如"加个用户注册"、"首页改版"、"做个管理后台" |
| `/peaks-sdd <任何异常描述>`     | Bug 修复   | 异常现象，如"登录没反应"、"页面白屏"、"接口500"            |

**不需要记住关键词**，用自然语言描述即可。系统会理解你的意图。

### /peaks-sdd 初始化 - 项目初始化

```
/peaks-sdd 初始化
```

扫描当前项目，检测技术栈，自动生成：

- `.claude/agents/` Agent 配置
- `.peaks/` 工作目录结构

**执行流程**：Phase 0: 项目初始化（详见上方 Step 0.1-0.8）

---

### /peaks-sdd 添加[功能] - 功能开发

```
/peaks-sdd 添加用户登录功能，支持邮箱+密码
```

或者直接粘贴 PRD 内容，自动进入完整开发流程。

**执行流程**：Checkpoint 0 → Phase 1-5（详见上方 SDD 工作流章节）

---

### /peaks-sdd [bug描述] - Bug 修复

```
/peaks-sdd 登录按钮点击没反应
```

自动分析复现 → 根因分析 → 修复 → 测试 → 验证。

**执行流程**：Phase 1-6（使用 `.claude/agents/peaksbug.md` 中定义的调试工作流）

---

## ⚠️ Gotchas (Claude 失败点总结)

> 随着使用积累的 Claude Code 常见失败模式，触发时需特别注意：

### 工作流相关

| Gotcha                 | 触发条件                                   | 应对方式                                            |
| ---------------------- | ------------------------------------------ | --------------------------------------------------- |
| **Agent 忘记上下文**   | 多轮对话后 Agent 无法回忆早期决策          | Checkpoint 0-6 强制用户确认，每个 Phase 产出物归档  |
| **规格蔓延**           | 用户不断添加未包含在 PRD 中的需求          | Phase 2 后新增需求必须走 Checkpoint 2 确认          |
| **Agent 自主代码生成** | Phase 5 中 Agent 跳过 Code Review 直接提交 | Checkpoint 5 强制门禁：CR → 安全检查 → QA           |
| **Context 溢出**       | 复杂项目多轮对话后 context 超过 85%        | Phase 0 提示 `/compact`，自动触发 SessionStart 检查 |

### 命令相关

| Gotcha               | 触发条件                         | 应对方式                                                           |
| -------------------- | -------------------------------- | ------------------------------------------------------------------ |
| **项目未初始化**     | peaks-sdd 未初始化时调用功能开发 | 自动检测 `.claude/agents/` 是否存在，不存在则先执行 Phase 0 初始化 |
| **命令注册路径错误** | 项目在子目录中，命令路径相对错误 | 使用绝对路径或相对于 `.claude/settings.json` 的路径                |
| **命令覆盖**         | 多次执行初始化覆盖已有命令       | Step 0.7 增量添加逻辑：已存在则跳过                                |

### 技术栈检测相关

| Gotcha                | 触发条件                                    | 应对方式                                         |
| --------------------- | ------------------------------------------- | ------------------------------------------------ |
| **Monorepo 检测失败** | package.json 在 root 但实际代码在 packages/ | 同时检测 root + packages/\*/package.json         |
| **混用框架**          | 同时检测到 React + NestJS                   | 生成 frontend + backend 两个 Agent               |
| **遗漏隐式依赖**      | 只检测 package.json，忽略 workspace 配置    | 检测 pnpm-workspace.yaml, lerna.json, turbo.json |

### Memory 相关

| Gotcha               | 触发条件                         | 应对方式                               |
| -------------------- | -------------------------------- | -------------------------------------- |
| **跨会话丢失上下文** | claude-mem 未正确初始化          | 初始化 Step 0.7 验证 claude-mem 已注册 |
| **CLAUDE.md 膨胀**   | 多轮迭代后 CLAUDE.md 超过 200 行 | 定期归档到 .peaks/，保持主文件精简     |

---

## 触发机制

`/peaks-sdd` 是统一入口，**用户输入任何内容都会被路由到正确的工作流**：

- 包含"初始化"、"setup" → Phase 0 初始化
- 描述的是**东西坏了/不工作** → peaksbug 调试
- **所有其他输入** → OpenSpec 功能开发（默认兜底）

不需要记住特定关键词，用自然语言描述即可。

---

## 关键原则

1. **动态生成** — 根据检测到的技术栈，动态生成对应的 Agent 配置
2. **通用框架** — 适用于任意 TypeScript 项目，不局限于特定框架
3. **Spec first, code second** — 规格在代码之前
4. **What & Why, not How** — 关注目标和价值
5. **Traceability** — 每个代码变更都可追溯到规格

---

## 资源文件索引

| 路径                              | 用途                                                          |
| --------------------------------- | ------------------------------------------------------------- |
| `references/dispatch-quickref.md` | Agent 调度速查表、质量门禁、文件命名规范                      |
| `templates/agents/*.md`           | **初始化时使用** - 14个模板，根据技术栈生成 `.claude/agents/` |
| `.claude/agents/*.md`             | **实际运行时使用** - 初始化后生成的 agents                    |
| `scripts/`                        | **执行脚本** - 8个脚本，质量门禁和自动化工具                  |

### templates/agents/ 目录说明

| 模板文件                    | 生成目标                                   | 触发条件              |
| --------------------------- | ------------------------------------------ | --------------------- |
| `frontend.md`               | `.claude/agents/frontend.md`               | 检测到 React/Vue/Next |
| `design.md`                 | `.claude/agents/design.md`                 | 检测到 React/Vue/Next |
| `backend.md`                | `.claude/agents/backend.md`                | 检测到 NestJS/Express |
| `peaksbug.md`               | `.claude/agents/peaksbug.md`               | Bug 修复场景          |
| `peaksfeat.md`              | `.claude/agents/peaksfeat.md`              | 功能开发场景          |
| `product.md`                | `.claude/agents/product.md`                | 始终生成              |
| `qa.md`                     | `.claude/agents/qa.md`                     | 始终生成              |
| `devops.md`                 | `.claude/agents/devops.md`                 | 始终生成              |
| `security-reviewer.md`      | `.claude/agents/security-reviewer.md`      | 始终生成              |
| `code-reviewer-frontend.md` | `.claude/agents/code-reviewer-frontend.md` | 始终生成              |
| `code-reviewer-backend.md`  | `.claude/agents/code-reviewer-backend.md`  | 始终生成              |
| `tauri.md`                  | `.claude/agents/tauri.md`                  | 检测到 Tauri          |
| `postgres.md`               | `.claude/agents/postgres.md`               | 检测到 PostgreSQL     |
| `triage.md`                 | `.claude/agents/triage.md`                 | 始终生成              |

### scripts/ 脚本说明

| 脚本                            | 用途                              | 调用时机                            |
| ------------------------------- | --------------------------------- | ----------------------------------- |
| `init.mjs`                      | 项目初始化脚本（lib/ 为依赖模块） | Phase 0.1-0.6（初始化阶段自动调用） |
| `openspec.mjs`                  | OpenSpec 工作流执行器             | 存量项目迭代时使用                  |
| `auto-format.mjs`               | 代码格式化                        | 开发阶段 PostToolUse hook           |
| `type-check.mjs`                | TypeScript 类型检查               | 开发阶段 PostToolUse hook           |
| `min-code-enforce.mjs`          | 最小代码强制检查                  | Code Review 前置                    |
| `component-library-enforce.mjs` | 组件库规范检查                    | 前端开发完成后                      |
| `tailwind-enforce.mjs`          | Tailwind CSS 规范检查             | 前端开发完成后                      |
| `file-size-check.mjs`           | 文件大小检查                      | 防止超大文件                        |

**调用示例**：

```bash
# 在开发阶段自动调用
node scripts/type-check.mjs
node scripts/auto-format.mjs

# 在 Code Review 前强制检查
node scripts/min-code-enforce.mjs --path src/

# OpenSpec 工作流
# 创建新变更
node scripts/openspec.mjs new "添加用户注册功能"
# 归档变更
node scripts/openspec.mjs archive "添加用户注册功能"
```
