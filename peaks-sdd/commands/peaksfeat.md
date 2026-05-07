---
name: peaksfeat
description: |
  PROACTIVELY execute full SDD workflow for feature development. Use when user says "添加功能", "开发 XXX", "peaksfeat", needs PRD, or wants implementation plan.

when_to_use: |
  添加功能、添加用户登录、new feature、implement、需求分析、PRD、技术计划、implementation plan、任务拆分

argument-hint: "<需求描述或 PRD>"
arguments:
  - name: input
    description: 自然语言需求描述或完整 PRD 内容

user-invocable: true

paths:
  - "**/*.md"
  - "**/prds/**"
  - "**/plans/**"

allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - Agent

context: inherit

model: sonnet

effort: high

hooks:
  PreToolUse:
    - matcher: "Agent"
      command: "echo 'Starting feature development workflow...'"
---

# /peaksfeat - 功能开发

输入自然语言需求或 PRD，自动完成从需求分析到代码实现的完整流程。

## 输入

{{input}}

如果用户只是说"开发 XXX"或"添加 XXX 功能"，直接进入 Phase 1。

如果用户提供的是完整 PRD，进入 Phase 2。

## 执行流程

### Checkpoint 0: 确认工作流

```
┌─ Checkpoint 0: 确认工作流 ─────────────────────────┐
│                                                    │
│  输入内容：{{input}}                                │
│                                                    │
│  请确认：                                          │
│  [ ] 这是新功能开发                                │
│  [ ] 需求描述已足够清晰（或 PRD 已提供）            │
│                                                    │
│  ✅ 确认 → 进入 Phase 1                            │
│  ❌ 需要更多信息 → 提问直到清晰                    │
└────────────────────────────────────────────────────┘
```

---

### Phase 1: Constitution（仅新项目首次使用）

**Step 1.1** — 定义治理原则
- 代码规范、提交约定、审查流程
- Agent 调度策略

**Step 1.2** — 输出 Constitution
```
.peaks/constitution.md
```

---

### Phase 2: Specify（需求分析）

**Step 2.1** — 需求分析
- 使用 product agent 进行 brainstorming
- 挖掘深层需求，考虑边界场景

**Step 2.2** — 编写 PRD
- 使用 `[NEW]` / `[CHANGED]` / `[DEPRECATED]` 标识
- 明确功能点和验收标准
- 输出：`.peaks/prds/prd-[功能名]-[日期].md`

```
┌─ Checkpoint 2: PRD 确认 ───────────────────────────┐
│                                                    │
│  产出：PRD 文档                                    │
│                                                    │
│  请确认：                                          │
│  [ ] 功能点完整                                    │
│  [ ] 验收标准可验证                                │
│  [ ] 边界场景已考虑                                │
│                                                    │
│  ✅ 确认 → 进入 Phase 3                            │
│  ❌ 需要修改 → 返回 product agent 重新分析        │
└────────────────────────────────────────────────────┘
```

---

### Phase 3: Plan（技术方案）

**Step 3.1** — 技术方案设计
- 确定技术栈、架构、API 设计
- 使用 architect agent（如有前端/后端分工）

**Step 3.2** — 产出实现计划
- 分解为可验证的里程碑
- 输出：`.peaks/plans/plan-[功能名]-[日期].md`

```
┌─ Checkpoint 3: Plan 确认 ──────────────────────────┐
│                                                    │
│  产出：技术实现计划                                │
│                                                    │
│  请确认：                                          │
│  [ ] 技术方案可行                                  │
│  [ ] 风险已识别                                    │
│  [ ] 里程碑合理                                    │
│                                                    │
│  ✅ 确认 → 进入 Phase 4                            │
│  ❌ 需要修改 → 返回重新设计                        │
└────────────────────────────────────────────────────┘
```

---

### Phase 4: Tasks（任务拆分）

**Step 4.1** — 任务拆分
- 按依赖关系排序
- 标记并行/顺序任务
- 输出：`.peaks/tasks/task-[功能名]-[日期].md`

**Step 4.2** — 任务分配
- 前端任务 → frontend agent
- 后端任务 → backend agent

```
┌─ Checkpoint 4: 任务分配 ───────────────────────────┐
│                                                    │
│  产出：任务列表 + 分工                             │
│                                                    │
│  请确认：                                          │
│  [ ] 任务分配合理                                  │
│  [ ] 依赖关系正确                                  │
│                                                    │
│  ✅ 确认 → 进入 Phase 5                            │
└────────────────────────────────────────────────────┘
```

---

### Phase 5: Implement（开发 → 测试 → 部署）

**Step 5.1** — 开发
- 调用对应 Agent 执行分配的任务
- 遵循 Karpathy Guidelines：编码前思考、简单优先、精准修改

**Step 5.2** — Code Review
```
┌─ Code Review ─────────────────────────────────────┐
│  调用 code-reviewer agent                         │
│                                                    │
│  ✅ 通过 → 进入安全检查                            │
│  ❌ 失败 → 修复后重新 CR                          │
└────────────────────────────────────────────────────┘
```

**Step 5.3** — 安全检查
```
┌─ 安全检查 ─────────────────────────────────────────┐
│  调用 security-reviewer agent                     │
│                                                    │
│  ✅ 通过 → 进入 QA 验证                            │
│  ❌ 失败 → 修复                                   │
└────────────────────────────────────────────────────┘
```

**Step 5.4** — QA 验证
- 调用 qa agent 执行测试
- E2E 测试、自动化测试
- 输出：`.peaks/reports/test-report-[日期].md`

**Step 5.5** — 部署
- 调用 devops agent 执行部署
- 进入 **Checkpoint 6**

---

### Checkpoint 6: 部署后验证

```
┌─ Checkpoint 6: 部署后验证 ─────────────────────────┐
│                                                    │
│  产出：                                            │
│  - .peaks/deploys/deploy-[环境]-[日期].log        │
│  - 部署验证报告                                    │
│                                                    │
│  请确认：                                          │
│  [ ] 所有服务端口可达                              │
│  [ ] 健康检查端点返回正常                          │
│  [ ] 关键功能可正常访问                            │
│                                                    │
│  ✅ 确认 → 功能开发完成                            │
│  ❌ 有问题 → 回滚或修复后重新验证                  │
└────────────────────────────────────────────────────┘
```

---

## 简化模式

如果用户只是快速添加一个小功能：

```
/peaksfeat 添加用户登录功能，支持邮箱+密码
```

直接进入快速路径：
1. 快速 PRD 生成
2. 快速实现
3. 基础测试

---

## 输出汇总

完成所有 Phase 后，输出：

```
✅ 功能开发完成

产出物：
  - .peaks/prds/prd-[功能名]-[日期].md
  - .peaks/plans/plan-[功能名]-[日期].md
  - .peaks/tasks/task-[功能名]-[日期].md
  - .peaks/reports/test-report-[日期].md
  - 代码变更（已提交到 git）
```
