# 调度速查表

## 工作流选择

| 场景 | 工作流 | 入口 |
|------|--------|------|
| 新项目 (0→1) | OpenSpec | `/peaks-sdd 初始化` → `/peaks-sdd 添加...` |
| 存量项目迭代 | OpenSpec | `openspec init` → `/opsx:propose` |
| Bug 修复 | peaksbug | `/peaks-sdd [bug描述]` |

## Agent 调度矩阵

| Agent | 触发条件 | 职责 |
|-------|---------|------|
| product | 始终 | 需求分析、PRD、grill-me |
| frontend | React/Vue/Next 检测到 | UI/UX、组件开发 |
| backend | NestJS/Express 检测到 | API、业务逻辑 |
| tauri | Tauri 检测到 | 桌面应用原生能力 |
| postgres | 数据库检测到 | 表设计、迁移 |
| qa | 始终 | E2E、自动化测试 |
| devops | 始终 | 部署、环境配置 |
| security-reviewer | 始终 | OWASP 安全审查 |
| code-reviewer-frontend | 有前端变更 | 前端代码审查 |
| code-reviewer-backend | 有后端变更 | 后端代码审查 |
| triage | 始终 | Issue 分类、状态机流转 |
| peaksfeat | 始终 | 功能开发工作流入口 |
| peaksbug | 始终 | Bug 修复工作流入口 |

## Agent 与 Skills 映射

| Agent | 依赖 Skills |
|-------|------------|
| peaksfeat | improve-codebase-architecture, systematic-debugging, test-driven-development, find-skills |
| peaksbug | systematic-debugging, test-driven-development, code-review |
| frontend | browser, browser-use, react:components, vue-best-practices, vue, vue-debug-guides, impeccable |
| backend | - |
| qa | test-driven-development, browser-use |
| design | design-taste-frontend, frontend-design |

## OpenSpec 工作流（存量项目迭代）

```
/opsx:propose ──► /opsx:specs ──► /opsx:design ──► /opsx:tasks ──► /opsx:apply ──► /opsx:archive
```

| 命令 | 产出 |
|------|------|
| `/opsx:propose <idea>` | `openspec/changes/[change-name]/proposal.md` |
| `/opsx:specs` | `openspec/changes/[change-name]/specs/*.md` |
| `/opsx:design` | `openspec/changes/[change-name]/design.md` |
| `/opsx:tasks` | `openspec/changes/[change-name]/tasks.md` |
| `/opsx:apply` | 执行 tasks.md 中的任务 |
| `/opsx:archive` | 合并到 openspec/specs/ |

## peaksbug 工作流（Bug 修复）

| Phase | 阶段 | 输出 |
|-------|------|------|
| 1 | 复现 | 复现步骤记录 |
| 2 | 根因分析 | Root cause 分析 |
| 3 | 修复方案 | 修复代码 |
| 4 | Code Review | 审查通过 |
| 5 | 回归测试 | 测试报告 |
| 6 | 验证 | 验证报告 |

## 质量门禁

```
开发完成 → Code Review ──┐
        ↓ 失败           ├─→ QA 验证 → 部署
     打回修复        安全检查
        ↓ 失败           ↓ 失败
     打回修复       打回修复

(Code Review 和 安全检查可并行执行)
```

## 文件命名规范

| 类型 | 格式 |
|------|------|
| PRD | `prd-[功能名]-[YYYYMMDD].md` |
| Plan | `plan-[功能名]-[YYYYMMDD].md` |
| Swagger | `swagger-[功能名]-[YYYYMMDD].json` |
| 设计稿 | `[功能名]-[YYYYMMDD].png` |
| 测试用例 | `test-case-[功能名]-[YYYYMMDD].md` |
| Bug 报告 | `bug-[问题描述]-[YYYYMMDD].md` |
| 部署脚本 | `deploy-[环境]-[YYYYMMDD].sh` |

## 输出目录结构

```
.peaks/
├── prds/              # PRD 文档
├── plans/             # 开发计划
├── swagger/           # API 规范
├── designs/           # 设计稿截图
├── reports/           # 测试报告
├── auto-tests/        # 自动化测试
└── checkpoints/       # 中间检查点

openspec/
├── specs/             # 系统行为规格（真理来源）
├── changes/           # 变更提案
│   └── [change-name]/
│       ├── proposal.md
│       ├── specs/
│       ├── design.md
│       └── tasks.md
└── archive/            # 已归档变更
```

## Context 管理

| Context 占用 | 动作 |
|-------------|------|
| < 50% | 正常继续 |
| 50-70% | 关注，产出中间文件减轻压力 |
| >= 70% | **强制**：产出检查点 → `/compact` → 继续 |
| >= 85% | **阻断**：停止 → `/compact` → 用户确认后继续 |

## 检查点速查

| # | 名称 | 确认内容 |
|---|------|---------|
| 0 | 需求确认 | 需求清晰可测量、范围明确、验收标准已定义 |
| 1 | Constitution | 团队约章、治理原则是否符合预期 |
| 2 | PRD | 需求是否完整无遗漏 |
| 3 | Design | 设计规范是否完整 |
| 4 | Implement | 代码满足 PRD |
| 5 | QA | 测试通过、E2E 验证 |
| 6 | Deploy | 服务可达、功能正常 |

## 技术栈检测

| 检测项 | 文件/目录 | 说明 |
|--------|-----------|------|
| 前端框架 | package.json dependencies.react | React 项目 |
| 后端框架 | package.json dependencies.@nestjs/* | NestJS 后端 |
| 全栈框架 | package.json dependencies.next | Next.js |
| 桌面应用 | src-tauri/ 或 tauri.conf.json | Tauri 项目 |
| 数据库 | typeorm / prisma / drizzle | PostgreSQL ORM |
| UI 库 | antd / @mui/material / @chakra-ui/react / radix-ui | UI 组件库 |
| 测试框架 | @playwright/test / vitest / jest | 测试框架 |

## 触发关键词

| 关键词 | 触发工作流 |
|--------|-----------|
| 初始化项目、setup project、init | Phase 0 初始化 |
| bug、报错、修复、登录按钮没反应 | peaksbug |
| 添加功能、需求、PRD、技术计划 | OpenSpec 功能开发 |
| /peaks-sdd | Slash 命令（统一入口） |
