---
name: context-monitor
enabled: true
event: stop
action: warn
---

## Context 使用率检查

检查 .claude/session-state.json 中的 contextEstimate 值：
- 如果 >= 70%: 提醒用户 context 已超过 70%，建议重启会话或执行 /compact
- 如果 >= 90%: 强烈警告，context 即将耗尽

## 检查规则

| contextEstimate | 动作 |
|-----------------|------|
| >= 90% | 🚨 强烈警告：context 即将耗尽，立即执行 /compact |
| >= 70% | ⚠️ 提醒：context 超过 70%，建议执行 /compact 或重启会话 |
| < 70% | ✅ 正常：可以继续工作 |

## 如何更新 contextEstimate

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