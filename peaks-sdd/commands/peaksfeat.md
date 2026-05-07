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

## ⚡ 自动决策：Spec-It vs OpenSpec

**无需用户确认，自动判断使用哪个工作流！**

### 自动决策逻辑

```
Step 1: 检测项目状态
├── 检查 .peaks/constitution.md 是否存在 → 已初始化项目
├── 检查 openspec/ 目录是否存在 → 已配置 OpenSpec
└── 检查 git log 提交数量 → 判断新/旧项目

Step 2: 自动选择
┌─ 存量项目 + openspec 已初始化？ ──────────────────┐
│  ✅ 是 → 使用 OpenSpec 工作流                      │
│         自动调用 /opsx:propose 执行                 │
│                                                    │
│  ❌ 否 → 使用 Spec-It (peaksfeat) 工作流          │
│         Constitution → PRD → 设计 → 开发            │
└───────────────────────────────────────────────────┘
```

### 判断标准

| 条件 | 工作流 | 说明 |
|------|--------|------|
| openspec/ 已存在 | OpenSpec | 存量项目迭代 |
| 项目有大量代码和提交 | OpenSpec | 已建立的项目 |
| 新项目（.peaks/ 也不存在） | Spec-It | 从头开始 |
| 用户明确说"从头开始开发" | Spec-It | 新项目 |

---

**当前工作目录**：`{{.cwd}}`

**用户输入**：`{{input}}`

---

## 执行计划

### 路径 A：OpenSpec（存量项目迭代）

如果检测到是存量项目（openspec/ 已存在或有大量代码），自动执行：

```
1. 检查 openspec/ 是否已初始化
   - 如果没有：先运行 'npx -y @fission-ai/openspec@latest init'

2. 自动创建变更提案：
   /opsx:propose {{input}}

3. 自动执行后续流程：
   /opsx:specs → /opsx:design → /opsx:tasks → /opsx:apply

4. 完成后归档：
   /opsx:archive
```

### 路径 B：Spec-It（新项目或复杂项目）

如果检测到是新项目或复杂项目，使用 peaksfeat agent：

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
