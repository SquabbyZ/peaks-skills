# Peaks SDD (Spec-Driven Development)

Spec-Driven Development workflow for Claude Code. 自动检测项目技术栈并动态生成对应的 Agent 配置。

## 安装

```bash
npx skills add peaks-sdd
```

## 快速开始

### 首次使用（必须用自然语言触发）

安装后，**在对话中直接输入以下任一语句**触发初始化：

```
使用 peaks-sdd 技能初始化我的项目
```

或

```
peaks-sdd 初始化项目
```

> **为什么不能用 `/peaksinit`？** 因为 `/peaksinit` 这个 slash command 是在初始化**过程中**才注册的。首次使用时它还不存在，必须用自然语言触发。

### 日常使用（初始化完成后）

初始化成功后，三个 slash command 就注册好了，可以直接使用：

| 命令 | 说明 | 示例 |
|------|------|------|
| `/peaksinit` | 重新扫描项目配置 | 重新检测技术栈、更新 Agent 配置 |
| `/peaksfeat` | 功能开发 | 添加用户登录功能 |
| `/peaksbug` | Bug 修复 | 登录报错500 |

## 工作流选择

```
收到任务
    ↓
┌─ 新项目或复杂项目？ ─────────────────────┐
│  ✅ 是 → /peaksfeat → 完整工作流        │
│      Constitution → PRD → 设计 → 开发    │
│                                           │
│  ❌ 否 → 存量项目功能迭代？              │
└──────────────────────────────────────────┘
    ↓
┌─ 存量项目功能迭代 ──────────────────────┐
│  ✅ 是 → OpenSpec（轻量级流体迭代）      │
│      /opsx:propose → /opsx:apply        │
│                                           │
│  ❌ 否 → Bug 修复？                      │
└──────────────────────────────────────────┘
    ↓
┌─ Bug 修复 ──────────────────────────────┐
│  ✅ 是 → /peaksbug                       │
│      复现 → 根因 → 修复 → 测试 → 验证   │
└──────────────────────────────────────────┘
```

## 三个命令详解

### /peaksinit

```
/peaksinit
```

项目初始化，扫描技术栈，生成 Agent 配置，注册其他命令。

### /peaksfeat

```
/peaksfeat 添加用户登录功能，支持邮箱+密码
```

功能开发，输入自然语言需求或 PRD，自动完成：
- Constitution 定义治理原则
- PRD 需求分析
- 技术方案设计
- 任务拆分与分配
- Agent 协作开发
- Code Review + 安全检查
- QA 验证
- 部署

### /peaksbug

```
/peaksbug 登录按钮点击没反应
```

Bug 修复，输入 bug 现象，自动完成：
- 复现问题
- 根因分析
- 修复实现
- Code Review + 安全检查
- 回归测试
- 生成修复报告

## 目录结构

```
.peaks/                    # SDD 工作目录
├── plans/                 # 开发计划
├── prds/                  # PRD 文档
├── reports/               # 测试报告
├── auto-tests/            # 自动化测试
├── deploys/               # 部署脚本
└── bugs/                  # Bug 分析报告

.claude/
├── agents/                # 动态生成的 Agent 配置
├── settings.json          # MCP 和命令配置
└── session-state.json      # 会话状态
```

## 依赖的 Skills

| Skill | 用途 |
|-------|------|
| karpathy-guidelines | Karpathy 开发原则 |
| systematic-debugging | 系统化调试 |
| tdd-guide | 测试驱动开发 |
| build-error-resolver | 构建错误修复 |
| performance-optimizer | 性能优化 |
| security-reviewer | 安全审查 |
| code-reviewer | 代码审查 |

## 技术栈检测

| 检测项 | 依据 |
|--------|------|
| React/Vue | package.json dependencies |
| Next.js | package.json dependencies.next |
| NestJS | package.json dependencies.@nestjs/* |
| Tauri | src-tauri/ 或 tauri.conf.json |
| PostgreSQL | typeorm / prisma / drizzle |
| 测试框架 | @playwright/test / vitest / jest |
