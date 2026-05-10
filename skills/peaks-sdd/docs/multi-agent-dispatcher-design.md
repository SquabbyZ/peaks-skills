# Multi-Agent Dispatcher Design

> Peaks-SDD 调度 Agent 架构设计

## 1. 背景与目标

### 1.1 问题陈述

当前 peaks-sdd 的 `frontend.md` 和 `backend.md` agent 配置存在以下问题：

1. **配置过于庞大** — 单个 agent 包含所有技术栈规范、项目结构、开发流程、验收标准
2. **无法并行开发** — 单一 agent 无法同时处理多个功能模块
3. **缺乏冲突检测** — 多个子 agent 可能修改同一文件，或 A 删除的部分是 B 的依赖
4. **代码冲突风险** — 缺乏调度机制，多 agent 并行时无法协调

### 1.2 设计目标

- **通用性** — 适配单包项目、多包 monorepo、不同技术栈组合
- **自适应性** — 项目结构扫描后动态生成 Agent 池，无需硬编码
- **高效并行** — 独立功能模块可并行开发，提高开发效率
- **冲突安全** — 调度 Agent 维护文件所有权和依赖关系，避免破坏性变更
- **统一测试** — 自测归到调度 Agent，汇总后统一执行集成测试

## 2. 架构概览

```
[调度 Agent (Dispatcher)]
    │
    ├── 项目结构扫描器
    ├── 任务分析器
    ├── 调度引擎
    └── 汇总测试协调器
    │
    ▼
[Agent 池 (Agent Pool)] — 动态生成
    │
    ├── [Sub-Agent-1]  ← 专属功能模块 A
    ├── [Sub-Agent-2]  ← 专属功能模块 B
    ├── [Sub-Agent-3]  ← 专属功能模块 C
    └── ...
```

### 2.1 核心组件职责

| 组件 | 职责 |
|------|------|
| **调度 Agent** | 任务编排、Agent 池生命周期管理、文件所有权追踪、依赖分析、汇总测试 |
| **子 Agent** | 功能实现、自测、报告产出 |

### 2.2 关键原则

- **文件所有权** — 每个共享文件有明确 owner，避免多 Agent 同时修改
- **依赖顺序** — 有依赖关系的任务串行执行，独立任务可并行
- **交接仪式** — Agent A 完成共享文件修改后，通知调度 Agent 注入最新状态给 Agent B
- **动态池化** — Agent 池根据项目结构自适应生成，不是硬编码模板

## 3. 项目结构扫描

### 3.1 扫描策略

项目初始化时，调度 Agent 自动扫描项目结构：

```typescript
interface ScanResult {
  packages: Package[];           // 检测到的包 (packages/admin, packages/server, etc.)
  modules: Module[];             // 各包内的功能模块
  sharedTypes: FilePath[];       // 跨包共享的类型定义文件
  sharedUtils: FilePath[];       // 跨包共享的工具文件
}

interface Package {
  name: string;
  path: string;
  techStack: 'react' | 'nestjs' | 'tauri' | 'python' | 'go' | ...;
  modules: Module[];
}

interface Module {
  name: string;           // e.g., "ai-models", "auth", "conversation"
  path: string;           // e.g., "packages/admin/src/ai-models"
  owner: AgentId | null;  // 当前负责的 Agent（null = 未分配）
  dependsOn: Module[];    // 依赖的其他模块
}
```

### 3.2 扫描算法

```
扫描流程:
1. 读取 package.json / go.mod / Cargo.toml 等确定包管理器
2. 检测 packages/ 目录 → 多包项目
3. 扫描各包的 src/ 目录结构 → 识别模块
4. 检测共享区域 (shared/, commons/, types/, etc.)
5. 分析模块间的 import 依赖关系
6. 生成 ScanResult
```

### 3.3 单包 vs 多包自适应

| 项目类型 | 检测方式 | Agent 池生成策略 |
|----------|----------|-----------------|
| 单包 + 模块少 | 单一 src/ | 单一 Agent 或按模块细分 1-2 个 |
| 单包 + 模块多 | 单一 src/ + 多个子目录 | 按模块细分 Agent 池 |
| 多包 | packages/ 目录存在 | 每包一个 Agent Pool，包内按模块再分 |
| 跨包任务 | 检测到 shared/* 被多包引用 | 协调 Agent 临时调度多个专属 Agent |

## 4. Agent 池管理

### 4.1 池生成规则

```typescript
function generateAgentPool(scanResult: ScanResult): AgentPool {
  const pool = new AgentPool();

  for (const pkg of scanResult.packages) {
    // 每包创建一个 Agent Pool
    const packagePool = pool.createPackagePool(pkg.name);

    if (pkg.modules.length <= 2) {
      // 模块少：创建一个全栈 Agent
      packagePool.addAgent(createFullStackAgent(pkg));
    } else {
      // 模块多：每个模块一个专属 Agent
      for (const module of pkg.modules) {
        const moduleAgent = createModuleAgent(pkg, module);
        moduleAgent.owns = [module.path];  // 设置文件所有权
        moduleAgent.dependsOn = module.dependsOn;
        packagePool.addAgent(moduleAgent);
      }
    }

    // 添加共享类型/工具的守护 Agent（只读或需预约修改）
    if (scanResult.sharedTypes.length > 0) {
      const guardianAgent = createGuardianAgent(scanResult.sharedTypes);
      pool.addGuardian(guardianAgent);
    }
  }

  return pool;
}
```

### 4.2 文件所有权规则

```
规则 1: 模块专属文件 → 模块 owner Agent 全权负责
规则 2: 共享文件 (< 300行) → 调度 Agent 指定唯一 owner，其他人增量
规则 3: 共享文件 (>= 300行) → 调度 Agent 先拆分，再分配
规则 4: 共享文件修改 → 必须通过"交接仪式"通知调度 Agent
```

### 4.3 池的动态调整

```
模块增删时:
  新增模块 → 分析结构 → 动态创建专属 Agent → 注册到池中
  删除模块 → Agent 归档（保留知识）→ 从注册表移除
  空闲超时 → Agent 保留上下文进入休眠，非销毁
```

## 5. 调度引擎

### 5.1 任务分析

```
输入: 用户任务描述
    ↓
任务分析:
  - 解析任务类型: feature / bugfix / refactor
  - 确定涉及的包和模块
  - 分析模块间依赖
    ↓
输出: TaskGraph
  - nodes: 子任务列表
  - edges: 依赖关系
  - executionPlan: 并行/串行顺序
```

### 5.2 调度算法

```typescript
interface ExecutionPlan {
  steps: Step[];
}

interface Step {
  agentId: AgentId;
  tasks: Task[];
  canParallelWith: AgentId[];  // 可并行的其他 Agent
}

function schedule(taskGraph: TaskGraph): ExecutionPlan {
  // 1. 拓扑排序 + 并行检测
  const sorted = topologicalSort(taskGraph);

  // 2. 独立任务标记为可并行
  for (const node of sorted) {
    if (node.dependsOn.length === 0) {
      node.canParallel = findIndependentNodes(node, sorted);
    }
  }

  // 3. 生成执行计划
  return buildExecutionPlan(sorted);
}
```

### 5.3 调度规则

| 场景 | 调度策略 |
|------|----------|
| 独立文件集合 | 并行执行 |
| 有共享文件交叉 | 分析依赖顺序，串行执行 |
| 共享文件修改完成 | 触发"交接仪式"，通知下游 Agent |
| 跨模块任务 | 协调 Agent 临时调度多个专属 Agent |
| 跨包任务 | 各包 Agent 同步执行，调度 Agent 协调 |

## 6. 交接仪式 (Handoff Protocol)

### 6.1 流程

```
[Agent A] 完成共享文件修改
    ↓
通知 [调度 Agent] — "shared/utils.ts 已更新，v2 版本"
    ↓
[调度 Agent] 更新状态注册表
    ↓
注入最新状态给 [Agent B] — "你现在基于 v2 开发"
    ↓
[Agent B] 继续执行，使用最新版本的共享文件
```

### 6.2 状态注册表

```typescript
interface SharedFileRegistry {
  [filePath: string]: {
    version: number;
    lastModifiedBy: AgentId;
    lastModifiedAt: timestamp;
    content: string;      // 或 content hash
    dependents: AgentId[]; // 依赖此文件的 Agent
  };
}
```

## 7. 冲突处理

### 7.1 文件拆分规则

```
共享文件行数 < 300 → 指定唯一 owner
共享文件行数 >= 300 → 调度 Agent 分析后拆分
```

### 7.2 冲突检测机制

```
调度前:
  - 分析任务涉及的文件列表
  - 检查文件所有权
  - 如果有冲突 → 调整调度顺序 或 要求预约

运行中:
  - Agent 尝试修改共享文件时检查版本
  - 如果版本落后 → 拒绝修改，要求重新同步

完成后:
  - CI + lint 冲突检测 catch 问题
  - 调度 Agent 分析失败原因，调整后续计划
```

### 7.3 冲突处理策略

| 策略 | 适用场景 | 描述 |
|------|----------|------|
| **指定 owner** | 小文件 (<300行) | 只有一个 Agent 能修改此文件，其他人增量 |
| **顺序串行** | 无法拆分但可顺序执行 | 先 A 后 B， B 基于 A 的结果继续 |
| **拆分合并** | 大文件 (>=300行) | 调度 Agent 分析后拆分为多个小文件 |
| **人工介入** | 复杂冲突 | 通知人工处理，暂定任务挂起 |

## 8. 汇总测试

### 8.1 设计

自测归到调度 Agent，统一执行集成测试：

```
各子 Agent 完成功能开发
    ↓
子 Agent 产出自测报告 → .peaks/reports/[module]-[timestamp].md
    ↓
调度 Agent 收集所有产出
    ↓
统一执行集成测试 / E2E 测试
    ↓
生成汇总报告 → .peaks/reports/integration-test-report-[timestamp].md
```

### 8.2 优点

- 子 Agent 专注功能开发，不承担测试负担
- 可做跨模块的集成测试
- 统一报告格式，便于 QA 和产品查看
- 测试资源集中管理

## 9. 动态配置模板

### 9.1 子 Agent 配置生成

调度 Agent 根据扫描结果动态生成子 Agent 配置：

```yaml
# 生成的 Agent 配置示例: packages/admin/agents/ai-models-agent.yaml
---
name: admin-ai-models-agent
description: |
  Admin 模块 - AI Models 功能专属 Agent
  负责 packages/admin/src/ai-models 下的所有开发任务

techStack: react
module: ai-models
owns:
  - packages/admin/src/ai-models/**
  - packages/admin/src/common/types/ai-models.ts

dependsOn:
  - admin-auth-agent  # AI Models 依赖 Auth 模块的用户信息

model: sonnet
maxTurns: 50

hooks:
  - type-check
  - auto-format
  - component-library-enforce
```

### 9.2 调度 Agent 配置

```yaml
# packages/sdd/dispatcher-agent.yaml
---
name: dispatcher-agent
description: |
  Peaks-SDD 调度 Agent
  负责分析项目结构、调度任务、管理 Agent 池

capabilities:
  - scan-project-structure
  - analyze-task-dependencies
  - schedule-tasks
  - manage-agent-pool
  - coordinate-handoff
  - run-integration-tests

model: sonnet
maxTurns: 100

tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - Agent
  - mcp__playwright__*
  - mcp__typescript-lsp__*
```

## 10. 工作流完整示例

### 场景: ice-cola 项目添加"用户积分"功能

```
Step 1: 项目初始化 — 扫描结构
  → 检测到 4 个包: admin, server, client, hermes-agent
  → 各包内模块扫描
  → 生成 Agent 池

Step 2: 用户任务进入
  → "添加用户积分功能"
  → 任务分析: 涉及 admin/user-agent, server/user-agent, client/user-agent

Step 3: 调度 Agent 分析依赖
  → admin 和 server 的 user 模块独立
  → client 依赖 server 的 API
  → 生成执行计划:
      - Phase 1 (并行): admin/user-agent + server/user-agent
      - Phase 2: client/user-agent (等待 server API 完成)

Step 4: 调度执行
  → admin/user-agent 和 server/user-agent 并行开发
  → server/user-agent 完成后 → 通知调度 Agent
  → 调度 Agent 注入最新 API Schema 给 client/user-agent
  → client/user-agent 继续开发

Step 5: 各 Agent 自测
  → 各 Agent 产出自测报告

Step 6: 调度 Agent 汇总测试
  → 执行跨模块集成测试
  → 生成集成测试报告
```

## 11. 文件路径

设计文档保存路径:

```
skills/peaks-sdd/docs/multi-agent-dispatcher-design.md
```

实现文件结构：

```
skills/peaks-sdd/
├── templates/
│   └── agents/
│       ├── dispatcher.md        # 调度 Agent 模板
│       ├── sub-agent.md         # 子 Agent 基类模板
│       └── README.md            # Agent 配置说明
├── scripts/
│   ├── scan-project.ts          # 项目结构扫描脚本
│   ├── generate-agents.ts      # Agent 池生成脚本
│   └── dispatcher-engine.ts    # 调度引擎核心逻辑
└── docs/
    └── multi-agent-dispatcher-design.md
```

## 12. 后续工作

- [ ] 实现项目结构扫描脚本 (`scan-project.ts`)
- [ ] 实现 Agent 池动态生成 (`generate-agents.ts`)
- [ ] 实现调度引擎 (`dispatcher-engine.ts`)
- [ ] 拆分 `frontend.md` → 调度 Agent + 专属模块 Agent
- [ ] 拆分 `backend.md` → 调度 Agent + 专属模块 Agent
- [ ] 实现交接协议和状态注册表
- [ ] 实现汇总测试协调器
- [ ] 在 ice-cola 项目上验证完整流程