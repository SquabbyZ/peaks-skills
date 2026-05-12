# OpenSpec 功能开发工作流

用于存量项目功能开发和需求迭代。

## 选择规则

- Bug 修复不用 OpenSpec，使用 dispatcher 的 bug flow。
- 新功能、改造、需求迭代默认使用 OpenSpec。
- 如果项目未初始化，先执行已有项目初始化。

## 标准流程

以 OpenSpec CLI 为规范命令面；如项目另有 `/opsx:*` slash command，可作为这些 CLI 步骤的包装，但不要混用两套状态。

```text
openspec init → openspec new change <name> → openspec spec → 编写 design/tasks → openspec apply → openspec archive <name>
```

对应产出位于：

```text
openspec/
├── specs/
├── changes/
│   └── [change-name]/
│       ├── proposal.md
│       ├── specs/
│       ├── design.md
│       └── tasks.md
└── .openspec/
```

## Checkpoints

| 检查点 | 时机 | 确认内容 |
| --- | --- | --- |
| Spec-Checkpoint 1 | propose 后 | 目标清晰、范围明确、价值充分 |
| Spec-Checkpoint 2 | specs 后 | 规格完整、行为可测试、无歧义 |
| Spec-Checkpoint 3 | design 后 | 技术方案可行、风险可控、依赖明确 |
| Spec-Checkpoint 4 | apply 后 | 代码通过 review、安全检查和测试 |
| Spec-Checkpoint 5 | archive 前 | 规格已更新、文档已同步、产出物完整 |

## Implementation Rules

- 读取项目记忆和代码结构后再设计影响范围。
- specs/design/tasks 未完成前不写实现代码。
- 实施阶段按 `tasks.md` 执行，独立任务可并行调度 agent。
- 每个阶段写入文件产物，避免只保存在对话上下文。
- 完成后归档到 `openspec/specs/`，确保系统当前行为被更新。
