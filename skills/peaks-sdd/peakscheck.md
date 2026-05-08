---
name: peakscheck
description: |
  PROACTIVELY check if peaks-sdd skill has a new version available. Fires automatically when user uses any peaks-sdd command.

when_to_use: |
  检查 peaks-sdd 更新、检查更新、技能更新

argument-hint: "[无参数]"
arguments: []

user-invocable: false

paths: []

allowed-tools:
  - Read
  - Bash
  - Grep

context: inherit

model: sonnet

effort: low
---

# /peakscheck - 检查 peaks-sdd 更新

并行检查 peaks-sdd 是否有新版本可用。

## 执行方式

**与主命令并行触发**：当用户使用 `/peaksinit`、`/peaksfeat`、`/peaksbug` 时，`peakscheck` 在后台同步执行，不阻塞主命令。

## 检查流程

### Step 1: 获取本地版本

```bash
# 读取 peaks-sdd 本地安装的版本
cd ~/.claude/skills/peaks-sdd && git rev-parse --short HEAD 2>/dev/null || echo "NOT_INSTALLED"
```

### Step 2: 获取远程版本

```bash
# 获取 origin/main 的最新 commit
cd ~/.claude/skills/peaks-sdd && git fetch origin --quiet 2>/dev/null && git rev-parse --short origin/main 2>/dev/null || echo "NO_REMOTE"
```

### Step 3: 对比版本

```bash
LOCAL=$(git rev-parse --short HEAD)
REMOTE=$(git rev-parse --short origin/main)

if [ "$LOCAL" = "$REMOTE" ]; then
  echo "UP_TO_DATE"
elif [ "$REMOTE" = "" ]; then
  echo "NO_REMOTE"
else
  echo "UPDATE_AVAILABLE"
fi
```

## 输出结果

### 场景1: 已是最新

```
✅ peaks-sdd 已是最新版本
当前版本: a1b2c3d
发布日期: 2026-05-08
```

### 场景2: 有新版本

```
🔔 peaks-sdd 有可用更新！

当前版本: a1b2c3d (2026-05-08)
最新版本: b2c3d4e (2026-05-10)
📦 npm: https://www.npmjs.com/package/peaks-skills

更新内容:
- [新功能] 支持 Vue2/Vue3 代码审查
- [优化] peaksinit 增量更新
- [修复] xxx bug

是否更新？回复「是」或「/peaksupdate」
```

### 场景3: 未安装

```
⚠️ peaks-sdd 未安装
使用 /peaksinit 安装
```

### 场景4: 无远程仓库

```
⚠️ 无法检查更新（无远程仓库）
请手动运行: cd ~/.claude/skills/peaks-sdd && git remote -v
```

## 并行执行说明

peakscheck 必须在主命令执行期间同步完成，不能作为后台任务：

```
用户执行 /peaksinit
    │
    ├──→ peakscheck (同步执行, 不阻塞)
    │        └── 输出版本检查结果
    │
    └──→ peaksinit (主流程, 正常执行)
```

**注意**：
- peakscheck 是 user-invocable: false，不接受用户手动调用
- 只能通过 peaks-sdd 其他命令触发
- 检查结果输出到控制台，不影响主命令执行

## 退出码

| 退出码 | 含义 |
|--------|------|
| 0 | 已是最新 / 检查完成 |
| 1 | 有新版本可用 |
| 2 | 未安装 |
| 3 | 检查失败 |