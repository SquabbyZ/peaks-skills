---
name: peaks-sdd-hooks
description: peaks-sdd 完整的 hook 配置集成
---

# peaks-sdd Hooks 完整配置

本文档展示如何配置 `.claude/settings.json` 以启用所有 peaks-sdd hooks。

## 完整配置示例

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash|npm|pnpm|yarn",
        "command": "node .claude/skills/peaks-sdd/scripts/check-gate.mjs check",
        "description": "Code Review + Security 强制检查"
      },
      {
        "matcher": "Bash",
        "command": "node .claude/skills/peaks-sdd/scripts/context-monitor.mjs check",
        "description": "Context 使用率检查 (>= 85% 阻断)"
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "command": "node .claude/skills/peaks-sdd/scripts/auto-format.mjs \"$FILE_PATH\"",
        "description": "自动格式化代码"
      },
      {
        "matcher": "Write",
        "command": "node .claude/skills/peaks-sdd/scripts/file-size-check.mjs \"$FILE_PATH\"",
        "description": "检查文件大小 (超过 400 行警告)"
      },
      {
        "matcher": "Write",
        "command": "node .claude/skills/peaks-sdd/scripts/type-check.mjs \"$FILE_PATH\"",
        "description": "检查 any 类型使用"
      },
      {
        "matcher": "Write",
        "command": "node .claude/skills/peaks-sdd/scripts/component-library-enforce.mjs \"$FILE_PATH\"",
        "description": "检查组件库使用规范"
      },
      {
        "matcher": "Write",
        "command": "node .claude/skills/peaks-sdd/scripts/tailwind-enforce.mjs \"$FILE_PATH\"",
        "description": "检查 TailwindCSS 使用规范"
      },
      {
        "matcher": "Write",
        "command": "node .claude/skills/peaks-sdd/scripts/min-code-enforce.mjs \"$FILE_PATH\"",
        "description": "检查最小代码量规范"
      }
    ]
  }
}
```

## Hook 列表

| Hook | 事件 | 脚本 | 说明 |
|------|------|------|------|
| require-code-review | PreToolUse | check-gate.mjs | CR + Security 强制检查 |
| context-monitor | PreToolUse | context-monitor.mjs | Context 使用率检查 |
| auto-format | PostToolUse | auto-format.mjs | 自动格式化代码 |
| file-size-check | PostToolUse | file-size-check.mjs | 检查文件大小 |
| type-check | PostToolUse | type-check.mjs | 检查 any 类型 |
| component-library-enforce | PostToolUse | component-library-enforce.mjs | 组件库规范检查 |
| tailwind-enforce | PostToolUse | tailwind-enforce.mjs | TailwindCSS 规范检查 |
| min-code-enforce | PostToolUse | min-code-enforce.mjs | 最小代码量检查 |

## 按需启用

如果你只需要部分 hooks，可以选择性地配置：

### 基础配置（推荐）

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "command": "node .claude/skills/peaks-sdd/scripts/auto-format.mjs \"$FILE_PATH\"",
        "description": "自动格式化代码"
      },
      {
        "matcher": "Write",
        "command": "node .claude/skills/peaks-sdd/scripts/file-size-check.mjs \"$FILE_PATH\"",
        "description": "检查文件大小"
      }
    ]
  }
}
```

### 完整配置（含质量门禁）

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash|npm|pnpm|yarn",
        "command": "node .claude/skills/peaks-sdd/scripts/check-gate.mjs check",
        "description": "Code Review + Security 强制检查"
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "command": "node .claude/skills/peaks-sdd/scripts/auto-format.mjs \"$FILE_PATH\"",
        "description": "自动格式化代码"
      },
      {
        "matcher": "Write",
        "command": "node .claude/skills/peaks-sdd/scripts/file-size-check.mjs \"$FILE_PATH\"",
        "description": "检查文件大小"
      },
      {
        "matcher": "Write",
        "command": "node .claude/skills/peaks-sdd/scripts/type-check.mjs \"$FILE_PATH\"",
        "description": "检查 any 类型"
      },
      {
        "matcher": "Write",
        "command": "node .claude/skills/peaks-sdd/scripts/tailwind-enforce.mjs \"$FILE_PATH\"",
        "description": "检查 TailwindCSS"
      }
    ]
  }
}
```

## 脚本说明

### PreToolUse Hooks

| 脚本 | 触发条件 | 阻断阈值 |
|------|----------|----------|
| check-gate.mjs | 运行 npm/pnpm 命令 | 未完成 CR 或 Security Scan |
| context-monitor.mjs | 任何 Bash 命令 | Context >= 85% |

### PostToolUse Hooks

| 脚本 | 触发条件 | 检查内容 |
|------|----------|----------|
| auto-format.mjs | Edit/Write 任何文件 | 使用 prettier 格式化 |
| file-size-check.mjs | Write 任何文件 | > 400 行警告, > 800 行阻断 |
| type-check.mjs | Write .ts/.tsx 文件 | 检测 any 类型使用 |
| component-library-enforce.mjs | Write .ts/.tsx 文件 | 检测 window.alert/confirm/prompt |
| tailwind-enforce.mjs | Write .tsx/.jsx 文件 | 检测内联 style 属性 |
| min-code-enforce.mjs | Write .ts/.tsx 文件 | 检测未使用 import、冗余注释 |

## 阈值配置

部分脚本支持通过环境变量或配置文件自定义阈值：

### context-monitor.mjs

```bash
AUTO_COMPACT=true node context-monitor.mjs monitor  # 超过阈值自动执行 /compact
```

### file-size-check.mjs

编辑脚本中的 `THRESHOLDS` 对象：
```javascript
const THRESHOLDS = {
  softWarn: 400,   // 超过此行数发出警告
  hardLimit: 800   // 超过此行数必须拆分
};
```

## 安装步骤

1. 确保 `.claude/skills/peaks-sdd/scripts/` 目录存在
2. 将上述配置添加到 `.claude/settings.json` 的 `hooks` 字段
3. 重启 Claude Code 会话

## 验证安装

```bash
node .claude/skills/peaks-sdd/scripts/auto-format.mjs
node .claude/skills/peaks-sdd/scripts/file-size-check.mjs
```

如果输出帮助信息，说明脚本可以正常执行。