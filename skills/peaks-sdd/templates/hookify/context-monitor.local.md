---
name: context-monitor
enabled: true
event: PreToolUse
action: warn
---

## Context 使用率检查

在每次工具调用前，检查 `.claude/session-state.json` 中的 `contextEstimate` 值。

### 检查规则

| contextEstimate | 动作 |
|-----------------|------|
| >= 85% | 🚨 **阻断**：阻止工具调用，强制提示用户先执行 /compact |
| >= 70% | ⚠️ **警告**：允许继续但输出醒目警告，建议先 /compact |
| < 70% | ✅ 正常：放行 |

### 阈值说明

| 阈值 | 含义 | 动作 |
|------|------|------|
| 85%+ | 危险区 | **阻断**，必须 /compact |
| 70-84% | 警戒区 | 警告，但允许继续 |
| 50-69% | 注意区 | 提示，可选 /compact |
| < 50% | 正常 | 无需操作 |

### 阻断逻辑（>= 85%）

当 `contextEstimate >= 85` 时：
1. 输出红色警告：`🚨 Context 已达 ${contextEstimate}%，请先执行 /compact 再继续`
2. 建议：将当前阶段的产出写入 `.peaks/` 文件，然后 `/compact`
3. 用户手动 `/compact` 后 `contextEstimate` 会重置，hook 自动放行

### 警告逻辑（>= 70%）

当 `contextEstimate >= 70` 时：
1. 输出黄色警告：`⚠️ Context 已达 ${contextEstimate}%，建议尽快 /compact`
2. 允许当前工具调用继续执行
3. 提醒用户：长任务考虑产出中间文件到 `.peaks/` 减轻 context 压力

### 如何更新 contextEstimate

在 `.claude/session-state.json` 中更新 `contextEstimate` 值：

```json
{
  "contextEstimate": 45,
  "phasesCompleted": ["探索", "PRD"],
  "lastUpdated": "2026-05-06T21:00:00"
}
```

Context 增量估算参考：
- 探索项目: +5%
- 产品分析 PRD + brainstorming: +10%
- UI/UX 设计（Figma）: +10%
- 测试用例编写: +5%
- 数据库设计: +5%
- 后端开发（单个模块）: +15%
- 前端开发（单个模块）: +12%
- 质量门禁（CR+安全+QA一轮）: +8%
- 自动化测试执行: +5%
- 运维部署: +3%

### 与 /loop 配合

当使用 `/loop` 长任务自治时：
1. loop 唤醒时自动触发此 hook 检查
2. context 过高时 loop 自动暂停，等待 `/compact`
3. `/compact` 后手动恢复 loop（`ScheduleWakeup` 重新调度）

### 调用监控脚本

可以使用 `context-monitor.mjs` 脚本进行更精确的检测：

```bash
node scripts/context-monitor.mjs . check
```

脚本会读取 `.claude/session-state.json` 并输出详细的消耗报告。