# OpenSpec Integration for peaks-sdd

## 什么是 OpenSpec

OpenSpec 是一套轻量级变更管理方法论，运行在 `/opsx:*` slash commands 上。它不替代 peaks-sdd 的阶段门禁，而是在**存量项目功能迭代**场景下提供 propose → apply → archive 的流体工作流。

核心区别：
- **Spec-It（peaks-sdd）**：规格驱动，阶段门禁，适合 0→1 全新构建
- **OpenSpec**：变更驱动，流体迭代，适合 1→n 存量项目迭代

两者互补，不是替代关系。

---

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

**产物解读：**
- `specs/` 是系统当前行为的记录，任何人可以直接阅读理解系统现状
- `changes/` 是变更的生命周期管理，从提案到归档全程可追溯
- `.openspec/` 是配置，不含业务产物

---

## 命令速查

| 命令 | 说明 | 触发场景 |
|------|------|----------|
| `/opsx:new <idea>` | 创建完整变更工作流 | 有明确变更意图时 |
| `/opsx:propose <idea>` | 创建变更提案 | 探索或讨论阶段 |
| `/opsx:explore` | 探索代码库现状 | 不确定系统当前行为 |
| `/opsx:verify` | 验证实施结果 | apply 后确认 |
| `/opsx:ff` | 快速填充 artifacts | 已有 proposal 骨架 |
| `/opsx:apply` | 实施任务 | 规格和技术设计已确认 |
| `/opsx:sync` | 同步变更到 specs | apply 后合并到真理来源 |
| `/opsx:archive` | 归档并合并到 specs | 变更完成，清理 workdir |
| `/opsx:onboard` | 初始化项目 | 新项目首次使用 |

---

## 工作流详解

### 标准变更流程

```
propose → specs → design → tasks → apply → archive
   ↑                                      |
   └──────────────────────────────────────┘
                    (修改后重新提案)
```

1. **propose**：写清楚 Why（为什么改）和 What（改什么），不急着写 How
2. **specs**：明确现有规格如何变更，delta 而非全量
3. **design**：技术方案，架构和边界
4. **tasks**：实施任务清单
5. **apply**：执行，变更代码和 specs
6. **archive**：归档到 archive/，合并 delta 到 specs/

### 快速工作流（已知变更意图）

```
/opsx:new <idea>   # 一步创建完整目录结构和 artifacts
/opsx:ff           # 快速填充骨架
# 填充 proposal.md、specs、design.md、tasks.md
/opsx:apply        # 实施
/opsx:archive      # 归档合并
```

### 探索工作流（不确定现状）

```
/opsx:explore   # 分析代码库，写入 specs/ 作为基准
# 发现现状与 specs/ 不符？→ /opsx:propose 新变更
```

---

## 使用决策树

```
项目当前处于什么阶段？
│
├─ 全新构建 (0→1)
│   └─ 使用 peaks-sdd 完整工作流
│       Constitution → PRD → 设计 → 技术方案 → 开发 → 测试 → 部署
│
├─ 复杂项目启动
│   └─ 使用 peaks-sdd 的 dispatcher swarm workflow
│       阶段门禁：PRD 确认 → 设计确认 → 技术方案确认 → 研发阶段
│
└─ 存量项目迭代 (1→n)
    └─ 使用 OpenSpec 流体工作流
        ├─ 需求明确 → /opsx:new → /opsx:ff → /opsx:apply → /opsx:archive
        ├─ 需求模糊 → /opsx:propose → 讨论澄清 → /opsx:ff
        └─ 现状不明 → /opsx:explore → 发现变更 → /opsx:propose
```

---

## 与 peaks-sdd 的互补关系

| 维度 | Spec-It（peaks-sdd） | OpenSpec |
|------|---------------------|----------|
| 适用场景 | 0→1 新项目，复杂项目 | 1→n 存量项目，功能迭代 |
| 工作流 | 阶段门禁：PRD → 设计 → 开发 | 流体迭代：propose → apply → archive |
| 项目阶段 | 全新构建或重大重构 | 现有项目增量迭代 |
| 变更方式 | 完整规格说明 | Delta 变更（对现有系统的修改） |
| 工具依赖 | AI Agent 调度 | Slash commands（`/opsx:*`） |
| 产物 | PRD、设计稿、技术方案、task graph | proposal、specs delta、design、tasks |
| 门禁 | PRD 确认门 / 设计确认门 / 技术方案确认门 | specs 确认 + design 确认 |

**关键原则：**
- OpenSpec 不做全量规格，只做 delta 变更
- OpenSpec 的 specs/ 是真理来源，changes/ 是变更历史
- archive 后变更合并到 specs/，保持单一真理来源

---

## 典型使用场景

### 场景 1：在已有项目中添加登录功能

```
/opsx:new 添加邮箱登录功能
  → 创建 changes/email-login/ 目录
  → 填充 proposal.md、specs/、design.md、tasks.md 骨架

# 填充 proposal.md：为什么加登录，目标是什么
# 填充 specs/：现有 specs 如何变更
# 填充 design.md：技术方案
# 填充 tasks.md：实施任务

/opsx:apply   # 执行实施
/opsx:archive # 归档合并到 specs/
```

### 场景 2：不确定现有系统行为

```
/opsx:explore
  → 分析代码库结构
  → 生成 specs/index.md 和各模块规格
  → 你发现某个模块设计与实现不一致？

/opsx:propose 修复 XX 模块的设计与实现不一致
  → 进入正常变更流程
```

### 场景 3：快速记录一个想法

```
/opsx:propose 用户反馈性能差，想加缓存层
  → 草稿存入 changes/ 供后续讨论
  → 不影响当前开发节奏
```