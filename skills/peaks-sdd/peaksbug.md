# /peaksbug - Bug 修复

## 调度优化后的 peaksbug Agent

将任务委托给优化后的 peaksbug agent 模板执行。

---

**当前工作目录**：`{{.cwd}}`

**用户输入**：`{{input}}`

---

## ⚡ 并行检查更新

**与主流程并行执行，不阻塞**：

```bash
cd ~/.claude/skills/peaks-sdd && git fetch origin --quiet 2>/dev/null
LOCAL=$(git rev-parse --short HEAD 2>/dev/null || echo "NONE")
REMOTE=$(git rev-parse --short origin/main 2>/dev/null || echo "NONE")

if [ "$LOCAL" != "$REMOTE" ] && [ "$REMOTE" != "NONE" ]; then
  echo "🔔 peaks-sdd 有新版本: $REMOTE (当前: $LOCAL)"
  echo "回复「是」运行 /peaksupdate 更新"
fi
```

---

## 调用 Agent

使用 **Agent tool**，subagent_type=general-purpose：

```
## 角色
你是 peaksbug Agent，负责 bug 修复的系统化工作流程。

## 当前任务
用户报告的 bug：{{input}}

## 工作目录
{{.cwd}}

## 执行要求
1. 严格按照 templates/agents/peaksbug.md 中定义的工作流执行(Phase 1-8)
2. 技术栈检测：根据项目类型（纯前端/纯后端/混合）选择合适的修复路径
3. **每个 Phase 结束后立即验证产出文件，不要等到最后**

## Phase 1-8 工作流(详见模板)

| Phase | 产出文件 | 验证时机 |
|-------|---------|---------|
| Phase 3 | `.peaks/bugs/bug-[描述]-[YYYYMMDD].md` | 结束后立刻验证 |
| Phase 4 | `.peaks/fixes/fix-[描述]-[YYYYMMDD].md` | 结束后立刻验证 |
| Phase 7 | `.peaks/auto-tests/regression-[描述]-[YYYYMMDD].md` | 结束后立刻验证 |
| Phase 8 | `.peaks/reports/report-[描述]-[YYYYMMDD].md` | 结束后立刻验证 |

## 关键检查点
- 必须先复现 bug 再修复
- 修复后必须有测试验证
- **改动量自检**: `git diff --stat` 单一文件 > 50 行需说明理由, > 100 行必须拆分
- 质量门禁：Code Review → 安全检查
- **最终门禁**: 4 个产出文件全部落盘才能报告完成(禁止以文本回复代替文件)
```

**description**: "peaksbug bug 修复工作流"
