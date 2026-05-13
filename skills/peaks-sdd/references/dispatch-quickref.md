# 调度速查表

## 工作流选择

| 场景 | 工作流 | 入口 |
|------|--------|------|
| 新项目 (0→1) | 空目录初始化工作流 | `/peaks-sdd 初始化我的项目` → `references/empty-project-workflow.md` |
| 存量项目迭代 | OpenSpec | `openspec init` → `openspec new change <name>` |
| Bug 修复 | dispatcher bug flow | `/peaks-sdd [bug描述]` |

## Agent 调度矩阵

| Agent | 触发条件 | 职责 |
|-------|---------|------|
| product | 始终 | 需求分析、PRD、grill-me |
| frontend | React/Vue/Next 检测到 | UI/UX、组件开发 |
| backend | NestJS/Express 检测到 | API、业务逻辑 |
| tauri | Tauri 检测到 | 桌面应用原生能力 |
| postgres | 数据库检测到 | 表设计、迁移 |
| qa | 始终 | 测试用例、E2E、自动化测试、QA 调度 |
| devops | 始终 | 部署、环境配置 |
| security-reviewer | 始终 | OWASP 安全审查 |
| code-reviewer-frontend | 有前端变更 | 前端代码审查 |
| code-reviewer-backend | 有后端变更 | 后端代码审查 |
| triage | 始终 | Issue 分类、状态机流转 |
| dispatcher | 始终 | 统一入口：初始化、功能开发、Bug 修复、研发调度、QA 调度 |

## 可选 Skills 增强

peaks-sdd 默认不要求新项目下载外部 skills。Agent 模板应以内置指令和本地脚本可独立运行；以下 skills 仅在已安装且网络可用时增强效果，缺失不得阻断流程。

| Agent | 可选增强 Skills |
|-------|----------------|
| product | product-brainstorming, brainstorming, office-hours |
| dispatcher | improve-codebase-architecture, systematic-debugging, test-driven-development, code-review |
| frontend | browser, browser-use, react:components, vercel-react-best-practices, vue-best-practices |
| qa | webapp-testing, e2e-testing-patterns, javascript-testing-patterns |
| design | design-taste-frontend, frontend-design |

按需策略：先检查当前任务是否能明显受益；如果推荐 skill 未安装，说明安装收益并询问用户。用户同意后只安装已同意的 skills；用户拒绝或安装失败时使用内置流程继续。初始化阶段不批量下载。

详见 `references/optional-skills.md`。

## OpenSpec 工作流（存量项目迭代）

```
openspec new change <name> ──► openspec spec ──► 编写 design ──► openspec apply ──► openspec archive <name>
```

| 命令 | 产出 |
|------|------|
| `openspec new change <name>` | `openspec/changes/[change-name]/` 目录及 proposal.md |
| `openspec list` | 查看所有变更 |
| `openspec show <change-name>` | 显示变更详情 |
| `openspec status <change-name>` | 显示变更完成状态 |
| `openspec archive <change-name>` | 合并到 openspec/specs/ |

## Dispatcher Bug Flow（Bug 修复）

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

| 类型 | Canonical 路径 |
|------|---------------|
| PRD | `.peaks/changes/<change-id>/product/prd.md` |
| PRD 确认 | `.peaks/changes/<change-id>/product/prd-confirmation.md` |
| 设计规范 | `.peaks/changes/<change-id>/design/design-spec.md` |
| 可视化设计稿 | `.peaks/changes/<change-id>/design/design-preview.html` 或导出的图片/PDF/SVG |
| 设计确认 | `.peaks/changes/<change-id>/design/design-confirmation.md` |
| 技术方案 | `.peaks/changes/<change-id>/architecture/system-design.md` |
| 技术方案确认 | `.peaks/changes/<change-id>/architecture/system-design-confirmation.md` |
| OpenAPI | `.peaks/changes/<change-id>/openspec/openapi.json` |
| 测试计划 | `.peaks/changes/<change-id>/qa/test-plan.md` |
| 单元测试报告 | `.peaks/ut/unit-test-report.md` + `.peaks/ut/coverage-summary.json` |
| 功能/性能报告 | `.peaks/changes/<change-id>/qa/functional-report.md` / `performance-report.md` |
| 安全报告 | `.peaks/changes/<change-id>/security/security-report.md` |
| QA 三轮 | `.peaks/changes/<change-id>/qa/qa-round-1.md` 到 `qa-round-3.md` |
| 最终报告 | `.peaks/changes/<change-id>/final-report.md` |

## 输出目录结构

```
.peaks/
├── current-change
├── project/                 # 项目长期知识
├── ut/                      # 单元测试报告和覆盖率摘要
└── changes/
    └── <change-id>/
        ├── product/
        ├── design/
        ├── architecture/
        ├── openspec/
        ├── dispatch/
        ├── swarm/
        │   ├── briefs/
        │   └── reports/
        ├── review/
        ├── security/
        ├── qa/
        └── final-report.md
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
| bug、报错、修复、登录按钮没反应 | dispatcher bug flow |
| 添加功能、需求、PRD、技术计划 | OpenSpec 功能开发 |
| /peaks-sdd | Slash 命令（统一入口） |
