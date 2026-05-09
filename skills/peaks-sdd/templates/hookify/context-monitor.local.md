---
name: context-monitor
enabled: true
event: PreToolUse
action: warn
---

## Context 使用率检查与自动 Compact 策略

在每次工具调用前，检查 .claude/session-state.json 中的 contextEstimate 值。

### 检查规则

| contextEstimate | 动作 |
|-----------------|------|
| >= 85% | 🚨 **阻断**：阻止工具调用，强制提示用户先执行 /compact |
| >= 70% | ⚠️ **警告**：允许继续但输出醒目警告，建议先 /compact |
| < 70% | ✅ 正常：放行 |

### 阻断逻辑（>= 85%）

当 contextEstimate >= 85 时：
1. 输出红色警告：`🚨 Context 已达 ${contextEstimate}%，请先执行 /compact 再继续`
2. 建议：将当前阶段的产出写入 .peaks/ 文件，然后 /compact
3. 用户手动 /compact 后 contextEstimate 会重置，hook 自动放行

### 警告逻辑（>= 70%）

当 contextEstimate >= 70 时：
1. 输出黄色警告：`⚠️ Context 已达 ${contextEstimate}%，建议尽快 /compact`
2. 允许当前工具调用继续执行
3. 提醒用户：长任务考虑产出中间文件到 .peaks/ 减轻 context 压力

### Context 增量估算参考

在 .claude/session-state.json 中更新 contextEstimate 值：

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

### 自动 Compact 触发

**当 contextEstimate >= 70% 时，优先建议自动 compact**：

1. **触发条件**：contextEstimate 连续 3 次检查都 >= 70%
2. **自动动作**：
   - 输出 `/compact` 指令（醒目格式）
   - 建议产出检查点文件到 `.peaks/checkpoints/`
3. **恢复流程**：
   - 用户执行 `/compact` 后 context 重置
   - 继续工作时 hook 自动放行

### 与 /loop 配合

当使用 /loop 长任务自治时：
1. loop 唤醒时自动触发此 hook 检查
2. context 过高时 loop 自动暂停，等待 /compact
3. /compact 后手动恢复 loop（ScheduleWakeup 重新调度）
4. **loop 迭代强制检查**：每次 loop 开始和结束都必须检查 contextEstimate

### 检查点文件模板

当需要产出检查点时，使用以下格式：

```markdown
# 检查点 - [模块名] - [时间戳]

## 已完成
- [ ] 任务 1
- [ ] 任务 2

## Context 状态
- contextEstimate: XX%
- 预估剩余容量: Y%

## 待处理
- [ ] 任务 3

## 恢复指令
/peaksfeat 继续开发 [模块名]，从检查点恢复
```
