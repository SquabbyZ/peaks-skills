---
name: require-code-review
enabled: true
event: PreToolUse
action: block
---

## Code Review + Security 强制检查 Hook

在每次提交测试/部署前，强制检查是否已完成 Code Review 和安全检查。

### 触发条件

| 操作 | 是否阻断 |
|------|---------|
| 运行 `npm test` / `pnpm test` | 🚨 阻断 |
| 运行 `npm run test:e2e` | 🚨 阻断 |
| 执行 `git commit` (非 `wip`) | 🚨 阻断 |
| 运行 `npm run deploy` | 🚨 阻断 |
| 提交 PR | 🚨 阻断 |

### 检查流程

```
1. 检测到测试/部署命令
       ↓
2. 检查是否有未完成的 CR
       ↓
3. 检查是否有安全扫描未通过
       ↓
4. 两者都通过 → 放行
   任一未通过 → 阻断并输出原因
```

### 必须完成的检查项

| 检查项 | 说明 | 完成标志 |
|--------|------|---------|
| **Code Review** | 必须有至少 1 人 approve | `CR Approved` |
| **Security Scan** | 必须无 CRITICAL/HIGH 漏洞 | `security:passed` |
| **类型检查** | `tsc --noEmit` 通过 | `typecheck:passed` |
| **ESLint** | 无 error 级别问题 | `lint:passed` |
| **测试覆盖率** | >= 80% | `coverage:80%+` |

### 阻断输出格式

```
🚨 [GateCheck] 检测到未完成的检查

📋 待完成项:
  ❌ Code Review: 请等待至少 1 人 approve
  ❌ Security Scan: 发现 2 个 HIGH 漏洞
     - src/auth/login.ts: SQL 注入风险
     - src/utils/validation.ts: XSS 漏洞

✅ 已完成:
  ✅ 类型检查: 通过
  ✅ ESLint: 无 error

💡 如何完成:
  1. 发起 PR 后等待 Code Review
  2. 运行安全扫描: npm run security:scan
  3. 修复所有漏洞后重试

⏸️ 当前操作已阻断，请先完成上述检查。
```

### 允许例外的情况

1. **WIP Commit**：`git commit -m "wip: ..."` 允许跳过检查
2. **Hotfix**：`git commit -m "hotfix: ..."` 允许紧急修复后补做
3. **跳过检查**：设置环境变量 `SKIP_CR_CHECK=true`

### 配置示例

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "command": "node scripts/check-gate.mjs",
        "description": "Block test/deploy until CR+Security passed"
      }
    ]
  }
}
```

### 配合 peaks-sdd 工作流

在 `/peaksfeat` 和 `/peaksbug` 流程中：

```
/peaksfeat
  └── Phase 5: Develop (开发)
        ↓
      开发完成
        ↓
  Phase 6: Review (CR + Security)
        ↓
      检查通过 → 进入 QA 测试
      检查失败 → 阻断，修复后重试
```

### 通过标志

当所有检查通过时：

```
✅ [GateCheck] 所有检查已通过

📋 检查结果:
  ✅ Code Review: Approved by @reviewer
  ✅ Security Scan: 0 vulnerabilities
  ✅ 类型检查: 通过
  ✅ ESLint: 0 errors
  ✅ 测试覆盖率: 85%

🚀 允许进入下一阶段
```