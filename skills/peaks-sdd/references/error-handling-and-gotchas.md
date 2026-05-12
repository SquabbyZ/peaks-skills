# 异常处理与 Gotchas

## 异常处理

| 场景 | 处理 |
| --- | --- |
| 当前分支是 main/master/develop/release/hotfix | 创建功能/修复分支，除非用户明确要求当前分支 |
| 不是 git 仓库 | 建议 `git init`；用户拒绝则继续但不创建分支 |
| 模板文件缺失 | 跳过缺失模板，记录警告，继续其他模板 |
| context 不足 | 写 checkpoint 后 compact/恢复 |
| 用户中断 | 暂停并保存当前进度到 `.peaks/state.json` 或 checkpoint |
| MCP 不可用 | 降级为本地 Read/Bash/Grep/Glob |
| OpenSpec 命令失败 | 输出错误，尝试脚本或直接 npx；仍失败则记录并停止该阶段 |
| settings.json 不存在 | 创建最小配置或提示可稍后配置 |
| npm/npx 超时 | 重试一次；仍失败则跳过并记录 |
| 权限不足 | 提示用户检查目录权限 |
| 磁盘空间不足 | 停止写入并提示清理空间 |
| 同时检测多个技术栈 | 生成多个对应 agent |
| OpenSpec 目录已存在 | 增量更新，不覆盖 |

## 常见失败点

| Gotcha | 触发 | 应对 |
| --- | --- | --- |
| Agent 忘记上下文 | 长对话/多 agent | 每阶段写入 `.peaks/`，关键点 checkpoint |
| 规格蔓延 | 用户持续追加需求 | 新需求回到 specs/PRD 确认 |
| 跳过 review | 实现后直接宣称完成 | 强制 CR、安全、测试门禁 |
| Context 溢出 | 大任务多轮执行 | checkpoint + compact + 文件恢复 |
| 项目未初始化 | 直接功能开发 | 自动先初始化 `.claude/agents/` |
| 命令路径错误 | 子目录执行 | 使用项目根目录或绝对路径 |
| Monorepo 检测失败 | 只看根 package.json | 同时扫描 packages/* |
| CLAUDE.md 膨胀 | 反复写入上下文 | 归档到 `.peaks/context/` |
