# 调度速查表

## 工作流选择

| 场景 | 工具 | 入口 |
|------|------|------|
| 新项目 (0→1) | Spec-It | `/peaksinit` → `/peaksfeat` |
| 复杂项目 | Spec-It | `/peaksfeat` |
| 存量项目迭代 | OpenSpec | `openspec init` → `/opsx:propose` |
| Bug 修复 | peaksbug | `/peaksbug` |

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
| design | 新页面/复杂交互 | UI 设计、设计稿、视觉规范（必须先调 design-taste-frontend） |

## Skill 调度矩阵

| Skill | 调用 Agent | 用途 |
|-------|-----------|------|
| `systematic-debugging` | peaksbug | 根因分析、执行路径追踪 |
| `test-driven-development` | peaksbug, frontend, backend | 测试驱动开发、回归测试 |
| `code-review` | peaksfeat, peaksbug | 代码审查方法论 |
| `security-review` | peaksfeat, peaksbug | 安全漏洞扫描方法论 |
| `browser` | frontend, peaksbug | Browserbase 浏览器自动化、E2E 测试 |
| `design-taste-frontend` | design | 设计品味评估（**必须最先调用**） |
| `frontend-design` | design | 前端设计方法论（design-taste-frontend 之后调用） |

## 质量门禁

```
开发完成 → Code Review → 安全检查 → QA 验证 → 部署
              ↓ 失败          ↓ 失败
           打回修复         修复
```

## 文件命名规范

| 类型 | 格式 |
|------|------|
| PRD | `prd-[功能名]-[YYYYMMDD].md` |
| Swagger | `swagger-[功能名]-[YYYYMMDD].json` |
| 设计稿 | `[功能名]-[YYYYMMDD].png` |
| 测试用例 | `test-case-[功能名]-[YYYYMMDD].md` |
| 开发计划 | `plan-[功能名]-[YYYYMMDD].md` |
| 部署脚本 | `deploy-[环境]-[YYYYMMDD].sh` |

## 检查点速查

| # | 名称 | 确认内容 |
|---|------|---------|
| 0 | 工作流确认 | Spec-It / OpenSpec / peaksbug |
| 1 | Constitution | 治理原则是否符合预期 |
| 2 | PRD | 需求是否完整无遗漏 |
| 3 | Plan | 方案是否可行、风险可控 |
| 4 | Tasks | 任务分配是否合理 |
| 5 | Implement | 代码满足 PRD、测试通过 |
| 6 | Deploy | 服务可达、功能正常 |
