# Peaks-SDD Agent Templates

## 架构演进

旧架构：`frontend.md` / `backend.md` 是单一的大而全 Agent 配置，包含所有技术栈规范、项目结构、开发流程。

新架构：调度 Agent + 动态子 Agent 池

```
[调度 Agent] → 动态生成 → [子 Agent 池]
                              ├── auth-agent
                              ├── orders-agent
                              ├── ai-models-agent
                              └── ...
```

## 文件说明

| 文件 | 说明 |
|------|------|
| `dispatcher.md` | 调度 Agent 模板 — 任务编排中枢 |
| `sub-agent.md` | 子 Agent 基类模板 — 功能开发专家 |
| `frontend.md` | (已归档) 旧版前端 Agent 配置 |
| `backend.md` | (已归档) 旧版后端 Agent 配置 |

## 新架构优势

1. **动态生成** — 根据项目结构自动生成 Agent 池
2. **并行开发** — 独立模块可同时开发
3. **冲突安全** — 文件所有权 + 交接协议避免冲突
4. **通用适配** — 单包/多包项目自动适配
5. **汇总测试** — 统一集成测试

## 使用方式

### 1. 项目初始化

调度 Agent 扫描项目结构：

```bash
# 调度 Agent 执行
npx peaks-sdd scan-project
```

生成 `agents.yaml` 配置文件：

```yaml
# 示例: packages/admin/agents.yaml
agents:
  - name: admin-auth-agent
    module: auth
    path: packages/admin/src/auth
    techStack: react
    owns:
      - packages/admin/src/auth/**
    dependsOn: []

  - name: admin-ai-models-agent
    module: ai-models
    path: packages/admin/src/ai-models
    techStack: react
    owns:
      - packages/admin/src/ai-models/**
    dependsOn:
      - admin-auth-agent
```

### 2. 任务调度

```
用户: 添加用户积分功能
    ↓
调度 Agent 分析任务
    ↓
生成执行计划
    ↓
并行/串行调度子 Agent
    ↓
汇总测试
```

### 3. 子 Agent 开发

子 Agent 专注于本模块：

```
接收任务 → 开发 → 自测 → 报告 → 归还 Agent 池
```

## 交接协议

当子 Agent A 修改了共享文件：

```
Agent A: 完成共享文件修改
    ↓
通知调度 Agent
    ↓
调度 Agent 更新状态注册表
    ↓
注入最新状态给 Agent B
    ↓
Agent B 继续开发
```

## 下一步

- [ ] 实现项目结构扫描脚本
- [ ] 实现 Agent 池动态生成
- [ ] 实现调度引擎
- [ ] 在 ice-cola 项目验证