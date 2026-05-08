---
name: peaksupdate
description: |
  PROACTIVELY update peaks-sdd to the latest version from remote repository.
  Use when user says "更新 peaks-sdd", "update skill", or confirms "/peakscheck" suggestion.

when_to_use: |
  更新 peaks-sdd、更新技能、upgrade skill

argument-hint: "[无参数]"
arguments: []

user-invocable: true

paths:
  - "~/.claude/skills/peaks-sdd/**"

allowed-tools:
  - Read
  - Bash
  - Grep

context: inherit

model: sonnet

effort: low
---

# /peaksupdate - 更新 peaks-sdd

将 peaks-sdd 更新到最新版本，并同步项目配置。

## 执行前检查

```bash
# 检查是否已安装
if [ ! -d ~/.claude/skills/peaks-sdd ]; then
  echo "NOT_INSTALLED"
  exit 1
fi
```

---

## 更新流程

### Step 1: 获取更新信息

```bash
cd ~/.claude/skills/peaks-sdd

# 获取更新前版本
BEFORE=$(git rev-parse --short HEAD)

# 拉取最新
git fetch origin --quiet

# 获取更新后版本
AFTER=$(git rev-parse --short origin/main)

# 获取更新日志
LOG=$(git log --oneline HEAD..origin/main)
```

### Step 2: 执行更新

```bash
# 切换到 main 分支并拉取
git checkout main 2>/dev/null || echo "ALREADY_MAIN"
git pull origin main --quiet

# 重置到 origin/main
git reset --hard origin/main
```

### Step 3: 验证更新

```bash
# 确认当前版本
CURRENT=$(git rev-parse --short HEAD)
REMOTE=$(git rev-parse --short origin/main)

if [ "$CURRENT" = "$REMOTE" ]; then
  echo "UPDATE_SUCCESS"
else
  echo "UPDATE_FAILED"
  exit 1
fi
```

---

## 同步项目配置（增量更新）

更新完成后，自动触发项目配置的增量同步：

```bash
# 检查项目是否已有 peaks-sdd 配置
if [ -f "{{cwd}}/.claude/settings.json" ]; then
  echo "PROJECT_CONFIGURED"
  # 调用 peaksinit 增量更新
  echo "请运行 /peaksinit 同步最新 Agent 模板"
else
  echo "PROJECT_NOT_INITIALIZED"
fi
```

---

## 输出报告

**保存到文件**：`.peaks/reports/update-report-[YYYYMMDD].md`

**npm 包**：https://www.npmjs.com/package/peaks-skills

同时输出到控制台（用户可见）。

```markdown
# peaks-sdd 更新报告

**更新时间**: [当前时间]
**npm 包**: https://www.npmjs.com/package/peaks-skills
**更新前版本**: [BEFORE]
**更新后版本**: [AFTER]
**更新 commit 数**: [N] 个 commit

---

## 更新内容

[LOG 输出，commit 列表，每行格式：- [类型] 描述]

### 主要变更

| 类型 | 数量 | 说明 |
|------|------|------|
| 新功能 | N | [功能名] |
| 优化 | N | [优化项] |
| 修复 | N | [修复项] |

---

## Agent 模板同步

更新后以下 Agent 模板已同步到最新：
- peaksfeat、peaksbug、peaksinit
- frontend（含 Vue2/Vue3 支持）
- code-reviewer-frontend（React + Vue）
- [其他更新的模板]

---

## 项目配置同步

| 项目 | 状态 | 说明 |
|------|------|------|
| Agent 配置 | ⏭️ 待同步 | 请运行 /peaksinit 增量更新 |
| Commands 注册 | ⏭️ 已更新 | peakscheck、peaksupdate 已注册 |
| Skills | ⏭️ 待验证 | 请运行 /peaksinit 确认 |

---

## 验证结果

| 检查项 | 状态 |
|--------|------|
| 仓库更新 | ✅ |
| 版本校验 | ✅ |
| Commands 注册 | ✅ |

✅ peaks-sdd 更新完成！
```

**执行要求**：
1. 将报告保存到 `.peaks/reports/update-report-[YYYYMMDD].md`
2. 控制台输出精简版（见下方）

## 控制台精简输出

```
🔄 正在更新 peaks-sdd...

📦 获取更新信息...
   更新前: [BEFORE]
   更新后: [AFTER]
   Commit 数: [N] 个

📝 更新内容:
   - [新功能] 支持 Vue2/Vue3 代码审查
   - [优化] peaksinit 增量更新
   - [修复] xxx bug

✅ peaks-sdd 更新完成！(v[AFTER])
📦 npm: https://www.npmjs.com/package/peaks-skills

📋 下一步：
   - 运行 /peaksinit 同步项目 Agent 配置
   - 或查看完整报告: .peaks/reports/update-report-[DATE].md
```

## 错误处理

### 场景1: 未安装

```
❌ peaks-sdd 未安装
请先运行: /peaksinit
```

### 场景2: 拉取失败

```
❌ 更新失败：网络错误或仓库不可达
请检查网络连接后重试
```

### 场景3: 有未提交的更改

```
⚠️ 检测到本地修改
请先提交或撤销更改:
  cd ~/.claude/skills/peaks-sdd
  git stash  # 暂存更改
  git reset --hard origin/main  # 强制更新
  # 或 git stash pop 恢复更改
```

---

## 安全说明

- 只从已知的 `origin` 仓库拉取
- 使用 `git reset --hard` 确保干净的状态
- 不会删除用户的项目文件（项目文件在用户目录，不是 skill 目录）