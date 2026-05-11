# peaks-sdd 自动化工作流补全设计

## 1. 背景与目标

### 现状问题

1. PRD 后没有生成 `product-knowledge.md`
2. 设计确认后没有自动创建技术文档和测试用例
3. 设计后流程中断，需要手动确认下一步
4. 开发完成后需要手动触发 CodeReview、安全检查、QA

### 目标

实现 peaks-sdd 空目录初始化后的**全自动化工作流**：
- 交互阶段（需用户确认）：项目名称 → PRD → 技术栈 → 设计稿
- 自动执行阶段（无需用户确认）：知识积累 → 技术文档+测试用例 → 开发 → CR+安全 → QA → 部署

## 2. 完整工作流定义

```
┌─────────────────────────────────────────────────────────────────┐
│ [交互阶段 - 需用户确认]                                           │
├─────────────────────────────────────────────────────────────────┤
│ Step 1: 项目名称                                                 │
│   → AskUserQuestion 确认项目名称                                 │
│   → mkdir -p {{PROJECT_NAME}} && cd {{PROJECT_NAME}}           │
│   产出：项目目录                                                 │
├─────────────────────────────────────────────────────────────────┤
│ Step 2: PRD 脑暴                                                │
│   → 调度 product agent                                          │
│   → 使用 AskUserQuestion 多轮交互（grill-me）                    │
│   产出：.peaks/prds/brainstorm-[日期].md                        │
│        .peaks/prds/prd-[功能名]-[日期].md                       │
├─────────────────────────────────────────────────────────────────┤
│ Step 3: 技术栈确认                                               │
│   → AskUserQuestion 确认技术栈（前端/后端/数据库/Monorepo）     │
│   产出：技术栈确定                                               │
├─────────────────────────────────────────────────────────────────┤
│ Step 4: 设计稿（如有前端）                                       │
│   → 调度 design agent                                           │
│   → 使用 AskUserQuestion 与用户确认设计稿                         │
│   产出：.peaks/designs/design-spec-[功能名]-[日期].md           │
│        .peaks/designs/[功能名]-[日期].png（截图）               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ [自动执行阶段 - 无需用户确认]                                     │
├─────────────────────────────────────────────────────────────────┤
│ Step 5: 知识积累                                                │
│   → 调度 product agent 生成知识积累                              │
│   产出：.peaks/knowledge/product-knowledge.md                   │
├─────────────────────────────────────────────────────────────────┤
│ Step 6: 并行生成技术文档 + 测试用例                              │
│   → 调度研发 agent 生成技术文档                                   │
│     产出：.peaks/plans/tech-doc-[功能名]-[日期].md              │
│   → 调度 qa-coordinator 生成测试用例                             │
│     产出：.peaks/test-docs/test-case-[功能名]-[日期].md         │
│   两者并行执行                                                   │
├─────────────────────────────────────────────────────────────────┤
│ Step 7: dispatcher 拆分子 agent 开发                            │
│   → dispatcher 分析任务涉及的模块                                │
│   → 调度子 agent 并行开发各模块                                  │
│   → 各子 agent 自测，产出自测报告                                │
│   产出：.peaks/reports/[module]-self-test-[日期].md            │
├─────────────────────────────────────────────────────────────────┤
│ Step 8: CodeReview + 安全检查（并行）                            │
│   → 调度 code-reviewer-frontend（如有前端）                      │
│   → 调度 code-reviewer-backend（如有后端）                       │
│   → 调度 security-reviewer                                      │
│   三者并行执行                                                   │
│                                                                  │
│   ┌─ 检查结果 ─────────────────────────────────────────┐        │
│   │  ✅ 全部通过 → 进入 Step 9                         │        │
│   │  ❌ 有问题 → 自动通知对应 agent 修复               │        │
│   │         → 修复后重新执行 Step 8                   │        │
│   │         → 循环直到全部通过                        │        │
│   └────────────────────────────────────────────────────┘        │
├─────────────────────────────────────────────────────────────────┤
│ Step 9: 3 轮 QA 测试                                            │
│   → 调度 qa-coordinator                                          │
│   → qa-coordinator 分配任务给 QA 子 agent（并行）               │
│     ├─ qa-frontend（如有前端）                                  │
│     ├─ qa-backend（如有后端）                                   │
│     ├─ qa-frontend-perf                                         │
│     ├─ qa-backend-perf                                         │
│     ├─ qa-security                                             │
│     └─ qa-automation                                          │
│                                                                  │
│   每轮结构：                                                     │
│   1. 分配任务 → 并行执行 → 汇总结果                             │
│   2. 决策：有问题 → 分配修复 → 自测 → 下一轮                   │
│                  → 无问题 → 下一轮                              │
│                                                                  │
│   产出：.peaks/reports/round-1-issues.md                        │
│        .peaks/reports/round-2-issues.md                        │
│        .peaks/reports/round-3-issues.md                        │
│        .peaks/reports/final-report-[日期].md                    │
├─────────────────────────────────────────────────────────────────┤
│ Step 10: 部署（可选）                                            │
│   → 调度 devops agent                                            │
│   → Docker 构建 → 服务部署 → 健康检查                            │
│   产出：.peaks/deploys/deploy-[环境]-[日期].log                 │
└─────────────────────────────────────────────────────────────────┘
```

## 3. SKILL.md 修改点

### 3.1 修改空目录初始化流程（Step 3 后添加知识积累）

**现状**（SKILL.md Step 3）：
```
Step 3: 调用 product agent 脑暴（至少 5 轮交互）
   → 产出 .peaks/prds/brainstorm-[日期].md
   → 产出 .peaks/prds/prd-[功能名]-[日期].md
```

**修改后**：
```
Step 3: 调用 product agent 脑暴（至少 5 轮交互）
   → 产出 .peaks/prds/brainstorm-[日期].md
   → 产出 .peaks/prds/prd-[功能名]-[日期].md

Step 3.5: [自动] 知识积累
   → 调度 product agent 生成知识积累
   → 产出 .peaks/knowledge/product-knowledge.md
```

### 3.2 修改 Step 5（设计后自动生成技术文档+测试用例）

**现状**（SKILL.md Step 5）：
```
Step 5: 创建项目 + 设计确认（并行）
   [A] 使用官方 CLI 创建项目
   [B] 调用 design agent 与用户确认页面
       → 基于 PRD 确认页面布局和交互
       → 用户通过 AskUserQuestion 确认设计稿
       → 产出 .peaks/designs/design-spec-[功能名]-[日期].md
```

**修改后**：
```
Step 5: 创建项目 + 设计确认（并行）
   [A] 使用官方 CLI 创建项目
   [B] 调用 design agent 与用户确认页面（如有前端）
       → 基于 PRD 确认页面布局和交互
       → 用户通过 AskUserQuestion 确认设计稿
       → 产出 .peaks/designs/design-spec-[功能名]-[日期].md

Step 5.5: [自动] 并行生成技术文档 + 测试用例
   前置条件：PRD 已确认、设计稿已就绪（如有）

   [并行执行]
   ├─ 研发 agent 生成技术文档
   │   产出：.peaks/plans/tech-doc-[功能名]-[日期].md
   └─ qa-coordinator 生成测试用例
       产出：.peaks/test-docs/test-case-[功能名]-[日期].md
```

### 3.3 修改 Step 7（自动触发开发+CR+安全+QA）

**现状**（SKILL.md Step 7）：
```
Step 7: 并行开发（与存量项目流程一致）
   QA: 根据 PRD 编写测试用例 → .peaks/plans/test-cases-[日期].md
   研发: 根据 PRD + Design 编写技术方案 → .peaks/plans/tech-[日期].md
   技术方案确认后 → 创建功能目录及子 agent → 进入 OpenSpec 工作流
```

**修改后**：
```
Step 6: [自动] dispatcher 拆分子 agent 开发
   前置条件：技术文档 + 测试用例已完成

   dispatcher 流程：
   1. dispatcher 读取 .claude/agents/dispatcher.md
   2. dispatcher 分析任务涉及哪些模块
   3. dispatcher 生成执行计划（独立任务并行，有依赖串行）
   4. dispatcher 调度子 agent 进行开发
      ├─ 各子 agent 基于技术文档开发
      ├─ 各子 agent 完成自测，产出 [module]-self-test-[date].md
      └─ dispatcher 汇总所有自测报告 → dispatcher-summary-[date].md

Step 7: [自动] CodeReview + 安全检查（并行）
   前置条件：开发完成

   ┌─────────────────────────────────────────────────────────┐
   │  并行执行（三者同时进行）                                │
   │  ├─ code-reviewer-frontend（如有前端）                 │
   │  ├─ code-reviewer-backend（如有后端）                   │
   │  └─ security-reviewer                                   │
   │                                                         │
   │  检查结果判定：                                         │
   │  ├─ 全部通过 → 进入 Step 8                             │
   │  └─ 有问题 → 自动通知对应 agent 修复                   │
   │            → 修复后重新执行 Step 7                      │
   │            → 循环直到全部通过                           │
   └─────────────────────────────────────────────────────────┘

Step 8: [自动] 3 轮 QA 测试
   前置条件：CodeReview + 安全检查全部通过

   qa-coordinator 流程：
   1. 读取：PRD + 设计稿 + 测试用例 + dispatcher 汇总报告
   2. 第 1 轮 QA：
      ├─ qa-coordinator 分配任务给所有 QA 子 agent（并行）
      │   ├─ qa-frontend
      │   ├─ qa-backend
      │   ├─ qa-frontend-perf
      │   ├─ qa-backend-perf
      │   ├─ qa-security
      │   └─ qa-automation（执行存量自动化测试）
      ├─ qa-coordinator 汇总结果 → round-1-issues.md
      └─ 决策：有/无问题 → 第 2 轮
   3. 第 2 轮 QA（重复流程）
   4. 第 3 轮 QA（最终验证）
   5. 生成最终报告 → .peaks/reports/final-report-[日期].md

Step 9: [可选] 部署
   前置条件：所有 QA 测试通过

   devops 流程：
   1. Docker 构建
   2. 服务部署
   3. 健康检查
   4. 通知用户
```

## 4. 新增/修改文件清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `skills/peaks-sdd/SKILL.md` | 修改 | 补全 Step 3.5、5.5、6-9 |
| `skills/peaks-sdd/scripts/workflow-continuer.mjs` | 新增 | 工作流自动执行脚本 |
| `skills/peaks-sdd/scripts/lib/dispatcher-engine.mjs` | 修改 | 增强调度逻辑 |
| `templates/agents/qa-coordinator.md` | 修改 | 增强 3 轮 QA 逻辑 |

## 5. workflow-continuer.mjs 职责

```
职责：
1. 检查当前工作流状态（通过 session-state.json）
2. 根据状态自动执行下一步
3. 处理 Step 8 的 CR+安全循环逻辑
4. 管理 checkpoint 和恢复

状态流转：
init → name_confirmed → prd_done → tech_stack_confirmed
→ design_done → knowledge_done → docs_done → development_done
→ cr_security_passed → qa_passed → deploy_done
```

## 6. 关键设计决策

### 6.1 CR+安全循环终止条件

- **最大循环次数**：10 次（防止无限循环）
- **每次循环**：记录问题到 `.peaks/checkpoints/cr-issues-[N].md`
- **超过限制**：中断流程，通知用户手动处理

### 6.2 QA 3 轮结构

- **不是**各子 agent 各自跑 3 轮
- **而是**qa-coordinator 统一调度，整体跑 3 轮
- 每轮包含：分配 → 并行执行 → 汇总 → 决策

### 6.3 自动返回开发的触发条件

CodeReview 或安全检查发现任何 HIGH/CRITICAL 问题，自动通知对应 agent 修复：
- frontend 相关问题 → frontend agent
- backend 相关问题 → backend agent
- 安全问题 → 安全问题对应的 agent

## 7. 产出文件清单

| 阶段 | 文件 | 路径 |
|------|------|------|
| Step 2 | brainstorm | `.peaks/prds/brainstorm-[日期].md` |
| Step 2 | prd | `.peaks/prds/prd-[功能名]-[日期].md` |
| Step 3.5 | product-knowledge | `.peaks/knowledge/product-knowledge.md` |
| Step 4 | design-spec | `.peaks/designs/design-spec-[功能名]-[日期].md` |
| Step 4 | design-screenshot | `.peaks/designs/[功能名]-[日期].png` |
| Step 5.5 | tech-doc | `.peaks/plans/tech-doc-[功能名]-[日期].md` |
| Step 5.5 | test-case | `.peaks/test-docs/test-case-[功能名]-[日期].md` |
| Step 6 | self-test (各模块) | `.peaks/reports/[module]-self-test-[日期].md` |
| Step 6 | dispatcher-summary | `.peaks/reports/dispatcher-summary-[日期].md` |
| Step 7 | cr-report | `.peaks/reports/cr-[日期].md` |
| Step 7 | security-report | `.peaks/reports/security-[日期].md` |
| Step 8 | round-1-issues | `.peaks/reports/round-1-issues.md` |
| Step 8 | round-2-issues | `.peaks/reports/round-2-issues.md` |
| Step 8 | round-3-issues | `.peaks/reports/round-3-issues.md` |
| Step 8 | final-report | `.peaks/reports/final-report-[功能名]-[日期].md` |
| Step 9 | deploy-log | `.peaks/deploys/deploy-[环境]-[日期].log` |

## 8. Context 管理策略

| 阶段类型 | context >= 75% | context >= 90% |
|---------|----------------|---------------|
| **交互阶段**（Step 1-4） | 警告 + 等待确认 | 阻断 + 等待确认 |
| **自动执行阶段**（Step 5-9） | 自动 compact + 继续 | 自动 compact + 继续 |

**自动执行阶段的 context 保护**：
- 每次循环迭代前检查 contextEstimate
- 强制产出检查点到 `.peaks/checkpoints/`
- compact 后自动继续执行