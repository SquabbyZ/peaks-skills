# OpenSpec Integration for peaks-sdd

## OpenSpec 目录结构

```
openspec/
├── specs/              # 系统当前行为（真理来源）
│   ├── index.md         # 规格索引
│   └── **/*.md          # 各模块规格
├── changes/             # 变更提案
│   ├── [change-name]/
│   │   ├── proposal.md  # 变更提案
│   │   ├── specs/       # 规格变更
│   │   ├── design.md    # 技术设计
│   │   └── tasks.md     # 实施任务
│   └── archive/         # 已归档变更
└── .openspec/          # OpenSpec 配置
```

## OpenSpec 命令

| 命令 | 说明 |
|------|------|
| `/opsx:propose <idea>` | 创建变更提案 |
| `/opsx:explore` | 探索代码库 |
| `/opsx:apply` | 实施任务 |
| `/opsx:sync` | 同步变更 |
| `/opsx:archive` | 归档并合并到 specs |
| `/opsx:new` | 创建新变更（完整工作流） |
| `/opsx:ff` | 快速填充所有 artifacts |
| `/opsx:verify` | 验证实施 |
| `/opsx:onboard` | 初始化项目 |

## 与 Spec-It 的区别

| 维度 | Spec-It (peaks-sdd) | OpenSpec |
|------|---------------------|----------|
| 适用场景 | 0→1 新项目，复杂项目 | 1→n 存量项目，功能迭代 |
| 工作流 | 阶段门禁（PRD → 设计 → 开发） | 流体迭代（propose → apply → archive） |
| 项目阶段 | 全新构建 | 现有项目迭代 |
| 变更方式 | 完整规格说明 | Delta 变更（对现有系统的修改） |
| 工具依赖 | AI Agent 调度 | Slash commands (`/opsx:*`) |

## 使用决策

```
新项目 (0→1) 或复杂项目
  → 使用 Spec-It (peaksfeat)
  → 完整的工作流：Constitution → PRD → 设计 → 开发 → 测试 → 部署

存量项目功能迭代 (1→n)
  → 使用 OpenSpec (openspec)
  → 轻量级工作流：propose → specs → design → tasks → apply → archive
```
