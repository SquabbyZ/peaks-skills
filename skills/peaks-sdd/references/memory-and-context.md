# Memory 与 Context 管理

## 文件位置

| 文件 | 作用 | Git |
| --- | --- | --- |
| `CLAUDE.md` | 项目级说明、上下文、规则 | 必入 |
| `CLAUDE.local.md` | 个人本地偏好 | 不入 |
| `.claude/rules/*.md` | 按路径懒加载规则 | 必入 |
| `.peaks/project/` | 跨迭代产品知识、总览、路线图、长期决策索引 | 必入 |
| `.peaks/changes/<change-id>/` | 当前 change 的 PRD、设计、架构、swarm、QA、review、报告等产物 | 必入 |
| `.peaks/current-change` | 当前活跃 change 指针 | 必入 |
| `~/.claude/CLAUDE.md` | 全局规则 | N/A |
| `~/.claude/projects/<project>/memory/` | 项目记忆 | 不入 |

## CLAUDE.md 精简原则

`CLAUDE.md` 应保持在 200 行以内。超出时，把阶段性上下文归档到 `.peaks/context/` 或相关产物目录。

## Context 阈值

| Context 占用 | 动作 |
| --- | --- |
| `< 50%` | 正常继续 |
| `50-70%` | 关注，优先写中间产物 |
| `>= 75%` | 全自动阶段先写 checkpoint，再 compact/恢复 |
| `>= 90%` | 交互阶段阻断并请求确认；自动阶段强制保护当前进度 |

## Persistence Policy

| 信息类型 | 写入位置 |
| --- | --- |
| 实时运行状态 | `.peaks/changes/<change-id>/swarm/status.json` |
| 阶段产物 | `.peaks/changes/<change-id>/` |
| 跨迭代产品知识 | `.peaks/project/` |
| 决策原因和阶段审计 | `.gitnexus/` |
| 长期用户/项目偏好 | claude-mem / memory |
| 官方文档查询摘要 | `.peaks/changes/<change-id>/enhancements.md` 或对应技术文档 |

GitNexus 只在阶段门禁触发：Product 脑暴结束、设计稿确认、技术栈确认、task graph 生成、review/QA 完成、final report。

claude-mem 只记录长期偏好、稳定项目事实、外部引用和团队约定，不记录 wave 状态、child-agent 进度、临时 blocker 或文件所有权。

Context7 只作为官方文档查询 MCP，不作为状态源；查询摘要必须落到当前 change 产物。

## 自动阶段保护

全自动阶段包括开发、Code Review、安全检查、测试、报告生成。触发 context 保护时：

1. 写入当前 change 的 `.peaks/changes/<change-id>/checkpoints/`。
2. 记录当前目标、已完成项、待办项、关键文件。
3. 恢复后从文件产物继续，而不是依赖对话记忆。

## Loop 使用原则

- 每次 loop 迭代完成一个可验证子目标。
- loop prompt 只包含当前任务和必要文件路径。
- 每次迭代优先写 `.peaks/` 产物。
- context 过高时先保护进度再继续。
