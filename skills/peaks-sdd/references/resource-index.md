# 资源文件索引

## templates/agents

初始化时从 `templates/agents/` 复制或渲染到目标项目 `.claude/agents/`。

| 模板 | 触发 |
| --- | --- |
| `sub-front/frontend.md` | 检测到 React/Vue/Next 后生成的前端研发调度专家 |
| `design.md` | 检测到前端项目 |
| `sub-back/backend.md` | 检测到后端框架后生成的后端研发调度专家 |
| `sub-front/frontend.md` | 前端研发调度：写技术文档、拆任务、调度 frontend-child |
| `sub-front/frontend-child.md` | 前端子任务实现 |
| `sub-back/backend.md` | 后端研发调度：写技术文档、拆任务、调度 backend-child |
| `sub-back/backend-child.md` | 后端子任务实现 |
| `dispatcher.md` | 唯一统一入口：初始化、功能开发、Bug 修复、研发调度、QA 调度 |
| `product.md` | 始终生成 |
| `qa.md` | 始终生成 |
| `devops.md` | 始终生成 |
| `security-reviewer.md` | 始终生成 |
| `code-reviewer-frontend.md` | 始终生成 |
| `code-reviewer-backend.md` | 始终生成 |
| `tauri.md` | 检测到 Tauri |
| `postgres.md` | 检测到数据库 |
| `triage.md` | 始终生成 |

子目录：

- `templates/agents/qa/`：QA 调度 agent (`qa.md`) 与统一 QA 子任务模板 (`qa-child.md`)。
- `templates/agents/sub-front/`：前端研发调度 agent 与前端专属 child agent 模板。
- `templates/agents/sub-back/`：后端研发调度 agent 与后端专属 child agent 模板。

## scripts

| 脚本 | 用途 |
| --- | --- |
| `init.mjs` | 项目初始化 |
| `scripts/lib/change-artifacts.mjs` | change-scoped artifact 路径和目录创建 |
| `scripts/lib/mcp-policy.mjs` | MCP server 注册表和技术栈感知配置 |
| `openspec.mjs` | OpenSpec 工作流执行器 |
| `auto-format.mjs` | 格式化 |
| `type-check.mjs` | TypeScript 类型检查 |
| `min-code-enforce.mjs` | 最小代码强制检查 |
| `component-library-enforce.mjs` | 组件库规范检查 |
| `tailwind-enforce.mjs` | Tailwind 规范检查 |
| `file-size-check.mjs` | 文件大小检查 |
| `verify-artifacts.mjs` | 产物验证 |
| `check-gate.mjs` | 质量门禁 |
| `context-monitor.mjs` | context 监控 |
| `workflow-continuer.mjs` | 工作流恢复/继续 |
| `dogfood-new-project.mjs` | 全新项目 0→1 初始化与产物/MCP smoke test |

## references

| 参考 | 用途 |
| --- | --- |
| `references/new-project-swarm-workflow.md` | 全新项目蜂群端到端流程 |
| `references/artifact-layout.md` | change-scoped `.peaks/` 目录规范 |
| `references/mcp-policy.md` | 细粒度 MCP server 策略 |
| `references/model-routing.md` | agent 按职责选择 haiku/sonnet/opus 的模型路由策略 |
| `references/dogfood-new-project-checklist.md` | 全新项目 0→1 手动 dogfood 测试清单 |

`references/` 存放运行时按需读取的流程说明。入口 `SKILL.md` 只索引，不展开长内容。
