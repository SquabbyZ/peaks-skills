---
name: context-monitor
enabled: true
event: PreToolUse
action: conditional
---

## Context 使用率检查与自动 Compact 策略

在每次工具调用前，检查 .claude/session-state.json 中的 contextEstimate 值。

### 阶段自动化级别

| 阶段类型 | 示例 | context >= 75% | context >= 90% |
|---------|------|---------------|---------------|
| **半自动** | Constitution、PRD、设计 | 警告 + 产出检查点 + 等待确认 | 阻断 + 等待确认 |
| **全自动** | 开发、Code Review、安全检测、测试 | 工作保护 → compact → 继续 | 自动 compact → 继续 |

**阈值优化**：
- 触发阈值：75%（比 70% 多 5% 缓冲，减少不必要的 compact）
- 阻断阈值：90%（给更多工作空间）

### 全自动阶段工作保护

触发 context >= 75% 时，在 compact 前强制执行：
1. **产出保护检查点**：写入 `.peaks/checkpoints/checkpoint-[模块]-[时间戳].md`
2. **保护进行中的工作**：包含代码片段、待办、已完成状态
3. **compact 后自动恢复**：从检查点恢复，继续 loop 迭代

### 阻断逻辑（>= 90%）

当 contextEstimate >= 90 时：
1. **全自动阶段**：自动执行工作保护 → `/compact` → 完成后自动继续
2. **半自动阶段**：输出红色警告，阻断操作，强制提示用户手动执行 `/compact`

### 警告逻辑（>= 75%）

当 contextEstimate >= 75 时：
1. **全自动阶段**：执行工作保护 → 自动 `/compact` → 继续执行
2. **半自动阶段**：输出黄色警告，允许继续但建议用户手动 compact

### Context 增量估算参考

在 .claude/session-state.json 中更新 contextEstimate 值：

```json
{
  "contextEstimate": 45,
  "currentPhase": "PRD 分析",
  "automationLevel": "semi",
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

### 自动 Compact 执行流程

**全自动阶段触发自动 compact 时**：
1. 产出检查点到 `.peaks/checkpoints/checkpoint-[模块]-[时间戳].md`
2. 输出当前进度摘要
3. 执行 `compact` 命令（hook 内部调用或通过输出指令触发）
4. context 重置后自动继续执行

### 与 /loop 配合

当使用 /loop 长任务自治时：
1. loop 唤醒时自动触发此 hook 检查
2. **全自动阶段**：context 过高时 loop 自动 compact 后继续
3. **半自动阶段**：context 过高时 loop 暂停，等待用户手动 compact
4. /compact 后手动恢复 loop（ScheduleWakeup 重新调度）
5. **loop 迭代强制检查**：每次 loop 开始和结束都必须检查 contextEstimate

### 检查点文件模板

当需要产出检查点时，使用以下格式：

```markdown
# 检查点 - [模块名] - [时间戳]

## 阶段信息
- 阶段类型: [全自动/半自动]
- 当前任务: [描述]

## 已完成
- [ ] 任务 1
- [ ] 任务 2

## Context 状态
- contextEstimate: XX%
- 预估剩余容量: Y%

## 待处理
- [ ] 任务 3

## 恢复指令
/peaks-sdd 继续开发 [模块名]，从检查点恢复
```
