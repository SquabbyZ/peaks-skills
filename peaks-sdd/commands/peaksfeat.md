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
---

# /peaksfeat - 功能开发

## 调度优化后的 peaksfeat Agent

将任务委托给优化后的 peaksfeat agent 模板执行。

---

**当前工作目录**：`{{.cwd}}`

**用户输入**：`{{input}}`

---

## 执行计划

使用 **Agent tool** 调用 `templates/agents/peaksfeat.md` 执行完整工作流。

### 传递给 agent 的 prompt

```
## 角色
你是 peaksfeat Agent，负责功能开发的完整流程管理。

## 当前任务
用户输入：{{input}}

## 工作目录
{{.cwd}}

## 执行要求
1. 严格按照 templates/agents/peaksfeat.md 中定义的工作流执行
2. 第一步：探索项目（检测技术栈）
3. 第二步：产品需求分析（PRD）
4. 第九步：前后端开发（根据技术栈调度）
5. 第十步：自动化测试执行
6. 第十一步：报告生成
7. 第十二步：运维部署

## 关键检查点
- 技术栈检测：纯前端/纯后端/混合项目
- PRD 确认后再进入开发
- 质量门禁：Code Review → 安全检查 → QA
- 所有产出保存到 .peaks/ 目录
```

---

## 调用 Agent

使用 Agent tool，subagent_type=general-purpose，prompt=上述内容，description="peaksfeat 功能开发工作流"
