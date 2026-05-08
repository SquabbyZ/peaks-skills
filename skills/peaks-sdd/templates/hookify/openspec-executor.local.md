---
name: openspec-executor
enabled: true
event: PreToolUse
action: exec
---

## OpenSpec 命令执行 Hook

当检测到特定命令模式时，自动执行对应的 OpenSpec 命令。

### 支持的命令模式

| 命令模式 | 执行脚本 | 说明 |
|---------|---------|------|
| `/openspec` | openspec.mjs exec | 执行 OpenSpec 命令 |
| `/spec` | openspec.mjs spec | 快速执行 spec 命令 |
| `/open` | openspec.mjs open | 打开 OpenSpec 工具 |

### 检测规则

1. **命令匹配**：检测工具输入中是否包含 `/(openspec|spec|open)` 模式
2. **参数解析**：提取命令和参数（如 `/openspec status`）
3. **执行脚本**：调用 `openspec.mjs` 执行对应命令
4. **结果返回**：将执行结果注入到上下文中

### 执行流程

```
用户输入: "/openspec status --project .peaks"
    ↓
Hook 检测到 openspec 命令
    ↓
解析参数: { command: "status", project: ".peaks" }
    ↓
执行: node scripts/openspec.mjs exec status --project .peaks
    ↓
返回结果并注入上下文
```

### 脚本接口

`openspec.mjs` 支持以下命令：

```bash
# 查看状态
node scripts/openspec.mjs status [--project <path>]

# 执行命令
node scripts/openspec.mjs exec <command> [--project <path>]

# 列出可用命令
node scripts/openspec.mjs list

# 初始化项目
node scripts/openspec.mjs init [--project <path>]
```

### 配置示例

在 `.claude/settings.json` 中添加：

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "/^/(openspec|spec|open)\\s/",
        "command": "node .claude/skills/peaks-sdd/scripts/openspec.mjs exec $1",
        "description": "Execute OpenSpec commands"
      }
    ]
  }
}
```

### 错误处理

| 错误类型 | 处理方式 |
|---------|---------|
| 命令不存在 | 输出可用命令列表 |
| 项目路径无效 | 提示使用 `--project` 指定正确路径 |
| 脚本执行失败 | 输出错误信息，建议手动执行 |

### 与 /loop 配合

在长任务循环中，可以使用 OpenSpec 命令来控制流程：

```
/loop
  - 检测到 context >= 70% 时暂停
  - 使用 /openspec save 保存进度
  - 使用 /openspec checkpoint 创建检查点
  - 恢复执行
```