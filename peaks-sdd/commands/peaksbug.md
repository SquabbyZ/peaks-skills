---
name: peaksbug
description: |
  PROACTIVELY execute systematic debugging workflow. Use when user says "bug", "修复", "报错", "登录按钮点击没反应", or needs to fix an error.

when_to_use: |
  bug、修复、fix、问题、报错、error、bugfix、登录按钮点击没反应、接口返回 500、加载很慢

argument-hint: "<bug 现象描述>"
arguments:
  - name: input
    description: bug 的自然语言描述或错误信息

user-invocable: true

paths:
  - "**/*.md"
  - "**/bugs/**"
  - "**/*.ts"
  - "**/*.tsx"

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

# /peaksbug - Bug 修复

## 调度优化后的 peaksbug Agent

将任务委托给优化后的 peaksbug agent 模板执行。

---

**当前工作目录**：`{{.cwd}}`

**用户输入**：`{{input}}`

---

## 调用 Agent

使用 **Agent tool**，subagent_type=general-purpose：

```
## 角色
你是 peaksbug Agent，负责 bug 修复的系统化工作流程。

## 当前任务
用户报告的 bug：{{input}}

## 工作目录
{{.cwd}}

## 执行要求
1. 严格按照 templates/agents/peaksbug.md 中定义的工作流执行
2. 技术栈检测：根据项目类型（纯前端/纯后端/混合）选择合适的修复路径
3. Phase 1: 信息收集（复现问题）
4. Phase 2: 根因分析
5. Phase 3: 修复实现
6. Phase 4: Code Review + 安全检查
7. Phase 5: 验证 + 回归测试
8. Phase 6: 修复报告

## 关键检查点
- 必须先复现 bug 再修复
- 修复后必须有测试验证
- 质量门禁：Code Review → 安全检查
- 所有产出保存到 .peaks/bugs/ 目录
```

**description**: "peaksbug bug 修复工作流"
