# 空目录初始化工作流

当当前目录为空或几乎为空，且用户描述想创建一个产品/应用时使用。

## 判断

- 目录为空，或只有少量配置文件且没有实际源码。
- 用户描述的是“我要做一个……”而不是修复已有项目。

## 流程

1. **确认项目名称**：用 AskUserQuestion 提供建议名称，并允许 Other 自定义。
2. **创建项目目录并初始化**：创建 `.peaks/`、`.claude/agents/`、`.gitnexus/`，复制 `templates/agents/`，并写入 `checkpoints/product-phase-handoff.md`、`design-phase-handoff.md`、`dispatcher-phase-handoff.md`、`qa-phase-handoff.md`。
3. **Product 脑暴**：必须依据 `checkpoints/product-phase-handoff.md` 调用项目内 `.claude/agents/product.md` 执行；至少 5 轮 AskUserQuestion 有效交互，记录每轮问题、用户回答/选择和决策；只有真实交互完成后才能产出当前 change 的 `product/brainstorm.md` 和 `product/prd.md`，自动分析或待确认问题只能写入 `product/brainstorm-draft.md`。
4. **知识积累**：从 PRD 提取跨迭代稳定业务知识，更新 `.peaks/project/product-knowledge.md`。
5. **确认技术栈**：确认前端、后端、数据库、monorepo/单包结构；优先搜索官方创建方式。
6. **前端设计确认**：如有前端，依据 `checkpoints/design-phase-handoff.md` 调用项目内 `.claude/agents/design.md`，推荐 awesome-design-md 风格参考，使用 design-taste-frontend / ui-ux-pro-max 能力，生成 HTML 设计稿，启动预览，直到用户确认“整体满意”，然后产出当前 change 的 `design/design-spec.md`。
7. **技术文档与测试用例**：依据 `checkpoints/dispatcher-phase-handoff.md` 和 `checkpoints/qa-phase-handoff.md` 调用项目内 dispatcher/qa agents，并行生成前端技术文档、后端技术文档、数据库设计、测试用例。
8. **dispatcher 开发**：最多 10 个子 agent，独立任务并行、依赖任务串行。
9. **Code Review + 安全检查**：并行执行，HIGH/CRITICAL 自动返回修复，最多循环 10 次。
10. **3 轮 QA**：qa 统一调度 3 轮，产出最终报告。
11. **可选部署**：部署属于共享/外部影响动作，执行前必须得到用户确认。

## 必要产出

```text
.peaks/current-change
.peaks/project/overview.md
.peaks/project/product-knowledge.md
.peaks/changes/<change-id>/product/brainstorm.md
.peaks/changes/<change-id>/product/prd.md
.peaks/changes/<change-id>/design/approved-preview.html
.peaks/changes/<change-id>/design/design-spec.md
.peaks/changes/<change-id>/architecture/tech-stack.md
.peaks/changes/<change-id>/architecture/system-design.md
.peaks/changes/<change-id>/architecture/decisions.md
.peaks/changes/<change-id>/qa/test-plan.md
.peaks/changes/<change-id>/swarm/task-graph.json
.peaks/changes/<change-id>/swarm/waves.json
.peaks/changes/<change-id>/swarm/status.json
.peaks/changes/<change-id>/swarm/agent-usage.md
.peaks/changes/<change-id>/review/code-review.md
.peaks/changes/<change-id>/security/security-report.md
.peaks/changes/<change-id>/qa/functional-report.md
.peaks/changes/<change-id>/qa/business-report.md
.peaks/changes/<change-id>/qa/performance-report.md
.peaks/changes/<change-id>/qa/runtime-smoke-report.md
.peaks/changes/<change-id>/final-report.md
```

## Gates

- 没有至少 5 轮 AskUserQuestion 证据的 `product/brainstorm.md`，不进入 PRD；`brainstorm-draft.md` 不能替代。
- 产品想法、UI 讨论或方向认同不等于 PRD 确认；只有写入 `product/prd-confirmation.md` 后才能进入设计/技术方案。
- 设计稿未确认，不进入技术文档和开发；设计确认后如影响范围、页面、状态、文案或验收标准，先同步 PRD，再询问用户是否进入技术方案。
- 技术文档和测试用例未确认，不进入开发；`architecture/system-design-confirmation.md` 缺失时不得调度子 agent。
- CR / 安全 / QA 未通过，不宣称完成。
